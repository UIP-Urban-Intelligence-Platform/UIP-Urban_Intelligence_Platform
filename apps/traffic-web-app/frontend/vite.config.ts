/**
 * Vite Configuration - Build Tool Settings
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/frontend/vite.config
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Vite build configuration for React frontend application. Defines dev server settings,
 * proxy configuration for API requests, and React plugin setup. Enables fast HMR (Hot
 * Module Replacement) and optimized production builds. Supports raw markdown imports
 * for embedded documentation.
 * 
 * Configuration highlights:
 * - Dev server on port 5173
 * - API proxy to backend (:5000)
 * - React plugin with Fast Refresh
 * - TypeScript type checking
 * - Raw markdown file imports for docs
 * 
 * @dependencies
 * - vite@4.4.9 - Build tool and dev server
 * - @vitejs/plugin-react@4.0.4 - React Fast Refresh support
 * 
 * @example
 * ```bash
 * npm run dev    # Start dev server on :5173
 * npm run build  # Production build to dist/
 * ```
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,  // Default Vite port (matches justrun.ps1)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  assetsInclude: ['**/*.md'],
});
