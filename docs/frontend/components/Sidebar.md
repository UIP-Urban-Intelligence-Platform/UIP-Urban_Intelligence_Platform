---
sidebar_position: 25
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: frontend/components/Sidebar.md
Module: Frontend Components - Sidebar
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Sidebar component documentation - main navigation sidebar component
  for the application.
============================================================================
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
