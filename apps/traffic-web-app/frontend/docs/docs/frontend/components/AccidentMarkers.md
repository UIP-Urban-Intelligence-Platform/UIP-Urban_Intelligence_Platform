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
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/AccidentMarkers.md
Module: Traffic Web App - AccidentMarkers Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  AccidentMarkers component documentation for map marker visualization.
============================================================================
-->

# AccidentMarkers

Map markers component for displaying accident locations with severity indicators.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/AccidentMarkers.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display accident locations on the map
- Color-coded severity indicators (critical, high, medium, low)
- Clickable markers with popup details
- Real-time updates for new accidents

## 🚀 Usage

```tsx
import { AccidentMarkers } from '@/components/AccidentMarkers';

function MapComponent() {
  return (
    <MapContainer>
      <AccidentMarkers
        accidents={accidentList}
        onMarkerClick={handleAccidentClick}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `accidents` | `Accident[]` | Yes | - | List of accidents |
| `onMarkerClick` | `(accident: Accident) => void` | No | - | Click handler |
| `showPopup` | `boolean` | No | `true` | Show popup on click |
| `filterSeverity` | `string[]` | No | `[]` | Filter by severity |

## 🎨 Severity Colors

| Severity | Color | Icon |
|----------|-------|------|
| Critical | 🔴 Red | `AlertCircle` |
| High | 🟠 Orange | `AlertTriangle` |
| Medium | 🟡 Yellow | `Alert` |
| Low | 🟢 Green | `Info` |

## 📖 Related Components

- [TrafficMap](TrafficMap) - Parent map component
- [CitizenReportMarkers](CitizenReportMarkers) - Report markers

---

See the [complete components reference](../complete-components-reference) for all available components.
