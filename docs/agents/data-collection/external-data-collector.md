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
File: agents/data-collection/external-data-collector.md
Module: Data Collection - External Data Collector Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  External Data Collector Agent documentation for fetching data from
  external APIs and integrating it into the platform.
============================================================================
-->

# External Data Collector Agent

The External Data Collector Agent fetches data from external APIs and integrates it into the platform.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.data_collection.external_data_collector_agent` |
| **Class** | `ExternalDataCollectorAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Collect external data** from third-party APIs
- **Normalize data formats** to platform standards
- **Handle rate limiting** and API quotas
- **Cache responses** for efficiency

## 🌐 Supported Sources

| Source | Data Type | Update Frequency |
|--------|-----------|------------------|
| Weather APIs | Meteorological | 15 minutes |
| Air Quality | AQI readings | 30 minutes |
| Traffic APIs | Flow data | 5 minutes |
| Event Services | City events | 1 hour |

## 🚀 Usage

### Collect Weather Data

```python
from src.agents.data_collection.external_data_collector_agent import ExternalDataCollectorAgent

collector = ExternalDataCollectorAgent()

# Collect weather data
weather = await collector.collect(
    source="openweathermap",
    location={"lat": 10.8231, "lon": 106.6297},
    data_type="current"
)
```

### Collect Multiple Sources

```python
# Collect from multiple sources
data = await collector.collect_all([
    {"source": "openweathermap", "location": hcmc_coords},
    {"source": "airquality", "location": hcmc_coords},
    {"source": "events", "city": "Ho Chi Minh City"}
])
```

### Schedule Collection

```python
# Register scheduled collection
collector.schedule(
    source="openweathermap",
    interval_minutes=15,
    callback=process_weather_data
)
```

## ⚙️ Configuration

```yaml
# config/data_sources.yaml
external_data_collector:
  enabled: true
  
  sources:
    openweathermap:
      url: "https://api.openweathermap.org/data/2.5"
      api_key: "${OPENWEATHER_API_KEY}"
      rate_limit: 60  # requests per minute
    
    airquality:
      url: "https://api.waqi.info"
      api_key: "${AIRQUALITY_API_KEY}"
      rate_limit: 1000  # requests per day
  
  cache:
    enabled: true
    ttl_seconds: 300
```

## 📊 Data Transformation

### Weather to NGSI-LD

```python
# Transform weather to NGSI-LD format
ngsi_weather = collector.transform_to_ngsi_ld(
    weather_data,
    entity_type="WeatherObserved",
    entity_id="urn:ngsi-ld:WeatherObserved:HCMC_01"
)
```

## 📖 Related Documentation

- [Weather Integration](weather-integration) - Weather specifics
- [Air Quality](air-quality) - AQI integration
- [NGSI-LD Transformer](../transformation/ngsi-ld-transformer) - Data transformation

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
