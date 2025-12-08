---
sidebar_label: 'SimpleLegend'
title: 'SimpleLegend'
sidebar_position: 26
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/SimpleLegend.md
Module: Traffic Web App - SimpleLegend Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  SimpleLegend component documentation for simple legend display.
============================================================================
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
