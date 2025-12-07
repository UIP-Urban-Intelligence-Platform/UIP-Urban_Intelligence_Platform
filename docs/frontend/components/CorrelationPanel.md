---
sidebar_position: 14
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: frontend/components/CorrelationPanel.md
Module: Frontend Components - CorrelationPanel
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  CorrelationPanel component documentation - panel component displaying
  correlation analysis between traffic events.
============================================================================
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
