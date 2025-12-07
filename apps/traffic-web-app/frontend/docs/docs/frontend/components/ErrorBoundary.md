---
sidebar_position: 15
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
ErrorBoundary Component Documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/ErrorBoundary.md
Author: UIP Team
Version: 1.0.0
-->

# ErrorBoundary

A React error boundary component for graceful error handling and recovery.

## 📋 Overview

| Property | Value |
|----------|-------|
| **File** | `src/components/ErrorBoundary.tsx` |
| **Type** | React Class Component |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- Catch JavaScript errors in child components
- Display fallback UI on error
- Log errors for debugging
- Provide recovery options

## 🚀 Usage

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <MainContent />
    </ErrorBoundary>
  );
}
```

## 📦 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Child components |
| `fallback` | `ReactNode` | No | Default error UI | Fallback component |
| `onError` | `(error: Error, info: ErrorInfo) => void` | No | - | Error callback |
| `onReset` | `() => void` | No | - | Reset callback |

## 🔧 Error Handling

```tsx
// With custom error handler
<ErrorBoundary
  onError={(error, info) => {
    logErrorToService(error, info);
  }}
  fallback={
    <div>
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  }
>
  <App />
</ErrorBoundary>
```

## 📖 Related Components

- [NotificationProvider](NotificationProvider) - Error notifications
- All components can be wrapped with ErrorBoundary

---

See the [complete components reference](../complete-components-reference) for all available components.
