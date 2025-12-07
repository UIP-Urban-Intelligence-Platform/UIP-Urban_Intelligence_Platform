---
sidebar_position: 14
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
CorrelationPanel Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/CorrelationPanel.md
Author: UIP Team
Version: 1.0.0
-->

# CorrelationPanel

A panel component displaying correlation analysis between traffic events.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/CorrelationPanel.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display correlation analysis results
- Show relationships between events
- Provide filtering options
- Enable correlation exploration

## 🚀 Usage

```tsx
import { CorrelationPanel } from '@/components/CorrelationPanel';

function AnalyticsPage() {
  return (
    <CorrelationPanel
      correlations={correlationList}
      onCorrelationSelect={handleSelect}
      expanded={isPanelOpen}
    />
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `correlations` | `Correlation[]` | Yes | - | Correlation data |
| `onCorrelationSelect` | `(c: Correlation) => void` | No | - | Selection handler |
| `expanded` | `boolean` | No | `true` | Panel state |
| `onToggle` | `() => void` | No | - | Toggle handler |

## 📊 Panel Sections

1. **Summary** - Total correlations, types breakdown
2. **List** - Sortable list of correlations
3. **Details** - Selected correlation info
4. **Actions** - Export, filter options

## 📖 Related Components

- [CorrelationLines](CorrelationLines) - Map visualization
- [AnalyticsDashboard](AnalyticsDashboard) - Analytics view

---

See the [complete components reference](../complete-components-reference) for all available components.
