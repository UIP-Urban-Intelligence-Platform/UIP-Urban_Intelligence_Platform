---
sidebar_position: 19
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
MapLegend Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/MapLegend.md
Author: UIP Team
Version: 1.0.0
-->

# MapLegend

A legend component explaining map symbols, colors, and layers.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/MapLegend.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Explain map symbols and colors
- Show active layer legends
- Provide scale information
- Interactive layer toggling

## 🚀 Usage

```tsx
import { MapLegend } from '@/components/MapLegend';

function MapComponent() {
  return (
    <MapContainer>
      <MapLegend
        layers={activeLayers}
        position="bottomright"
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `layers` | `LegendItem[]` | Yes | - | Legend items |
| `position` | `MapPosition` | No | `'bottomright'` | Legend position |
| `collapsed` | `boolean` | No | `false` | Collapsed state |
| `onLayerToggle` | `(layer: string) => void` | No | - | Toggle handler |

## 🎨 Legend Items

| Category | Items |
|----------|-------|
| Cameras | Active, Offline, Maintenance |
| Traffic | Free flow, Slow, Congested |
| Incidents | Accident, Hazard, Roadwork |
| Weather | Rain, Fog, Clear |

## 📖 Related Components

- [SimpleLegend](SimpleLegend) - Simplified legend
- [TrafficMap](TrafficMap) - Map container
- [FilterPanel](FilterPanel) - Layer controls

---

See the [complete components reference](../complete-components-reference) for all available components.
