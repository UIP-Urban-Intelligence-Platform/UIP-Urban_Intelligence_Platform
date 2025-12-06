---
sidebar_position: 18
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
HumidityVisibilityLayer Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/HumidityVisibilityLayer.md
Author: UIP Team
Version: 1.0.0
-->

# HumidityVisibilityLayer

A map layer component visualizing humidity and visibility conditions.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/HumidityVisibilityLayer.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display humidity levels on map
- Visualize visibility conditions
- Show fog/mist affected areas
- Weather impact on traffic

## 🚀 Usage

```tsx
import { HumidityVisibilityLayer } from '@/components/HumidityVisibilityLayer';

function MapComponent() {
  return (
    <MapContainer>
      <HumidityVisibilityLayer
        data={weatherData}
        visible={showWeatherLayer}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `WeatherData[]` | Yes | - | Weather data points |
| `visible` | `boolean` | No | `true` | Layer visibility |
| `opacity` | `number` | No | `0.5` | Layer opacity |
| `showHumidity` | `boolean` | No | `true` | Show humidity |
| `showVisibility` | `boolean` | No | `true` | Show visibility |

## 🎨 Visualization

| Condition | Display |
|-----------|---------|
| Low Visibility (<1km) | 🌫️ Dense fog overlay |
| Medium Visibility (1-5km) | ⛅ Light mist |
| High Humidity (>80%) | 💧 Blue tint |

## 📖 Related Components

- [WeatherOverlay](WeatherOverlay) - Weather display
- [AQIHeatmap](AQIHeatmap) - Air quality
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
