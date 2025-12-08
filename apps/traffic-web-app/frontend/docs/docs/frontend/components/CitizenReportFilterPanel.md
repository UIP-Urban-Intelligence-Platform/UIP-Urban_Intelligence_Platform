---
sidebar_label: 'CitizenReportFilterPanel'
title: 'CitizenReportFilterPanel'
sidebar_position: 9
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/CitizenReportFilterPanel.md
Module: Traffic Web App - CitizenReportFilterPanel Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  CitizenReportFilterPanel component documentation for filtering reports.
============================================================================
-->

# CitizenReportFilterPanel

A filter panel component for filtering citizen reports by various criteria.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/CitizenReportFilterPanel.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Filter citizen reports by type, status, date
- Search reports by keyword
- Sort reports by various fields
- Apply geographic filters

## 🚀 Usage

```tsx
import { CitizenReportFilterPanel } from '@/components/CitizenReportFilterPanel';

function ReportsPage() {
  const [filters, setFilters] = useState({});

  return (
    <CitizenReportFilterPanel
      filters={filters}
      onFilterChange={setFilters}
      onReset={() => setFilters({})}
    />
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filters` | `ReportFilters` | Yes | - | Current filter state |
| `onFilterChange` | `(filters: ReportFilters) => void` | Yes | - | Filter change handler |
| `onReset` | `() => void` | No | - | Reset filters handler |
| `collapsed` | `boolean` | No | `false` | Panel collapsed state |

## 🔧 Filter Options

| Filter | Type | Options |
|--------|------|---------|
| Report Type | Multi-select | Accident, Congestion, Hazard, etc. |
| Status | Multi-select | Pending, Verified, Resolved |
| Date Range | Date picker | Start/End dates |
| Severity | Single-select | All, Critical, High, Medium, Low |

## 📖 Related Components

- [CitizenReportForm](CitizenReportForm) - Submit reports
- [CitizenReportMap](CitizenReportMap) - Map view
- [CitizenReportMarkers](CitizenReportMarkers) - Map markers

---

See the [complete components reference](../complete-components-reference) for all available components.
