---
sidebar_position: 21
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/PatternZones.md
Module: Traffic Web App - PatternZones Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  PatternZones component documentation for traffic pattern visualization.
============================================================================
-->

# PatternZones

A map layer component for visualizing detected traffic patterns as zones.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/PatternZones.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display detected traffic patterns
- Show recurring congestion zones
- Visualize peak hour patterns
- Highlight anomaly areas

## 🚀 Usage

```tsx
import { PatternZones } from '@/components/PatternZones';

function MapComponent() {
  return (
    <MapContainer>
      <PatternZones
        patterns={patternData}
        visible={showPatterns}
        onPatternClick={handlePatternClick}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `patterns` | `Pattern[]` | Yes | - | Pattern data |
| `visible` | `boolean` | No | `true` | Layer visibility |
| `onPatternClick` | `(p: Pattern) => void` | No | - | Click handler |
| `opacity` | `number` | No | `0.4` | Zone opacity |
| `showLabels` | `boolean` | No | `true` | Show zone labels |

## 🎨 Pattern Types

| Pattern | Color | Description |
|---------|-------|-------------|
| Peak Hour | 🔴 Red | Rush hour congestion |
| Recurring | 🟠 Orange | Daily patterns |
| Weekend | 🟣 Purple | Weekend patterns |
| Anomaly | 🟡 Yellow | Unusual patterns |

## 📖 Related Components

- [SpeedZones](SpeedZones) - Speed visualization
- [AnalyticsDashboard](AnalyticsDashboard) - Analytics
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
