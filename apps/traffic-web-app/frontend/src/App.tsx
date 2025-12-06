/**
 * Root Application Component - Traffic Web Application
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/App
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Root application component setting up routing, global providers, and error boundaries.
 * Defines three main routes: landing page (/), dashboard (/dashboard), and docs (/docs/*).
 * Wraps entire application with NotificationProvider for toast alerts and ErrorBoundary 
 * for graceful error handling.
 * 
 * Route structure:
 * - / → LandingPage (marketing and onboarding)
 * - /dashboard → Dashboard (main traffic monitoring interface)
 * - /docs/* → DocsPage (embedded documentation)
 * 
 * @dependencies
 * - react@18.2.0 - Component and React types
 * - react-router-dom@6.14.2 - BrowserRouter, Routes, Route
 * - NotificationProvider - Global toast system
 * - ErrorBoundary - Error catching and reporting
 * 
 * @example
 * ```tsx
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * );
 * ```
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import DocsPage from './pages/DocsPage';
import { NotificationProvider } from './components/NotificationProvider';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <NotificationProvider maxToasts={3}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/docs/*" element={<DocsPage />} />
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;
