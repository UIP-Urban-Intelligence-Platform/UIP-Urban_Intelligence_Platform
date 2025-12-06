---
sidebar_position: 13
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
CorrelationLines Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/CorrelationLines.md
Author: UIP Team
Version: 1.0.0
-->

# CorrelationLines

A map overlay component that draws lines between correlated events or entities.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/CorrelationLines.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Visualize relationships between entities
- Show correlation between accidents and congestion
- Display camera coverage areas
- Indicate data flow between sources

## 🚀 Usage

```tsx
import { CorrelationLines } from '@/components/CorrelationLines';

function MapComponent() {
  return (
    <MapContainer>
      <CorrelationLines
        correlations={correlationData}
        visible={showCorrelations}
      />
    </MapContainer>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `correlations` | `Correlation[]` | Yes | - | Correlation data |
| `visible` | `boolean` | No | `true` | Show/hide lines |
| `color` | `string` | No | `'#ff7800'` | Line color |
| `weight` | `number` | No | `2` | Line thickness |
| `opacity` | `number` | No | `0.7` | Line opacity |
| `animated` | `boolean` | No | `false` | Animate lines |

## 🔧 Correlation Object

```typescript
interface Correlation {
  id: string;
  from: LatLng;
  to: LatLng;
  type: 'accident-congestion' | 'camera-event' | 'custom';
  strength: number;  // 0-1
}
```

## 📖 Related Components

- [CorrelationPanel](CorrelationPanel) - Correlation details
- [TrafficMap](TrafficMap) - Map container
- [AccidentMarkers](AccidentMarkers) - Accident display

---

See the [complete components reference](../complete-components-reference) for all available components.
