#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Data Quality Validator Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.monitoring.data_quality_validator_agent
Author: Nguyen Viet Hoang
Created: 2025-11-22
Version: 2.0.0
License: MIT

Description:
    Configuration-driven validation system for NGSI-LD entities with
    schema validation, business rules, quality scoring, and data cleaning.

Core Features:
    - NGSI-LD schema compliance validation
    - Custom business rules evaluation
    - Weighted quality scoring (0-100)
    - Automatic data normalization and cleaning
    - Invalid entity filtering and reporting

Dependencies:
    - PyYAML>=6.0: Configuration parsing
    - jsonschema>=4.0: Schema validation
    - requests>=2.28: HTTP client

Configuration:
    config/data_quality_config.yaml:
        - schema_rules: NGSI-LD schema validation rules
        - business_rules: Custom validation logic
        - quality_weights: Scoring weights per criterion
        - cleaning_rules: Data normalization rules

Example:
    ```python
    from src.agents.monitoring.data_quality_validator_agent import DataQualityValidatorAgent

    agent = DataQualityValidatorAgent()
    result = agent.validate_entities(ngsi_ld_entities)
    print(f"Valid: {result['valid_count']}, Quality Score: {result['avg_score']}")
    ```

Architecture:
    Input → SchemaValidator → BusinessRulesEngine → QualityScorer → DataCleaner → Output
"""

import json
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, urlunparse

import requests
import yaml

# Import centralized environment variable expansion helper
from src.core.config_loader import expand_env_var

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DataQualityConfig:
    """
    Configuration loader and manager for data quality validation.
    Supports environment variable expansion and dynamic rule loading.
    """

    def __init__(self, config_path: str):
        """
        Initialize configuration from YAML file.

        Args:
            config_path: Path to data_quality_config.yaml
        """
        self.config_path = config_path
        self.config = self._load_config()
        self._validate_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load and parse YAML configuration with environment variable expansion."""
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Parse YAML
            config = yaml.safe_load(content)

            # Expand environment variables like ${VAR:-default}
            config = expand_env_var(config)

            logger.info(f"Loaded configuration from {self.config_path}")
            return config
        except FileNotFoundError:
            logger.error(f"Configuration file not found: {self.config_path}")
            raise
        except yaml.YAMLError as e:
            logger.error(f"Failed to parse YAML configuration: {e}")
            raise

    def _validate_config(self):
        """Validate configuration structure and required fields."""
        if "data_quality_validator" not in self.config:
            raise ValueError(
                "Missing 'data_quality_validator' root key in configuration"
            )

        validator_config = self.config["data_quality_validator"]

        # Validate required sections
        required_sections = ["business_rules", "quality_thresholds"]
        for section in required_sections:
            if section not in validator_config:
                raise ValueError(f"Missing required configuration section: {section}")

        logger.info("Configuration validation passed")

    def get_schema_validation_config(self) -> Dict[str, Any]:
        """Get schema validation configuration."""
        return self.config["data_quality_validator"].get("schema_validation", {})

    def get_business_rules(
        self, entity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get business rules, optionally filtered by entity type.

        Args:
            entity_type: Filter rules by entity type (applies_to_types)

        Returns:
            List of business rule configurations
        """
        rules = self.config["data_quality_validator"].get("business_rules", [])

        if entity_type:
            # Filter rules that apply to this entity type
            filtered_rules = []
            for rule in rules:
                applies_to = rule.get("applies_to_types", [])
                if not applies_to or entity_type in applies_to:
                    filtered_rules.append(rule)
            return filtered_rules

        return rules

    def get_quality_thresholds(self) -> Dict[str, float]:
        """Get quality score thresholds."""
        return self.config["data_quality_validator"].get("quality_thresholds", {})

    def get_data_cleaning_rules(self) -> Dict[str, Any]:
        """Get data cleaning configuration."""
        return self.config["data_quality_validator"].get("data_cleaning", {})

    def get_reporting_config(self) -> Dict[str, Any]:
        """Get reporting configuration."""
        return self.config["data_quality_validator"].get("reporting", {})

    def get_performance_config(self) -> Dict[str, Any]:
        """Get performance configuration."""
        return self.config["data_quality_validator"].get("performance", {})

    def get_integration_config(self) -> Dict[str, Any]:
        """Get integration configuration."""
        return self.config["data_quality_validator"].get("integration", {})

    def get_custom_domain_rules(self, domain: str) -> List[Dict[str, Any]]:
        """Get custom domain-specific rules."""
        custom_rules = self.config.get("custom_domain_rules", {})
        domain_config = custom_rules.get(domain, {})

        if not domain_config.get("enabled", False):
            return []

        return domain_config.get("rules", [])


class SchemaValidator:
    """
    Validates NGSI-LD entity schema compliance.
    Checks required fields, data types, and property structures.
    """

    def __init__(self, config: DataQualityConfig):
        """
        Initialize schema validator.

        Args:
            config: Data quality configuration
        """
        self.config = config
        self.schema_config = config.get_schema_validation_config()

    def validate(self, entity: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate entity schema compliance.

        Args:
            entity: NGSI-LD entity to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if not self.schema_config.get("enabled", True):
            return True, []

        errors = []

        # Check required fields
        required_fields = self.schema_config.get("required_fields", [])
        for field in required_fields:
            if field not in entity:
                errors.append(f"Missing required field: {field}")

        # Validate field types
        field_types = self.schema_config.get("field_types", {})
        for field, expected_type in field_types.items():
            if field in entity:
                actual_type = type(entity[field]).__name__

                # Handle multiple allowed types
                if isinstance(expected_type, list):
                    valid_types = [self._normalize_type_name(t) for t in expected_type]
                    if actual_type not in valid_types:
                        errors.append(
                            f"Field '{field}' has invalid type '{actual_type}', "
                            f"expected one of {valid_types}"
                        )
                else:
                    expected_type_norm = self._normalize_type_name(expected_type)
                    if actual_type != expected_type_norm:
                        errors.append(
                            f"Field '{field}' has invalid type '{actual_type}', "
                            f"expected '{expected_type_norm}'"
                        )

        # Validate NGSI-LD property structures
        property_structure = self.schema_config.get("property_structure", {})
        if property_structure:
            prop_errors = self._validate_property_structures(entity, property_structure)
            errors.extend(prop_errors)

        is_valid = len(errors) == 0
        return is_valid, errors

    def _normalize_type_name(self, type_name: str) -> str:
        """Normalize type names for comparison."""
        type_map = {
            "string": "str",
            "number": "float",
            "integer": "int",
            "boolean": "bool",
            "array": "list",
            "object": "dict",
        }
        return type_map.get(type_name.lower(), type_name)

    def _validate_property_structures(
        self, entity: Dict[str, Any], structure_config: Dict[str, Any]
    ) -> List[str]:
        """Validate NGSI-LD property structures."""
        errors = []

        required_keys = structure_config.get("required_keys", [])
        valid_types = structure_config.get("valid_types", [])

        for key, value in entity.items():
            # Skip metadata fields
            if key in ["id", "type", "@context"]:
                continue

            # Check if it's a property object
            if isinstance(value, dict):
                # Validate required keys
                for req_key in required_keys:
                    if req_key not in value:
                        errors.append(
                            f"Property '{key}' missing required key '{req_key}'"
                        )

                # Validate property type
                if "type" in value and valid_types:
                    if value["type"] not in valid_types:
                        errors.append(
                            f"Property '{key}' has invalid type '{value['type']}', "
                            f"expected one of {valid_types}"
                        )

        return errors


class BusinessRulesEngine:
    """
    Evaluates custom business rules on entity data.
    Supports expression evaluation with operators and functions.
    """

    def __init__(self, config: DataQualityConfig):
        """
        Initialize business rules engine.

        Args:
            config: Data quality configuration
        """
        self.config = config
        self.http_timeout = config.get_performance_config().get("http_timeout", 5)
        self.http_cache = {}

    def evaluate_rules(
        self, entity: Dict[str, Any], entity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluate all business rules for an entity.

        Args:
            entity: NGSI-LD entity to validate
            entity_type: Entity type for rule filtering

        Returns:
            List of rule check results
        """
        rules = self.config.get_business_rules(entity_type)
        results = []

        for rule in rules:
            result = self._evaluate_rule(entity, rule)
            results.append(result)

        return results

    def _evaluate_rule(
        self, entity: Dict[str, Any], rule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate a single business rule.

        Args:
            entity: NGSI-LD entity
            rule: Rule configuration

        Returns:
            Rule evaluation result
        """
        rule_name = rule.get("name", "unknown")
        field = rule.get("field", "")
        weight = rule.get("weight", 1.0)
        severity = rule.get("severity", "error")

        # Extract field value
        field_value = self._extract_field_value(entity, field)

        # Check if field exists
        if field_value is None:
            # Field doesn't exist - check if rule requires it
            has_exists_rule = any(
                "exists(" in expr.get("expression", "")
                for expr in rule.get("rules", [])
            )

            if has_exists_rule:
                # Let the exists() check handle it
                pass
            else:
                # Field is optional, skip this rule
                return {
                    "rule": rule_name,
                    "passed": True,
                    "weight": weight,
                    "severity": severity,
                    "skipped": True,
                    "reason": f"Field '{field}' not present in entity",
                }

        # Evaluate all expressions in the rule
        expressions = rule.get("rules", [])
        all_passed = True
        errors = []

        for expr_config in expressions:
            expression = expr_config.get("expression", "")
            error_message = expr_config.get("error_message", "Validation failed")

            try:
                passed = self._evaluate_expression(expression, field_value, entity)
                if not passed:
                    all_passed = False
                    errors.append(error_message)
            except Exception as e:
                all_passed = False
                errors.append(f"Expression evaluation error: {str(e)}")
                logger.error(f"Error evaluating rule '{rule_name}': {e}")

        return {
            "rule": rule_name,
            "passed": all_passed,
            "weight": weight,
            "severity": severity,
            "errors": errors if not all_passed else [],
        }

    def _extract_field_value(self, entity: Dict[str, Any], field_path: str) -> Any:
        """
        Extract field value from entity using dot notation and array indexing.

        Args:
            entity: NGSI-LD entity
            field_path: Field path (e.g., "location.value.coordinates[0]")

        Returns:
            Field value or None if not found
        """
        try:
            # Handle array indexing
            parts = []
            current_part = ""

            for char in field_path:
                if char == "[":
                    if current_part:
                        parts.append(("key", current_part))
                        current_part = ""
                elif char == "]":
                    if current_part:
                        parts.append(("index", int(current_part)))
                        current_part = ""
                elif char == ".":
                    if current_part:
                        parts.append(("key", current_part))
                        current_part = ""
                else:
                    current_part += char

            if current_part:
                parts.append(("key", current_part))

            # Navigate through the entity
            value = entity
            for part_type, part_value in parts:
                if part_type == "key":
                    if isinstance(value, dict):
                        value = value.get(part_value)
                    else:
                        return None
                elif part_type == "index":
                    if isinstance(value, list):
                        if 0 <= part_value < len(value):
                            value = value[part_value]
                        else:
                            return None
                    else:
                        return None

                if value is None:
                    return None

            return value
        except (KeyError, IndexError, ValueError, TypeError):
            return None

    def _evaluate_expression(
        self, expression: str, field_value: Any, entity: Dict[str, Any]
    ) -> bool:
        """
        Evaluate a business rule expression.

        Supported operators: >=, <=, ==, !=, >, <, AND, OR, NOT, IN, MATCHES
        Supported functions: now(), http_head(), len(), exists()

        Args:
            expression: Rule expression to evaluate
            field_value: Value of the field being validated
            entity: Full entity for context

        Returns:
            True if expression passes, False otherwise
        """
        # Create evaluation context
        context = self._create_evaluation_context(field_value, entity)

        # Replace function calls with their results
        expression = self._evaluate_functions(expression, context)

        # Replace field references with values
        expression = self._replace_field_references(expression, context)

        # Evaluate logical operators
        return self._evaluate_logical_expression(expression, context)

    def _create_evaluation_context(
        self, field_value: Any, entity: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create evaluation context with all available values."""
        # Extract simple field name from value
        field_names = []
        if isinstance(field_value, dict):
            field_names.extend(field_value.keys())

        # Common field name mappings
        context = {"value": field_value, "entity": entity}

        # Add direct field value with common names
        if isinstance(field_value, (int, float)):
            # For numeric values, add common field names
            for name in ["speed", "temperature", "humidity", "intensity", "occupancy"]:
                context[name] = field_value
        elif isinstance(field_value, str):
            # For string values
            for name in [
                "id",
                "url",
                "observedAt",
                "dateObserved",
                "description",
                "imageSnapshot",
                "streamURL",
                "status",
                "patientId",
            ]:
                context[name] = field_value
        elif isinstance(field_value, list):
            # For arrays
            context["coordinates"] = field_value
            context["category"] = field_value
        elif isinstance(field_value, dict):
            # For objects
            context["refDevice"] = field_value

        return context

    def _evaluate_functions(self, expression: str, context: Dict[str, Any]) -> str:
        """Evaluate function calls in expression."""
        # now() function
        if "now()" in expression:
            now_timestamp = int(datetime.now(timezone.utc).timestamp())
            expression = expression.replace("now()", str(now_timestamp))

        # len() function
        len_pattern = r"len\(([^)]+)\)"
        for match in re.finditer(len_pattern, expression):
            field_name = match.group(1)
            field_value = context.get(field_name, context.get("value"))
            if field_value is not None:
                length = len(field_value) if hasattr(field_value, "__len__") else 0
                expression = expression.replace(match.group(0), str(length))

        # exists() function
        exists_pattern = r"exists\(([^)]+)\)"
        for match in re.finditer(exists_pattern, expression):
            field_name = match.group(1)
            field_value = context.get(field_name, context.get("value"))
            exists = field_value is not None
            expression = expression.replace(match.group(0), str(exists))

        # http_head() function
        http_head_pattern = r"http_head\(([^)]+)\)"
        for match in re.finditer(http_head_pattern, expression):
            field_name = match.group(1)
            url = context.get(field_name, context.get("value"))
            status_code = self._http_head_check(url)
            expression = expression.replace(match.group(0), str(status_code))

        return expression

    def _http_head_check(self, url: str) -> int:
        """
        Perform HTTP HEAD check on URL.

        Args:
            url: URL to check

        Returns:
            HTTP status code or 0 if check fails
        """
        if not url or not isinstance(url, str):
            return 0

        # Check cache
        if url in self.http_cache:
            cache_time, status_code = self.http_cache[url]
            if time.time() - cache_time < 300:  # 5 minute cache
                return status_code

        try:
            response = requests.head(
                url, timeout=self.http_timeout, allow_redirects=True
            )
            status_code = response.status_code

            # Cache result
            self.http_cache[url] = (time.time(), status_code)

            return status_code
        except requests.RequestException:
            return 0

    def _replace_field_references(
        self, expression: str, context: Dict[str, Any]
    ) -> str:
        """Replace field references with their values."""
        # Replace field references
        for field_name, field_value in context.items():
            if field_name in ["entity", "value"]:
                continue

            if isinstance(field_value, str):
                # String values need quotes
                expression = re.sub(
                    r"\b" + re.escape(field_name) + r"\b",
                    f'"{field_value}"',
                    expression,
                )
            elif isinstance(field_value, bool):
                # Boolean values
                expression = re.sub(
                    r"\b" + re.escape(field_name) + r"\b", str(field_value), expression
                )
            elif isinstance(field_value, (int, float)):
                # Numeric values
                expression = re.sub(
                    r"\b" + re.escape(field_name) + r"\b", str(field_value), expression
                )
            elif isinstance(field_value, list):
                # Handle array indexing
                for i, item in enumerate(field_value):
                    expression = expression.replace(f"{field_name}[{i}]", str(item))

        return expression

    def _evaluate_logical_expression(
        self, expression: str, context: Dict[str, Any]
    ) -> bool:
        """Evaluate logical expression with operators."""
        try:
            # Handle MATCHES operator (regex matching)
            if "MATCHES(" in expression:
                matches_pattern = r'MATCHES\(([^,]+),\s*["\']([^"\']+)["\']\)'
                for match in re.finditer(matches_pattern, expression):
                    value_str = match.group(1).strip().strip('"')
                    pattern = match.group(2)

                    try:
                        matches = bool(re.match(pattern, value_str))
                        expression = expression.replace(match.group(0), str(matches))
                    except re.error:
                        expression = expression.replace(match.group(0), "False")

            # Handle IN operator
            if " IN " in expression:
                in_pattern = r"(\d+)\s+IN\s+\[([^\]]+)\]"
                for match in re.finditer(in_pattern, expression):
                    value = int(match.group(1))
                    list_items = [int(x.strip()) for x in match.group(2).split(",")]
                    result = value in list_items
                    expression = expression.replace(match.group(0), str(result))

            # Replace logical operators with Python equivalents
            expression = expression.replace(" AND ", " and ")
            expression = expression.replace(" OR ", " or ")
            expression = expression.replace(" NOT ", " not ")

            # Safely evaluate the expression
            result = eval(expression, {"__builtins__": {}}, {})
            return bool(result)
        except Exception as e:
            logger.error(f"Error evaluating expression '{expression}': {e}")
            return False


class QualityScorer:
    """
    Calculates quality scores from validation results.
    Uses weighted scoring based on rule importance.
    """

    def __init__(self, config: DataQualityConfig):
        """
        Initialize quality scorer.

        Args:
            config: Data quality configuration
        """
        self.config = config
        self.thresholds = config.get_quality_thresholds()

    def calculate_score(
        self, schema_valid: bool, rule_results: List[Dict[str, Any]]
    ) -> Tuple[float, str]:
        """
        Calculate quality score from validation results.

        Args:
            schema_valid: Whether schema validation passed
            rule_results: List of business rule results

        Returns:
            Tuple of (quality_score, status)
        """
        # Schema validation is binary - if it fails, score is 0
        if not schema_valid:
            return 0.0, self._get_status(0.0)

        # Calculate weighted score from business rules
        total_weight = 0.0
        weighted_score = 0.0

        for result in rule_results:
            if result.get("skipped", False):
                continue

            weight = result.get("weight", 1.0)
            passed = result.get("passed", False)

            total_weight += weight
            if passed:
                weighted_score += weight

        # Calculate final score (0.0 - 1.0)
        if total_weight > 0:
            score = weighted_score / total_weight
        else:
            score = 1.0  # No rules to check

        status = self._get_status(score)
        return round(score, 3), status

    def _get_status(self, score: float) -> str:
        """
        Determine status based on score and thresholds.

        Args:
            score: Quality score (0.0 - 1.0)

        Returns:
            Status label (PASS, WARNING, REJECT)
        """
        accept_threshold = self.thresholds.get("accept", 0.7)
        reject_threshold = self.thresholds.get("reject", 0.5)

        if score >= accept_threshold:
            return "PASS"
        elif score >= reject_threshold:
            return "WARNING"
        else:
            return "REJECT"


class DataCleaner:
    """
    Performs automatic data cleaning and normalization.
    Applies configurable cleaning rules to entity data.
    """

    def __init__(self, config: DataQualityConfig):
        """
        Initialize data cleaner.

        Args:
            config: Data quality configuration
        """
        self.config = config
        self.cleaning_config = config.get_data_cleaning_rules()

    def clean(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply data cleaning rules to entity.

        Args:
            entity: NGSI-LD entity to clean

        Returns:
            Cleaned entity
        """
        if not self.cleaning_config.get("enabled", True):
            return entity

        # Make a deep copy to avoid modifying original
        cleaned_entity = json.loads(json.dumps(entity))

        # Apply cleaning rules
        rules = self.cleaning_config.get("rules", [])
        for rule in rules:
            if not rule.get("enabled", True):
                continue

            action = rule.get("action", "")

            if action == "convert_to_utc":
                cleaned_entity = self._fix_timezone(cleaned_entity, rule)
            elif action == "trim":
                cleaned_entity = self._trim_whitespace(cleaned_entity, rule)
            elif action == "uppercase":
                cleaned_entity = self._normalize_case(cleaned_entity, rule, str.upper)
            elif action == "lowercase":
                cleaned_entity = self._normalize_case(cleaned_entity, rule, str.lower)
            elif action == "titlecase":
                cleaned_entity = self._normalize_case(cleaned_entity, rule, str.title)
            elif action == "remove_null_values":
                cleaned_entity = self._remove_nulls(cleaned_entity)
            elif action == "round":
                cleaned_entity = self._fix_numeric_precision(cleaned_entity, rule)
            elif action == "normalize_url":
                cleaned_entity = self._normalize_urls(cleaned_entity, rule)
            elif action == "ensure_iso8601_with_timezone":
                cleaned_entity = self._normalize_datetime(cleaned_entity, rule)

        return cleaned_entity

    def _fix_timezone(
        self, entity: Dict[str, Any], rule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert timestamps to UTC timezone."""
        fields = rule.get("fields", [])

        for field_path in fields:
            value = self._get_nested_value(entity, field_path)
            if value and isinstance(value, str):
                try:
                    # Parse datetime
                    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))

                    # Convert to UTC
                    dt_utc = dt.astimezone(timezone.utc)

                    # Format as ISO 8601 with Z suffix
                    utc_string = dt_utc.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

                    # Update entity
                    self._set_nested_value(entity, field_path, utc_string)
                except (ValueError, AttributeError):
                    # Invalid datetime format - skip timezone conversion for this field
                    pass

        return entity

    def _trim_whitespace(
        self, entity: Dict[str, Any], rule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Remove leading/trailing whitespace from string fields."""

        def trim_strings(obj):
            if isinstance(obj, dict):
                return {k: trim_strings(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [trim_strings(item) for item in obj]
            elif isinstance(obj, str):
                return obj.strip()
            else:
                return obj

        return trim_strings(entity)

    def _normalize_case(
        self, entity: Dict[str, Any], rule: Dict[str, Any], transform_func
    ) -> Dict[str, Any]:
        """Normalize case for specific fields."""
        fields = rule.get("fields", [])

        for field_path in fields:
            value = self._get_nested_value(entity, field_path)
            if value and isinstance(value, str):
                normalized_value = transform_func(value)
                self._set_nested_value(entity, field_path, normalized_value)

        return entity

    def _remove_nulls(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Remove null or empty string values."""

        def remove_null_values(obj):
            if isinstance(obj, dict):
                return {
                    k: remove_null_values(v)
                    for k, v in obj.items()
                    if v is not None and v != ""
                }
            elif isinstance(obj, list):
                return [
                    remove_null_values(item)
                    for item in obj
                    if item is not None and item != ""
                ]
            else:
                return obj

        return remove_null_values(entity)

    def _fix_numeric_precision(
        self, entity: Dict[str, Any], rule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Round numeric values to specified precision."""
        fields = rule.get("fields", [])
        precision = rule.get("precision", 6)

        for field_path in fields:
            # Handle array indexing in field path
            if "[" in field_path:
                # Extract array path and index
                base_path = field_path[: field_path.index("[")]
                index_str = field_path[
                    field_path.index("[") + 1 : field_path.index("]")
                ]
                index = int(index_str)

                # Get the array
                array = self._get_nested_value(entity, base_path)
                if array and isinstance(array, list) and 0 <= index < len(array):
                    value = array[index]
                    if isinstance(value, (int, float)):
                        array[index] = round(float(value), precision)
            else:
                # Handle regular field path
                value = self._get_nested_value(entity, field_path)
                if value is not None and isinstance(value, (int, float)):
                    rounded_value = round(float(value), precision)
                    self._set_nested_value(entity, field_path, rounded_value)

        return entity

    def _normalize_urls(
        self, entity: Dict[str, Any], rule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Normalize URL formats."""
        field_patterns = rule.get("field_patterns", [])

        def normalize_url(url: str) -> str:
            if not url or not isinstance(url, str):
                return url

            try:
                parsed = urlparse(url)

                # Lowercase scheme and netloc
                normalized = parsed._replace(
                    scheme=parsed.scheme.lower(), netloc=parsed.netloc.lower()
                )

                # Remove trailing slash from path
                path = normalized.path.rstrip("/")
                normalized = normalized._replace(path=path)

                return urlunparse(normalized)
            except Exception:
                return url

        def process_urls(obj, parent_key=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    full_key = f"{parent_key}.{key}" if parent_key else key

                    # Check if key matches patterns
                    matches_pattern = any(
                        re.search(pattern, full_key, re.IGNORECASE)
                        for pattern in field_patterns
                    )

                    if matches_pattern and isinstance(value, str):
                        obj[key] = normalize_url(value)
                    elif isinstance(value, (dict, list)):
                        process_urls(value, full_key)
            elif isinstance(obj, list):
                for item in obj:
                    if isinstance(item, (dict, list)):
                        process_urls(item, parent_key)

        process_urls(entity)
        return entity

    def _normalize_datetime(
        self, entity: Dict[str, Any], rule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Ensure datetime strings use ISO 8601 format with timezone."""
        field_patterns = rule.get("field_patterns", [])

        def normalize_dt(dt_string: str) -> str:
            if not dt_string or not isinstance(dt_string, str):
                return dt_string

            try:
                # Parse datetime (handle various formats)
                if "Z" in dt_string or "+" in dt_string or dt_string.count("-") > 2:
                    dt = datetime.fromisoformat(dt_string.replace("Z", "+00:00"))
                else:
                    # Assume UTC if no timezone
                    dt = datetime.fromisoformat(dt_string).replace(tzinfo=timezone.utc)

                # Format as ISO 8601 with Z suffix
                return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
            except (ValueError, AttributeError):
                return dt_string

        def process_datetimes(obj, parent_key=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    full_key = f"{parent_key}.{key}" if parent_key else key

                    # Check if key matches patterns
                    matches_pattern = any(
                        re.search(pattern, full_key, re.IGNORECASE)
                        for pattern in field_patterns
                    )

                    if matches_pattern and isinstance(value, str):
                        obj[key] = normalize_dt(value)
                    elif isinstance(value, (dict, list)):
                        process_datetimes(value, full_key)
            elif isinstance(obj, list):
                for item in obj:
                    if isinstance(item, (dict, list)):
                        process_datetimes(item, parent_key)

        process_datetimes(entity)
        return entity

    def _get_nested_value(self, obj: Dict[str, Any], path: str) -> Any:
        """Get nested value using dot notation."""
        keys = path.split(".")
        value = obj

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None

        return value

    def _set_nested_value(self, obj: Dict[str, Any], path: str, value: Any):
        """Set nested value using dot notation."""
        keys = path.split(".")
        target = obj

        for key in keys[:-1]:
            if key not in target:
                target[key] = {}
            target = target[key]

        target[keys[-1]] = value


class DataQualityValidatorAgent:
    """
    Main orchestrator for data quality validation.
    Coordinates schema validation, business rules, scoring, and cleaning.
    """

    def __init__(self, config_path: str):
        """
        Initialize Data Quality Validator Agent.

        Args:
            config_path: Path to data_quality_config.yaml
        """
        self.config = DataQualityConfig(config_path)
        self.schema_validator = SchemaValidator(self.config)
        self.rules_engine = BusinessRulesEngine(self.config)
        self.quality_scorer = QualityScorer(self.config)
        self.data_cleaner = DataCleaner(self.config)

        # Get configuration
        self.reporting_config = self.config.get_reporting_config()
        self.performance_config = self.config.get_performance_config()
        self.integration_config = self.config.get_integration_config()

        # Create report directory
        report_dir = self.reporting_config.get(
            "report_directory", "logs/validation_reports"
        )
        Path(report_dir).mkdir(parents=True, exist_ok=True)

        logger.info("Data Quality Validator Agent initialized")

    def validate_entity(
        self, entity: Dict[str, Any], auto_clean: bool = True
    ) -> Dict[str, Any]:
        """
        Validate a single NGSI-LD entity.

        Args:
            entity: NGSI-LD entity to validate
            auto_clean: Whether to apply automatic data cleaning

        Returns:
            Validation report with quality score and status
        """
        entity_id = entity.get("id", "unknown")
        entity_type = entity.get("type", "unknown")

        logger.info(f"Validating entity {entity_id} (type: {entity_type})")

        # Apply data cleaning if enabled
        if auto_clean and self.integration_config.get("auto_fix", True):
            entity = self.data_cleaner.clean(entity)

        # Schema validation
        schema_valid, schema_errors = self.schema_validator.validate(entity)

        # Business rules validation
        rule_results = self.rules_engine.evaluate_rules(entity, entity_type)

        # Calculate quality score
        quality_score, status = self.quality_scorer.calculate_score(
            schema_valid, rule_results
        )

        # Compile validation report
        report = {
            "entity_id": entity_id,
            "entity_type": entity_type,
            "validation_timestamp": datetime.now(timezone.utc).isoformat(),
            "quality_score": quality_score,
            "status": status,
            "schema_validation": {"passed": schema_valid, "errors": schema_errors},
            "business_rules": self._format_rule_results(rule_results),
            "checks": self._compile_checks(rule_results),
            "errors": self._compile_errors(schema_errors, rule_results),
            "warnings": self._compile_warnings(rule_results),
        }

        # Include cleaned data if configured
        if self.reporting_config.get("include_cleaned_data", False):
            report["cleaned_entity"] = entity

        # Save report if configured
        if self.reporting_config.get("save_reports", True):
            self._save_report(report)

        # Log validation result
        if self.reporting_config.get("log_validation", True):
            self._log_validation_result(report)

        return report

    def validate_batch(
        self, entities: List[Dict[str, Any]], parallel: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Validate multiple entities in batch.

        Args:
            entities: List of NGSI-LD entities to validate
            parallel: Whether to use parallel processing

        Returns:
            List of validation reports
        """
        logger.info(f"Validating batch of {len(entities)} entities")

        if parallel and self.performance_config.get("parallel_validation", True):
            return self._validate_batch_parallel(entities)
        else:
            return self._validate_batch_sequential(entities)

    def _validate_batch_sequential(
        self, entities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Validate entities sequentially."""
        reports = []
        for entity in entities:
            report = self.validate_entity(entity)
            reports.append(report)
        return reports

    def _validate_batch_parallel(
        self, entities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Validate entities in parallel using thread pool."""
        max_workers = self.performance_config.get("max_workers", 4)
        reports = []

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(self.validate_entity, entity): entity
                for entity in entities
            }

            for future in as_completed(futures):
                try:
                    report = future.result()
                    reports.append(report)
                except Exception as e:
                    entity = futures[future]
                    entity_id = entity.get("id", "unknown")
                    logger.error(f"Error validating entity {entity_id}: {e}")

                    # Create error report
                    reports.append(
                        {
                            "entity_id": entity_id,
                            "status": "ERROR",
                            "quality_score": 0.0,
                            "errors": [str(e)],
                        }
                    )

        return reports

    def _format_rule_results(
        self, rule_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Format rule results for report."""
        formatted = []

        for result in rule_results:
            if result.get("skipped", False):
                continue

            formatted.append(
                {
                    "rule": result["rule"],
                    "passed": result["passed"],
                    "weight": result["weight"],
                    "severity": result["severity"],
                    "errors": result.get("errors", []),
                }
            )

        return formatted

    def _compile_checks(
        self, rule_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compile checks summary for report."""
        checks = []

        for result in rule_results:
            if result.get("skipped", False):
                continue

            checks.append(
                {
                    "rule": result["rule"],
                    "passed": result["passed"],
                    "weight": result["weight"],
                }
            )

        return checks

    def _compile_errors(
        self, schema_errors: List[str], rule_results: List[Dict[str, Any]]
    ) -> List[str]:
        """Compile all errors from validation."""
        errors = []

        # Add schema errors
        errors.extend(schema_errors)

        # Add rule errors with severity error or critical
        for result in rule_results:
            severity = result.get("severity", "error")
            if severity in ["error", "critical"] and not result["passed"]:
                errors.extend(result.get("errors", []))

        return errors

    def _compile_warnings(self, rule_results: List[Dict[str, Any]]) -> List[str]:
        """Compile warnings from validation."""
        warnings = []

        for result in rule_results:
            severity = result.get("severity", "error")
            if severity in ["warning", "info"] and not result["passed"]:
                warnings.extend(result.get("errors", []))

        return warnings

    def _save_report(self, report: Dict[str, Any]):
        """Save validation report to file."""
        try:
            report_dir = self.reporting_config.get(
                "report_directory", "logs/validation_reports"
            )
            report_format = self.reporting_config.get("report_format", "json")

            # Create filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            entity_id = report["entity_id"].split(":")[-1]  # Extract ID part
            filename = f"validation_{entity_id}_{timestamp}.{report_format}"
            filepath = Path(report_dir) / filename

            # Save report
            with open(filepath, "w", encoding="utf-8") as f:
                if report_format == "json":
                    json.dump(report, f, indent=2)
                elif report_format == "yaml":
                    yaml.dump(report, f, default_flow_style=False)

            logger.debug(f"Saved validation report to {filepath}")
        except Exception as e:
            logger.error(f"Failed to save validation report: {e}")

    def _log_validation_result(self, report: Dict[str, Any]):
        """Log validation result based on status."""
        entity_id = report["entity_id"]
        status = report["status"]
        score = report["quality_score"]

        message = f"Entity {entity_id}: {status} " f"(quality_score={score:.3f})"

        if status == "REJECT":
            logger.error(message)
        elif status == "WARNING":
            logger.warning(message)
        else:
            logger.info(message)

    def get_validation_summary(self, reports: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary statistics from validation reports.

        Args:
            reports: List of validation reports

        Returns:
            Summary statistics
        """
        total = len(reports)
        passed = sum(1 for r in reports if r["status"] == "PASS")
        warnings = sum(1 for r in reports if r["status"] == "WARNING")
        rejected = sum(1 for r in reports if r["status"] == "REJECT")

        avg_score = (
            sum(r["quality_score"] for r in reports) / total if total > 0 else 0.0
        )

        return {
            "total_entities": total,
            "passed": passed,
            "warnings": warnings,
            "rejected": rejected,
            "average_quality_score": round(avg_score, 3),
            "pass_rate": round(passed / total * 100, 2) if total > 0 else 0.0,
        }


# ==============================================================================
# CLI Interface
# ==============================================================================


def main():
    """Main CLI entry point for testing."""
    import argparse

    parser = argparse.ArgumentParser(description="Data Quality Validator Agent")
    parser.add_argument(
        "--config",
        default="config/data_quality_config.yaml",
        help="Path to configuration file",
    )
    parser.add_argument("--entity", help="Path to entity JSON file to validate")
    parser.add_argument(
        "--batch", help="Path to JSON file containing array of entities"
    )

    args = parser.parse_args()

    # Initialize agent
    agent = DataQualityValidatorAgent(args.config)

    # Validate single entity
    if args.entity:
        with open(args.entity, "r") as f:
            entity = json.load(f)

        report = agent.validate_entity(entity)
        print(json.dumps(report, indent=2))

    # Validate batch
    elif args.batch:
        with open(args.batch, "r") as f:
            entities = json.load(f)

        reports = agent.validate_batch(entities)
        summary = agent.get_validation_summary(reports)

        print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
