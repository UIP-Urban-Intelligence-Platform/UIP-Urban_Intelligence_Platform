/**
 * @file sidebarsApi.ts
 * @module apps/traffic-web-app/frontend/docs/sidebarsApi
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description API sidebar configuration for Docusaurus documentation site
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebarsApi: SidebarsConfig = {
  apiSidebar: [
    'overview',
    'API',
    'agents',
    'orchestrator',
    'transformation',
  ],
};

export default sidebarsApi;
