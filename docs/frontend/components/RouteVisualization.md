---
sidebar_position: 24
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
RouteVisualization Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/RouteVisualization.md
Author: UIP Team
Version: 1.0.0
-->

# RouteVisualization

A map layer component for displaying planned routes with traffic conditions.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/RouteVisualization.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Render route polylines on map
- Show traffic conditions along route
- Highlight incidents on route
- Display turn-by-turn points

## 🚀 Usage

```tsx
import { RouteVisualization } from '@/components/RouteVisualization';

function MapComponent() {
  return (
    <MapContainer>
      <RouteVisualization
        route={selectedRoute}
        showTraffic={true}
        showIncidents={true}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `route` | `Route` | Yes | - | Route to display |
| `showTraffic` | `boolean` | No | `true` | Color by traffic |
| `showIncidents` | `boolean` | No | `true` | Show incidents |
| `color` | `string` | No | `'#3388ff'` | Route color |
| `alternativeRoutes` | `Route[]` | No | `[]` | Alt routes |

## 🎨 Traffic Coloring

| Speed | Color |
|-------|-------|
| Free flow (>50 km/h) | 🟢 Green |
| Moderate (30-50 km/h) | 🟡 Yellow |
| Slow (15-30 km/h) | 🟠 Orange |
| Congested (<15 km/h) | 🔴 Red |

## 📖 Related Components

- [RoutePlanner](RoutePlanner) - Route planning
- [SpeedZones](SpeedZones) - Speed visualization
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
