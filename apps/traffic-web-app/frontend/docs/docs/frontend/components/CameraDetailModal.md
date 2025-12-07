---
sidebar_position: 7
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/CameraDetailModal.md
Module: Traffic Web App - CameraDetailModal Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  CameraDetailModal component documentation for camera detail view.
============================================================================
-->

# CameraDetailModal

A modal dialog component for displaying detailed camera information and live feed.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/CameraDetailModal.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display camera details in a modal overlay
- Show live camera feed or latest snapshot
- Display real-time traffic metrics
- Historical data and trends

## 🚀 Usage

```tsx
import { CameraDetailModal } from '@/components/CameraDetailModal';

function MapComponent() {
  const [selectedCamera, setSelectedCamera] = useState(null);

  return (
    <>
      <TrafficMap onCameraClick={setSelectedCamera} />
      {selectedCamera && (
        <CameraDetailModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `camera` | `Camera` | Yes | - | Camera data object |
| `onClose` | `() => void` | Yes | - | Close handler |
| `showLiveFeed` | `boolean` | No | `true` | Show live video |
| `showHistory` | `boolean` | No | `true` | Show historical data |

## 📊 Modal Sections

1. **Header** - Camera name, status, location
2. **Live Feed** - Real-time or latest image
3. **Metrics** - Vehicle count, speed, congestion
4. **History** - Trend charts and statistics

## 📖 Related Components

- [TrafficMap](TrafficMap) - Map with camera markers
- [AnalyticsDashboard](AnalyticsDashboard) - Analytics view

---

See the [complete components reference](../complete-components-reference) for all available components.
