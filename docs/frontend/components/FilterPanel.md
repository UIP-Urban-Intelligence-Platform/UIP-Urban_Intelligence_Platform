---
sidebar_position: 16
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
FilterPanel Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/FilterPanel.md
Author: UIP Team
Version: 1.0.0
-->

# FilterPanel

A configurable filter panel for filtering traffic data and map elements.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/FilterPanel.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Filter map elements by type
- Control layer visibility
- Set date/time ranges
- Apply severity filters

## 🚀 Usage

```tsx
import { FilterPanel } from '@/components/FilterPanel';

function Dashboard() {
  const [filters, setFilters] = useState(defaultFilters);

  return (
    <FilterPanel
      filters={filters}
      onChange={setFilters}
      layers={availableLayers}
    />
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filters` | `Filters` | Yes | - | Current filter state |
| `onChange` | `(filters: Filters) => void` | Yes | - | Change handler |
| `layers` | `Layer[]` | No | - | Available layers |
| `collapsed` | `boolean` | No | `false` | Panel state |
| `position` | `'left' \| 'right'` | No | `'left'` | Panel position |

## 🔧 Filter Types

| Filter | Type | Description |
|--------|------|-------------|
| Date Range | Date picker | Start/end dates |
| Time of Day | Time picker | Hour range |
| Layers | Checkboxes | Visible layers |
| Severity | Multi-select | Filter by severity |
| Camera Status | Toggle | Online/offline |

## 📖 Related Components

- [TrafficMap](TrafficMap) - Map container
- [Sidebar](Sidebar) - Navigation
- [MapLegend](MapLegend) - Legend display

---

See the [complete components reference](../complete-components-reference) for all available components.
