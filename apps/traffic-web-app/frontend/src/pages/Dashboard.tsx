/**
 * Dashboard Page - Main Traffic Monitoring Interface
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/pages/Dashboard
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Primary dashboard page integrating traffic map, sidebar controls, and analytics panel.
 * Manages WebSocket connection for real-time updates and coordinates between components.
 * 
 * Key Features:
 * - Real-time data updates via WebSocket
 * - Interactive traffic map with 8 overlay layers
 * - Analytics dashboard with charts and metrics
 * - Sidebar with filters and layer controls
 * - State management via Zustand store
 * - Auto-refresh with configurable intervals
 * 
 * Components:
 * - TrafficMap: MapLibre GL map with camera markers, heatmaps, zones
 * - Sidebar: Layer toggles, filters, AI agent panels
 * - AnalyticsDashboard: Charts for congestion, accidents, AQI trends
 * 
 * @dependencies
 * - react@^18.2: UI library
 * - TrafficMap, Sidebar, AnalyticsDashboard components
 * - WebSocket service for real-time updates
 * - Zustand store for state management
 */

import React, { useEffect, useState, useRef } from 'react';
import TrafficMap from '../components/TrafficMap';
import Sidebar from '../components/Sidebar';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { wsService } from '../services/websocket';
import { useTrafficStore } from '../store/trafficStore';

const Dashboard: React.FC = () => {
    const { refreshData, loading, error } = useTrafficStore();
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const trafficMapRef = useRef<any>(null);

    useEffect(() => {
        // Load initial data using store method (refreshData clears cache first)
        const initializeApp = async () => {
            try {
                await refreshData();
                setIsInitialized(true);

                // Connect WebSocket after data is loaded
                wsService.connect();
            } catch (err) {
                console.error('Failed to initialize app:', err);
                setIsInitialized(true); // Still mark as initialized to show the UI
            }
        };

        initializeApp();

        return () => {
            wsService.disconnect();
        };
    }, [refreshData]);

    // Show loading screen while initializing
    if (!isInitialized || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="inline-block animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mb-6"></div>
                        <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-4 border-blue-200 opacity-20"></div>
                    </div>
                    <p className="text-gray-800 text-xl font-medium tracking-tight">Loading Data</p>
                    <p className="text-gray-500 text-sm mt-2 font-light">Please wait a moment</p>
                </div>
            </div>
        );
    }

    // Show error state if there's a critical error
    if (error && !isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
                <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-gray-800 text-xl font-medium mb-2">Unable to Load Data</p>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
            <Sidebar
                onCameraSelect={(camera) => trafficMapRef.current?.handleCameraClick?.(camera)}
                onZoomToCamera={(camera) => trafficMapRef.current?.handleZoomToCamera?.(camera)}
                onZoomToDistrict={(bounds, center) => trafficMapRef.current?.handleZoomToDistrict?.(bounds, center)}
            />
            <div className="flex-1 relative">
                <TrafficMap ref={trafficMapRef} />
                <AnalyticsDashboard
                    isOpen={isAnalyticsOpen}
                    onToggle={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                />
            </div>
        </div>
    );
};

export default Dashboard;
