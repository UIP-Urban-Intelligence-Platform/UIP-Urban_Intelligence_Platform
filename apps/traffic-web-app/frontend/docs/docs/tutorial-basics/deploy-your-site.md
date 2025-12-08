---
sidebar_label: 'Deploy your site'
title: 'Deploy your site'
sidebar_position: 5
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Docusaurus tutorial - Deploy your site.

File: apps/traffic-web-app/frontend/docs/docs/tutorial-basics/deploy-your-site.md
Module: Tutorial Basics Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Tutorial on deploying Docusaurus sites.
============================================================================
-->

# Deploy your site

Docusaurus is a **static-site-generator** (also called **[Jamstack](https://jamstack.org/)**).

It builds your site as simple **static HTML, JavaScript and CSS files**.

## Build your site

Build your site **for production**:

```bash
npm run build
```

The static files are generated in the `build` folder.

## Deploy your site

Test your production build locally:

```bash
npm run serve
```

The `build` folder is now served at [http://localhost:3000/](http://localhost:3000/).

You can now deploy the `build` folder **almost anywhere** easily, **for free** or very small cost (read the **[Deployment Guide](https://docusaurus.io/docs/deployment)**).
