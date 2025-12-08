---
sidebar_label: 'SpeedZones'
title: 'SpeedZones'
sidebar_position: 27
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/SpeedZones.md
Module: Traffic Web App - SpeedZones Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  SpeedZones component documentation for speed zone visualization.
============================================================================
-->

# SpeedZones

A map layer component for visualizing traffic speed zones.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/SpeedZones.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display real-time traffic speeds
- Color-coded road segments
- Show congestion levels
- Update in real-time

## 🚀 Usage

```tsx
import { SpeedZones } from '@/components/SpeedZones';

function MapComponent() {
  return (
    <MapContainer>
      <SpeedZones
        data={speedData}
        visible={showSpeedLayer}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `SpeedData[]` | Yes | - | Speed readings |
| `visible` | `boolean` | No | `true` | Layer visibility |
| `opacity` | `number` | No | `0.7` | Line opacity |
| `weight` | `number` | No | `5` | Line thickness |

## 🎨 Speed Colors

| Speed Range | Color | Level |
|-------------|-------|-------|
| > 50 km/h | 🟢 Green | Free flow |
| 30-50 km/h | 🟡 Yellow | Moderate |
| 15-30 km/h | 🟠 Orange | Slow |
| < 15 km/h | 🔴 Red | Congested |

## 📖 Related Components

- [VehicleHeatmap](VehicleHeatmap) - Vehicle density
- [PatternZones](PatternZones) - Patterns
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
