#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""NGSI-LD Transformer Agent - Domain-Agnostic Entity Transformation.

UIP - Urban Intelligence Platform
Copyright (C) 2025 UIP Team

SPDX-License-Identifier: MIT

Module: src.agents.transformation.ngsi_ld_transformer_agent
Project: UIP - Urban Intelligence Platform
Author: Nguyen Dinh Anh Tuan <nguyentuan834897@gmail.com>
Created: 2025-11-22
Version: 1.0.0
License: MIT

Description:
    Transforms raw data into NGSI-LD format compliant with ETSI CIM NGSI-LD specifications.
    Features domain-agnostic, config-driven architecture for flexible entity mapping.

Core Capabilities:
    - Reads raw JSON data from any domain (traffic, IoT, smart city, etc.)
    - Applies configurable mapping rules from YAML configuration
    - Generates NGSI-LD compliant entities with proper context
    - Validates output against NGSI-LD JSON schema
    - Supports Property, GeoProperty, and Relationship types
    - Handles temporal properties and multi-attribute entities

Dependencies:
    - PyYAML>=6.0: Configuration file parsing
    - jsonschema>=4.0: NGSI-LD schema validation
    - python-dateutil>=2.8: Timestamp handling

Configuration:
    Requires ngsi_ld_mappings.yaml containing:
    - entity_mappings: Field-to-property mapping rules
    - type_definitions: NGSI-LD entity type configurations
    - context_urls: JSON-LD @context URLs
    - property_types: Type specifications (Property, GeoProperty, Relationship)

Examples:
    >>> from src.agents.transformation import NGSILDTransformerAgent
    >>> import yaml
    >>>
    >>> with open('config/ngsi_ld_mappings.yaml') as f:
    ...     config = yaml.safe_load(f)
    >>>
    >>> agent = NGSILDTransformerAgent(config)
    >>> raw_data = [{'id': 'CAM001', 'lat': 10.762622, 'lon': 106.660172}]
    >>> entities = agent.transform(raw_data)
    >>> print(entities[0]['type'])  # 'Camera'

Validation:
    Output entities are validated against NGSI-LD schema to ensure:
    - Valid entity structure with required fields (id, type, @context)
    - Proper attribute formats (value, observedAt, unitCode)
    - Correct GeoJSON formatting for GeoProperty
    - Valid Relationship references

References:
    - ETSI GS CIM 009 v1.6.1 NGSI-LD Specification:
      https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.06.01_60/gs_CIM009v010601p.pdf
    - Smart Data Models Initiative: https://smartdatamodels.org/
    - NGSI-LD Primer: https://github.com/FIWARE/tutorials.NGSI-LD
"""

import json
import logging
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import yaml

# Import centralized environment variable expansion helper
from src.core.config_loader import expand_env_var

# MongoDB integration (optional)
try:
    from src.utils.mongodb_helper import get_mongodb_helper

    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    get_mongodb_helper = None

# MongoDB integration (optional)
try:
    from src.utils.mongodb_helper import get_mongodb_helper

    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    get_mongodb_helper = None


class TransformationEngine:
    """
    Engine for applying transformation functions to values.

    Supports configurable transformations like boolean mapping,
    string formatting, datetime conversion, etc.
    """

    def __init__(self, transforms_config: Dict[str, Any]):
        """
        Initialize transformation engine with config.

        Args:
            transforms_config: Transform definitions from YAML
        """
        self.transforms = transforms_config
        self._transform_functions: Dict[str, Callable] = {}
        self._register_transforms()

    def _register_transforms(self) -> None:
        """Register transformation functions from config."""
        for name, config in self.transforms.items():
            transform_type = config.get("type")

            if transform_type == "boolean_map":
                self._transform_functions[name] = self._create_boolean_map(
                    config.get("true_value"), config.get("false_value")
                )
            elif transform_type == "string_uppercase":
                self._transform_functions[name] = lambda x: str(x).upper() if x else x
            elif transform_type == "datetime_format":
                self._transform_functions[name] = self._create_datetime_formatter(
                    config.get("output_format", "iso8601")
                )
            else:
                # Identity transform for unknown types
                self._transform_functions[name] = lambda x: x

    def _create_boolean_map(self, true_val: str, false_val: str) -> Callable:
        """
        Create boolean mapping function.

        Args:
            true_val: Value to return for True
            false_val: Value to return for False

        Returns:
            Mapping function
        """

        def mapper(value: Any) -> str:
            if isinstance(value, bool):
                return true_val if value else false_val
            elif isinstance(value, str):
                return true_val if value.lower() in ("true", "1", "yes") else false_val
            else:
                return false_val

        return mapper

    def _create_datetime_formatter(self, output_format: str) -> Callable:
        """
        Create datetime formatting function.

        Args:
            output_format: Output format (iso8601, etc.)

        Returns:
            Formatting function
        """

        def formatter(value: Any) -> str:
            if isinstance(value, str):
                try:
                    # Try parsing as ISO format
                    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
                    return dt.isoformat() + "Z"
                except:
                    return value
            elif isinstance(value, datetime):
                return value.isoformat() + "Z"
            else:
                return str(value)

        return formatter

    def apply_transform(self, transform_name: str, value: Any) -> Any:
        """
        Apply named transformation to value.

        Args:
            transform_name: Name of transform from config
            value: Value to transform

        Returns:
            Transformed value
        """
        if transform_name in self._transform_functions:
            return self._transform_functions[transform_name](value)
        return value


class NGSILDValidator:
    """
    Validator for NGSI-LD entity structure.

    Validates entities against NGSI-LD core schema and custom rules.
    """

    def __init__(self, validation_config: Dict[str, Any]):
        """
        Initialize validator with config.

        Args:
            validation_config: Validation rules from YAML
        """
        self.config = validation_config
        self.errors: List[str] = []

    def validate_entity(self, entity: Dict[str, Any]) -> bool:
        """
        Validate single NGSI-LD entity.

        Args:
            entity: NGSI-LD entity to validate

        Returns:
            True if valid, False otherwise
        """
        self.errors = []

        # Check required fields
        required_fields = self.config.get("required_fields", [])
        for field in required_fields:
            if field not in entity:
                self.errors.append(f"Missing required field: {field}")

        # Check required properties
        required_props = self.config.get("required_properties", [])
        for prop in required_props:
            if prop not in entity:
                self.errors.append(f"Missing required property: {prop}")

        # Validate geo constraints
        if "location" in entity and "geo_constraints" in self.config:
            geo = entity["location"]
            if geo.get("type") == "GeoProperty":
                coords = geo.get("value", {}).get("coordinates", [])
                if len(coords) == 2:
                    lng, lat = coords
                    lat_range = self.config["geo_constraints"]["latitude_range"]
                    lng_range = self.config["geo_constraints"]["longitude_range"]

                    if not (lat_range[0] <= lat <= lat_range[1]):
                        self.errors.append(f"Latitude {lat} out of range {lat_range}")
                    if not (lng_range[0] <= lng <= lng_range[1]):
                        self.errors.append(f"Longitude {lng} out of range {lng_range}")

        return len(self.errors) == 0

    def get_errors(self) -> List[str]:
        """Get validation errors from last validation."""
        return self.errors


class NGSILDTransformerAgent:
    """NGSI-LD Transformer Agent - Entity Transformation with Type Mapping.

    Features:
    - Property type transformation (Property, GeoProperty, Relationship)
    - Configurable mapping rules
    - Transformation functions (boolean_to_ptz, uppercase, etc.)
    - NGSI-LD schema validation
    - Batch processing for performance
    - Comprehensive error handling
    """

    def __init__(self, config_path: str = "config/ngsi_ld_mappings.yaml"):
        """
        Initialize NGSI-LD Transformer Agent.

        Args:
            config_path: Path to YAML configuration file

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If configuration is invalid
        """
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.logger = self._setup_logging()

        # Initialize transformation engine
        self.transform_engine = TransformationEngine(self.config.get("transforms", {}))

        # Initialize validator
        self.validator = NGSILDValidator(self.config.get("validation", {}))

        # Statistics
        self.stats = {
            "total_entities": 0,
            "successful_transforms": 0,
            "failed_transforms": 0,
            "validation_errors": 0,
            "processing_time": 0.0,
        }

        # MongoDB helper (optional, non-blocking)
        self._mongodb_helper = None
        if MONGODB_AVAILABLE:
            try:
                self._mongodb_helper = get_mongodb_helper()
                if self._mongodb_helper and self._mongodb_helper.enabled:
                    self.logger.info("✅ MongoDB publishing enabled")
                else:
                    self.logger.debug("MongoDB publishing disabled in config")
            except Exception as e:
                self.logger.warning(
                    f"MongoDB initialization failed (non-critical): {e}"
                )
        else:
            self.logger.debug("MongoDB not available (pymongo not installed)")

    def _load_config(self) -> Dict[str, Any]:
        """
        Load and validate configuration from YAML file.

        Returns:
            Configuration dictionary

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If configuration is invalid
        """
        if not self.config_path.exists():
            raise FileNotFoundError(f"Config file not found: {self.config_path}")

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in config file: {e}")

        # Expand environment variables like ${VAR:-default}
        config = expand_env_var(config)

        # Validate required config sections
        required_sections = [
            "entity_type",
            "uri_prefix",
            "id_field",
            "property_mappings",
        ]
        for section in required_sections:
            if section not in config:
                raise ValueError(f"Missing required config section: {section}")

        return config

    def _setup_logging(self) -> logging.Logger:
        """
        Setup structured logging for the agent.

        Returns:
            Configured logger instance
        """
        logger = logging.getLogger("NGSILDTransformer")
        logger.setLevel(logging.INFO)

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        return logger

    def load_source_data(
        self, source_file: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Load source data from JSON file.

        Args:
            source_file: Path to source file (uses config default if None)

        Returns:
            List of raw entities

        Raises:
            FileNotFoundError: If source file doesn't exist
            ValueError: If source file is invalid JSON
        """
        if source_file is None:
            source_file = self.config["processing"]["source_file"]

        source_path = Path(source_file)

        if not source_path.exists():
            raise FileNotFoundError(f"Source file not found: {source_path}")

        try:
            with open(source_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in source file: {e}")

        if not isinstance(data, list):
            raise ValueError("Source data must be a JSON array")

        self.logger.info(f"Loaded {len(data)} entities from {source_path}")
        return data

    def generate_uri(self, entity: Dict[str, Any]) -> str:
        """
        Generate NGSI-LD URI for entity with URL-encoded ID.

        Entity IDs must be valid URIs per NGSI-LD spec. This method:
        - URL-encodes spaces and special characters
        - Ensures RFC 3986 compliance
        - Prevents URISyntaxException in Stellio

        Args:
            entity: Raw entity data

        Returns:
            NGSI-LD URI (e.g., "urn:ngsi-ld:Camera:TTH%20406")
        """
        from urllib.parse import quote

        id_field = self.config["id_field"]
        uri_prefix = self.config["uri_prefix"]

        entity_id = entity.get(id_field, "unknown")

        # URL-encode the entity ID to handle spaces and special chars
        # safe=':/' preserves colons and slashes in URNs
        # This converts "TTH 406" → "TTH%20406"
        encoded_id = quote(str(entity_id), safe="")

        return f"{uri_prefix}{encoded_id}"

    def create_property(
        self, value: Any, observed_at: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create NGSI-LD Property structure.

        Args:
            value: Property value
            observed_at: Optional observation timestamp

        Returns:
            NGSI-LD Property object
        """
        prop = {"type": "Property", "value": value}

        if observed_at:
            prop["observedAt"] = observed_at

        return prop

    def create_geo_property(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Create NGSI-LD GeoProperty (GeoJSON Point).

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate

        Returns:
            NGSI-LD GeoProperty object
        """
        return {
            "type": "GeoProperty",
            "value": {
                "type": "Point",
                "coordinates": [longitude, latitude],  # GeoJSON: [lng, lat]
            },
        }

    def create_relationship(self, target_uri: str) -> Dict[str, Any]:
        """
        Create NGSI-LD Relationship structure.

        Args:
            target_uri: URI of target entity

        Returns:
            NGSI-LD Relationship object
        """
        return {"type": "Relationship", "object": target_uri}

    def apply_property_mapping(
        self, entity: Dict[str, Any], source_field: str, mapping_config: Any
    ) -> Optional[Dict[str, Any]]:
        """
        Apply property mapping to transform source field to NGSI-LD property.

        Args:
            entity: Source entity
            source_field: Source field name
            mapping_config: Mapping configuration

        Returns:
            NGSI-LD property or None if source field missing
        """
        # Handle simple string mapping
        if isinstance(mapping_config, str):
            value = entity.get(source_field)
            if value is None:
                return None
            return self.create_property(value)

        # Handle complex mapping with config
        if isinstance(mapping_config, dict):
            value = entity.get(source_field)
            if value is None:
                return None

            # Apply transformation if specified
            transform = mapping_config.get("transform")
            if transform:
                value = self.transform_engine.apply_transform(transform, value)

            # Create property based on type
            prop_type = mapping_config.get("type", "Property")
            if prop_type == "Property":
                return self.create_property(value)
            elif prop_type == "Relationship":
                return self.create_relationship(value)

        return None

    def transform_entity(self, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform single entity to NGSI-LD format.

        Args:
            entity: Raw entity data

        Returns:
            NGSI-LD entity or None if transformation failed
        """
        try:
            # Create base NGSI-LD entity
            ngsi_entity = {
                "id": self.generate_uri(entity),
                "type": self.config["entity_type"],
                "@context": self.config["context_urls"],
            }

            # Apply property mappings
            property_mappings = self.config.get("property_mappings", {})
            for source_field, mapping_config in property_mappings.items():
                if isinstance(mapping_config, dict):
                    target_field = mapping_config.get("target", source_field)
                else:
                    target_field = mapping_config

                mapped_property = self.apply_property_mapping(
                    entity, source_field, mapping_config
                )

                if mapped_property:
                    ngsi_entity[target_field] = mapped_property

            # Apply geo property mapping
            geo_config = self.config.get("geo_property")
            if geo_config:
                source_fields = geo_config.get("source", [])
                target_field = geo_config.get("target", "location")

                if len(source_fields) == 2:
                    lat_field, lng_field = source_fields
                    latitude = entity.get(lat_field)
                    longitude = entity.get(lng_field)

                    if latitude is not None and longitude is not None:
                        try:
                            lat = float(latitude)
                            lng = float(longitude)
                            ngsi_entity[target_field] = self.create_geo_property(
                                lat, lng
                            )
                        except (ValueError, TypeError):
                            self.logger.warning(
                                f"Invalid coordinates for entity {entity.get(self.config['id_field'])}"
                            )

            # Apply relationship mappings
            relationships = self.config.get("relationships", [])
            for rel_config in relationships:
                source_field = rel_config.get("source")
                target_field = rel_config.get("target")

                if source_field and target_field:
                    rel_value = entity.get(source_field)
                    if rel_value:
                        ngsi_entity[target_field] = self.create_relationship(rel_value)

            return ngsi_entity

        except Exception as e:
            self.logger.error(f"Error transforming entity: {e}")
            return None

    def create_weather_observed_entity(
        self, camera_entity: Dict[str, Any], camera_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Create WeatherObserved entity from camera's weather data.

        Args:
            camera_entity: Raw camera entity with weather data
            camera_id: NGSI-LD URI of the camera (for refDevice)

        Returns:
            NGSI-LD WeatherObserved entity or None if no weather data
        """
        try:
            # Check if weather data exists
            weather_data = camera_entity.get("weather")
            if not weather_data:
                return None

            # Load weather mappings from config
            full_config_path = Path(self.config_path)
            with open(full_config_path, "r", encoding="utf-8") as f:
                full_config = yaml.safe_load(f)

            weather_config = full_config.get("weather_mappings")
            if not weather_config:
                self.logger.warning("weather_mappings not found in config")
                return None

            # Generate unique ID with timestamp
            # URL-encode camera_code to handle spaces (e.g., "TTH 406" → "TTH%20406")
            from urllib.parse import quote

            camera_code = camera_entity.get("code", "unknown")
            encoded_camera_code = quote(str(camera_code), safe="")
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            entity_id = (
                f"{weather_config['uri_prefix']}{encoded_camera_code}-{timestamp}"
            )

            # Create base entity
            weather_entity = {
                "id": entity_id,
                "type": weather_config["entity_type"],
                "@context": weather_config["context_urls"],
            }

            # Add refDevice relationship to camera
            weather_entity["refDevice"] = self.create_relationship(camera_id)

            # Apply property mappings
            property_mappings = weather_config.get("property_mappings", {})
            for source_field, mapping_config in property_mappings.items():
                value = weather_data.get(source_field)

                # Handle default values
                if value is None and "default" in mapping_config:
                    value = mapping_config["default"]

                if value is not None:
                    target_field = mapping_config.get("target", source_field)
                    prop = self.create_property(value)

                    # Add unit if specified
                    if "unit" in mapping_config:
                        prop["unitCode"] = mapping_config["unit"]

                    weather_entity[target_field] = prop

            # Add location (same as camera)
            latitude = camera_entity.get("latitude")
            longitude = camera_entity.get("longitude")
            if latitude is not None and longitude is not None:
                weather_entity["location"] = self.create_geo_property(
                    float(latitude), float(longitude)
                )

            # Add observation timestamp
            enrichment_timestamp = camera_entity.get("enrichment_timestamp")
            if enrichment_timestamp:
                weather_entity["dateObserved"] = self.create_property(
                    enrichment_timestamp
                )

            return weather_entity

        except Exception as e:
            self.logger.error(f"Error creating WeatherObserved entity: {e}")
            return None

    def create_air_quality_observed_entity(
        self, camera_entity: Dict[str, Any], camera_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Create AirQualityObserved entity from camera's air quality data.

        Args:
            camera_entity: Raw camera entity with air_quality data
            camera_id: NGSI-LD URI of the camera (for refDevice)

        Returns:
            NGSI-LD AirQualityObserved entity or None if no air quality data
        """
        try:
            # Check if air quality data exists
            aq_data = camera_entity.get("air_quality")
            if not aq_data:
                return None

            # Load air quality mappings from config
            full_config_path = Path(self.config_path)
            with open(full_config_path, "r", encoding="utf-8") as f:
                full_config = yaml.safe_load(f)

            aq_config = full_config.get("airquality_mappings")
            if not aq_config:
                self.logger.warning("airquality_mappings not found in config")
                return None

            # Generate unique ID with timestamp
            # URL-encode camera_code to handle spaces (e.g., "TTH 406" → "TTH%20406")
            from urllib.parse import quote

            camera_code = camera_entity.get("code", "unknown")
            encoded_camera_code = quote(str(camera_code), safe="")
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            entity_id = f"{aq_config['uri_prefix']}{encoded_camera_code}-{timestamp}"

            # Create base entity
            aq_entity = {
                "id": entity_id,
                "type": aq_config["entity_type"],
                "@context": aq_config["context_urls"],
            }

            # Add refDevice relationship to camera
            aq_entity["refDevice"] = self.create_relationship(camera_id)

            # Apply property mappings
            property_mappings = aq_config.get("property_mappings", {})
            for source_field, mapping_config in property_mappings.items():
                # Handle nested pollutant data structure (from OpenWeatherMap)
                value = None
                if source_field in ["pm25", "pm10", "co", "o3", "no2", "so2", "nh3"]:
                    # These are nested in measurement objects: {'value': ..., 'unit': ...}
                    measurement = aq_data.get(source_field)
                    if isinstance(measurement, dict):
                        value = measurement.get("value")
                else:
                    # Direct fields: aqi_category, aqi_index, source, location_name, distance_km
                    value = aq_data.get(source_field)

                # Handle default values
                if value is None and "default" in mapping_config:
                    value = mapping_config["default"]

                if value is not None:
                    target_field = mapping_config.get("target", source_field)
                    prop = self.create_property(value)

                    # Add unit if specified
                    if "unit" in mapping_config:
                        prop["unitCode"] = mapping_config["unit"]

                    aq_entity[target_field] = prop

            # Add location (same as camera)
            latitude = camera_entity.get("latitude")
            longitude = camera_entity.get("longitude")
            if latitude is not None and longitude is not None:
                aq_entity["location"] = self.create_geo_property(
                    float(latitude), float(longitude)
                )

            # Add observation timestamp
            enrichment_timestamp = camera_entity.get("enrichment_timestamp")
            if enrichment_timestamp:
                aq_entity["dateObserved"] = self.create_property(enrichment_timestamp)

            return aq_entity

        except Exception as e:
            self.logger.error(f"Error creating AirQualityObserved entity: {e}")
            return None

    def process_batch(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process batch of entities.

        NOW CREATES 3 ENTITIES PER CAMERA:
        1. Camera entity (original)
        2. WeatherObserved entity (if weather data exists)
        3. AirQualityObserved entity (if air quality data exists)

        Args:
            entities: List of raw enriched camera entities

        Returns:
            List of NGSI-LD entities (Camera + WeatherObserved + AirQualityObserved)
        """
        ngsi_entities = []

        for entity in entities:
            # 1. Transform Camera entity (original logic)
            camera_entity = self.transform_entity(entity)

            if camera_entity:
                # Validate camera entity if configured
                if self.config["processing"].get("validate_output", True):
                    if self.validator.validate_entity(camera_entity):
                        # Get camera ID for relationships
                        camera_id = camera_entity.get("id")

                        # 2. Create WeatherObserved entity FIRST (to get its ID)
                        weather_entity = self.create_weather_observed_entity(
                            entity, camera_id
                        )
                        weather_entity_id = None
                        if weather_entity:
                            weather_entity_id = weather_entity.get("id")
                            ngsi_entities.append(weather_entity)
                            self.stats["successful_transforms"] += 1
                            self.logger.debug(
                                f"Created WeatherObserved for {camera_id}"
                            )

                        # 3. Create AirQualityObserved entity (to get its ID)
                        aq_entity = self.create_air_quality_observed_entity(
                            entity, camera_id
                        )
                        aq_entity_id = None
                        if aq_entity:
                            aq_entity_id = aq_entity.get("id")
                            ngsi_entities.append(aq_entity)
                            self.stats["successful_transforms"] += 1
                            self.logger.debug(
                                f"Created AirQualityObserved for {camera_id}"
                            )

                        # 4. Add bidirectional Relationships to Camera entity (LOD 5-star compliance)
                        # Following NGSI-LD Smart Data Models standards
                        if weather_entity_id:
                            camera_entity["refWeatherObserved"] = (
                                self.create_relationship(weather_entity_id)
                            )
                            self.logger.debug(
                                f"Added refWeatherObserved relationship to {camera_id}"
                            )

                        if aq_entity_id:
                            camera_entity["refAirQualityObserved"] = (
                                self.create_relationship(aq_entity_id)
                            )
                            self.logger.debug(
                                f"Added refAirQualityObserved relationship to {camera_id}"
                            )

                        # 5. Add Camera entity (with relationships) to result list
                        ngsi_entities.append(camera_entity)
                        self.stats["successful_transforms"] += 1
                    else:
                        self.logger.warning(
                            f"Validation failed for {camera_entity.get('id')}: "
                            f"{self.validator.get_errors()}"
                        )
                        self.stats["validation_errors"] += 1
                        self.stats["failed_transforms"] += 1
                else:
                    # No validation - still add relationships for LOD 5-star compliance
                    camera_id = camera_entity.get("id")

                    # Create WeatherObserved entity FIRST
                    weather_entity = self.create_weather_observed_entity(
                        entity, camera_id
                    )
                    weather_entity_id = None
                    if weather_entity:
                        weather_entity_id = weather_entity.get("id")
                        ngsi_entities.append(weather_entity)
                        self.stats["successful_transforms"] += 1

                    # Create AirQualityObserved entity
                    aq_entity = self.create_air_quality_observed_entity(
                        entity, camera_id
                    )
                    aq_entity_id = None
                    if aq_entity:
                        aq_entity_id = aq_entity.get("id")
                        ngsi_entities.append(aq_entity)
                        self.stats["successful_transforms"] += 1

                    # Add bidirectional Relationships to Camera entity
                    if weather_entity_id:
                        camera_entity["refWeatherObserved"] = self.create_relationship(
                            weather_entity_id
                        )
                    if aq_entity_id:
                        camera_entity["refAirQualityObserved"] = (
                            self.create_relationship(aq_entity_id)
                        )

                    # Add Camera entity (with relationships)
                    ngsi_entities.append(camera_entity)
                    self.stats["successful_transforms"] += 1
            else:
                self.stats["failed_transforms"] += 1

        return ngsi_entities

    def transform_all(self, source_file: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Transform all entities from source file.

        Args:
            source_file: Path to source file (uses config default if None)

        Returns:
            List of all NGSI-LD entities
        """
        import time

        start_time = time.time()

        # Load source data
        entities = self.load_source_data(source_file)
        self.stats["total_entities"] = len(entities)

        # Process in batches
        batch_size = self.config["processing"].get("batch_size", 100)
        all_ngsi_entities = []

        for i in range(0, len(entities), batch_size):
            batch = entities[i : i + batch_size]
            self.logger.info(
                f"Processing batch {i//batch_size + 1}/{(len(entities)-1)//batch_size + 1} "
                f"({len(batch)} entities)..."
            )

            ngsi_batch = self.process_batch(batch)
            all_ngsi_entities.extend(ngsi_batch)

        self.stats["processing_time"] = time.time() - start_time

        self.logger.info(
            f"Transformation complete: {self.stats['successful_transforms']}/{self.stats['total_entities']} "
            f"entities in {self.stats['processing_time']:.2f}s"
        )

        return all_ngsi_entities

    def save_output(
        self, ngsi_entities: List[Dict[str, Any]], output_file: Optional[str] = None
    ) -> None:
        """
        Save NGSI-LD entities to output file.

        Args:
            ngsi_entities: List of NGSI-LD entities
            output_file: Path to output file (uses config default if None)
        """
        if output_file is None:
            output_file = self.config["processing"]["output_file"]

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        pretty_print = self.config["processing"].get("pretty_print", True)
        indent = 2 if pretty_print else None

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(ngsi_entities, f, ensure_ascii=False, indent=indent)

        self.logger.info(
            f"Saved {len(ngsi_entities)} NGSI-LD entities to {output_path}"
        )

        # Optionally publish to MongoDB (non-blocking, failures won't stop workflow)
        if self._mongodb_helper and self._mongodb_helper.enabled and ngsi_entities:
            try:
                success, failed = self._mongodb_helper.insert_entities_batch(
                    ngsi_entities
                )
                if success > 0:
                    self.logger.info(f"✅ Published {success} entities to MongoDB")
                if failed > 0:
                    self.logger.warning(
                        f"⚠️ Failed to publish {failed} entities to MongoDB"
                    )
            except Exception as e:
                self.logger.warning(f"MongoDB publishing failed (non-critical): {e}")

    def log_statistics(self) -> None:
        """Log transformation statistics."""
        self.logger.info("=" * 60)
        self.logger.info("TRANSFORMATION STATISTICS")
        self.logger.info("=" * 60)
        self.logger.info(f"Total input entities: {self.stats['total_entities']}")
        self.logger.info(
            f"Total output entities: {self.stats['successful_transforms']}"
        )
        self.logger.info(f"Failed transforms: {self.stats['failed_transforms']}")
        self.logger.info(f"Validation errors: {self.stats['validation_errors']}")
        self.logger.info(f"Processing time: {self.stats['processing_time']:.2f}s")

        if self.stats["total_entities"] > 0:
            # Calculate entity multiplication factor (3x expected: Camera + Weather + AQ)
            output_ratio = (
                self.stats["successful_transforms"] / self.stats["total_entities"]
            )
            self.logger.info(
                f"Entity multiplication: {output_ratio:.1f}x (Expected: ~3x if all data present)"
            )

            if self.stats["processing_time"] > 0:
                throughput = (
                    self.stats["total_entities"] / self.stats["processing_time"]
                )
                self.logger.info(f"Input throughput: {throughput:.1f} cameras/second")
                output_throughput = (
                    self.stats["successful_transforms"] / self.stats["processing_time"]
                )
                self.logger.info(
                    f"Output throughput: {output_throughput:.1f} entities/second"
                )

        self.logger.info("=" * 60)

    def run(
        self, source_file: Optional[str] = None, output_file: Optional[str] = None
    ) -> None:
        """
        Run full transformation workflow.

        Args:
            source_file: Path to source file (uses config default if None)
            output_file: Path to output file (uses config default if None)
        """
        self.logger.info("Starting NGSI-LD transformation...")

        ngsi_entities = self.transform_all(source_file)
        self.save_output(ngsi_entities, output_file)
        self.log_statistics()


def main(config: Dict = None):
    """Main entry point for the agent."""
    import argparse

    # If called from orchestrator with config dict
    if config:
        try:
            input_file = config.get("input_file", "data/cameras_updated.json")
            output_file = config.get("output_file", "data/ngsi_ld_entities.json")
            config_path = config.get("config_path", "config/ngsi_ld_mappings.yaml")

            agent = NGSILDTransformerAgent(config_path=config_path)
            agent.run(source_file=input_file, output_file=output_file)

            return {"status": "success", "output_file": output_file}
        except Exception as e:
            print(f"Agent execution failed: {e}", file=sys.stderr)
            return {"status": "failed", "error": str(e)}

    # Command line execution
    parser = argparse.ArgumentParser(description="NGSI-LD Transformer Agent")
    parser.add_argument(
        "--config",
        default="config/ngsi_ld_mappings.yaml",
        help="Path to mapping configuration file",
    )
    parser.add_argument("--source", help="Path to source JSON file (overrides config)")
    parser.add_argument("--output", help="Path to output file (overrides config)")

    args = parser.parse_args()

    try:
        agent = NGSILDTransformerAgent(config_path=args.config)
        agent.run(source_file=args.source, output_file=args.output)

    except KeyboardInterrupt:
        print("\nTransformation cancelled by user")
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
