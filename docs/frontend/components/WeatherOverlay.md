---
sidebar_position: 30
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
WeatherOverlay Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/WeatherOverlay.md
Author: UIP Team
Version: 1.0.0
-->

# WeatherOverlay

A map overlay component displaying current weather conditions.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/WeatherOverlay.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display weather conditions on map
- Show rain, cloud, temperature layers
- Weather impact on traffic
- Real-time weather updates

## 🚀 Usage

```tsx
import { WeatherOverlay } from '@/components/WeatherOverlay';

function MapComponent() {
  return (
    <MapContainer>
      <WeatherOverlay
        data={weatherData}
        layers={['rain', 'clouds']}
        visible={showWeather}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `WeatherData` | Yes | - | Weather data |
| `layers` | `WeatherLayer[]` | No | `['rain']` | Active layers |
| `visible` | `boolean` | No | `true` | Show/hide overlay |
| `opacity` | `number` | No | `0.6` | Layer opacity |

## 🌦️ Weather Layers

| Layer | Display | Data Source |
|-------|---------|-------------|
| `rain` | Precipitation | OpenWeatherMap |
| `clouds` | Cloud coverage | OpenWeatherMap |
| `temp` | Temperature | OpenWeatherMap |
| `wind` | Wind vectors | OpenWeatherMap |

## 📖 Related Components

- [AQIHeatmap](AQIHeatmap) - Air quality
- [HumidityVisibilityLayer](HumidityVisibilityLayer) - Visibility
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
