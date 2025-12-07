---
sidebar_position: 5
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: agents/rdf-linked-data/smart-data-models-validation.md
Module: RDF Linked Data - Smart Data Models Validation Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Smart Data Models Validation Agent documentation for validating entities
  against FIWARE Smart Data Models schemas.
============================================================================
-->

# Smart Data Models Validation Agent

The Smart Data Models Validation Agent validates entities against FIWARE Smart Data Models schemas.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.rdf_linked_data.smart_data_models_validation_agent` |
| **Class** | `SmartDataModelsValidationAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Validate against Smart Data Models** schemas
- **Ensure NGSI-LD compliance** with FIWARE standards
- **Check required properties** and data types
- **Generate validation reports** with detailed errors

## 📊 Supported Models

| Domain | Model | Schema |
|--------|-------|--------|
| Transportation | `TrafficFlowObserved` | FIWARE Transportation |
| Smart Cities | `Device` | FIWARE Device |
| Weather | `WeatherObserved` | FIWARE Weather |
| Air Quality | `AirQualityObserved` | FIWARE Environment |

## 🚀 Usage

### Validate Entity

```python
from src.agents.rdf_linked_data.smart_data_models_validation_agent import SmartDataModelsValidationAgent

agent = SmartDataModelsValidationAgent()

entity = {
    "id": "urn:ngsi-ld:TrafficFlowObserved:TFO_001",
    "type": "TrafficFlowObserved",
    "laneId": {"type": "Property", "value": 1},
    "intensity": {"type": "Property", "value": 250},
    "location": {
        "type": "GeoProperty",
        "value": {"type": "Point", "coordinates": [106.6297, 10.8231]}
    }
}

# Validate against schema
result = await agent.validate(entity)
print(f"Valid: {result['valid']}")
print(f"Errors: {result['errors']}")
```

### Batch Validation

```python
# Validate multiple entities
entities = [entity1, entity2, entity3]
results = await agent.validate_batch(entities)

# Summary
valid_count = sum(1 for r in results if r['valid'])
print(f"Valid: {valid_count}/{len(entities)}")
```

### Get Schema Info

```python
# Get schema for entity type
schema = await agent.get_schema("TrafficFlowObserved")
print(f"Required: {schema['required']}")
print(f"Properties: {list(schema['properties'].keys())}")
```

## ⚙️ Configuration

```yaml
# config/validation.yaml
smart_data_models_validation:
  enabled: true
  
  # Schema source
  schemas:
    source: "https://smart-data-models.github.io"
    cache_enabled: true
    cache_ttl_hours: 24
  
  # Validation settings
  validation:
    strict_mode: true
    check_required: true
    check_types: true
    allow_additional_properties: true
  
  # Reporting
  reporting:
    include_warnings: true
    max_errors_per_entity: 10
```

## 📋 Validation Result

```json
{
  "entity_id": "urn:ngsi-ld:TrafficFlowObserved:TFO_001",
  "entity_type": "TrafficFlowObserved",
  "valid": false,
  "errors": [
    {
      "path": "$.dateObserved",
      "message": "Required property 'dateObserved' is missing",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "path": "$.description",
      "message": "Recommended property 'description' is missing",
      "severity": "warning"
    }
  ]
}
```

## 📖 Related Documentation

- [NGSI-LD Transformer](../transformation/ngsi-ld-transformer) - Entity transformation
- [Data Quality Validator](../monitoring/data-quality-validator) - Quality checks
- [NGSI-LD to RDF](ngsi-ld-to-rdf) - RDF conversion

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
