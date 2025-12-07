/**
 * Citizen Report Map - Interactive Report Visualization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/CitizenReportMap
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Citizen Report Map - Interactive map for viewing and submitting citizen science reports.
 * Combines map visualization, report submission form, and filtering capabilities.
 * 
 * Features:
 * - Full-screen interactive map
 * - Report submission form with photo upload
 * - Report filtering by type, status, time range
 * - Real-time report statistics
 * - Report marker clustering
 * - Auto-refresh every 30 seconds
 * 
 * @dependencies
 * - react-map-gl@^7.1: Map rendering (MIT license)
 * - maplibre-gl@^4.7: Mapping library (BSD-3-Clause)
 * - lucide-react@^0.294: Icons
 * - citizenReportService: API client
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer } from './map';
import { Plus, X } from 'lucide-react';
// Note: MapLibre CSS is handled by MapContainer
import { CitizenReportForm } from './CitizenReportForm';
import { CitizenReportMarkers } from './CitizenReportMarkers';
import { CitizenReportFilterPanel } from './CitizenReportFilterPanel';
import { citizenReportService } from '../services/citizenReportService';
import { CitizenReport, CitizenReportFilters, CitizenReportStats } from '../types/citizenReport';

// Note: Leaflet icon fix removed - MapLibre handles icons differently

const HCMC_CENTER: [number, number] = [10.791, 106.691];
const DEFAULT_ZOOM = 12;

export const CitizenReportMap: React.FC = () => {
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [stats, setStats] = useState<CitizenReportStats | null>(null);
    const [filters, setFilters] = useState<CitizenReportFilters>({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch citizen reports
    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [reportsData, statsData] = await Promise.all([
                citizenReportService.queryReports(filters),
                citizenReportService.getStats()
            ]);

            setReports(reportsData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch citizen reports:', err);
            setError('Failed to load citizen reports. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // Initial data fetch
    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchReports();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchReports]);

    const handleReportSubmitted = (reportId: string) => {
        console.log('Report submitted:', reportId);
        setIsFormOpen(false);
        // Refresh reports after a short delay to allow background processing
        setTimeout(() => {
            fetchReports();
        }, 2000);
    };

    const handleFiltersChange = (newFilters: CitizenReportFilters) => {
        setFilters(newFilters);
    };

    return (
        <div className="relative w-full h-screen">
            {/* Map Container */}
            <MapContainer
                center={HCMC_CENTER}
                zoom={DEFAULT_ZOOM}
                className="w-full h-full"
            >
                {/* TileLayer is handled via mapStyle in MapContainer - OpenStreetMap default */}

                {/* Citizen Report Markers */}
                <CitizenReportMarkers reports={reports} />
            </MapContainer>

            {/* Filter Panel - Left Side */}
            <div className="absolute top-4 left-4 z-[1000] w-80 max-h-[calc(100vh-2rem)] overflow-y-auto">
                <CitizenReportFilterPanel
                    filters={filters}
                    stats={stats}
                    onFiltersChange={handleFiltersChange}
                    isLoading={isLoading}
                />
            </div>

            {/* Submit Report Button - Right Bottom */}
            <button
                onClick={() => setIsFormOpen(true)}
                className="absolute bottom-8 right-8 z-[1000] bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-4 rounded-full shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
            >
                <Plus className="w-6 h-6" />
                Submit Report
            </button>

            {/* Report Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
                    <div className="relative max-w-2xl w-full">
                        <CitizenReportForm
                            onReportSubmitted={handleReportSubmitted}
                            onClose={() => setIsFormOpen(false)}
                            initialLocation={{ lat: HCMC_CENTER[0], lng: HCMC_CENTER[1] }}
                        />
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute top-4 right-4 z-[1000] bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="p-1 hover:bg-red-600 rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Legend - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Report Types</h4>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>🚨 Accident</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>🚦 Traffic Jam</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>🌊 Flood</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                        <span>🕳️ Road Damage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>⚠️ Other</span>
                    </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600 opacity-100"></div>
                        <span>AI Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600 opacity-60"></div>
                        <span>Pending Verification</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
