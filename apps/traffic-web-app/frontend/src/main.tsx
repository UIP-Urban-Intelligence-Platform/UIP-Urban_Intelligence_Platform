/**
 * React Application Entry Point - Traffic Web Application
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/main
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Main entry point for React application initialization with error boundary wrapper,
 * strict mode, and root element mounting.
 * 
 * Features:
 * - React 18 concurrent mode
 * - Error boundary for crash handling
 * - Strict mode for development checks
 * - Global CSS imports
 * 
 * @dependencies
 * - react@^18.2: UI library
 * - react-dom@^18.2: DOM rendering
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
