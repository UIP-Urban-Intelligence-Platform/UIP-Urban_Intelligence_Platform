---
sidebar_label: 'NotificationProvider'
title: 'NotificationProvider'
sidebar_position: 20
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/components/NotificationProvider.md
Module: Traffic Web App - NotificationProvider Component Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  NotificationProvider component documentation for notifications.
============================================================================
-->

# NotificationProvider

A context provider component for managing application-wide notifications.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/NotificationProvider.tsx` |
| **Type** | React Context Provider |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Provide notification context to app
- Manage toast notifications
- Handle real-time alerts
- Queue and display notifications

## 🚀 Usage

```tsx
import { NotificationProvider, useNotification } from '@/components/NotificationProvider';

// Wrap app
function App() {
  return (
    <NotificationProvider>
      <MainContent />
    </NotificationProvider>
  );
}

// Use in components
function MyComponent() {
  const { notify } = useNotification();

  const handleSuccess = () => {
    notify({
      type: 'success',
      message: 'Report submitted successfully'
    });
  };
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Child components |
| `position` | `ToastPosition` | No | `'top-right'` | Toast position |
| `maxToasts` | `number` | No | `5` | Max visible toasts |
| `duration` | `number` | No | `5000` | Default duration (ms) |

## 🔧 Notification Types

| Type | Icon | Color |
|------|------|-------|
| `success` | ✅ | Green |
| `error` | ❌ | Red |
| `warning` | ⚠️ | Yellow |
| `info` | ℹ️ | Blue |
| `alert` | 🚨 | Orange |

## 📖 Related Components

- [ConnectionStatus](ConnectionStatus) - Connection alerts
- [ErrorBoundary](ErrorBoundary) - Error handling

---

See the [complete components reference](../complete-components-reference) for all available components.
