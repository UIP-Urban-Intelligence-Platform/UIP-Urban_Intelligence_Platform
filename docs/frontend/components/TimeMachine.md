---
sidebar_position: 28
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: frontend/components/TimeMachine.md
Module: Frontend Components - TimeMachine
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  TimeMachine component documentation - interactive time navigation
  component for viewing historical traffic data.
============================================================================
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
