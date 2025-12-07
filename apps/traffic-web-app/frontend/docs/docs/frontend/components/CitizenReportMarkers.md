---
sidebar_position: 11
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
CitizenReportMarkers Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/CitizenReportMarkers.md
Author: UIP Team
Version: 1.0.0
-->

# CitizenReportMarkers

Map markers component for rendering citizen report locations with type-specific icons.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/CitizenReportMarkers.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Render report markers on map
- Type-specific icons and colors
- Status indicators (pending, verified, resolved)
- Interactive popups with report details

## 🚀 Usage

```tsx
import { CitizenReportMarkers } from '@/components/CitizenReportMarkers';

function MapComponent() {
  return (
    <MapContainer>
      <CitizenReportMarkers
        reports={reportList}
        onMarkerClick={handleClick}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `reports` | `CitizenReport[]` | Yes | - | Report data |
| `onMarkerClick` | `(report: CitizenReport) => void` | No | - | Click handler |
| `showPopups` | `boolean` | No | `true` | Enable popups |
| `filterStatus` | `string[]` | No | - | Filter by status |

## 🎨 Report Type Icons

| Type | Icon | Color |
|------|------|-------|
| Accident | 🚗 | Red |
| Congestion | 🚦 | Orange |
| Hazard | ⚠️ | Yellow |
| Roadwork | 🚧 | Blue |
| Flooding | 💧 | Cyan |
| Other | 📍 | Gray |

## 📖 Related Components

- [CitizenReportMap](CitizenReportMap) - Parent map
- [AccidentMarkers](AccidentMarkers) - Accident markers

---

See the [complete components reference](../complete-components-reference) for all available components.
