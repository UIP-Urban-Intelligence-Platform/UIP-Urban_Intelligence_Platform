#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Triplestore Loader Agent - Apache Jena Fuseki Integration.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.rdf_linked_data.triplestore_loader_agent
Author: Nguyen Viet Hoang
Created: 2025-11-22
Version: 2.0.0
License: MIT

Description:
    Loads RDF data into Apache Jena Fuseki triplestore with support for
    multiple RDF formats, named graphs, and batch processing.

Supported RDF Formats:
    - Turtle (.ttl)
    - N-Triples (.nt)
    - RDF/XML (.rdf, .xml)
    - JSON-LD (.jsonld)

Core Features:
    - Named graph organization
    - Batch processing for large datasets
    - SPARQL endpoint validation
    - Retry logic with exponential backoff
    - Format auto-detection
    - Comprehensive error handling

Dependencies:
    - requests>=2.28: HTTP client for Fuseki API
    - rdflib>=6.0: RDF parsing and validation
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/fuseki.yaml:
        - fuseki_url: Fuseki server endpoint
        - dataset_name: Target dataset
        - named_graphs: Graph organization rules
        - batch_size: Triples per batch

Example:
    ```python
    from src.agents.rdf_linked_data.triplestore_loader_agent import TriplestoreLoaderAgent

    agent = TriplestoreLoaderAgent()
    agent.load_rdf_file("data/rdf/observations.ttl", graph_name="observations")
    ```

Architecture:
    File → Parser → Validator → Batch Processor → Fuseki SPARQL Endpoint

References:
    - Apache Jena Fuseki: https://jena.apache.org/documentation/fuseki2/
    - RDF 1.1 Specification: https://www.w3.org/TR/rdf11-concepts/
"""

import json
import logging
import os
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
import yaml
from rdflib import Graph, URIRef

from src.core.config_loader import expand_env_var

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class LoadStatistics:
    """Statistics for triplestore loading operation"""

    timestamp: str
    dataset: str
    files_loaded: List[str]
    total_triples: int
    named_graphs: List[str]
    sparql_endpoint: str
    duration_seconds: float
    status: str
    errors: List[str]

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


class ConfigLoader:
    """Load and validate Fuseki configuration from YAML file"""

    def __init__(self):
        """Initialize configuration loader"""
        self.config = None

    def load_config(self, config_path: str) -> Dict:
        """
        Load Fuseki configuration from YAML file

        Args:
            config_path: Path to fuseki.yaml configuration file

        Returns:
            Configuration dictionary

        Raises:
            FileNotFoundError: If config file not found
            ValueError: If config is invalid
        """
        try:
            if not os.path.exists(config_path):
                raise FileNotFoundError(f"Configuration file not found: {config_path}")

            with open(config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)

            # Expand environment variables using centralized helper
            config = expand_env_var(config)

            # Override with environment variables
            self._apply_env_overrides(config)

            # Validate configuration
            self.validate_config(config)

            self.config = config
            logger.info(f"Loaded Fuseki configuration from: {config_path}")
            return config

        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML configuration: {e}")
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            raise

    def _apply_env_overrides(self, config: Dict) -> None:
        """Apply environment variable overrides to configuration"""
        fuseki_config = config.get("fuseki", {})

        # Override base_url
        if "FUSEKI_BASE_URL" in os.environ:
            fuseki_config["base_url"] = os.environ["FUSEKI_BASE_URL"]

        # Override dataset
        if "FUSEKI_DATASET" in os.environ:
            fuseki_config["dataset"] = os.environ["FUSEKI_DATASET"]

        # Override auth credentials
        auth = fuseki_config.get("auth", {})
        if "FUSEKI_USERNAME" in os.environ:
            auth["username"] = os.environ["FUSEKI_USERNAME"]
        if "FUSEKI_PASSWORD" in os.environ:
            auth["password"] = os.environ["FUSEKI_PASSWORD"]

        # Replace ${FUSEKI_PASSWORD} placeholder
        if auth.get("password", "").startswith("${") and auth["password"].endswith("}"):
            env_var = auth["password"][2:-1]
            if env_var in os.environ:
                auth["password"] = os.environ[env_var]
            else:
                # Log warning without revealing env variable name
                logger.warning("Required password environment variable not set")

    def validate_config(self, config: Dict) -> None:
        """
        Validate Fuseki configuration structure

        Args:
            config: Configuration dictionary

        Raises:
            ValueError: If configuration is invalid
        """
        if "fuseki" not in config:
            raise ValueError("Missing 'fuseki' section in configuration")

        fuseki = config["fuseki"]

        # Validate required fields
        required_fields = ["base_url", "dataset", "endpoints"]
        for field in required_fields:
            if field not in fuseki:
                raise ValueError(f"Missing required field 'fuseki.{field}'")

        # Validate endpoints
        endpoints = fuseki["endpoints"]
        required_endpoints = ["data", "sparql"]
        for endpoint in required_endpoints:
            if endpoint not in endpoints:
                raise ValueError(
                    f"Missing required endpoint 'fuseki.endpoints.{endpoint}'"
                )

        # Validate upload config
        if "upload" in fuseki:
            upload = fuseki["upload"]
            if "supported_formats" in upload:
                for fmt in upload["supported_formats"]:
                    if "format" not in fmt or "mime_type" not in fmt:
                        raise ValueError(
                            "Invalid format definition in upload.supported_formats"
                        )

        logger.debug("Fuseki configuration validation passed")

    def get_fuseki_config(self) -> Dict:
        """Get Fuseki configuration section"""
        if not self.config:
            raise ValueError("Configuration not loaded. Call load_config() first.")
        return self.config.get("fuseki", {})

    def get_domain_config(self, domain: str) -> Optional[Dict]:
        """
        Get domain-specific configuration

        Args:
            domain: Domain name (e.g., 'traffic-cameras')

        Returns:
            Domain configuration or None if not found
        """
        if not self.config:
            return None

        domains = self.config.get("domains", {})
        return domains.get(domain)


class RDFValidator:
    """Validate RDF syntax and structure"""

    def __init__(self):
        """Initialize RDF validator"""
        self.format_map = {
            ".ttl": "turtle",
            ".nt": "nt",
            ".rdf": "xml",
            ".xml": "xml",
            ".jsonld": "json-ld",
        }

    def validate_file(self, file_path: str) -> Tuple[bool, Optional[str], int]:
        """
        Validate RDF file syntax

        Args:
            file_path: Path to RDF file

        Returns:
            Tuple of (is_valid, error_message, triple_count)
        """
        try:
            if not os.path.exists(file_path):
                return False, f"File not found: {file_path}", 0

            # Detect format from extension
            ext = Path(file_path).suffix.lower()
            rdf_format = self.format_map.get(ext)

            if not rdf_format:
                return False, f"Unsupported file extension: {ext}", 0

            # Parse RDF file
            graph = Graph()
            graph.parse(file_path, format=rdf_format)

            triple_count = len(graph)

            if triple_count == 0:
                return False, "File contains no triples", 0

            logger.info(f"Validated RDF file: {file_path} ({triple_count} triples)")
            return True, None, triple_count

        except Exception as e:
            error_msg = f"RDF validation failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, 0

    def validate_graph(self, graph: Graph) -> Tuple[bool, Optional[str]]:
        """
        Validate RDF graph

        Args:
            graph: RDFLib graph

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            if len(graph) == 0:
                return False, "Graph contains no triples"

            # Check for invalid URIs
            for s, p, o in graph:
                if isinstance(s, URIRef) and " " in str(s):
                    return False, f"Invalid URI with spaces: {s}"
                if isinstance(p, URIRef) and " " in str(p):
                    return False, f"Invalid URI with spaces: {p}"
                if isinstance(o, URIRef) and " " in str(o):
                    return False, f"Invalid URI with spaces: {o}"

            return True, None

        except Exception as e:
            return False, f"Graph validation failed: {str(e)}"


class FusekiClient:
    """Client for interacting with Apache Jena Fuseki triplestore"""

    def __init__(self, config: Dict):
        """
        Initialize Fuseki client

        Args:
            config: Fuseki configuration from YAML
        """
        self.base_url = config["base_url"].rstrip("/")
        self.dataset = config["dataset"]
        self.auth = config.get("auth", {})
        self.endpoints = config["endpoints"]
        self.upload_config = config.get("upload", {})
        self.timeout = self.upload_config.get("timeout", 60)
        self.retry_attempts = self.upload_config.get("retry_attempts", 3)
        self.retry_delay = self.upload_config.get("retry_delay", 2)

        # Build full endpoint URLs
        self.data_url = (
            f"{self.base_url}{self.endpoints['data'].format(dataset=self.dataset)}"
        )
        self.sparql_url = (
            f"{self.base_url}{self.endpoints['sparql'].format(dataset=self.dataset)}"
        )
        self.update_url = f"{self.base_url}{self.endpoints.get('update', '/{dataset}/update').format(dataset=self.dataset)}"

        # Authentication
        self.auth_tuple = None
        if self.auth.get("username") and self.auth.get("password"):
            self.auth_tuple = (self.auth["username"], self.auth["password"])

        logger.info(f"Initialized Fuseki client for dataset: {self.dataset}")
        logger.info(f"Data endpoint: {self.data_url}")
        logger.info(f"SPARQL endpoint: {self.sparql_url}")

    def ensure_dataset(self) -> bool:
        """
        Ensure dataset exists in Fuseki, create if not found.

        Returns:
            True if dataset exists or created successfully
        """
        try:
            # Check if dataset exists by querying server info
            ping_url = f"{self.base_url}/$/ping"
            response = requests.get(ping_url, auth=self.auth_tuple, timeout=5)

            if response.status_code != 200:
                logger.warning(f"Fuseki server not responding at {self.base_url}")
                return False

            # Check dataset exists via admin API (list datasets)
            list_url = f"{self.base_url}/$/datasets"
            response = requests.get(list_url, auth=self.auth_tuple, timeout=10)

            if response.status_code == 200:
                datasets_info = response.json()
                datasets = datasets_info.get("datasets", [])

                # Check if our dataset is in the list
                dataset_names = []
                for ds in datasets:
                    # Dataset format: {"ds.name": "/lod-dataset", ...}
                    ds_name = ds.get("ds.name", "")
                    if ds_name.startswith("/"):
                        ds_name = ds_name[1:]  # Remove leading /
                    dataset_names.append(ds_name)

                if self.dataset in dataset_names:
                    logger.info(f"Dataset '{self.dataset}' exists")
                    return True
                else:
                    logger.warning(
                        f"Dataset '{self.dataset}' not found in: {dataset_names}"
                    )
                    logger.warning(f"Attempting to create dataset '{self.dataset}'...")
                    return self._create_dataset()
            else:
                logger.warning(f"Failed to list datasets: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"Error checking dataset: {e}")
            return False

    def _create_dataset(self) -> bool:
        """
        Create dataset in Fuseki using admin API.

        Returns:
            True if dataset created successfully
        """
        try:
            # Fuseki admin API endpoint for creating datasets
            create_url = f"{self.base_url}/$/datasets"

            # Dataset configuration for form-data submission
            # Fuseki expects form-encoded data, not JSON
            dataset_config = {
                "dbName": self.dataset,
                "dbType": "tdb2",  # TDB2 is the recommended database type
            }

            logger.info(f"Creating dataset '{self.dataset}' with TDB2...")

            response = requests.post(
                create_url,
                data=dataset_config,  # Form-encoded, not JSON
                auth=self.auth_tuple,
                timeout=30,
            )

            if response.status_code in [200, 201]:
                logger.info(f"✅ Successfully created dataset '{self.dataset}'")

                # Verify dataset was created
                import time

                time.sleep(1)  # Give Fuseki time to initialize dataset

                list_url = f"{self.base_url}/$/datasets"
                verify_response = requests.get(
                    list_url, auth=self.auth_tuple, timeout=10
                )

                if verify_response.status_code == 200:
                    datasets_info = verify_response.json()
                    datasets = datasets_info.get("datasets", [])
                    dataset_names = [
                        ds.get("ds.name", "").lstrip("/") for ds in datasets
                    ]

                    if self.dataset in dataset_names:
                        logger.info(
                            f"✅ Verified dataset '{self.dataset}' exists in Fuseki"
                        )
                        return True
                    else:
                        logger.error(
                            f"Dataset '{self.dataset}' not found after creation"
                        )
                        return False
                else:
                    logger.warning("Could not verify dataset creation")
                    return True  # Assume success if create returned 200/201
            else:
                logger.error(
                    f"❌ Failed to create dataset: {response.status_code} - {response.text}"
                )
                return False

        except Exception as e:
            logger.error(f"❌ Error creating dataset: {e}")
            return False

    def upload_rdf(self, file_path: str, graph_uri: Optional[str] = None) -> bool:
        """
        Upload RDF file to Fuseki

        Args:
            file_path: Path to RDF file
            graph_uri: Optional named graph URI

        Returns:
            True if upload successful, False otherwise
        """
        try:
            # Detect MIME type from file extension
            ext = Path(file_path).suffix.lower()
            mime_type = self._get_mime_type(ext)

            if not mime_type:
                logger.error(f"Unsupported file type: {ext}")
                return False

            # Read file content
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Build URL using Fuseki Graph Store Protocol (GSP)
            # - POST to /{dataset}/data for default graph
            # - PUT to /{dataset}/data?graph=<uri> for named graph
            url = self.data_url
            http_method = "POST"  # Default for default graph

            if graph_uri:
                url = f"{url}?graph={graph_uri}"
                http_method = "PUT"  # GSP requires PUT for named graphs

            # Prepare headers
            headers = {"Content-Type": mime_type}

            # Upload with retry logic
            for attempt in range(self.retry_attempts):
                try:
                    # Use PUT for named graphs, POST for default graph
                    if http_method == "PUT":
                        response = requests.put(
                            url,
                            data=content.encode("utf-8"),
                            headers=headers,
                            auth=self.auth_tuple,
                            timeout=self.timeout,
                        )
                    else:
                        response = requests.post(
                            url,
                            data=content.encode("utf-8"),
                            headers=headers,
                            auth=self.auth_tuple,
                            timeout=self.timeout,
                        )

                    if response.status_code in [200, 201, 204]:
                        logger.info(f"Successfully uploaded: {file_path}")
                        if graph_uri:
                            logger.info(f"  Graph: {graph_uri}")
                        return True
                    else:
                        # HTTP errors are expected and handled by retry logic
                        logger.debug(
                            f"Upload attempt {attempt + 1} failed: {response.status_code} - {response.text}"
                        )

                        if attempt < self.retry_attempts - 1:
                            time.sleep(self.retry_delay)

                except requests.RequestException as e:
                    # Network errors are expected and handled by retry logic
                    logger.debug(f"Upload attempt {attempt + 1} failed: {e}")
                    if attempt < self.retry_attempts - 1:
                        time.sleep(self.retry_delay)

            logger.error(
                f"Failed to upload {file_path} after {self.retry_attempts} attempts"
            )
            return False

        except Exception as e:
            logger.error(f"Error uploading RDF file: {e}")
            return False

    def _get_mime_type(self, ext: str) -> Optional[str]:
        """Get MIME type for file extension"""
        mime_map = {
            ".ttl": "text/turtle",
            ".nt": "application/n-triples",
            ".rdf": "application/rdf+xml",
            ".xml": "application/rdf+xml",
            ".jsonld": "application/ld+json",
        }
        return mime_map.get(ext)

    def query_sparql(self, query: str) -> Optional[Dict]:
        """
        Execute SPARQL query

        Args:
            query: SPARQL query string

        Returns:
            Query results as dictionary or None if failed
        """
        try:
            headers = {
                "Content-Type": "application/sparql-query",
                "Accept": "application/sparql-results+json",
            }

            response = requests.post(
                self.sparql_url,
                data=query.encode("utf-8"),
                headers=headers,
                auth=self.auth_tuple,
                timeout=30,
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(
                    f"SPARQL query failed: {response.status_code} - {response.text}"
                )
                return None

        except Exception as e:
            logger.error(f"Error executing SPARQL query: {e}")
            return None

    def count_triples(self) -> int:
        """
        Count total triples in dataset (including named graphs)

        Returns:
            Number of triples or -1 if failed
        """
        # Query counts triples in ALL graphs (default + named)
        # GRAPH ?g makes it scan all named graphs
        query = """
        SELECT (COUNT(*) as ?count)
        WHERE {
            { ?s ?p ?o }  # Default graph
            UNION
            { GRAPH ?g { ?s ?p ?o } }  # All named graphs
        }
        """
        result = self.query_sparql(query)

        if result and "results" in result and "bindings" in result["results"]:
            bindings = result["results"]["bindings"]
            if bindings and "count" in bindings[0]:
                return int(bindings[0]["count"]["value"])

        return -1

    def test_endpoint(self) -> bool:
        """
        Test SPARQL endpoint connectivity

        Returns:
            True if endpoint is accessible, False otherwise
        """
        try:
            query = "ASK { ?s ?p ?o }"
            result = self.query_sparql(query)
            return result is not None
        except Exception as e:
            logger.error(f"Endpoint test failed: {e}")
            return False


class NamedGraphManager:
    """Manage named graphs for RDF data organization"""

    def __init__(self, config: Dict):
        """
        Initialize named graph manager

        Args:
            config: Fuseki configuration
        """
        self.named_graphs = config.get("named_graphs", [])
        self.base_url = config["base_url"]
        self.dataset = config["dataset"]

        logger.info(
            f"Initialized named graph manager with {len(self.named_graphs)} graphs"
        )

    def get_graph_for_file(self, file_path: str) -> Optional[str]:
        """
        Determine unique named graph URI for each file to prevent overwrites.
        Each RDF file gets its own named graph based on filename.

        Args:
            file_path: Path to RDF file

        Returns:
            Unique named graph URI for this file
        """
        # Create unique graph URI from filename
        # Example: Camera_20251101_073532.ttl -> http://example.org/graphs/Camera_20251101_073532
        filename = os.path.splitext(os.path.basename(file_path))[0]

        # Use configured base graph URI or default
        if self.named_graphs:
            base_graph = self.named_graphs[0].rsplit("/", 1)[0]  # Get base path
        else:
            base_graph = "http://example.org/graphs"

        # Return unique graph URI per file
        return f"{base_graph}/{filename}"

    def list_graphs(self) -> List[str]:
        """Get list of configured named graphs"""
        return self.named_graphs.copy()


class SPARQLTester:
    """Test SPARQL endpoint functionality"""

    def __init__(self, fuseki_client: FusekiClient, config: Dict):
        """
        Initialize SPARQL tester

        Args:
            fuseki_client: FusekiClient instance
            config: Fuseki configuration
        """
        self.client = fuseki_client
        self.test_queries = config.get("sparql", {}).get("test_queries", [])

        logger.info(
            f"Initialized SPARQL tester with {len(self.test_queries)} test queries"
        )

    def run_tests(self) -> Tuple[bool, List[str]]:
        """
        Run all test queries

        Returns:
            Tuple of (all_passed, error_messages)
        """
        errors = []
        passed = 0

        for test in self.test_queries:
            name = test.get("name", "unknown")
            query = test.get("query")
            expected_binding = test.get("expected_binding")

            if not query:
                errors.append(f"Test '{name}': Missing query")
                continue

            logger.info(f"Running test query: {name}")
            result = self.client.query_sparql(query)

            if result is None:
                errors.append(f"Test '{name}': Query failed")
                continue

            # Check for expected binding
            if expected_binding:
                if "results" in result and "bindings" in result["results"]:
                    bindings = result["results"]["bindings"]
                    if not bindings:
                        errors.append(f"Test '{name}': No results returned")
                        continue

                    if expected_binding not in bindings[0]:
                        errors.append(
                            f"Test '{name}': Missing expected binding '{expected_binding}'"
                        )
                        continue
                else:
                    errors.append(f"Test '{name}': Invalid result format")
                    continue

            passed += 1
            logger.info(f"Test '{name}': PASSED")

        all_passed = len(errors) == 0
        logger.info(f"SPARQL tests: {passed}/{len(self.test_queries)} passed")

        return all_passed, errors


class TriplestoreLoaderAgent:
    """Main agent for loading RDF data into Fuseki triplestore"""

    def __init__(self, config_path: str = "config/fuseki.yaml"):
        """
        Initialize triplestore loader agent

        Args:
            config_path: Path to Fuseki configuration file
        """
        # Load configuration
        self.config_loader = ConfigLoader()
        self.config = self.config_loader.load_config(config_path)
        self.fuseki_config = self.config_loader.get_fuseki_config()

        # Initialize components
        self.validator = RDFValidator()
        self.fuseki_client = FusekiClient(self.fuseki_config)
        self.graph_manager = NamedGraphManager(self.fuseki_config)
        self.sparql_tester = SPARQLTester(self.fuseki_client, self.fuseki_config)

        # Ensure dataset exists in Fuseki
        if not self.fuseki_client.ensure_dataset():
            logger.warning(
                "Could not verify/create dataset in Fuseki - uploads may fail"
            )

        # Statistics
        self.stats = None

        logger.info("Triplestore Loader Agent initialized successfully")

    def load_rdf_files(
        self,
        file_paths: List[str],
        validate_before: bool = True,
        validate_after: bool = True,
    ) -> LoadStatistics:
        """
        Load RDF files into Fuseki

        Args:
            file_paths: List of RDF file paths to load
            validate_before: Validate RDF syntax before upload
            validate_after: Validate SPARQL endpoint after upload

        Returns:
            Load statistics
        """
        start_time = time.time()
        errors = []
        files_loaded = []
        total_triples = 0
        graphs_used = set()

        logger.info(f"Starting RDF load process for {len(file_paths)} files")

        # Validate and upload each file
        for file_path in file_paths:
            logger.info(f"Processing file: {file_path}")

            # Validate before upload
            if validate_before:
                is_valid, error_msg, triple_count = self.validator.validate_file(
                    file_path
                )
                if not is_valid:
                    errors.append(f"{file_path}: {error_msg}")
                    logger.error(f"Validation failed for {file_path}: {error_msg}")
                    continue

                logger.info(f"  Validated: {triple_count} triples")
                total_triples += triple_count

            # Determine named graph
            graph_uri = self.graph_manager.get_graph_for_file(file_path)
            if graph_uri:
                graphs_used.add(graph_uri)

            # Upload to Fuseki
            success = self.fuseki_client.upload_rdf(file_path, graph_uri)
            if success:
                files_loaded.append(os.path.basename(file_path))
            else:
                errors.append(f"{file_path}: Upload failed")

        # Validate after upload
        if validate_after and files_loaded:
            logger.info("Running post-upload validation...")

            # Test endpoint
            if not self.fuseki_client.test_endpoint():
                errors.append("SPARQL endpoint test failed")

            # Count triples
            triple_count = self.fuseki_client.count_triples()
            if triple_count >= 0:
                logger.info(f"Total triples in triplestore: {triple_count}")
            else:
                errors.append("Failed to count triples")

            # Run SPARQL tests
            tests_passed, test_errors = self.sparql_tester.run_tests()
            if not tests_passed:
                errors.extend(test_errors)

        # Calculate duration
        duration = time.time() - start_time

        # Determine status
        status = "success" if not errors else "partial" if files_loaded else "failed"

        # Create statistics
        self.stats = LoadStatistics(
            timestamp=datetime.utcnow().isoformat() + "Z",
            dataset=self.fuseki_config["dataset"],
            files_loaded=files_loaded,
            total_triples=total_triples,
            named_graphs=list(graphs_used),
            sparql_endpoint=self.fuseki_client.sparql_url,
            duration_seconds=round(duration, 2),
            status=status,
            errors=errors,
        )

        logger.info(f"Load process completed in {duration:.2f}s")
        logger.info(f"Status: {status}")
        logger.info(f"Files loaded: {len(files_loaded)}/{len(file_paths)}")

        return self.stats

    def load_directory(
        self,
        directory: str,
        pattern: str = "*.ttl",
        validate_before: bool = True,
        validate_after: bool = True,
    ) -> LoadStatistics:
        """
        Load all RDF files from directory

        Args:
            directory: Directory containing RDF files
            pattern: File pattern (e.g., "*.ttl", "*.nt")
            validate_before: Validate RDF syntax before upload
            validate_after: Validate SPARQL endpoint after upload

        Returns:
            Load statistics
        """
        # Find all matching files
        dir_path = Path(directory)
        file_paths = [str(f) for f in dir_path.glob(pattern)]

        if not file_paths:
            logger.warning(
                f"No files found matching pattern '{pattern}' in {directory}"
            )

        return self.load_rdf_files(file_paths, validate_before, validate_after)

    def load_multiple_directories(
        self,
        directories: List[str],
        pattern: str = "*.ttl",
        validate_before: bool = True,
        validate_after: bool = True,
    ) -> LoadStatistics:
        """
        Load all RDF files from multiple directories (NEW for analytics data loop)

        This method scans multiple RDF directories and loads all files into Fuseki.
        Useful for loading both camera RDF (data/rdf/) and analytics RDF
        (data/rdf_observations/, data/rdf_accidents/, data/rdf_patterns/).

        Args:
            directories: List of directory paths containing RDF files
            pattern: File pattern (e.g., "*.ttl", "*.nt")
            validate_before: Validate RDF syntax before upload
            validate_after: Validate SPARQL endpoint after upload

        Returns:
            Load statistics (aggregated from all directories)

        Example:
            agent.load_multiple_directories([
                "data/rdf",
                "data/rdf_observations",
                "data/rdf_accidents"
            ])
        """
        all_file_paths = []

        for directory in directories:
            dir_path = Path(directory)

            # Skip if directory doesn't exist
            if not dir_path.exists():
                logger.warning(f"Directory not found (skipping): {directory}")
                continue

            # Find all matching files in this directory
            file_paths = [str(f) for f in dir_path.glob(pattern)]

            if file_paths:
                logger.info(f"Found {len(file_paths)} files in {directory}")
                all_file_paths.extend(file_paths)
            else:
                logger.warning(
                    f"No files found matching pattern '{pattern}' in {directory}"
                )

        if not all_file_paths:
            logger.warning(
                f"No RDF files found in any of {len(directories)} directories"
            )
        else:
            logger.info(
                f"Total files to load: {len(all_file_paths)} from {len(directories)} directories"
            )

        return self.load_rdf_files(all_file_paths, validate_before, validate_after)

    def save_report(self, output_path: Optional[str] = None) -> str:
        """
        Save load report to file

        Args:
            output_path: Optional output file path

        Returns:
            Path to saved report
        """
        if not self.stats:
            raise ValueError("No statistics available. Run load_rdf_files() first.")

        # Determine output path
        if not output_path:
            report_config = self.config.get("reporting", {})
            output_dir = report_config.get("output_dir", "data/reports")
            os.makedirs(output_dir, exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"triplestore_load_{timestamp}.json"
            output_path = os.path.join(output_dir, filename)

        # Save report
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.stats.to_dict(), f, indent=2)

        logger.info(f"Load report saved to: {output_path}")
        return output_path


def main(config: Dict = None):
    """Main entry point for triplestore loader agent"""
    logger.info("=" * 80)
    logger.info("TRIPLESTORE LOADER AGENT - Apache Jena Fuseki")
    logger.info("=" * 80)

    try:
        # If called from orchestrator with config dict
        if config:
            config_path = config.get("config_path", "config/fuseki.yaml")
            rdf_dir = config.get("input_dir", "data/rdf")  # Single dir or first dir
            pattern = config.get("pattern", "*.ttl")
            mode = config.get(
                "mode", "single"
            )  # 'single' or 'multiple' or 'auto-discover'

            agent = TriplestoreLoaderAgent(config_path)

            # Auto-discover mode: scan data/ for all rdf* directories
            if mode == "auto-discover":
                logger.info("Auto-discovering RDF directories in data/...")
                data_path = Path("data")
                rdf_dirs = [
                    str(d)
                    for d in data_path.iterdir()
                    if d.is_dir() and d.name.startswith("rdf")
                ]

                if not rdf_dirs:
                    logger.error("No RDF directories found in data/")
                    return {
                        "status": "failed",
                        "error": "No RDF directories found in data/",
                    }

                logger.info(f"Discovered {len(rdf_dirs)} RDF directories: {rdf_dirs}")
                stats = agent.load_multiple_directories(rdf_dirs, pattern=pattern)

            # Multiple directories mode
            elif mode == "multiple":
                rdf_dirs = config.get("input_dirs", [rdf_dir])

                if not rdf_dirs:
                    logger.error("No RDF directories specified")
                    return {"status": "failed", "error": "No RDF directories specified"}

                stats = agent.load_multiple_directories(rdf_dirs, pattern=pattern)

            # Single directory mode (backward compatible)
            else:
                if not os.path.exists(rdf_dir):
                    logger.warning(f"RDF directory not found: {rdf_dir} - skipping")
                    # Return empty stats instead of error
                    return {
                        "status": "success",
                        "stats": {
                            "dataset": agent.fuseki_config["dataset"],
                            "files_loaded": 0,
                            "total_triples": 0,
                            "named_graphs": 0,
                            "sparql_endpoint": agent.fuseki_client.sparql_url,
                            "skipped": True,
                            "reason": f"Directory not found: {rdf_dir}",
                        },
                    }

                stats = agent.load_directory(rdf_dir, pattern=pattern)

            agent.save_report()

            return {
                "status": "success",
                "stats": {
                    "dataset": stats.dataset,
                    "files_loaded": len(stats.files_loaded),
                    "total_triples": stats.total_triples,
                    "named_graphs": len(stats.named_graphs),
                    "sparql_endpoint": stats.sparql_endpoint,
                },
            }

        # Command line execution - NOW WITH AUTO-DISCOVERY!
        config_path = "config/fuseki.yaml"
        agent = TriplestoreLoaderAgent(config_path)

        # Auto-discover all RDF directories in data/
        logger.info("Auto-discovering RDF directories...")
        data_path = Path("data")
        rdf_dirs = [
            str(d)
            for d in data_path.iterdir()
            if d.is_dir() and d.name.startswith("rdf")
        ]

        if not rdf_dirs:
            logger.error("No RDF directories found in data/")
            logger.info("Please run NGSI-LD to RDF Agent first to generate RDF files")
            return None

        logger.info(f"Found {len(rdf_dirs)} RDF directories: {rdf_dirs}")

        # Load all Turtle files from all discovered directories
        logger.info("Loading RDF files from all directories...")
        stats = agent.load_multiple_directories(rdf_dirs, pattern="*.ttl")

        # Save report
        report_path = agent.save_report()

        # Print summary
        print("\n" + "=" * 80)
        print("TRIPLESTORE LOAD SUMMARY")
        print("=" * 80)
        print(f"Dataset:         {stats.dataset}")
        print(f"Directories:     {len(rdf_dirs)}")
        print(f"Files loaded:    {len(stats.files_loaded)}")
        print(f"Total triples:   {stats.total_triples}")
        print(f"Named graphs:    {len(stats.named_graphs)}")
        print(f"Duration:        {stats.duration_seconds}s")
        print(f"Status:          {stats.status}")
        print(f"SPARQL endpoint: {stats.sparql_endpoint}")
        if stats.errors:
            print(f"\nErrors ({len(stats.errors)}):")
            for error in stats.errors:
                print(f"  - {error}")
        print(f"\nReport saved to: {report_path}")
        print("=" * 80)
        return None

    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        if config:
            return {"status": "failed", "error": str(e)}
        sys.exit(1)


if __name__ == "__main__":
    main()
