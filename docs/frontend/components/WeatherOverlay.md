---
sidebar_position: 30
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: frontend/components/WeatherOverlay.md
Module: Frontend Components - WeatherOverlay
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  WeatherOverlay component documentation - map overlay component
  displaying current weather conditions.
============================================================================
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
