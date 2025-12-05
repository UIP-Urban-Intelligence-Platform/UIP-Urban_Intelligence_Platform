#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Incident Report Generator Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.notification.incident_report_generator_agent
Author: Nguyen Nhat Quang
Created: 2025-11-22
Version: 2.0.0
License: MIT

Description:
    Automated incident report generation system for NGSI-LD entities.
    Generates comprehensive reports with contextual data and visualizations.

Report Formats:
    - PDF: Professional reports with charts and maps
    - JSON: Structured data for API consumers
    - HTML: Web-viewable reports with interactive elements

Core Features:
    - Subscribe to incident entities (RoadAccident, TrafficIncident, etc.)
    - Query Neo4j for contextual data (nearby cameras, historical patterns)
    - Generate reports with visualizations (charts, maps)
    - Email notifications to stakeholders
    - RESTful API for report retrieval
    - Storage options (filesystem/S3)

Dependencies:
    - reportlab>=3.6: PDF generation
    - matplotlib>=3.7: Chart generation
    - neo4j>=5.0: Graph database queries
    - jinja2>=3.1: HTML templating

Configuration:
    config/incident_report_config.yaml:
        - report_templates: Report structure definitions
        - notification_recipients: Email distribution lists
        - storage_config: Report storage settings

Example:
    ```python
    from src.agents.notification.incident_report_generator_agent import IncidentReportGeneratorAgent

    agent = IncidentReportGeneratorAgent()
    report = agent.generate_report(incident_id="urn:ngsi-ld:RoadAccident:001")
    ```
"""

import base64
import io
import json
import logging
import os
import smtplib
from datetime import datetime, timedelta
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List, Optional

import matplotlib

matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import yaml
from flask import Flask, jsonify, request, send_file
from jinja2 import Environment, FileSystemLoader, select_autoescape

from src.core.config_loader import expand_env_var

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class IncidentReportConfig:
    """
    Load and manage incident report configuration.

    Loads configuration from YAML file including triggers,
    data sources, report formats, and notification settings.
    """

    def __init__(self, config_path: str):
        """
        Initialize configuration.

        Args:
            config_path: Path to YAML configuration file

        Raises:
            FileNotFoundError: If configuration file not found
            yaml.YAMLError: If configuration is invalid YAML
        """
        self.config_path = Path(config_path)

        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(self.config_path, "r") as f:
            self.config = yaml.safe_load(f)

        # Expand environment variables in config using centralized helper
        self.config = expand_env_var(self.config)

        self.report_config = self.config.get("incident_report_generator", {})

        logger.info(f"Loaded configuration from {config_path}")

    def get_triggers(self) -> List[Dict[str, Any]]:
        """Get trigger configuration."""
        return self.report_config.get("triggers", [])

    def get_data_sources(self) -> Dict[str, Any]:
        """Get data sources configuration."""
        return self.report_config.get("data_sources", {})

    def get_report_formats(self) -> List[Dict[str, Any]]:
        """Get report format specifications."""
        return self.report_config.get("report_formats", [])

    def get_storage_config(self) -> Dict[str, Any]:
        """Get storage configuration."""
        return self.report_config.get("storage", {})

    def get_notifications_config(self) -> Dict[str, Any]:
        """Get notifications configuration."""
        return self.report_config.get("notifications", {})

    def get_visualizations_config(self) -> Dict[str, Any]:
        """Get visualizations configuration."""
        return self.report_config.get("visualizations", {})

    def get_report_sections(self) -> Dict[str, Any]:
        """Get report sections configuration."""
        return self.report_config.get("report_sections", {})


class Neo4jQueryExecutor:
    """
    Execute Cypher queries against Neo4j database.

    Handles connection management and query execution for
    contextual data retrieval.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Neo4j query executor.

        Args:
            config: Neo4j configuration
        """
        self.enabled = config.get("enabled", False)
        # Priority: environment variables > config > defaults
        self.uri = os.environ.get("NEO4J_URL") or config.get(
            "uri", "bolt://localhost:7687"
        )
        self.username = os.environ.get("NEO4J_USER") or config.get("username", "neo4j")
        self.password = os.environ.get("NEO4J_PASSWORD") or config.get(
            "password", "password"
        )
        self.database = config.get("database", "neo4j")
        self.queries = config.get("queries", {})

        self.driver = None

        if self.enabled:
            try:
                from neo4j import GraphDatabase

                self.driver = GraphDatabase.driver(
                    self.uri, auth=(self.username, self.password)
                )
                logger.info("Connected to Neo4j database")
            except ImportError:
                logger.warning("neo4j package not installed - Neo4j queries disabled")
                self.enabled = False
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {e}")
                self.enabled = False

    def execute_query(
        self, query_name: str, parameters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Execute named query with parameters.

        Args:
            query_name: Name of query in configuration
            parameters: Query parameters

        Returns:
            List of result records
        """
        if not self.enabled or not self.driver:
            logger.warning("Neo4j not enabled - returning empty results")
            return []

        query_config = self.queries.get(query_name, {})
        query_text = query_config.get("query", "")
        query_config.get("timeout", 10)

        if not query_text:
            logger.error(f"Query not found: {query_name}")
            return []

        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(query_text, parameters)
                records = [dict(record) for record in result]
                logger.info(f"Executed query '{query_name}': {len(records)} records")
                return records

        except Exception as e:
            logger.error(f"Query execution failed '{query_name}': {e}")
            return []

    def close(self):
        """Close Neo4j connection."""
        if self.driver:
            self.driver.close()
            logger.info("Closed Neo4j connection")


class ReportDataCollector:
    """
    Collect data from multiple sources for report generation.

    Aggregates data from Neo4j, Stellio, and other sources
    to build comprehensive incident context.
    """

    def __init__(self, config: IncidentReportConfig):
        """
        Initialize data collector.

        Args:
            config: Report configuration
        """
        self.config = config
        self.data_sources = config.get_data_sources()

        # Initialize Neo4j executor
        neo4j_config = self.data_sources.get("neo4j", {})
        self.neo4j = Neo4jQueryExecutor(neo4j_config)

        # Stellio configuration - Priority: environment variables > config > defaults
        self.stellio_config = self.data_sources.get("stellio", {})
        self.stellio_enabled = self.stellio_config.get("enabled", False)
        self.stellio_base_url = os.environ.get(
            "STELLIO_URL"
        ) or self.stellio_config.get("base_url", "http://localhost:8080")

    def collect_incident_data(
        self, accident_id: str, entity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Collect all data for incident report.

        Args:
            accident_id: Incident entity ID
            entity_data: Initial entity data

        Returns:
            Comprehensive data dictionary
        """
        logger.info(f"Collecting data for incident: {accident_id}")

        data = {
            "accident_id": accident_id,
            "entity_data": entity_data,
            "context": {},
            "timeline": [],
            "related_incidents": [],
            "historical_patterns": {},
            "weather": {},
        }

        # Extract basic information
        detection_time = entity_data.get("detectionTime", {}).get(
            "value", datetime.utcnow().isoformat()
        )
        camera_id = entity_data.get("cameraId", {}).get("value", "")
        location = entity_data.get("location", {}).get("value", {})

        # Get context data from Neo4j
        context_data = self.neo4j.execute_query("context", {"accident_id": accident_id})
        if context_data:
            data["context"] = context_data[0] if context_data else {}

        # Get timeline data
        if camera_id:
            start_time = (
                datetime.fromisoformat(detection_time.replace("Z", ""))
                - timedelta(minutes=5)
            ).isoformat()
            end_time = (
                datetime.fromisoformat(detection_time.replace("Z", ""))
                + timedelta(minutes=30)
            ).isoformat()

            timeline_data = self.neo4j.execute_query(
                "timeline",
                {
                    "camera_id": camera_id,
                    "start_time": start_time,
                    "end_time": end_time,
                },
            )
            data["timeline"] = timeline_data

        # Get related incidents
        if location and isinstance(location, dict):
            coordinates = location.get("coordinates", [])
            if len(coordinates) >= 2:
                start_time = (
                    datetime.fromisoformat(detection_time.replace("Z", ""))
                    - timedelta(hours=24)
                ).isoformat()
                end_time = datetime.utcnow().isoformat()

                related_data = self.neo4j.execute_query(
                    "related_incidents",
                    {
                        "accident_id": accident_id,
                        "radius_meters": 1000,
                        "start_time": start_time,
                        "end_time": end_time,
                    },
                )
                data["related_incidents"] = related_data

        # Get historical patterns
        if location and isinstance(location, dict):
            coordinates = location.get("coordinates", [])
            if len(coordinates) >= 2:
                start_date = (datetime.utcnow() - timedelta(days=90)).isoformat()
                end_date = datetime.utcnow().isoformat()

                historical_data = self.neo4j.execute_query(
                    "historical_patterns",
                    {
                        "coordinates": {
                            "longitude": coordinates[0],
                            "latitude": coordinates[1],
                        },
                        "radius_meters": 500,
                        "start_date": start_date,
                        "end_date": end_date,
                    },
                )
                data["historical_patterns"] = (
                    historical_data[0] if historical_data else {}
                )

        # Get weather context
        weather_data = self.neo4j.execute_query(
            "weather_context",
            {
                "location": str(location),
                "start_time": detection_time,
                "end_time": detection_time,
            },
        )
        data["weather"] = weather_data[0] if weather_data else {}

        logger.info(f"Data collection complete for {accident_id}")

        return data


class VisualizationGenerator:
    """
    Generate charts and maps for incident reports.

    Creates visualizations using matplotlib and folium
    for enhanced report comprehension.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize visualization generator.

        Args:
            config: Visualization configuration
        """
        self.config = config
        self.charts_config = config.get("charts", {})
        self.maps_config = config.get("maps", {})
        self.charts_enabled = self.charts_config.get("enabled", True)
        self.maps_enabled = self.maps_config.get("enabled", False)

    def generate_speed_timeline_chart(
        self, timeline_data: List[Dict[str, Any]]
    ) -> Optional[str]:
        """
        Generate speed timeline chart.

        Args:
            timeline_data: Timeline observations

        Returns:
            Base64-encoded PNG image
        """
        if not self.charts_enabled or not timeline_data:
            return None

        try:
            times = []
            speeds = []

            for obs in timeline_data:
                obs_data = obs.get("o", {})
                if "observedAt" in obs_data and "avgSpeed" in obs_data:
                    times.append(obs_data["observedAt"])
                    speeds.append(obs_data["avgSpeed"])

            if not times:
                return None

            # Create chart
            plt.figure(figsize=(10, 6))
            plt.plot(
                range(len(speeds)),
                speeds,
                marker="o",
                color="#FF6B6B",
                linewidth=2,
                markersize=6,
            )
            plt.xlabel("Time", fontsize=12)
            plt.ylabel("Speed (km/h)", fontsize=12)
            plt.title(
                "Speed Profile Before/After Incident", fontsize=14, fontweight="bold"
            )
            plt.grid(True, alpha=0.3)
            plt.tight_layout()

            # Convert to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format="png", dpi=300, bbox_inches="tight")
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode("utf-8")
            plt.close()

            logger.info("Generated speed timeline chart")
            return image_base64

        except Exception as e:
            logger.error(f"Failed to generate speed timeline chart: {e}")
            return None

    def generate_speed_variance_chart(
        self, timeline_data: List[Dict[str, Any]]
    ) -> Optional[str]:
        """
        Generate speed variance bar chart.

        Args:
            timeline_data: Timeline observations

        Returns:
            Base64-encoded PNG image
        """
        if not self.charts_enabled or not timeline_data:
            return None

        try:
            variances = []

            for obs in timeline_data:
                obs_data = obs.get("o", {})
                if "speedVariance" in obs_data:
                    variances.append(obs_data["speedVariance"])

            if not variances:
                return None

            # Create chart
            plt.figure(figsize=(10, 6))
            plt.bar(
                range(len(variances)),
                variances,
                color="#95E1D3",
                edgecolor="#5FBE9B",
                linewidth=1.5,
            )
            plt.xlabel("Time Interval", fontsize=12)
            plt.ylabel("Speed Variance", fontsize=12)
            plt.title("Speed Variance Distribution", fontsize=14, fontweight="bold")
            plt.grid(True, axis="y", alpha=0.3)
            plt.tight_layout()

            # Convert to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format="png", dpi=300, bbox_inches="tight")
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode("utf-8")
            plt.close()

            logger.info("Generated speed variance chart")
            return image_base64

        except Exception as e:
            logger.error(f"Failed to generate speed variance chart: {e}")
            return None

    def generate_map(
        self, location: Dict[str, Any], affected_cameras: List[Dict[str, Any]]
    ) -> Optional[str]:
        """
        Generate incident location map.

        Args:
            location: Incident location
            affected_cameras: List of affected cameras

        Returns:
            Base64-encoded PNG image
        """
        if not self.maps_enabled:
            return None

        try:
            import folium
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options

            # Create map centered on incident
            coordinates = location.get("coordinates", [106.6297, 10.8231])
            m = folium.Map(location=[coordinates[1], coordinates[0]], zoom_start=15)

            # Add incident marker
            folium.Marker(
                [coordinates[1], coordinates[0]],
                popup="Incident Location",
                icon=folium.Icon(color="red", icon="exclamation-triangle"),
            ).add_to(m)

            # Add affected cameras
            for camera in affected_cameras:
                cam_loc = camera.get("location", {}).get("coordinates", [])
                if len(cam_loc) >= 2:
                    folium.Marker(
                        [cam_loc[1], cam_loc[0]],
                        popup=f"Camera: {camera.get('id', 'Unknown')}",
                        icon=folium.Icon(color="blue", icon="camera"),
                    ).add_to(m)

            # Add impact radius
            folium.Circle(
                [coordinates[1], coordinates[0]],
                radius=500,
                color="orange",
                fill=True,
                fillOpacity=0.2,
            ).add_to(m)

            # Save to temp file
            temp_html = "temp_map.html"
            m.save(temp_html)

            # Convert to PNG using selenium (headless)
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            driver = webdriver.Chrome(options=chrome_options)
            driver.get(f"file:///{os.path.abspath(temp_html)}")

            screenshot = driver.get_screenshot_as_png()
            driver.quit()

            # Clean up
            os.remove(temp_html)

            # Convert to base64
            image_base64 = base64.b64encode(screenshot).decode("utf-8")

            logger.info("Generated incident map")
            return image_base64

        except Exception as e:
            logger.error(f"Failed to generate map: {e}")
            return None


class ReportGenerator:
    """
    Generate incident reports in multiple formats.

    Uses Jinja2 templates to render PDF, JSON, and HTML reports.
    """

    def __init__(self, config: IncidentReportConfig):
        """
        Initialize report generator.

        Args:
            config: Report configuration
        """
        self.config = config
        self.report_formats = config.get_report_formats()
        self.sections_config = config.get_report_sections()
        self.viz_config = config.get_visualizations_config()

        # Initialize Jinja2 environment with autoescape for security
        template_dir = Path(__file__).parent.parent.parent / "templates"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(["html", "htm", "xml"]),
        )

        # Initialize visualization generator
        self.viz_gen = VisualizationGenerator(self.viz_config)

    def generate_report(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate complete incident report.

        Args:
            data: Collected incident data

        Returns:
            Dictionary with report_id and file paths for each format
        """
        # Generate report ID
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        accident_id_short = data["accident_id"].split(":")[-1][:10]
        report_id = f"RPT-{timestamp}-{accident_id_short}"

        logger.info(f"Generating report: {report_id}")

        # Build report data structure
        report_data = self._build_report_data(data, report_id)

        # Generate visualizations
        charts = []

        # Speed timeline chart
        speed_chart = self.viz_gen.generate_speed_timeline_chart(
            data.get("timeline", [])
        )
        if speed_chart:
            charts.append(
                {"title": "Speed Profile Before/After Incident", "data": speed_chart}
            )

        # Speed variance chart
        variance_chart = self.viz_gen.generate_speed_variance_chart(
            data.get("timeline", [])
        )
        if variance_chart:
            charts.append(
                {"title": "Speed Variance Distribution", "data": variance_chart}
            )

        report_data["charts"] = charts

        # Generate map
        entity_data = data.get("entity_data", {})
        location = entity_data.get("location", {}).get("value", {})
        affected_cameras = report_data.get("impact", {}).get("affected_cameras", [])

        map_image = self.viz_gen.generate_map(location, affected_cameras)
        report_data["map_image"] = map_image

        # Generate formats
        results = {"report_id": report_id, "files": {}}

        for format_config in self.report_formats:
            if not format_config.get("enabled", True):
                continue

            format_type = format_config["type"]

            if format_type == "json":
                json_path = self._generate_json(report_data, report_id)
                results["files"]["json"] = json_path

            elif format_type == "html":
                html_path = self._generate_html(report_data, report_id, format_config)
                results["files"]["html"] = html_path

            elif format_type == "pdf":
                pdf_path = self._generate_pdf(report_data, report_id, format_config)
                results["files"]["pdf"] = pdf_path

        logger.info(f"Report generation complete: {report_id}")

        return results

    def _build_report_data(
        self, data: Dict[str, Any], report_id: str
    ) -> Dict[str, Any]:
        """
        Build structured report data.

        Args:
            data: Collected raw data
            report_id: Generated report ID

        Returns:
            Structured report data
        """
        entity_data = data.get("entity_data", {})

        # Summary section
        summary = {
            "location": entity_data.get("roadName", {}).get("value", "Unknown"),
            "severity": entity_data.get("severity", {}).get("value", "moderate"),
            "detection_time": entity_data.get("detectionTime", {}).get(
                "value", datetime.utcnow().isoformat()
            ),
            "estimated_clearance": (
                datetime.utcnow() + timedelta(minutes=30)
            ).isoformat(),
            "camera_id": entity_data.get("cameraId", {}).get("value", ""),
            "description": f"Traffic incident detected on {entity_data.get('roadName', {}).get('value', 'Unknown')}",
        }

        # Timeline section
        timeline = []
        timeline_data = data.get("timeline", [])

        for i, obs in enumerate(timeline_data[:10]):  # Limit to 10 events
            obs_data = obs.get("o", {})
            event_time = obs_data.get("observedAt", "")
            speed = obs_data.get("avgSpeed", 0)

            if i == 0:
                event = "Normal traffic flow"
            elif i == len(timeline_data) // 2:
                event = "Speed variance spike detected"
            elif i == len(timeline_data) // 2 + 1:
                event = "Accident confirmed"
            else:
                event = f"Traffic speed: {speed} km/h"

            timeline.append(
                {
                    "time": (
                        event_time.split("T")[-1][:5]
                        if "T" in event_time
                        else event_time
                    ),
                    "event": event,
                }
            )

        # Impact section
        impact = {
            "affected_cameras": [],
            "avg_speed_drop": (
                entity_data.get("avgSpeed", {}).get("value", 0) * 0.45
                if entity_data.get("avgSpeed")
                else 45
            ),
            "congestion_duration": "30 minutes",
            "estimated_vehicles_affected": 150,
        }

        # Context section
        context = {}

        weather_data = data.get("weather", {}).get("w", {})
        if weather_data:
            context["weather_conditions"] = {
                "temperature": weather_data.get("temperature", 28),
                "conditions": weather_data.get("conditions", "Clear"),
                "wind_speed": weather_data.get("windSpeed", 10),
                "precipitation": weather_data.get("precipitation", 0),
            }

        historical_data = data.get("historical_patterns", {})
        if historical_data:
            context["historical_patterns"] = {
                "incident_count": historical_data.get("incident_count", 5),
                "time_period": "90 days",
                "avg_speed": historical_data.get("avg_speed", 45),
            }

        # Recommendations
        recommendations = self._generate_recommendations(summary["severity"])

        # Related incidents
        related_incidents = []
        for incident in data.get("related_incidents", [])[:5]:  # Limit to 5
            incident_data = incident.get("a2", {})
            related_incidents.append(
                {
                    "id": incident_data.get("id", "Unknown"),
                    "location": incident_data.get("roadName", "Unknown"),
                    "time": incident_data.get("detectionTime", ""),
                    "severity": incident_data.get("severity", "moderate"),
                }
            )

        return {
            "report_id": report_id,
            "accident_id": data["accident_id"],
            "generated_at": datetime.utcnow().isoformat(),
            "severity": summary["severity"],
            "summary": summary,
            "timeline": timeline,
            "impact": impact,
            "context": context,
            "recommendations": recommendations,
            "related_incidents": related_incidents,
        }

    def _generate_recommendations(self, severity: str) -> List[str]:
        """
        Generate recommendations based on severity.

        Args:
            severity: Incident severity

        Returns:
            List of recommendations
        """
        sections_config = self.sections_config.get("recommendations", {})
        rules = sections_config.get("rules", [])

        recommendations = []

        for rule in rules:
            condition = rule.get("condition", {})

            if "severity" in condition:
                if condition["severity"] == severity:
                    recommendations.extend(rule.get("actions", []))

        # Default recommendations if none found
        if not recommendations:
            recommendations = [
                "Monitor situation for changes",
                "Update traffic apps with incident data",
                "Deploy traffic management if needed",
            ]

        return recommendations

    def _generate_json(self, data: Dict[str, Any], report_id: str) -> str:
        """
        Generate JSON format report.

        Args:
            data: Report data
            report_id: Report ID

        Returns:
            File path
        """
        storage_config = self.config.get_storage_config()
        base_path = Path(
            storage_config.get("filesystem", {}).get(
                "base_path", "data/incident_reports"
            )
        )

        # Create subdirectories by date
        if storage_config.get("filesystem", {}).get("subdirs_by_date", True):
            now = datetime.utcnow()
            base_path = (
                base_path / str(now.year) / f"{now.month:02d}" / f"{now.day:02d}"
            )

        base_path.mkdir(parents=True, exist_ok=True)

        # Generate file path
        file_path = base_path / f"{report_id}.json"

        # Remove charts and maps from JSON (binary data)
        json_data = {k: v for k, v in data.items() if k not in ["charts", "map_image"]}

        # Write JSON file
        with open(file_path, "w") as f:
            json.dump(json_data, f, indent=2)

        logger.info(f"Generated JSON report: {file_path}")

        return str(file_path)

    def _generate_html(
        self, data: Dict[str, Any], report_id: str, format_config: Dict[str, Any]
    ) -> str:
        """
        Generate HTML format report.

        Args:
            data: Report data
            report_id: Report ID
            format_config: Format configuration

        Returns:
            File path
        """
        template_name = format_config.get("template", "templates/incident_web.html")
        template_file = Path(template_name).name

        template = self.jinja_env.get_template(template_file)
        html_content = template.render(**data)

        storage_config = self.config.get_storage_config()
        base_path = Path(
            storage_config.get("filesystem", {}).get(
                "base_path", "data/incident_reports"
            )
        )

        # Create subdirectories by date
        if storage_config.get("filesystem", {}).get("subdirs_by_date", True):
            now = datetime.utcnow()
            base_path = (
                base_path / str(now.year) / f"{now.month:02d}" / f"{now.day:02d}"
            )

        base_path.mkdir(parents=True, exist_ok=True)

        # Generate file path
        file_path = base_path / f"{report_id}.html"

        # Write HTML file
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        logger.info(f"Generated HTML report: {file_path}")

        return str(file_path)

    def _generate_pdf(
        self, data: Dict[str, Any], report_id: str, format_config: Dict[str, Any]
    ) -> str:
        """
        Generate PDF format report.

        Args:
            data: Report data
            report_id: Report ID
            format_config: Format configuration

        Returns:
            File path
        """
        template_name = format_config.get("template", "templates/incident_report.html")
        template_file = Path(template_name).name

        template = self.jinja_env.get_template(template_file)
        html_content = template.render(**data)

        storage_config = self.config.get_storage_config()
        base_path = Path(
            storage_config.get("filesystem", {}).get(
                "base_path", "data/incident_reports"
            )
        )

        # Create subdirectories by date
        if storage_config.get("filesystem", {}).get("subdirs_by_date", True):
            now = datetime.utcnow()
            base_path = (
                base_path / str(now.year) / f"{now.month:02d}" / f"{now.day:02d}"
            )

        base_path.mkdir(parents=True, exist_ok=True)

        # Generate file path
        file_path = base_path / f"{report_id}.pdf"

        try:
            from weasyprint import HTML

            # Convert HTML to PDF
            HTML(string=html_content).write_pdf(str(file_path))

            logger.info(f"Generated PDF report: {file_path}")

        except ImportError:
            logger.error("weasyprint not installed - PDF generation disabled")
            logger.info("Falling back to HTML output")

            # Save as HTML instead
            file_path = base_path / f"{report_id}_fallback.html"
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(html_content)

        return str(file_path)


class NotificationSender:
    """
    Send report notifications via email and webhooks.

    Handles email delivery with attachments and webhook POSTs.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize notification sender.

        Args:
            config: Notification configuration
        """
        self.config = config
        self.email_config = config.get("email", {})
        self.webhook_config = config.get("webhook", {})

        self.email_enabled = self.email_config.get("enabled", False)
        self.webhook_enabled = self.webhook_config.get("enabled", False)

    def send_email_notification(
        self, report_data: Dict[str, Any], pdf_path: Optional[str] = None
    ):
        """
        Send email notification with report attachment.

        Args:
            report_data: Report data
            pdf_path: Path to PDF attachment
        """
        if not self.email_enabled:
            logger.info("Email notifications disabled")
            return

        severity = report_data.get("severity", "moderate")
        recipients = self.email_config.get("recipients", {}).get(severity, [])

        if not recipients:
            recipients = self.email_config.get("recipients", {}).get("moderate", [])

        if not recipients:
            logger.warning("No email recipients configured")
            return

        # Build subject - use Environment with autoescape for security
        from jinja2 import Environment

        safe_env = Environment(autoescape=True)
        subject_template = self.email_config.get(
            "subject_template", "Incident Report: {{report_id}}"
        )
        subject = safe_env.from_string(subject_template).render(**report_data)

        # Build body - use Environment with autoescape for security
        body_template = self.email_config.get("body_template", "")
        body = safe_env.from_string(body_template).render(**report_data)

        # Create message
        msg = MIMEMultipart()
        msg["From"] = (
            f"{self.email_config.get('from_name', 'Report System')} <{self.email_config.get('from_addr', '')}>"
        )
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain"))

        # Attach PDF if available
        if pdf_path and Path(pdf_path).exists():
            with open(pdf_path, "rb") as f:
                pdf_attachment = MIMEApplication(f.read(), _subtype="pdf")
                pdf_attachment.add_header(
                    "Content-Disposition", "attachment", filename=Path(pdf_path).name
                )
                msg.attach(pdf_attachment)

        # Send email
        try:
            # Priority: environment variables > config > defaults
            smtp_host = os.environ.get("SMTP_HOST") or self.email_config.get(
                "smtp_host", "localhost"
            )
            smtp_port = int(
                os.environ.get("SMTP_PORT") or self.email_config.get("smtp_port", 25)
            )
            use_tls = self.email_config.get("use_tls", False)
            username = os.environ.get("SMTP_USERNAME") or self.email_config.get(
                "username", ""
            )
            password = os.environ.get("SMTP_PASSWORD") or self.email_config.get(
                "password", ""
            )

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                if use_tls:
                    server.starttls()

                if username and password:
                    server.login(username, password)

                server.send_message(msg)

                logger.info(f"Sent email notification to {len(recipients)} recipients")

        except Exception as e:
            logger.error(f"Failed to send email: {e}")


class IncidentReportGenerator:
    """
    Main incident report generator agent.

    Orchestrates data collection, report generation, and notifications
    for traffic incident entities.
    """

    def __init__(self, config_path: str):
        """
        Initialize incident report generator.

        Args:
            config_path: Path to YAML configuration file
        """
        self.config = IncidentReportConfig(config_path)

        # Initialize components
        self.data_collector = ReportDataCollector(self.config)
        self.report_generator = ReportGenerator(self.config)
        self.notifier = NotificationSender(self.config.get_notifications_config())

        # Initialize Flask API
        self.app = Flask(__name__)
        self._setup_api()

        # Statistics
        self.stats = {
            "reports_generated": 0,
            "reports_failed": 0,
            "notifications_sent": 0,
        }

        logger.info("Incident report generator initialized")

    def generate_report_for_incident(
        self, accident_id: str, entity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate report for incident entity.

        Args:
            accident_id: Incident entity ID
            entity_data: Entity data from NGSI-LD

        Returns:
            Report generation results
        """
        try:
            logger.info(f"Starting report generation for: {accident_id}")

            # Collect data
            data = self.data_collector.collect_incident_data(accident_id, entity_data)

            # Generate report
            results = self.report_generator.generate_report(data)

            # Send notifications
            report_data = {
                "report_id": results["report_id"],
                "accident_id": accident_id,
                "severity": data["entity_data"]
                .get("severity", {})
                .get("value", "moderate"),
                "location": data["entity_data"]
                .get("roadName", {})
                .get("value", "Unknown"),
                "detection_time": data["entity_data"]
                .get("detectionTime", {})
                .get("value", ""),
                "summary": f"Incident detected at {data['entity_data'].get('roadName', {}).get('value', 'Unknown')}",
                "report_url": f"http://localhost:8081/api/reports/{results['report_id']}",
            }

            pdf_path = results["files"].get("pdf")
            self.notifier.send_email_notification(report_data, pdf_path)

            self.stats["reports_generated"] += 1
            self.stats["notifications_sent"] += 1

            logger.info(f"Report generation complete: {results['report_id']}")

            return results

        except Exception as e:
            logger.error(f"Report generation failed for {accident_id}: {e}")
            self.stats["reports_failed"] += 1
            raise

    def _setup_api(self):
        """Setup Flask API endpoints."""

        @self.app.route("/health", methods=["GET"])
        def health():
            return jsonify({"status": "healthy"}), 200

        @self.app.route("/stats", methods=["GET"])
        def stats():
            return jsonify(self.stats), 200

        @self.app.route("/api/reports/<report_id>", methods=["GET"])
        def get_report(report_id):
            """Get report by ID."""
            format_type = request.args.get("format", "json")

            storage_config = self.config.get_storage_config()
            base_path = Path(
                storage_config.get("filesystem", {}).get(
                    "base_path", "data/incident_reports"
                )
            )

            # Search for report file
            report_file = None
            for root, dirs, files in os.walk(base_path):
                for file in files:
                    if file.startswith(report_id) and file.endswith(f".{format_type}"):
                        report_file = Path(root) / file
                        break
                if report_file:
                    break

            if not report_file or not report_file.exists():
                return jsonify({"error": "Report not found"}), 404

            if format_type == "json":
                with open(report_file, "r") as f:
                    return jsonify(json.load(f)), 200
            else:
                return send_file(str(report_file))

        logger.info("API endpoints configured")

    def run_api(self, host: str = "0.0.0.0", port: int = 8081):
        """Run Flask API server."""
        logger.info(f"Starting API server on {host}:{port}")
        self.app.run(host=host, port=port, threaded=True)


if __name__ == "__main__":
    # Example usage
    generator = IncidentReportGenerator("config/incident_report_config.yaml")

    # Example incident data
    sample_entity = {
        "id": "urn:ngsi-ld:RoadAccident:TTH406-1730448000",
        "type": "RoadAccident",
        "roadName": {"value": "Trần Quang Khải - Trần Khắc Chân"},
        "severity": {"value": "moderate"},
        "cameraId": {"value": "TTH406"},
        "detectionTime": {"value": "2025-11-01T10:00:00Z"},
        "avgSpeed": {"value": 25},
        "location": {"value": {"type": "Point", "coordinates": [106.6297, 10.8231]}},
    }

    # Generate report
    results = generator.generate_report_for_incident(sample_entity["id"], sample_entity)
    print(f"Report generated: {results['report_id']}")
    print(f"Files: {results['files']}")

    # Start API server
    # generator.run_api()
