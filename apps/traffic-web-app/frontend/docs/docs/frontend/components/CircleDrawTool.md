---
sidebar_position: 8
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/CircleDrawTool.md
Module: Traffic Web App - CircleDrawTool Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  CircleDrawTool component documentation for map drawing tools.
============================================================================
-->

# CircleDrawTool

An interactive map tool for drawing circular areas to define zones or filters.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/CircleDrawTool.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Draw circular zones on the map
- Define geographic filters
- Select cameras within radius
- Create alert zones

## 🚀 Usage

```tsx
import { CircleDrawTool } from '@/components/CircleDrawTool';

function MapComponent() {
  const handleCircleComplete = (circle) => {
    console.log('Circle:', circle.center, circle.radius);
  };

  return (
    <MapContainer>
      <CircleDrawTool
        active={isDrawing}
        onComplete={handleCircleComplete}
        color="#3388ff"
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `active` | `boolean` | No | `false` | Enable drawing mode |
| `onComplete` | `(circle: Circle) => void` | Yes | - | Callback when done |
| `color` | `string` | No | `'#3388ff'` | Circle color |
| `fillOpacity` | `number` | No | `0.2` | Fill opacity |
| `minRadius` | `number` | No | `100` | Minimum radius (meters) |
| `maxRadius` | `number` | No | `10000` | Maximum radius (meters) |

## 🔧 Circle Object

```typescript
interface Circle {
  center: LatLng;
  radius: number;  // in meters
}
```

## 📖 Related Components

- [TrafficMap](TrafficMap) - Map container
- [FilterPanel](FilterPanel) - Filter controls

---

See the [complete components reference](../complete-components-reference) for all available components.
