---
sidebar_position: 10
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
CitizenReportMap Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/CitizenReportMap.md
Author: UIP Team
Version: 1.0.0
-->

# CitizenReportMap

A specialized map component for displaying and interacting with citizen reports.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/CitizenReportMap.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display citizen reports on interactive map
- Allow location selection for new reports
- Cluster markers for better visualization
- Filter and highlight reports

## 🚀 Usage

```tsx
import { CitizenReportMap } from '@/components/CitizenReportMap';

function ReportsPage() {
  return (
    <CitizenReportMap
      reports={reportList}
      onLocationSelect={handleLocationSelect}
      onReportClick={handleReportClick}
    />
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `reports` | `CitizenReport[]` | Yes | - | List of reports |
| `onLocationSelect` | `(latlng: LatLng) => void` | No | - | Location pick handler |
| `onReportClick` | `(report: CitizenReport) => void` | No | - | Report click handler |
| `selectionMode` | `boolean` | No | `false` | Enable location pick |
| `filters` | `ReportFilters` | No | - | Active filters |

## 🎨 Features

- **Clustering** - Groups nearby markers
- **Color coding** - By report type and status
- **Popup details** - Quick view of report info
- **Location picker** - Click to set report location

## 📖 Related Components

- [CitizenReportForm](CitizenReportForm) - Submit reports
- [CitizenReportMarkers](CitizenReportMarkers) - Marker rendering
- [CitizenReportFilterPanel](CitizenReportFilterPanel) - Filters

---

See the [complete components reference](../complete-components-reference) for all available components.
