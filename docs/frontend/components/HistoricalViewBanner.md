---
sidebar_position: 17
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
HistoricalViewBanner Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/HistoricalViewBanner.md
Author: UIP Team
Version: 1.0.0
-->

# HistoricalViewBanner

A banner component indicating that the user is viewing historical data.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/HistoricalViewBanner.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Indicate historical data viewing mode
- Display selected time period
- Provide quick exit to live view
- Show data staleness warning

## 🚀 Usage

```tsx
import { HistoricalViewBanner } from '@/components/HistoricalViewBanner';

function Dashboard() {
  return (
    <>
      {isHistoricalView && (
        <HistoricalViewBanner
          timestamp={selectedTime}
          onExitHistorical={handleExitHistorical}
        />
      )}
      <TrafficMap />
    </>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `timestamp` | `Date` | Yes | - | Historical timestamp |
| `onExitHistorical` | `() => void` | Yes | - | Exit handler |
| `showDiff` | `boolean` | No | `true` | Show time difference |

## 🎨 Banner Styles

- **Background**: Semi-transparent amber
- **Icon**: Clock/history icon
- **Text**: "Viewing data from [date/time]"
- **Button**: "Return to Live View"

## 📖 Related Components

- [TimeMachine](TimeMachine) - Time navigation
- [TrafficMap](TrafficMap) - Map display

---

See the [complete components reference](../complete-components-reference) for all available components.
