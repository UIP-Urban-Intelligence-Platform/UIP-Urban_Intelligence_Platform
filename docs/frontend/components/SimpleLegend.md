---
sidebar_position: 26
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
SimpleLegend Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/SimpleLegend.md
Author: UIP Team
Version: 1.0.0
-->

# SimpleLegend

A simplified legend component for basic map symbology.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/SimpleLegend.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display simple map legend
- Minimal footprint design
- Quick reference for colors
- Non-interactive display

## 🚀 Usage

```tsx
import { SimpleLegend } from '@/components/SimpleLegend';

function MapComponent() {
  return (
    <MapContainer>
      <SimpleLegend
        items={legendItems}
        position="bottomleft"
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `LegendItem[]` | Yes | - | Legend items |
| `position` | `MapPosition` | No | `'bottomleft'` | Position |
| `title` | `string` | No | - | Legend title |

## 🔧 Legend Item

```typescript
interface LegendItem {
  label: string;
  color: string;
  shape?: 'circle' | 'square' | 'line';
}
```

## 📖 Related Components

- [MapLegend](MapLegend) - Full legend
- [TrafficMap](TrafficMap) - Map container

---

See the [complete components reference](../complete-components-reference) for all available components.
