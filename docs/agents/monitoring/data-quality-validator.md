---
sidebar_position: 3
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: agents/monitoring/data-quality-validator.md
Module: Monitoring - Data Quality Validator Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Data Quality Validator Agent documentation for ensuring data integrity
  and quality across all data sources and pipelines.
============================================================================
-->

# Data Quality Validator Agent

The Data Quality Validator Agent ensures data integrity and quality across all data sources and pipelines.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.monitoring.data_quality_validator_agent` |
| **Class** | `DataQualityValidatorAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

The Data Quality Validator Agent provides:

- **Schema validation** for incoming data
- **Completeness checks** for required fields
- **Consistency validation** across data sources
- **Freshness monitoring** for real-time data
- **Anomaly detection** for unexpected values

## 📊 Validation Types

### Schema Validation

| Check | Description |
|-------|-------------|
| Type validation | Correct data types |
| Required fields | All mandatory fields present |
| Format validation | Proper formatting (dates, IDs) |
| Range validation | Values within acceptable ranges |

### Data Quality Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Completeness | (non-null values / total) × 100 | > 95% |
| Accuracy | (valid values / total) × 100 | > 99% |
| Consistency | (matching records / total) × 100 | > 98% |
| Timeliness | Age of latest record | < 5 min |

## 🔧 Architecture

```text
┌─────────────────────────────────────────────┐
│        Data Quality Validator Agent         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ Schema  │  │Complete-│  │ Consistency │ │
│  │Validator│  │ ness    │  │  Checker    │ │
│  └────┬────┘  └────┬────┘  └──────┬──────┘ │
│       │            │              │         │
│       └────────────┼──────────────┘         │
│                    ▼                        │
│           ┌───────────────┐                 │
│           │ Quality Score │                 │
│           │   Calculator  │                 │
│           └───────┬───────┘                 │
│                   │                         │
│       ┌───────────┼───────────┐            │
│       ▼           ▼           ▼            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Report │ │  Alert  │ │ Metrics │       │
│  │Generator│ │ Trigger │ │ Export  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

## 🚀 Usage

### Basic Validation

```python
from src.agents.monitoring.data_quality_validator_agent import DataQualityValidatorAgent

validator = DataQualityValidatorAgent()

# Validate entity
result = validator.validate_entity(camera_entity)
if result.is_valid:
    print("Entity is valid")
else:
    print(f"Validation errors: {result.errors}")
```

### Batch Validation

```python
# Validate multiple entities
entities = load_entities()
results = validator.validate_batch(entities)

print(f"Valid: {results.valid_count}")
print(f"Invalid: {results.invalid_count}")
print(f"Quality Score: {results.quality_score}%")
```

### Schema Definition

```python
from src.validation import Schema, Field

camera_schema = Schema(
    name="Camera",
    fields=[
        Field("id", type="string", required=True, pattern=r"^CAM_\d+$"),
        Field("name", type="string", required=True, max_length=100),
        Field("location", type="object", required=True),
        Field("status", type="string", enum=["active", "inactive", "maintenance"]),
        Field("lastObservation", type="datetime", max_age_minutes=10)
    ]
)

validator.register_schema("Camera", camera_schema)
```

## ⚙️ Configuration

```yaml
# config/data_quality_config.yaml
data_quality:
  enabled: true
  
  # Validation rules
  schemas:
    Camera:
      required_fields:
        - id
        - name
        - location
        - status
      field_types:
        id: string
        name: string
        location: object
        status: string
      patterns:
        id: "^CAM_\\d+$"
      enums:
        status: ["active", "inactive", "maintenance"]
    
    Observation:
      required_fields:
        - id
        - observedAt
        - vehicleCount
        - avgSpeed
      field_types:
        vehicleCount: integer
        avgSpeed: number
      ranges:
        vehicleCount:
          min: 0
          max: 1000
        avgSpeed:
          min: 0
          max: 200
  
  # Quality thresholds
  thresholds:
    completeness_warning: 95
    completeness_critical: 90
    freshness_warning_minutes: 5
    freshness_critical_minutes: 15
  
  # Alerting
  alerts:
    enabled: true
    on_quality_drop: true
    on_schema_violation: true
```

## 📈 Quality Reports

### Generate Report

```python
# Generate quality report
report = validator.generate_report(
    time_range="24h",
    entity_types=["Camera", "Observation", "Accident"]
)

print(f"Overall Quality Score: {report.overall_score}%")
for entity_type, score in report.by_entity_type.items():
    print(f"  {entity_type}: {score}%")
```

### Report Format

```json
{
  "timestamp": "2025-11-29T10:00:00Z",
  "overall_quality_score": 97.5,
  "metrics": {
    "completeness": 98.2,
    "accuracy": 99.1,
    "consistency": 96.5,
    "timeliness": 95.8
  },
  "by_entity_type": {
    "Camera": {
      "score": 99.0,
      "records_validated": 150,
      "errors": 2
    },
    "Observation": {
      "score": 96.5,
      "records_validated": 45000,
      "errors": 1580
    }
  },
  "issues": [
    {
      "type": "missing_field",
      "entity": "CAM_045",
      "field": "lastObservation",
      "severity": "warning"
    }
  ]
}
```

## 🛡️ Error Handling

```python
# Handle validation errors
for entity in entities:
    result = validator.validate_entity(entity)
    
    if not result.is_valid:
        for error in result.errors:
            if error.severity == "critical":
                logger.error(f"Critical: {error.message}")
                quarantine_entity(entity)
            elif error.severity == "warning":
                logger.warning(f"Warning: {error.message}")
                flag_for_review(entity)
```

## 📖 Related Documentation

- [Health Check Agent](health-check) - System health monitoring
- [Performance Monitor](performance-monitor) - Performance metrics
- [Entity Publisher](../context-management/entity-publisher) - Entity validation

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
