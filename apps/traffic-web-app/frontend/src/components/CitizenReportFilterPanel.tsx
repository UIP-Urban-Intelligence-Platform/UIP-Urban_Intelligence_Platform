/**
 * Citizen Report Filter Panel - Advanced Report Filtering
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/CitizenReportFilterPanel
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Citizen Report Filter Panel - Advanced filtering for citizen science reports.
 * Provides filters by type, status, time range, and displays statistics.
 * 
 * Features:
 * - Report type filtering (Air Quality, Congestion, Accident, Infrastructure)
 * - Status filtering (Pending, Verified, Resolved)
 * - Time range filtering (Last 24h, 7 days, 30 days, All)
 * - Real-time statistics display
 * - Collapsible panel design
 * - Clear all filters button
 * 
 * @dependencies
 * - lucide-react@^0.294: Filter icons
 */

import React, { useState } from 'react';
import { Filter, X, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { CitizenReportFilters, CitizenReportStats, ReportType } from '../types/citizenReport';

interface CitizenReportFilterPanelProps {
    filters: CitizenReportFilters;
    stats: CitizenReportStats | null;
    onFiltersChange: (filters: CitizenReportFilters) => void;
    isLoading?: boolean;
}

export const CitizenReportFilterPanel: React.FC<CitizenReportFilterPanelProps> = ({
    filters,
    stats,
    onFiltersChange,
    isLoading = false
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const reportTypes: { value: ReportType; label: string; icon: string }[] = [
        { value: 'traffic_jam', label: 'Traffic Jam', icon: '🚦' },
        { value: 'accident', label: 'Accident', icon: '🚨' },
        { value: 'flood', label: 'Flood', icon: '🌊' },
        { value: 'road_damage', label: 'Road Damage', icon: '🕳️' },
        { value: 'other', label: 'Other', icon: '⚠️' }
    ];

    const timeRanges = [
        { value: 1, label: 'Last Hour' },
        { value: 6, label: 'Last 6 Hours' },
        { value: 24, label: 'Last 24 Hours' },
        { value: 168, label: 'Last Week' },
        { value: undefined, label: 'All Time' }
    ];

    const handleFilterChange = (key: keyof CitizenReportFilters, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value === filters[key] ? undefined : value
        });
    };

    const clearFilters = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Filter className="w-5 h-5" />
                    <h3 className="font-semibold">Citizen Reports</h3>
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            {Object.values(filters).filter(v => v !== undefined).length} active
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-blue-500 rounded transition-colors text-white"
                >
                    {isExpanded ? '−' : '+'}
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 space-y-6">
                    {/* Statistics */}
                    {stats && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs text-gray-600">Total Reports</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-gray-600">AI Verified</span>
                                </div>
                                <div className="text-2xl font-bold text-green-700">{stats.verified}</div>
                                <div className="text-xs text-gray-600">
                                    {stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(0) : 0}% verified
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    <span className="text-xs text-gray-600">Last 24h</span>
                                </div>
                                <div className="text-2xl font-bold text-yellow-700">{stats.last24Hours}</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs text-gray-600">Avg Confidence</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-700">
                                    {(stats.avgConfidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Report Type Distribution */}
                    {stats && stats.total > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">By Type</h4>
                            <div className="space-y-2">
                                {reportTypes.map((type) => {
                                    const count = stats.byType[type.value] || 0;
                                    const percentage = (count / stats.total) * 100;
                                    return (
                                        <div key={type.value} className="flex items-center gap-2">
                                            <span className="text-lg">{type.icon}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-gray-700">{type.label}</span>
                                                    <span className="text-xs font-semibold text-gray-900">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        {/* Report Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Type
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {reportTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => handleFilterChange('reportType', type.value)}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${filters.reportType === type.value
                                            ? 'bg-blue-500 text-white border-blue-500 font-semibold'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                            }`}
                                    >
                                        <span className="mr-1">{type.icon}</span>
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Time Range
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {timeRanges.map((range) => (
                                    <button
                                        key={range.label}
                                        onClick={() => handleFilterChange('hours', range.value)}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${filters.hours === range.value
                                            ? 'bg-blue-500 text-white border-blue-500 font-semibold'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI Verification Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Status
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleFilterChange('aiVerified', true)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${filters.aiVerified === true
                                        ? 'bg-green-500 text-white border-green-500 font-semibold'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                                        }`}
                                >
                                    ✓ Verified
                                </button>
                                <button
                                    onClick={() => handleFilterChange('aiVerified', false)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${filters.aiVerified === false
                                        ? 'bg-yellow-500 text-white border-yellow-500 font-semibold'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-400'
                                        }`}
                                >
                                    ⏳ Pending
                                </button>
                            </div>
                        </div>

                        {/* Confidence Threshold */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Min Confidence: {filters.minConfidence ? `${(filters.minConfidence * 100).toFixed(0)}%` : 'Any'}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={filters.minConfidence || 0}
                                onChange={(e) => handleFilterChange('minConfidence', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="p-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading reports...</p>
                </div>
            )}
        </div>
    );
};
