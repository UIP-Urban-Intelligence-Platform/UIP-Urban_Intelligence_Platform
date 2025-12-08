---
sidebar_label: 'Docs Service'
title: 'Docs Service'
sidebar_position: 3
description: Documentation content loader and navigation management
---

{/*
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/frontend/services/docsService.md
Module: Traffic Web App - Docs Service Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Documentation content loader and navigation management service.
============================================================================
*/}

# Docs Service

Service for loading and managing documentation content from markdown files with navigation structure.

## Overview

The docsService provides:

- Documentation navigation tree structure
- Content loading from markdown files
- Breadcrumb generation
- Previous/Next navigation helpers
- Search indexing support

```mermaid
graph TD
    A[DocsService] --> B[Navigation Structure]
    A --> C[Content Loading]
    A --> D[Navigation Helpers]
    
    B --> E[docsNavigation Array]
    B --> F[Nested Categories]
    
    C --> G[loadDocContent]
    C --> H[docsMap]
    
    D --> I[getBreadcrumbs]
    D --> J[getPrevNextDocs]
    D --> K[hasDocContent]
```

## Types

```typescript
interface DocItem {
    id: string;
    title: string;
    path: string;
    children?: DocItem[];
    order?: number;
}

interface DocContent {
    title: string;
    content: string;
    frontmatter?: Record<string, unknown>;
}
```

## Navigation Structure

The `docsNavigation` array defines the complete documentation hierarchy:

```typescript
export const docsNavigation: DocItem[] = [
    {
        id: 'intro',
        title: 'Giá»›i thiá»‡u',
        path: '/docs',
        order: 1,
    },
    {
        id: 'quick-start',
        title: 'Báº¯t Ä‘áº§u nhanh',
        path: '/docs/quick-start',
        order: 2,
    },
    {
        id: 'agents',
        title: 'Há»‡ thá»‘ng Agent',
        path: '/docs/agents',
        order: 5,
        children: [
            { id: 'agents-overview', title: 'Tá»•ng quan Agent', path: '/docs/agents/overview' },
            {
                id: 'agents-analytics', 
                title: 'Analytics Agents', 
                path: '/docs/agents/analytics',
                children: [
                    { id: 'accident-detection', title: 'Accident Detection', path: '/docs/agents/analytics/accident-detection' },
                    // ... more nested items
                ]
            },
        ],
    },
    // ... more sections
];
```

## API Functions

### loadDocContent

Load markdown content for a given path.

```typescript
async function loadDocContent(path: string): Promise<DocContent | null>
```

### getBreadcrumbs

Generate breadcrumb trail for current path.

```typescript
function getBreadcrumbs(currentPath: string): Array<{ title: string; path: string }>
```

### getPrevNextDocs

Get previous and next documents for sequential navigation.

```typescript
function getPrevNextDocs(currentPath: string): {
    prev: DocItem | null;
    next: DocItem | null;
}
```

### hasDocContent

Check if a path has actual content in docsMap.

```typescript
function hasDocContent(path: string): boolean
```

## Usage

```typescript
import { 
    loadDocContent, 
    getBreadcrumbs, 
    getPrevNextDocs, 
    docsNavigation 
} from '../services/docsService';

// Load content for current page
const content = await loadDocContent('/docs/agents/overview');
if (content) {
    console.log(content.title);   // "Tá»•ng quan Agent"
    console.log(content.content); // Markdown content
}

// Get breadcrumbs
const breadcrumbs = getBreadcrumbs('/docs/agents/analytics/accident-detection');
// [{ title: 'Docs', path: '/docs' }, { title: 'Agents', path: '/docs/agents' }, ...]

// Get prev/next navigation
const { prev, next } = getPrevNextDocs('/docs/agents/overview');
// prev: quick-start, next: agents-reference
```

## Navigation Categories

| Category | Description | Items |
|----------|-------------|-------|
| Giá»›i thiá»‡u | Introduction to the platform | 1 |
| Báº¯t Ä‘áº§u nhanh | Quick start guide | 1 |
| CÃ i Ä‘áº·t | Installation instructions | 1 |
| Kiáº¿n trÃºc | System architecture | 1 |
| Há»‡ thá»‘ng Agent | Agent documentation | 14+ |
| Frontend | Component documentation | 3+ |
| API | API reference | 3 |
| Data Models | Standards & ontologies | 1 |
| DevOps | DevOps guide | 1 |
| Testing | Testing guide | 1 |
| HÆ°á»›ng dáº«n | Development guides | 3 |
| Tutorial | Tutorial basics | 6 |

## Content Storage

Documentation content is stored in `docsMap` keyed by path:

```typescript
const docsMap: Record<string, DocContent> = {
    '/docs': { title: 'Introduction', content: '...' },
    '/docs/quick-start': { title: 'Quick Start', content: '...' },
    // ... more content
};
```

## Dependencies

- TypeScript interfaces for type safety
- Path-based content lookup
- Tree traversal for navigation

## See Also

- [DocsPage Component](../pages/DocsPage.md)
- [Overview](../overview.md)
