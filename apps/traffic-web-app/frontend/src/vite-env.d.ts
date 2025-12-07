/**
 * Vite Environment Type Definitions
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/vite-env.d
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * TypeScript ambient declarations for Vite environment variables and import.meta types.
 * Extends Vite's default types to include custom environment variables (API URLs, feature
 * flags) used throughout the application.
 * 
 * Environment variables:
 * - VITE_API_URL: Backend API base URL
 * - VITE_WS_URL: WebSocket server URL
 * 
 * @dependencies
 * - vite@4.4.9 - Build tool with type definitions
 * 
 * @example
 * ```typescript
 * const apiUrl = import.meta.env.VITE_API_URL;
 * const wsUrl = import.meta.env.VITE_WS_URL;
 * ```
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Raw markdown file imports
declare module '*.md?raw' {
  const content: string;
  export default content;
}
