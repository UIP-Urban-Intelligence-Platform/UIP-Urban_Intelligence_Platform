---
sidebar_label: 'Incident Report Generator'
title: 'Incident Report Generator Agent'
sidebar_position: 3
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Incident Report Generator Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/notification/incident-report-generator.md
Module: Notification Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Incident Report Generator Agent component.
============================================================================
-->

# Incident Report Generator Agent

The Incident Report Generator Agent creates detailed incident reports for documentation and analysis.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.notification.incident_report_generator_agent` |
| **Class** | `IncidentReportGeneratorAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Generate incident reports** in multiple formats
- **Aggregate related data** from multiple sources
- **Include visualizations** and maps
- **Support regulatory compliance** reporting

## 📊 Report Types

| Type | Description | Format |
|------|-------------|--------|
| `accident` | Detailed accident report | PDF, JSON |
| `congestion` | Congestion analysis | PDF, CSV |
| `daily_summary` | Daily operations | PDF, HTML |
| `monthly_analytics` | Monthly trends | PDF, XLSX |

## 🚀 Usage

### Generate Accident Report

```python
from src.agents.notification.incident_report_generator_agent import IncidentReportGeneratorAgent

generator = IncidentReportGeneratorAgent()

# Generate accident report
report = await generator.generate_accident_report(
    incident_id="ACC_001",
    include_images=True,
    include_map=True,
    format="pdf"
)
```

### Generate Summary Report

```python
# Generate daily summary
summary = await generator.generate_daily_summary(
    date="2025-11-29",
    zones=["district_1", "district_3"],
    format="html"
)
```

### Batch Reports

```python
# Generate reports for date range
reports = await generator.generate_batch(
    report_type="congestion",
    start_date="2025-11-20",
    end_date="2025-11-29",
    output_dir="reports/"
)
```

## ⚙️ Configuration

```yaml
# config/incident_report_config.yaml
incident_report_generator:
  enabled: true
  
  # Output settings
  output:
    default_format: "pdf"
    output_dir: "reports"
    include_branding: true
  
  # Content settings
  content:
    include_images: true
    include_maps: true
    include_raw_data: false
    max_images_per_report: 10
  
  # Templates
  templates:
    accident: "templates/reports/accident.html"
    congestion: "templates/reports/congestion.html"
    summary: "templates/reports/summary.html"
```

## 📄 Report Sections

### Accident Report Structure

1. **Executive Summary** - Key facts and outcomes
2. **Incident Details** - Time, location, severity
3. **Visual Evidence** - Camera images, maps
4. **Timeline** - Event sequence
5. **Response Actions** - Actions taken
6. **Recommendations** - Future prevention

## 📖 Related Documentation

- [Accident Detection](../analytics/accident-detection) - Detection source
- [Alert Dispatcher](alert-dispatcher) - Alert integration
- [Email Handler](email-notification-handler) - Report delivery

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
