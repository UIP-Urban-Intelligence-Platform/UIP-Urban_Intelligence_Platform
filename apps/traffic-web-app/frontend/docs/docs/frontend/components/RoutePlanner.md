---
sidebar_label: 'RoutePlanner'
title: 'RoutePlanner'
sidebar_position: 23
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/RoutePlanner.md
Module: Traffic Web App - RoutePlanner Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  RoutePlanner component documentation for route planning features.
============================================================================
-->

# RoutePlanner

An interactive route planning component with traffic-aware suggestions.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/RoutePlanner.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Plan routes between locations
- Consider real-time traffic conditions
- Provide alternative routes
- Estimate travel times

## 🚀 Usage

```tsx
import { RoutePlanner } from '@/components/RoutePlanner';

function NavigationPage() {
  return (
    <RoutePlanner
      onRouteSelect={handleRouteSelect}
      trafficData={liveTrafficData}
    />
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onRouteSelect` | `(route: Route) => void` | Yes | - | Selection handler |
| `trafficData` | `TrafficData` | No | - | Live traffic data |
| `origin` | `LatLng` | No | - | Start location |
| `destination` | `LatLng` | No | - | End location |
| `showAlternatives` | `boolean` | No | `true` | Show alt routes |

## 📊 Route Information

| Field | Description |
|-------|-------------|
| Distance | Total route distance |
| Duration | Estimated travel time |
| Traffic Delay | Current delay |
| Incidents | Number of incidents |

## 📖 Related Components

- [RouteVisualization](RouteVisualization) - Route display
- [TrafficMap](TrafficMap) - Map container
- [SpeedZones](SpeedZones) - Traffic speed

---

See the [complete components reference](../complete-components-reference) for all available components.
