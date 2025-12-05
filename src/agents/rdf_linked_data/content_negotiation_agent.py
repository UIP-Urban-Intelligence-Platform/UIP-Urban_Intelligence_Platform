#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Content Negotiation Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.rdf_linked_data.content_negotiation_agent
Author: Nguyen Viet Hoang
Created: 2025-11-22
Version: 2.0.0
License: MIT

Description:
    Implements Linked Open Data (LOD) best practices for content negotiation,
    providing multi-format RDF responses with proper HTTP semantics.

Supported Formats:
    - JSON-LD (application/ld+json)
    - Turtle (text/turtle)
    - RDF/XML (application/rdf+xml)
    - HTML (text/html) with Jinja2 templates

Core Features:
    - Accept header parsing with quality values (q-values)
    - HTTP 303 redirects for non-information resources
    - Link headers for alternate format discovery
    - Format conversion via rdflib
    - Human-readable HTML representation

Dependencies:
    - rdflib>=6.0: RDF parsing and serialization
    - jinja2>=3.1: HTML template engine
    - fastapi>=0.104: HTTP server
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/content_negotiation_config.yaml:
        - base_url: Server base URL
        - template_path: Jinja2 templates location
        - default_format: Fallback format

Example:
    ```python
    from src.agents.rdf_linked_data.content_negotiation_agent import ContentNegotiationAgent

    agent = ContentNegotiationAgent()
    agent.run(host="0.0.0.0", port=8081)
    ```

References:
    - LOD Best Practices: https://www.w3.org/TR/cooluris/
    - HTTP Content Negotiation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
"""

import asyncio
import hashlib
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
import yaml
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse, RedirectResponse
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from rdflib import Graph

# Import centralized environment variable expansion helper
from src.core.config_loader import expand_env_var

# ============================================================================
# ENUMS AND DATA CLASSES
# ============================================================================


class FormatSource(Enum):
    """Source for format data"""

    STELLIO = "stellio"
    FUSEKI = "fuseki"
    CONVERT = "convert"
    TEMPLATE = "template"


@dataclass
class FormatConfig:
    """Configuration for a single format"""

    mime_type: str
    extension: str
    priority: float
    source: str
    description: str = ""
    charset: str = "utf-8"
    template: Optional[str] = None

    def matches(self, mime_type: str) -> bool:
        """Check if this format matches given mime type"""
        return self.mime_type.lower() == mime_type.lower()

    def get_content_type(self) -> str:
        """Get full Content-Type header value"""
        return f"{self.mime_type}; charset={self.charset}"


@dataclass
class BackendConfig:
    """Configuration for a backend service"""

    url: str
    timeout: int = 30
    headers: Dict[str, str] = field(default_factory=dict)
    retry: Dict[str, int] = field(
        default_factory=lambda: {"max_attempts": 3, "backoff_factor": 2}
    )

    def format_url(self, **kwargs) -> str:
        """Format URL with placeholders"""
        return self.url.format(**kwargs)


@dataclass(order=True)
class AcceptFormat:
    """Parsed Accept header format with quality value"""

    # Use negative quality for descending order (dataclass sorts ascending)
    _sort_key: float = field(init=False, repr=False)
    mime_type: str = field(compare=False)
    quality: float = field(compare=False)
    params: Dict[str, str] = field(default_factory=dict, compare=False)

    def __post_init__(self):
        # Negate quality for descending sort order
        self._sort_key = -self.quality


@dataclass
class NegotiationResult:
    """Result of content negotiation"""

    format_config: FormatConfig
    quality: float
    matched_mime_type: str


# ============================================================================
# ACCEPT HEADER PARSER
# ============================================================================


class AcceptHeaderParser:
    """Parser for HTTP Accept headers with quality values"""

    @staticmethod
    def parse(accept_header: str) -> List[AcceptFormat]:
        """
        Parse Accept header into sorted list of formats.

        Examples:
            "application/ld+json" -> [AcceptFormat('application/ld+json', 1.0)]
            "text/turtle;q=0.9, */*;q=0.1" -> [AcceptFormat('text/turtle', 0.9), ...]

        Args:
            accept_header: Accept header value

        Returns:
            List of AcceptFormat objects sorted by quality (descending)
        """
        if not accept_header or accept_header.strip() == "":
            return [AcceptFormat("*/*", 1.0)]

        formats = []

        for part in accept_header.split(","):
            part = part.strip()
            if not part:
                continue

            # Split mime type and parameters
            components = [c.strip() for c in part.split(";")]
            mime_type = components[0]

            # Default quality is 1.0
            quality = 1.0
            params = {}

            # Parse parameters
            for param in components[1:]:
                if "=" in param:
                    key, value = param.split("=", 1)
                    key = key.strip()
                    value = value.strip()

                    if key == "q":
                        try:
                            quality = float(value)
                            # Clamp to valid range [0, 1]
                            quality = max(0.0, min(1.0, quality))
                        except (ValueError, TypeError):
                            quality = 1.0
                    else:
                        params[key] = value

            formats.append(AcceptFormat(mime_type, quality, params))

        # Sort by quality (descending), then by specificity
        formats.sort(
            key=lambda f: (f.quality, f.mime_type != "*/*", "/" in f.mime_type),
            reverse=True,
        )

        return formats


# ============================================================================
# FORMAT CONVERTER
# ============================================================================


class FormatConverter:
    """Convert between different RDF formats using rdflib"""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize format converter.

        Args:
            config: RDF conversion configuration
        """
        self.config = config
        self.default_format = config.get("default_format", "json-ld")
        self.formats = config.get("formats", {})
        self.parser_options = config.get("parser", {})
        self.serializer_options = config.get("serializer", {})

        self.logger = logging.getLogger(__name__)

    def json_ld_to_graph(self, json_ld_data: Dict[str, Any]) -> Graph:
        """
        Convert JSON-LD data to rdflib Graph.

        Args:
            json_ld_data: JSON-LD dictionary

        Returns:
            rdflib Graph
        """
        graph = Graph()

        try:
            # Serialize to JSON string
            json_str = json.dumps(json_ld_data)

            # Parse into graph
            graph.parse(
                data=json_str,
                format="json-ld",
                encoding=self.parser_options.get("encoding", "utf-8"),
            )

            self.logger.debug(f"Parsed JSON-LD into graph with {len(graph)} triples")

        except Exception as e:
            self.logger.error(f"Failed to parse JSON-LD: {e}")
            raise ValueError(f"Invalid JSON-LD data: {e}")

        return graph

    def graph_to_turtle(self, graph: Graph, base_uri: Optional[str] = None) -> str:
        """
        Convert rdflib Graph to Turtle format.

        Args:
            graph: rdflib Graph
            base_uri: Base URI for relative references

        Returns:
            Turtle string
        """
        try:
            turtle_config = self.formats.get("turtle", {})

            turtle = graph.serialize(
                format="turtle",
                base=base_uri or turtle_config.get("base_uri"),
                encoding="utf-8",
            )

            # Handle bytes return value
            if isinstance(turtle, bytes):
                turtle = turtle.decode("utf-8")

            self.logger.debug(f"Serialized graph to Turtle ({len(turtle)} chars)")

            return turtle

        except Exception as e:
            self.logger.error(f"Failed to serialize to Turtle: {e}")
            raise ValueError(f"Turtle serialization failed: {e}")

    def graph_to_rdfxml(self, graph: Graph, base_uri: Optional[str] = None) -> str:
        """
        Convert rdflib Graph to RDF/XML format.

        Args:
            graph: rdflib Graph
            base_uri: Base URI for XML base

        Returns:
            RDF/XML string
        """
        try:
            rdfxml_config = self.formats.get("rdf-xml", {})

            rdfxml = graph.serialize(
                format="xml",
                base=base_uri or rdfxml_config.get("xml_base"),
                encoding="utf-8",
            )

            # Handle bytes return value
            if isinstance(rdfxml, bytes):
                rdfxml = rdfxml.decode("utf-8")

            self.logger.debug(f"Serialized graph to RDF/XML ({len(rdfxml)} chars)")

            return rdfxml

        except Exception as e:
            self.logger.error(f"Failed to serialize to RDF/XML: {e}")
            raise ValueError(f"RDF/XML serialization failed: {e}")

    def graph_to_jsonld(
        self, graph: Graph, context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Convert rdflib Graph to JSON-LD format.

        Args:
            graph: rdflib Graph
            context: JSON-LD context URL

        Returns:
            JSON-LD dictionary
        """
        try:
            jsonld_config = self.formats.get("json-ld", {})

            jsonld_str = graph.serialize(
                format="json-ld",
                context=context or jsonld_config.get("context"),
                encoding="utf-8",
                indent=self.serializer_options.get("indent", 2),
            )

            # Handle bytes return value
            if isinstance(jsonld_str, bytes):
                jsonld_str = jsonld_str.decode("utf-8")

            # Parse back to dict
            jsonld_data = json.loads(jsonld_str)

            self.logger.debug(f"Serialized graph to JSON-LD")

            return jsonld_data

        except Exception as e:
            self.logger.error(f"Failed to serialize to JSON-LD: {e}")
            raise ValueError(f"JSON-LD serialization failed: {e}")

    def convert_to_format(
        self, data: Dict[str, Any], target_format: str, base_uri: Optional[str] = None
    ) -> Any:
        """
        Convert data to target format.

        Args:
            data: Source data (JSON-LD dict)
            target_format: Target MIME type
            base_uri: Base URI for conversions

        Returns:
            Converted data (string or dict)
        """
        # Parse to graph
        graph = self.json_ld_to_graph(data)

        # Convert to target format
        if target_format == "application/ld+json":
            return data  # Already JSON-LD
        elif target_format == "text/turtle":
            return self.graph_to_turtle(graph, base_uri)
        elif target_format == "application/rdf+xml":
            return self.graph_to_rdfxml(graph, base_uri)
        else:
            raise ValueError(f"Unsupported target format: {target_format}")


# ============================================================================
# HTML RENDERER
# ============================================================================


class HTMLRenderer:
    """Render entities as HTML using Jinja2 templates"""

    def __init__(self, template_dir: str, config: Dict[str, Any]):
        """
        Initialize HTML renderer.

        Args:
            template_dir: Path to templates directory
            config: Template configuration
        """
        self.template_dir = Path(template_dir)
        self.config = config

        # Create Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=config.get("autoescape", True),
            auto_reload=config.get("auto_reload", True),
            cache_size=config.get("cache_size", 400),
        )

        # Add custom filters
        self._setup_filters()

        # Add globals
        globals_config = config.get("globals", {})
        self.env.globals.update(globals_config)

        self.logger = logging.getLogger(__name__)

    def _setup_filters(self):
        """Setup custom Jinja2 filters"""

        def format_coordinates(coords):
            """Format coordinate array"""
            if isinstance(coords, list) and len(coords) >= 2:
                return f"{coords[1]:.6f}, {coords[0]:.6f}"
            return str(coords)

        def format_datetime(dt_str):
            """Format ISO datetime string"""
            try:
                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                return dt.strftime("%Y-%m-%d %H:%M:%S UTC")
            except:
                return dt_str

        self.env.filters["format_coordinates"] = format_coordinates
        self.env.filters["format_datetime"] = format_datetime

    def render(
        self, template_name: str, entity_data: Dict[str, Any], base_url: str = ""
    ) -> str:
        """
        Render entity as HTML.

        Args:
            template_name: Template file name
            entity_data: Entity data (JSON-LD dict)
            base_url: Base URL for links

        Returns:
            HTML string
        """
        try:
            template = self.env.get_template(template_name)

            # Prepare context
            context = {
                "entity": entity_data,
                "base_url": base_url,
                "formats": [
                    {
                        "name": "JSON-LD",
                        "param": "jsonld",
                        "mime": "application/ld+json",
                    },
                    {"name": "Turtle", "param": "turtle", "mime": "text/turtle"},
                    {
                        "name": "RDF/XML",
                        "param": "rdfxml",
                        "mime": "application/rdf+xml",
                    },
                ],
            }

            html = template.render(**context)

            self.logger.debug(f"Rendered HTML with template {template_name}")

            return html

        except TemplateNotFound:
            self.logger.error(f"Template not found: {template_name}")
            raise ValueError(f"Template not found: {template_name}")
        except Exception as e:
            self.logger.error(f"Template rendering failed: {e}")
            raise ValueError(f"HTML rendering failed: {e}")


# ============================================================================
# CONTENT NEGOTIATION CONFIG
# ============================================================================


class ContentNegotiationConfig:
    """Configuration loader for content negotiation agent"""

    def __init__(self, config_path: str):
        """
        Initialize configuration.

        Args:
            config_path: Path to YAML config file
        """
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self._setup_logging()

        self.logger = logging.getLogger(__name__)
        self.logger.info(f"Loaded configuration from {config_path}")

    def _load_config(self) -> Dict[str, Any]:
        """Load YAML configuration file"""
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)

            if "content_negotiation" not in config:
                raise ValueError("Missing 'content_negotiation' root key in config")

            # Expand environment variables like ${VAR:-default}
            config = expand_env_var(config)
            return config["content_negotiation"]

        except FileNotFoundError:
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in config: {e}")

    def _setup_logging(self):
        """Setup logging from config"""
        log_config = self.config.get("logging", {})

        log_level = getattr(logging, log_config.get("level", "INFO").upper())
        log_format = log_config.get("format", "json")
        log_file = log_config.get("file", "logs/content_negotiation.log")

        # Create logs directory
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        # Setup formatter
        if log_format == "json":
            formatter = logging.Formatter(
                '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
            )
        else:
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )

        # File handler
        from logging.handlers import RotatingFileHandler

        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=log_config.get("max_bytes", 10485760),
            backupCount=log_config.get("backup_count", 5),
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)

        # Console handler - initialize before conditional check
        console_handler = None
        if log_config.get("console_output", True):
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            console_handler.setLevel(log_level)

        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)
        root_logger.addHandler(file_handler)

        if console_handler is not None:
            root_logger.addHandler(console_handler)

    def get_server_config(self) -> Dict[str, Any]:
        """Get server configuration"""
        return self.config.get("server", {})

    def get_formats(self) -> List[FormatConfig]:
        """Get list of format configurations"""
        formats_config = self.config.get("formats", [])

        return [
            FormatConfig(
                mime_type=fmt["mime_type"],
                extension=fmt["extension"],
                priority=fmt["priority"],
                source=fmt["source"],
                description=fmt.get("description", ""),
                charset=fmt.get("charset", "utf-8"),
                template=fmt.get("template"),
            )
            for fmt in formats_config
        ]

    def get_backend_config(self, backend_name: str) -> BackendConfig:
        """Get backend configuration"""
        backends = self.config.get("backends", {})

        if backend_name not in backends:
            raise ValueError(f"Unknown backend: {backend_name}")

        backend = backends[backend_name]

        return BackendConfig(
            url=backend["url"],
            timeout=backend.get("timeout", 30),
            headers=backend.get("headers", {}),
            retry=backend.get("retry", {}),
        )

    def get_redirects_config(self) -> Dict[str, Any]:
        """Get redirects configuration"""
        return self.config.get("redirects", {})

    def get_link_headers_config(self) -> Dict[str, Any]:
        """Get link headers configuration"""
        return self.config.get("link_headers", {})

    def get_rdf_conversion_config(self) -> Dict[str, Any]:
        """Get RDF conversion configuration"""
        return self.config.get("rdf_conversion", {})

    def get_templates_config(self) -> Dict[str, Any]:
        """Get templates configuration"""
        return self.config.get("templates", {})

    def get_caching_config(self) -> Dict[str, Any]:
        """Get caching configuration"""
        return self.config.get("caching", {})

    def get_cors_config(self) -> Dict[str, Any]:
        """Get CORS configuration"""
        return self.config.get("cors", {})

    def get_monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring configuration"""
        return self.config.get("monitoring", {})


# ============================================================================
# CONTENT NEGOTIATION AGENT
# ============================================================================


class ContentNegotiationAgent:
    """Main content negotiation agent"""

    def __init__(self, config_path: str):
        """
        Initialize content negotiation agent.

        Args:
            config_path: Path to YAML config file
        """
        self.config = ContentNegotiationConfig(config_path)
        self.logger = logging.getLogger(__name__)

        # Initialize components
        self.formats = self.config.get_formats()
        self.parser = AcceptHeaderParser()
        self.converter = FormatConverter(self.config.get_rdf_conversion_config())

        # Initialize HTML renderer
        template_config = self.config.get_templates_config()
        template_dir = template_config.get("template_dir", "templates")
        self.html_renderer = HTMLRenderer(template_dir, template_config)

        # HTTP client for backend requests
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0), follow_redirects=True
        )

        # Statistics
        self.stats = {"requests": 0, "format_usage": {}, "errors": 0, "cache_hits": 0}

        self.logger.info("Content Negotiation Agent initialized")

    async def shutdown(self):
        """Cleanup resources"""
        await self.client.aclose()
        self.logger.info("Content Negotiation Agent shutdown")

    def negotiate_format(
        self, accept_header: str, available_formats: Optional[List[FormatConfig]] = None
    ) -> NegotiationResult:
        """
        Negotiate best format based on Accept header.

        Args:
            accept_header: Accept header value
            available_formats: List of available formats (default: all)

        Returns:
            NegotiationResult with selected format

        Raises:
            HTTPException: If no acceptable format found (406)
        """
        if available_formats is None:
            available_formats = self.formats

        # Parse Accept header
        accept_formats = self.parser.parse(accept_header)

        # Try to match each accepted format
        for accept_fmt in accept_formats:
            for available_fmt in available_formats:
                # Exact match
                if available_fmt.matches(accept_fmt.mime_type):
                    return NegotiationResult(
                        format_config=available_fmt,
                        quality=accept_fmt.quality,
                        matched_mime_type=accept_fmt.mime_type,
                    )

                # Wildcard match
                if accept_fmt.mime_type == "*/*":
                    # Return highest priority format
                    best = max(available_formats, key=lambda f: f.priority)
                    return NegotiationResult(
                        format_config=best,
                        quality=accept_fmt.quality,
                        matched_mime_type=best.mime_type,
                    )

                # Type wildcard (e.g., text/*)
                if accept_fmt.mime_type.endswith("/*"):
                    type_prefix = accept_fmt.mime_type.split("/")[0]
                    if available_fmt.mime_type.startswith(type_prefix + "/"):
                        return NegotiationResult(
                            format_config=available_fmt,
                            quality=accept_fmt.quality,
                            matched_mime_type=accept_fmt.mime_type,
                        )

        # No acceptable format found
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail=f"Cannot produce response matching Accept: {accept_header}",
        )

    async def fetch_from_stellio(self, entity_id: str) -> Dict[str, Any]:
        """
        Fetch entity from Stellio backend.

        Args:
            entity_id: Entity ID

        Returns:
            JSON-LD entity data
        """
        backend_config = self.config.get_backend_config("stellio")
        url = backend_config.format_url(id=entity_id)

        self.logger.debug(f"Fetching from Stellio: {url}")

        max_attempts = backend_config.retry["max_attempts"]
        backoff = backend_config.retry["backoff_factor"]

        for attempt in range(max_attempts):
            try:
                response = await self.client.get(
                    url, headers=backend_config.headers, timeout=backend_config.timeout
                )

                if response.status_code == 200:
                    data = response.json()
                    self.logger.info(f"Fetched entity {entity_id} from Stellio")
                    return data
                elif response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Entity not found: {entity_id}",
                    )
                else:
                    self.logger.warning(f"Stellio returned {response.status_code}")

            except httpx.TimeoutException:
                self.logger.warning(
                    f"Stellio timeout (attempt {attempt + 1}/{max_attempts})"
                )
                if attempt < max_attempts - 1:
                    await asyncio.sleep(backoff**attempt)
                    continue
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Backend timeout",
                )
            except httpx.RequestError as e:
                self.logger.error(f"Stellio request error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY, detail="Backend error"
                )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch from backend",
        )

    async def fetch_from_fuseki(self, entity_uri: str) -> str:
        """
        Fetch entity from Fuseki backend via SPARQL.

        Args:
            entity_uri: Entity URI

        Returns:
            Turtle format string
        """
        backend_config = self.config.get_backend_config("fuseki")

        # Format SPARQL query
        query_template = backend_config.retry.get("query_template", "")
        if not query_template:
            # Fallback query
            query_template = f"CONSTRUCT {{ ?s ?p ?o }} WHERE {{ ?s ?p ?o . FILTER(?s = <{entity_uri}>) }}"
        else:
            query_template = query_template.format(uri=entity_uri)

        url = backend_config.url

        self.logger.debug(f"Fetching from Fuseki: {url}")

        max_attempts = backend_config.retry["max_attempts"]
        backoff = backend_config.retry["backoff_factor"]

        for attempt in range(max_attempts):
            try:
                response = await self.client.post(
                    url,
                    data={"query": query_template},
                    headers={"Accept": "text/turtle"},
                    timeout=backend_config.timeout,
                )

                if response.status_code == 200:
                    turtle_data = response.text
                    self.logger.info(f"Fetched entity {entity_uri} from Fuseki")
                    return turtle_data
                elif response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Entity not found: {entity_uri}",
                    )
                else:
                    self.logger.warning(f"Fuseki returned {response.status_code}")

            except httpx.TimeoutException:
                self.logger.warning(
                    f"Fuseki timeout (attempt {attempt + 1}/{max_attempts})"
                )
                if attempt < max_attempts - 1:
                    await asyncio.sleep(backoff**attempt)
                    continue
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Backend timeout",
                )
            except httpx.RequestError as e:
                self.logger.error(f"Fuseki request error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY, detail="Backend error"
                )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch from backend",
        )

    async def get_entity_data(
        self, entity_id: str, format_config: FormatConfig, base_url: str = ""
    ) -> Tuple[Any, str]:
        """
        Get entity data in requested format.

        Args:
            entity_id: Entity ID
            format_config: Requested format configuration
            base_url: Base URL for entity

        Returns:
            Tuple of (data, content_type)
        """
        try:
            # Fetch from appropriate backend
            if format_config.source == "stellio":
                # Fetch JSON-LD from Stellio
                json_ld_data = await self.fetch_from_stellio(entity_id)

                if format_config.mime_type == "application/ld+json":
                    # Return as-is
                    return json_ld_data, format_config.get_content_type()
                else:
                    # Convert to requested format
                    converted_data = self.converter.convert_to_format(
                        json_ld_data, format_config.mime_type, base_url
                    )
                    return converted_data, format_config.get_content_type()

            elif format_config.source == "fuseki":
                # Fetch Turtle from Fuseki
                entity_uri = f"{base_url}/id/{entity_id}"
                turtle_data = await self.fetch_from_fuseki(entity_uri)

                if format_config.mime_type == "text/turtle":
                    # Return as-is
                    return turtle_data, format_config.get_content_type()
                else:
                    # Parse Turtle and convert
                    graph = Graph()
                    graph.parse(data=turtle_data, format="turtle")

                    if format_config.mime_type == "application/ld+json":
                        json_ld_data = self.converter.graph_to_jsonld(graph)
                        return json_ld_data, format_config.get_content_type()
                    elif format_config.mime_type == "application/rdf+xml":
                        rdfxml_data = self.converter.graph_to_rdfxml(graph, base_url)
                        return rdfxml_data, format_config.get_content_type()

            elif format_config.source == "convert":
                # Fetch JSON-LD and convert
                json_ld_data = await self.fetch_from_stellio(entity_id)
                converted_data = self.converter.convert_to_format(
                    json_ld_data, format_config.mime_type, base_url
                )
                return converted_data, format_config.get_content_type()

            elif format_config.source == "template":
                # Fetch JSON-LD and render HTML
                json_ld_data = await self.fetch_from_stellio(entity_id)

                template_name = format_config.template
                if not template_name:
                    raise ValueError("No template specified for HTML format")

                # Extract just filename from path
                template_name = Path(template_name).name

                html_data = self.html_renderer.render(
                    template_name, json_ld_data, base_url
                )
                return html_data, format_config.get_content_type()

            else:
                raise ValueError(f"Unknown format source: {format_config.source}")

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Failed to get entity data: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process entity: {str(e)}",
            )

    def build_link_headers(self, base_url: str, current_format: str) -> List[str]:
        """
        Build Link headers for alternate formats.

        Args:
            base_url: Base URL for entity
            current_format: Current format MIME type

        Returns:
            List of Link header values
        """
        link_config = self.config.get_link_headers_config()

        if not link_config.get("enabled", True):
            return []

        include_formats = link_config.get("include_formats", [])
        rel = link_config.get("rel", "alternate")

        links = []

        for fmt in self.formats:
            # Skip current format
            if fmt.mime_type == current_format:
                continue

            # Check if format should be included
            if include_formats and fmt.mime_type not in include_formats:
                continue

            # Build link URL with format parameter
            link_url = f"{base_url}?format={fmt.extension.lstrip('.')}"

            # Build Link header value
            link_value = f'<{link_url}>;rel="{rel}";type="{fmt.mime_type}"'
            links.append(link_value)

        return links

    def should_redirect(self, path: str) -> bool:
        """
        Check if path should be redirected (303).

        Args:
            path: Request path

        Returns:
            True if should redirect
        """
        redirect_config = self.config.get_redirects_config()

        if not redirect_config.get("enabled", True):
            return False

        suffix = redirect_config.get("information_resource_suffix", "/data")

        # If already has suffix, no redirect
        if path.endswith(suffix):
            return False

        # Check if matches non-information pattern
        pattern = redirect_config.get(
            "non_information_pattern", r"^/id/([^/]+)/([^/]+)$"
        )

        if re.match(pattern, path):
            return True

        return False

    def get_redirect_location(self, path: str) -> str:
        """
        Get redirect location for path.

        Args:
            path: Request path

        Returns:
            Redirect location
        """
        redirect_config = self.config.get_redirects_config()
        suffix = redirect_config.get("information_resource_suffix", "/data")

        return f"{path}{suffix}"

    def get_statistics(self) -> Dict[str, Any]:
        """Get agent statistics"""
        return {
            "requests": self.stats["requests"],
            "format_usage": dict(self.stats["format_usage"]),
            "errors": self.stats["errors"],
            "cache_hits": self.stats["cache_hits"],
        }

    def health_check(self) -> Dict[str, Any]:
        """Health check endpoint"""
        return {
            "status": "healthy",
            "service": "content-negotiation",
            "formats": len(self.formats),
            "requests": self.stats["requests"],
        }


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================


def create_app(config_path: str) -> FastAPI:
    """
    Create FastAPI application.

    Args:
        config_path: Path to config file

    Returns:
        FastAPI app
    """
    app = FastAPI(
        title="Content Negotiation Service",
        description="LOD Content Negotiation with multi-format support",
        version="1.0.0",
    )

    # Initialize agent
    agent = ContentNegotiationAgent(config_path)

    # Setup CORS
    cors_config = agent.config.get_cors_config()
    if cors_config.get("enabled", True):
        app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_config.get("allow_origins", ["*"]),
            allow_methods=cors_config.get("allow_methods", ["GET", "HEAD", "OPTIONS"]),
            allow_headers=cors_config.get("allow_headers", ["*"]),
            expose_headers=cors_config.get("expose_headers", []),
            max_age=cors_config.get("max_age", 3600),
        )

    @app.on_event("shutdown")
    async def shutdown_event():
        await agent.shutdown()

    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return agent.health_check()

    @app.get("/metrics")
    async def metrics():
        """Metrics endpoint"""
        return agent.get_statistics()

    @app.get("/id/{entity_type}/{entity_id}")
    async def get_entity_non_information(
        entity_type: str, entity_id: str, request: Request
    ):
        """
        Non-information resource endpoint.
        Returns 303 redirect to information resource.
        """
        path = f"/id/{entity_type}/{entity_id}"

        if agent.should_redirect(path):
            location = agent.get_redirect_location(path)

            # Validate redirect location to prevent open redirect vulnerability
            # Only allow relative paths starting with /
            if not location or not location.startswith("/"):
                agent.logger.warning(f"Invalid redirect location blocked: {location}")
                return await get_entity_data(entity_type, entity_id, request)

            # Get redirect config
            redirect_config = agent.config.get_redirects_config()
            status_code = redirect_config.get("status_code", 303)
            vary_header = redirect_config.get("vary_header", "Accept")

            # Build full URL using only validated relative path
            base_url = str(request.base_url).rstrip("/")
            full_location = f"{base_url}{location}"

            agent.logger.info(f"303 redirect: {path} -> {location}")

            headers = {"Vary": vary_header}

            return RedirectResponse(
                url=full_location, status_code=status_code, headers=headers
            )

        # If redirects disabled, fall through to data handler
        return await get_entity_data(entity_type, entity_id, request)

    @app.get("/id/{entity_type}/{entity_id}/data")
    async def get_entity_data(entity_type: str, entity_id: str, request: Request):
        """
        Information resource endpoint.
        Returns entity in negotiated format.
        """
        agent.stats["requests"] += 1

        # Get Accept header
        accept_header = request.headers.get("Accept", "application/ld+json")

        # Check for format query parameter override
        format_param = request.query_params.get("format")
        if format_param:
            # Map extension to MIME type
            format_map = {
                "jsonld": "application/ld+json",
                "turtle": "text/turtle",
                "ttl": "text/turtle",
                "rdfxml": "application/rdf+xml",
                "rdf": "application/rdf+xml",
                "html": "text/html",
            }

            if format_param in format_map:
                accept_header = format_map[format_param]

        try:
            # Negotiate format
            negotiation = agent.negotiate_format(accept_header)
            format_config = negotiation.format_config

            # Track format usage
            agent.stats["format_usage"][format_config.mime_type] = (
                agent.stats["format_usage"].get(format_config.mime_type, 0) + 1
            )

            # Get entity data
            full_entity_id = f"urn:ngsi-ld:{entity_type}:{entity_id}"
            base_url = str(request.base_url).rstrip("/")

            data, content_type = await agent.get_entity_data(
                full_entity_id, format_config, base_url
            )

            # Build Link headers
            entity_url = f"{base_url}/id/{entity_type}/{entity_id}/data"
            link_headers = agent.build_link_headers(entity_url, format_config.mime_type)

            # Build response headers
            headers = {"Content-Type": content_type, "Vary": "Accept"}

            # Add Link headers
            if link_headers:
                headers["Link"] = ", ".join(link_headers)

            # Add caching headers
            cache_config = agent.config.get_caching_config()
            if cache_config.get("enabled", True):
                cc = cache_config.get("cache_control", {})
                cache_parts = []

                if cc.get("public", True):
                    cache_parts.append("public")

                max_age = cc.get("max_age", 300)
                cache_parts.append(f"max-age={max_age}")

                if cc.get("must_revalidate", False):
                    cache_parts.append("must-revalidate")

                headers["Cache-Control"] = ", ".join(cache_parts)

                # ETag
                if cache_config.get("etag", {}).get("enabled", True):
                    data_str = json.dumps(data) if isinstance(data, dict) else str(data)
                    etag = hashlib.sha256(data_str.encode()).hexdigest()[:16]
                    headers["ETag"] = f'"{etag}"'

            # Return response based on format
            if format_config.mime_type == "text/html":
                return HTMLResponse(content=data, headers=headers)
            elif format_config.mime_type == "application/ld+json":
                return Response(
                    content=json.dumps(data, indent=2, ensure_ascii=False),
                    media_type=content_type,
                    headers=headers,
                )
            else:
                return PlainTextResponse(content=data, headers=headers)

        except HTTPException:
            agent.stats["errors"] += 1
            raise
        except Exception as e:
            agent.stats["errors"] += 1
            agent.logger.error(f"Request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
            )

    return app


# ============================================================================
# MAIN
# ============================================================================


if __name__ == "__main__":
    import uvicorn

    config_path = "config/content_negotiation_config.yaml"

    # Create app
    app = create_app(config_path)

    # Get server config
    agent = ContentNegotiationAgent(config_path)
    server_config = agent.config.get_server_config()

    # Run server
    uvicorn.run(
        app,
        host=server_config.get("host", "0.0.0.0"),
        port=server_config.get("port", 8082),
        workers=server_config.get("workers", 4),
        reload=server_config.get("reload", False),
        log_level=server_config.get("log_level", "info"),
    )
