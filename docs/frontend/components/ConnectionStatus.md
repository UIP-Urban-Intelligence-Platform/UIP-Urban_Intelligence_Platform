---
sidebar_position: 12
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
ConnectionStatus Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/ConnectionStatus.md
Author: UIP Team
Version: 1.0.0
-->

# ConnectionStatus

A status indicator component showing real-time connection status to backend services.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/ConnectionStatus.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Display WebSocket connection status
- Show API connectivity state
- Indicate data freshness
- Auto-reconnection feedback

## 🚀 Usage

```tsx
import { ConnectionStatus } from '@/components/ConnectionStatus';

function Header() {
  return (
    <header>
      <ConnectionStatus />
    </header>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `showLabel` | `boolean` | No | `true` | Show status text |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Indicator size |
| `position` | `'inline' \| 'fixed'` | No | `'inline'` | Display position |

## 🎨 Status Indicators

| Status | Color | Label |
|--------|-------|-------|
| Connected | 🟢 Green | Connected |
| Connecting | 🟡 Yellow | Connecting... |
| Disconnected | 🔴 Red | Disconnected |
| Reconnecting | 🟠 Orange | Reconnecting... |

## 📖 Related Components

- [Sidebar](Sidebar) - App navigation
- [NotificationProvider](NotificationProvider) - Notifications

---

See the [complete components reference](../complete-components-reference) for all available components.
