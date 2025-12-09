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
    port: 5173,  
    host: true,  
    allowedHosts: true,  
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false,
    },
  },
  assetsInclude: ['**/*.md'],

  // Optimize dependency pre-bundling to reduce chunk count
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
      'recharts',
      'maplibre-gl',
      'react-map-gl',
      'lucide-react',
      'framer-motion',
      'date-fns',
      'react-markdown',
      'react-syntax-highlighter',
      'supercluster',
    ],
    // Force pre-bundling to reduce runtime module requests
    force: false,
    esbuildOptions: {
      // Increase memory limit for esbuild
      target: 'es2020',
    },
  },

  // Build optimization - consolidate chunks
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting to reduce number of chunks
        manualChunks: {
          // Core React vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries chunk
          'vendor-ui': ['framer-motion', 'lucide-react', 'recharts'],
          // Map libraries chunk
          'vendor-map': ['maplibre-gl', 'react-map-gl', 'supercluster'],
          // Markdown libraries chunk
          'vendor-markdown': ['react-markdown', 'react-syntax-highlighter', 'remark-gfm', 'rehype-raw', 'gray-matter'],
          // Utilities chunk
          'vendor-utils': ['axios', 'zustand', 'date-fns'],
        },
      },
    },
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Enable source maps for debugging
    sourcemap: false,
  },
});
