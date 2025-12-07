---
sidebar_position: 25
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Sidebar Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/Sidebar.md
Author: UIP Team
Version: 1.0.0
-->

# Sidebar

The main navigation sidebar component for the application.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/Sidebar.tsx` |
| **Type** | React Functional Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Main application navigation
- Quick access to features
- User profile and settings
- Collapsible for more space

## 🚀 Usage

```tsx
import { Sidebar } from '@/components/Sidebar';

function Layout() {
  return (
    <div className="flex">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setCollapsed(!isSidebarCollapsed)}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `collapsed` | `boolean` | No | `false` | Collapsed state |
| `onToggle` | `() => void` | No | - | Toggle handler |
| `activeItem` | `string` | No | - | Active nav item |

## 📋 Navigation Items

| Item | Icon | Route |
|------|------|-------|
| Dashboard | 📊 | `/dashboard` |
| Traffic Map | 🗺️ | `/map` |
| Analytics | 📈 | `/analytics` |
| Reports | 📝 | `/reports` |
| Settings | ⚙️ | `/settings` |

## 📖 Related Components

- [ConnectionStatus](ConnectionStatus) - Status display
- [FilterPanel](FilterPanel) - Filters

---

See the [complete components reference](../complete-components-reference) for all available components.
