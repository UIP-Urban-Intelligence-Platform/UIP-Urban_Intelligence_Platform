---
sidebar_label: 'PollutantCircles'
title: 'PollutantCircles'
sidebar_position: 22
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/PollutantCircles.md
Module: Traffic Web App - PollutantCircles Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  PollutantCircles component documentation for pollution visualization.
============================================================================
-->

# PollutantCircles

A map component displaying pollutant concentration levels as circular markers.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/PollutantCircles.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display pollutant levels at monitoring stations
- Color-coded severity indicators
- Show specific pollutant concentrations
- Interactive popups with details

## 🚀 Usage

```tsx
import { PollutantCircles } from '@/components/PollutantCircles';

function MapComponent() {
  return (
    <MapContainer>
      <PollutantCircles
        data={pollutantData}
        pollutant="PM2.5"
        visible={showPollutants}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `PollutantData[]` | Yes | - | Pollutant readings |
| `pollutant` | `'PM2.5' \| 'PM10' \| 'NO2' \| 'O3'` | No | `'PM2.5'` | Pollutant type |
| `visible` | `boolean` | No | `true` | Show/hide circles |
| `radius` | `number` | No | `500` | Circle radius (m) |

## 🎨 Concentration Levels

| Level | Color | PM2.5 (µg/m³) |
|-------|-------|---------------|
| Good | 🟢 Green | 0-12 |
| Moderate | 🟡 Yellow | 12-35 |
| Unhealthy Sensitive | 🟠 Orange | 35-55 |
| Unhealthy | 🔴 Red | 55-150 |
| Very Unhealthy | 🟣 Purple | 150-250 |
| Hazardous | 🟤 Maroon | 250+ |

## 📖 Related Components

- [AQIHeatmap](AQIHeatmap) - AQI heatmap
- [WeatherOverlay](WeatherOverlay) - Weather layer
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
