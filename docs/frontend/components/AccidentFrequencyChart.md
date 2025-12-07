---
sidebar_position: 4
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: frontend/components/AccidentFrequencyChart.md
Module: Frontend Components - AccidentFrequencyChart
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  AccidentFrequencyChart component documentation - displays accident
  frequency data over time using charts.
============================================================================
-->

# AccidentFrequencyChart

A visualization component that displays accident frequency data over time using charts.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/AccidentFrequencyChart.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display accident frequency trends over time
- Visualize accident patterns by hour, day, or week
- Support filtering by zone or severity
- Interactive chart with tooltips and legends

## 🚀 Usage

```tsx
import { AccidentFrequencyChart } from '@/components/AccidentFrequencyChart';

function MyComponent() {
  return (
    <AccidentFrequencyChart
      data={accidentData}
      timeRange="7d"
      groupBy="hour"
    />
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `AccidentData[]` | Yes | - | Accident data array |
| `timeRange` | `'24h' \| '7d' \| '30d'` | No | `'7d'` | Time range to display |
| `groupBy` | `'hour' \| 'day' \| 'week'` | No | `'day'` | Data grouping |
| `height` | `number` | No | `300` | Chart height in pixels |

## 📖 Related Components

- [AnalyticsDashboard](AnalyticsDashboard) - Parent dashboard
- [PatternZones](PatternZones) - Pattern visualization

---

See the [complete components reference](../complete-components-reference) for all available components.
