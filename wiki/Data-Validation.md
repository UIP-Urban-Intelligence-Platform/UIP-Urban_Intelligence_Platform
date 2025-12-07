<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Data-Validation.md
Module: Data Validation Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Complete guide to data validation processes in UIP.
============================================================================
-->

# ✅ Data Validation

Complete guide to data validation processes in UIP - Urban Intelligence Platform.

---

## 📊 Overview

UIP - Urban Intelligence Platform implements comprehensive data validation at every stage of the data pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATA VALIDATION PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   INPUT     │───▶│   SCHEMA    │───▶│  SEMANTIC   │───▶│   OUTPUT    │  │
│  │ VALIDATION  │    │ VALIDATION  │    │ VALIDATION  │    │ VALIDATION  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│        │                  │                  │                  │           │
│        ▼                  ▼                  ▼                  ▼           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Format      │    │ JSON Schema │    │ NGSI-LD     │    │ Entity      │  │
│  │ Type Check  │    │ Smart Data  │    │ SOSA/SSN    │    │ Integrity   │  │
│  │ Range Check │    │ Models      │    │ Ontology    │    │ Consistency │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Validation Types

### 1. Input Validation

Validates raw data from external sources:

| Check | Description | Example |
|-------|-------------|---------|
| **Format** | Data format correctness | Valid JSON structure |
| **Type** | Data type matching | String, Number, Boolean |
| **Range** | Value boundaries | Latitude: -90 to 90 |
| **Required** | Mandatory fields | `id`, `type` required |
| **Pattern** | Regex matching | URN format validation |

```python
# Example: Input validation
from src.agents.validation_agent import ValidationAgent

validator = ValidationAgent()

# Validate camera data
camera_data = {
    "id": "urn:ngsi-ld:Camera:TTH001",
    "type": "Camera",
    "location": {
        "type": "GeoProperty",
        "value": {
            "type": "Point",
            "coordinates": [106.6297, 10.8231]
        }
    }
}

result = validator.validate_input(camera_data)
print(f"Valid: {result.is_valid}")
print(f"Errors: {result.errors}")
```

### 2. Schema Validation

Validates against JSON Schema and Smart Data Models:

```yaml
# config/validation.yaml
validation:
  schemas:
    camera:
      schema_url: "https://smartdatamodels.org/dataModel.Transportation/Camera/schema.json"
      required_fields:
        - id
        - type
        - location
      
    traffic_flow:
      schema_url: "https://smartdatamodels.org/dataModel.Transportation/TrafficFlowObserved/schema.json"
      required_fields:
        - id
        - type
        - dateObserved
        - location
```

```python
# Schema validation example
from jsonschema import validate, ValidationError

def validate_against_schema(data: dict, schema: dict) -> bool:
    """Validate data against JSON Schema."""
    try:
        validate(instance=data, schema=schema)
        return True
    except ValidationError as e:
        logger.error(f"Schema validation failed: {e.message}")
        return False
```

### 3. Semantic Validation

Validates NGSI-LD and ontology compliance:

| Check | Standard | Description |
|-------|----------|-------------|
| **Entity ID** | NGSI-LD | URN format: `urn:ngsi-ld:Type:id` |
| **@context** | JSON-LD | Valid context URLs |
| **Relationships** | NGSI-LD | Valid entity references |
| **Observations** | SOSA/SSN | Sensor-observation links |
| **GeoProperty** | GeoJSON | Valid coordinates |

```python
# Semantic validation
def validate_ngsi_ld_entity(entity: dict) -> ValidationResult:
    """Validate NGSI-LD entity structure."""
    errors = []
    
    # Check entity ID format
    if not entity.get("id", "").startswith("urn:ngsi-ld:"):
        errors.append("Invalid entity ID format")
    
    # Check required @context
    if "@context" not in entity:
        errors.append("Missing @context")
    
    # Check type
    if "type" not in entity:
        errors.append("Missing entity type")
    
    # Validate GeoProperty
    if "location" in entity:
        location = entity["location"]
        if location.get("type") != "GeoProperty":
            errors.append("Location must be GeoProperty")
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )
```

### 4. Output Validation

Validates data before publishing to Stellio:

```python
# Output validation before publish
def validate_before_publish(entities: list) -> tuple:
    """Validate entities before publishing to Stellio."""
    valid_entities = []
    invalid_entities = []
    
    for entity in entities:
        result = validate_ngsi_ld_entity(entity)
        
        if result.is_valid:
            valid_entities.append(entity)
        else:
            invalid_entities.append({
                "entity": entity,
                "errors": result.errors
            })
    
    # Save invalid entities for review
    if invalid_entities:
        save_invalid_entities(invalid_entities)
    
    return valid_entities, invalid_entities
```

---

## 📁 Validation Configuration

### Main Configuration File

**File**: `config/validation.yaml`

```yaml
# ============================================================================
# Data Validation Configuration
# ============================================================================

validation:
  # Enable/disable validation stages
  enabled:
    input: true
    schema: true
    semantic: true
    output: true
  
  # Validation strictness
  strict_mode: false  # If true, reject on any error
  
  # Error handling
  on_error:
    action: "log_and_continue"  # log_and_continue | reject | quarantine
    save_invalid: true
    invalid_path: "data/invalid_entities.json"
  
  # Thresholds
  thresholds:
    completeness: 0.95  # 95% of required fields
    accuracy: 0.99      # 99% data accuracy
    consistency: 1.0    # 100% consistent

  # Field validation rules
  rules:
    coordinates:
      latitude:
        min: -90
        max: 90
      longitude:
        min: -180
        max: 180
    
    timestamps:
      format: "ISO8601"
      max_age_hours: 24
    
    entity_id:
      pattern: "^urn:ngsi-ld:[A-Za-z]+:[A-Za-z0-9_-]+$"
```

---

## 🔄 Validation Pipeline

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VALIDATION PIPELINE FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Raw Data                                                                   │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 1: Input Validation                                          │   │
│  │  • Check JSON format                                                │   │
│  │  • Validate required fields                                         │   │
│  │  • Type checking                                                    │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 2: Schema Validation                                         │   │
│  │  • JSON Schema validation                                           │   │
│  │  • Smart Data Models compliance                                     │   │
│  │  • Property constraints                                             │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 3: Semantic Validation                                       │   │
│  │  • NGSI-LD compliance                                               │   │
│  │  • Ontology validation (SOSA/SSN)                                   │   │
│  │  • Relationship integrity                                           │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 4: Output Validation                                         │   │
│  │  • Entity completeness                                              │   │
│  │  • Cross-reference validation                                       │   │
│  │  • Final quality check                                              │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│                        Validated Data                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```python
# src/agents/validation_agent.py
class ValidationAgent:
    """Multi-stage data validation agent."""
    
    def __init__(self, config_path: str = "config/validation.yaml"):
        self.config = load_config(config_path)
        self.schema_validator = SchemaValidator()
        self.semantic_validator = SemanticValidator()
    
    def validate(self, data: dict) -> ValidationResult:
        """Run full validation pipeline."""
        results = []
        
        # Stage 1: Input validation
        if self.config["enabled"]["input"]:
            results.append(self.validate_input(data))
        
        # Stage 2: Schema validation
        if self.config["enabled"]["schema"]:
            results.append(self.validate_schema(data))
        
        # Stage 3: Semantic validation
        if self.config["enabled"]["semantic"]:
            results.append(self.validate_semantic(data))
        
        # Stage 4: Output validation
        if self.config["enabled"]["output"]:
            results.append(self.validate_output(data))
        
        return self.combine_results(results)
    
    def validate_input(self, data: dict) -> ValidationResult:
        """Stage 1: Input validation."""
        errors = []
        
        # Check JSON structure
        if not isinstance(data, dict):
            errors.append("Data must be a JSON object")
            return ValidationResult(False, errors)
        
        # Check required fields
        required = ["id", "type"]
        for field in required:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        return ValidationResult(len(errors) == 0, errors)
    
    def validate_schema(self, data: dict) -> ValidationResult:
        """Stage 2: Schema validation."""
        entity_type = data.get("type", "")
        schema = self.schema_validator.get_schema(entity_type)
        
        if schema:
            return self.schema_validator.validate(data, schema)
        
        return ValidationResult(True, [])  # No schema = pass
    
    def validate_semantic(self, data: dict) -> ValidationResult:
        """Stage 3: Semantic validation."""
        return self.semantic_validator.validate_ngsi_ld(data)
    
    def validate_output(self, data: dict) -> ValidationResult:
        """Stage 4: Output validation."""
        errors = []
        
        # Check entity completeness
        completeness = self.calculate_completeness(data)
        if completeness < self.config["thresholds"]["completeness"]:
            errors.append(f"Low completeness: {completeness:.2%}")
        
        return ValidationResult(len(errors) == 0, errors)
```

---

## 📊 Validation Reports

### Report Generation

```python
# Generate validation report
def generate_validation_report(results: list) -> dict:
    """Generate comprehensive validation report."""
    return {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_entities": len(results),
            "valid": sum(1 for r in results if r.is_valid),
            "invalid": sum(1 for r in results if not r.is_valid),
            "success_rate": sum(1 for r in results if r.is_valid) / len(results)
        },
        "errors_by_type": group_errors_by_type(results),
        "recommendations": generate_recommendations(results)
    }
```

### Sample Report

```json
{
  "timestamp": "2025-11-25T10:30:00Z",
  "summary": {
    "total_entities": 722,
    "valid": 718,
    "invalid": 4,
    "success_rate": 0.9945
  },
  "errors_by_type": {
    "missing_field": 2,
    "invalid_format": 1,
    "range_error": 1
  },
  "recommendations": [
    "Fix missing 'location' field in 2 entities",
    "Correct coordinate format in entity CAM_405"
  ]
}
```

---

## 🧪 Testing Validation

### Unit Tests

```python
# tests/test_validation.py
import pytest
from src.agents.validation_agent import ValidationAgent

class TestValidation:
    def setup_method(self):
        self.validator = ValidationAgent()
    
    def test_valid_entity(self):
        """Test validation of valid entity."""
        entity = {
            "id": "urn:ngsi-ld:Camera:TTH001",
            "type": "Camera",
            "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
            "location": {
                "type": "GeoProperty",
                "value": {"type": "Point", "coordinates": [106.6297, 10.8231]}
            }
        }
        
        result = self.validator.validate(entity)
        assert result.is_valid
    
    def test_missing_required_field(self):
        """Test validation fails for missing required field."""
        entity = {"type": "Camera"}  # Missing 'id'
        
        result = self.validator.validate(entity)
        assert not result.is_valid
        assert "Missing required field: id" in result.errors
    
    def test_invalid_coordinate_range(self):
        """Test validation fails for invalid coordinates."""
        entity = {
            "id": "urn:ngsi-ld:Camera:TTH001",
            "type": "Camera",
            "location": {
                "type": "GeoProperty",
                "value": {"type": "Point", "coordinates": [200, 100]}  # Invalid
            }
        }
        
        result = self.validator.validate(entity)
        assert not result.is_valid
```

### Run Tests

```bash
# Run validation tests
pytest tests/test_validation.py -v

# Run with coverage
pytest tests/test_validation.py --cov=src/agents/validation_agent
```

---

## 🔗 Related Pages

- [[Data-Flow]] - Data pipeline overview
- [[Entity-Types]] - Entity documentation
- [[NGSI-LD-Guide]] - NGSI-LD standards
- [[Smart-Data-Models]] - Smart Data Models reference
- [[Configuration]] - Configuration guide

---

<p align="center">
  <sub>Part of <a href="Home">UIP - Urban Intelligence Platform</a> Documentation</sub>
</p>
