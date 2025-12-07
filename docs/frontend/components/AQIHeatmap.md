---
sidebar_position: 6
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
AQIHeatmap Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/AQIHeatmap.md
Author: UIP Team
Version: 1.0.0
-->

# AQIHeatmap

A heatmap visualization component for displaying Air Quality Index (AQI) data across the map.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/AQIHeatmap.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Visualize AQI levels across geographic areas
- Color-coded heatmap based on AQI values
- Real-time updates from air quality sensors
- Interactive legend with AQI scale

## 🚀 Usage

```tsx
import { AQIHeatmap } from '@/components/AQIHeatmap';

function MapComponent() {
  return (
    <MapContainer>
      <AQIHeatmap
        data={aqiData}
        opacity={0.6}
        radius={25}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `AQIData[]` | Yes | - | AQI data points |
| `opacity` | `number` | No | `0.6` | Heatmap opacity (0-1) |
| `radius` | `number` | No | `25` | Heatmap point radius |
| `blur` | `number` | No | `15` | Blur radius |
| `visible` | `boolean` | No | `true` | Show/hide heatmap |

## 🎨 AQI Color Scale

| AQI Range | Level | Color |
|-----------|-------|-------|
| 0-50 | Good | 🟢 Green |
| 51-100 | Moderate | 🟡 Yellow |
| 101-150 | Unhealthy for Sensitive | 🟠 Orange |
| 151-200 | Unhealthy | 🔴 Red |
| 201-300 | Very Unhealthy | 🟣 Purple |
| 300+ | Hazardous | 🟤 Maroon |

## 📖 Related Components

- [TrafficMap](TrafficMap) - Parent map component
- [WeatherOverlay](WeatherOverlay) - Weather layer
- [PollutantCircles](PollutantCircles) - Pollutant visualization

---

See the [complete components reference](../complete-components-reference) for all available components.
