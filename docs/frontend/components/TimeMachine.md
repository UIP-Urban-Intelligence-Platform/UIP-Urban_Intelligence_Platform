---
sidebar_position: 28
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
TimeMachine Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/TimeMachine.md
Author: UIP Team
Version: 1.0.0
-->

# TimeMachine

An interactive time navigation component for viewing historical traffic data.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/TimeMachine.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Navigate to historical timestamps
- Playback traffic over time
- Compare different time periods
- Quick jump to common times

## 🚀 Usage

```tsx
import { TimeMachine } from '@/components/TimeMachine';

function Dashboard() {
  return (
    <TimeMachine
      currentTime={selectedTime}
      onChange={handleTimeChange}
      onPlayback={handlePlayback}
    />
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentTime` | `Date` | Yes | - | Selected time |
| `onChange` | `(time: Date) => void` | Yes | - | Time change handler |
| `onPlayback` | `(playing: boolean) => void` | No | - | Playback handler |
| `minTime` | `Date` | No | 7 days ago | Earliest time |
| `maxTime` | `Date` | No | Now | Latest time |
| `step` | `number` | No | `300` | Step in seconds |

## 🎛️ Controls

| Control | Function |
|---------|----------|
| Date Picker | Select specific date |
| Time Slider | Fine-tune time |
| Play/Pause | Playback control |
| Speed | Playback speed |
| Presets | Quick jumps |

## 📖 Related Components

- [HistoricalViewBanner](HistoricalViewBanner) - View indicator
- [TrafficMap](TrafficMap) - Map display
- [AnalyticsDashboard](AnalyticsDashboard) - Analytics

---

See the [complete components reference](../complete-components-reference) for all available components.
