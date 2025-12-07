---
sidebar_position: 29
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: frontend/components/VehicleHeatmap.md
Module: Frontend Components - VehicleHeatmap
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  VehicleHeatmap component documentation - heatmap layer component
  visualizing vehicle density across the map.
============================================================================
-->

# VehicleHeatmap

A heatmap layer component visualizing vehicle density across the map.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/VehicleHeatmap.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Visualize vehicle density
- Show traffic hotspots
- Real-time density updates
- Historical density comparison

## 🚀 Usage

```tsx
import { VehicleHeatmap } from '@/components/VehicleHeatmap';

function MapComponent() {
  return (
    <MapContainer>
      <VehicleHeatmap
        data={vehicleData}
        visible={showHeatmap}
        radius={30}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `VehicleData[]` | Yes | - | Vehicle counts |
| `visible` | `boolean` | No | `true` | Show/hide layer |
| `radius` | `number` | No | `25` | Heatmap radius |
| `blur` | `number` | No | `15` | Blur amount |
| `maxIntensity` | `number` | No | - | Max intensity |
| `gradient` | `ColorGradient` | No | Default | Color gradient |

## 🎨 Default Gradient

| Intensity | Color |
|-----------|-------|
| 0.0 | Blue |
| 0.4 | Cyan |
| 0.6 | Green |
| 0.7 | Yellow |
| 0.8 | Orange |
| 1.0 | Red |

## 📖 Related Components

- [SpeedZones](SpeedZones) - Speed display
- [PatternZones](PatternZones) - Patterns
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
