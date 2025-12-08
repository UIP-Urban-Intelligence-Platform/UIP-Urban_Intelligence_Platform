/**
 * @fileoverview PredictiveTimeline Component - Traffic Prediction Visualization
 * @module apps/traffic-web-app/frontend/src/components/agents/PredictiveTimeline
 * 
 * @description
 * Visualizes Traffic Maestro Agent's predictive traffic control with:
 * - Dual-slider timeline: Now vs Predicted (Next 2 hours)
 * - Event markers: Icons showing external events (concerts, sports, conferences)
 * - Congestion curve: Predicted traffic overlaying event timeline
 * - Action button: Activate pre-emptive green wave based on risk levels
 * 
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @license
 * SPDX-License-Identifier: MIT
 *
 * This file is part of HCMC Traffic Monitoring System.
 *
 * Licensed under MIT License (see LICENSE).
 *
 * @see {@link https://github.com/your-org/hcmc-traffic|GitHub Repository}
 * @see {@link https://hcmc-traffic.docs.io|Documentation}
 */

import React, { useState, useEffect, useMemo } from 'react';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface ExternalEvent {
    id: string;
    type: 'concert' | 'sports' | 'conference' | 'festival' | 'emergency' | 'construction' | 'traffic_hotspot' | 'Music' | 'Undefined' | 'other' | string;
    name: string;
    venue: string;
    startTime: string;
    endTime: string;
    estimatedAttendees: number;
    impactRadius: number; // meters
    location: {
        lat: number;
        lng: number;
    };
    riskScore: number; // 0-100
    startTimeFormatted?: string;
    endTimeFormatted?: string;
    // Additional fields for traffic hotspots
    averageSpeed?: number;
    vehicleCount?: number;
    source?: string; // 'external_api' for Ticketmaster events
    isSimulated?: boolean; // true if data is simulated, false if from real CV analysis
}interface CongestionPrediction {
    timestamp: string;
    currentCongestion: number; // 0-100
    predictedCongestion: number; // 0-100
    confidence: number; // 0-1
    contributingEvents: string[]; // Event IDs
    factors: {
        baselineTraffic: number;
        eventImpact: number;
        weatherImpact: number;
        historicalPattern: number;
    };
}

interface PredictiveTimelineProps {
    predictions: CongestionPrediction[];
    events: ExternalEvent[];
    onEventClick?: (event: ExternalEvent) => void;
    onClose?: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    autoRefreshInterval?: number; // seconds
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getEventIcon = (type: ExternalEvent['type']): string => {
    const icons: Record<string, string> = {
        concert: '🎵',
        sports: '⚽',
        conference: '💼',
        festival: '🎉',
        emergency: '🚨',
        construction: '🚧',
        traffic_hotspot: '🔥',
        other: '📍'
    };
    return icons[type] || '📍';
};

const getCongestionLabel = (level: number): string => {
    if (level >= 80) return 'Severe';
    if (level >= 60) return 'Heavy';
    if (level >= 40) return 'Moderate';
    if (level >= 20) return 'Light';
    return 'Free Flow';
};

const getRiskColor = (risk: number): string => {
    if (risk >= 80) return 'bg-red-600 text-white';
    if (risk >= 60) return 'bg-orange-500 text-white';
    if (risk >= 40) return 'bg-yellow-500 text-gray-900';
    return 'bg-green-500 text-white';
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export const PredictiveTimeline: React.FC<PredictiveTimelineProps> = ({
    predictions,
    events,
    onEventClick,
    onClose,
    onRefresh,
    isLoading = false,
    autoRefreshInterval = 60
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [countdown, setCountdown] = useState(autoRefreshInterval);

    // Debug logging
    console.log('🔥 PredictiveTimeline props received:', {
        predictions: predictions?.length || 0,
        events: events?.length || 0,
        eventsData: events?.slice(0, 3) // Log first 3 events
    });

    // =====================================================
    // AUTO-REFRESH TIMER
    // =====================================================

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            setCountdown((prev) => {
                if (prev <= 1) {
                    return autoRefreshInterval;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [autoRefreshInterval]);

    // =====================================================
    // CALCULATE PEAK RISK
    // =====================================================

    const peakRisk = useMemo(() => {
        if (!predictions.length) return { time: '', level: 0 };

        const peak = predictions.reduce((max, pred) =>
            pred.predictedCongestion > max.predictedCongestion ? pred : max
        );

        return {
            time: new Date(peak.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            level: Math.round(peak.predictedCongestion)
        };
    }, [predictions]);

    // =====================================================
    // PREPARE CHART DATA
    // =====================================================

    const chartData = useMemo(() => {
        return predictions.map((pred) => {
            const time = new Date(pred.timestamp);
            const minutesFromNow = Math.floor((time.getTime() - currentTime.getTime()) / 60000);

            return {
                time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                minutesFromNow,
                current: Math.round(pred.currentCongestion),
                predicted: Math.round(pred.predictedCongestion),
                confidence: pred.confidence * 100,
                timestamp: pred.timestamp
            };
        }).filter((d) => d.minutesFromNow >= 0 && d.minutesFromNow <= 120);
    }, [predictions, currentTime]);

    // =====================================================
    // EVENT MARKERS ON TIMELINE
    // =====================================================

    const eventMarkers = useMemo(() => {
        console.log('🔍 Processing events:', events?.length || 0, 'events received');

        if (!events || events.length === 0) {
            console.log('⚠️ No events to process');
            return [];
        }

        const processed = events.map((event) => {
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);
            const minutesFromNow = Math.floor((startTime.getTime() - currentTime.getTime()) / 60000);
            const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

            // Format date and time for display
            const dateFormatted = startTime.toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit'
            });
            const startTimeFormatted = startTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const endTimeFormatted = endTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return {
                ...event,
                minutesFromNow,
                durationMinutes,
                dateFormatted,
                startTimeFormatted,
                endTimeFormatted
            };
        });

        // Filter: Show all traffic_hotspots + external_api events + events in next 24 hours
        const filtered = processed.filter((e) => {
            const isHotspot = e.type === 'traffic_hotspot';
            const isExternalEvent = e.source === 'external_api';
            const isInTimeRange = e.minutesFromNow >= -60 && e.minutesFromNow <= 1440;

            return isHotspot || isExternalEvent || isInTimeRange;
        });

        console.log('✅ Filtered events:', filtered.length, 'events after filter');

        // Sort: Hotspots first (by riskScore), then events by time
        return filtered.sort((a, b) => {
            // Hotspots always come first, sorted by risk score (highest first)
            if (a.type === 'traffic_hotspot' && b.type !== 'traffic_hotspot') return -1;
            if (a.type !== 'traffic_hotspot' && b.type === 'traffic_hotspot') return 1;
            if (a.type === 'traffic_hotspot' && b.type === 'traffic_hotspot') {
                return b.riskScore - a.riskScore;
            }
            // Events sorted by time
            return a.minutesFromNow - b.minutesFromNow;
        });
    }, [events, currentTime]);

    // =====================================================
    // SEPARATE HOTSPOTS AND EXTERNAL EVENTS
    // =====================================================

    const hotspots = useMemo(() => {
        const result = eventMarkers.filter(e => e.type === 'traffic_hotspot');
        console.log('🔥 Hotspots filtered:', result.length, 'from eventMarkers:', eventMarkers.length);
        return result;
    }, [eventMarkers]);

    const externalEvents = useMemo(() => {
        const result = eventMarkers.filter(e => e.type !== 'traffic_hotspot');
        console.log('🎉 External events filtered:', result.length);
        return result;
    }, [eventMarkers]);

    // =====================================================
    // LOADING STATE
    // =====================================================

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading predictions...</p>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN RENDER
    // =====================================================

    return (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">

            {/* HEADER - COMPACT */}
            <div className="text-white p-4" style={{ backgroundColor: '#111827' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="text-3xl">🚦</div>
                        <div>
                            <h2 className="text-xl font-bold">Dự Đoán Giao Thông</h2>
                            <p className="text-sm text-gray-300">Cập nhật mỗi {autoRefreshInterval}s • Tiếp theo: {countdown}s</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-2xl font-bold">{peakRisk.level}%</div>
                            <div className="text-xs opacity-90">Mức cao nhất lúc {peakRisk.time}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    className="px-3 py-1.5 text-sm bg-white rounded-lg transition-colors shadow-md hover:opacity-80"
                                    style={{ color: '#111827' }}
                                    title="Làm mới"
                                >
                                    🔄
                                </button>
                            )}
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-bold"
                                    title="Đóng"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT - SCROLLABLE */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                <div className="p-4 space-y-4">

                    {/* CURRENT STATUS CARDS */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border-2 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
                            <div className="text-3xl mb-2">🚗</div>
                            <div className="text-sm font-semibold text-gray-500">Hiện Tại</div>
                            <div className="text-2xl font-bold" style={{ color: '#111827' }}>
                                {chartData[0]?.current || 0}%
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{getCongestionLabel(chartData[0]?.current || 0)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
                            <div className="text-3xl mb-2">⏰</div>
                            <div className="text-sm font-semibold text-gray-500">Dự Đoán (1h)</div>
                            <div className="text-2xl font-bold" style={{ color: '#111827' }}>
                                {chartData.find(d => d.minutesFromNow >= 60)?.predicted || 0}%
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{getCongestionLabel(chartData.find(d => d.minutesFromNow >= 60)?.predicted || 0)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
                            <div className="text-3xl mb-2">🔥</div>
                            <div className="text-sm font-semibold text-gray-500">Mức Cao Nhất</div>
                            <div className="text-2xl font-bold" style={{ color: '#111827' }}>{peakRisk.level}%</div>
                            <div className="text-xs text-gray-600 mt-1">Lúc {peakRisk.time}</div>
                        </div>
                    </div>

                    {/* TWO COLUMN LAYOUT: Hotspots + External Events */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* LEFT: TRAFFIC HOTSPOTS */}
                        <div className="bg-white rounded-lg shadow-lg p-4">
                            <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                                <span>🔥</span>
                                <span>Điểm Nóng ({hotspots.length})</span>
                            </h3>
                            {hotspots.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">Không có điểm nóng nào</p>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {hotspots.slice(0, 10).map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={() => onEventClick?.(event)}
                                            className="p-3 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer transition-all"
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#EF4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#FECACA'}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    <div className="text-2xl">🔥</div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: '#111827' }}>{event.name}</p>
                                                        <p className="text-xs text-gray-600">{event.venue}</p>
                                                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                            <p>🚗 {event.vehicleCount || event.estimatedAttendees} xe • 🏎️ {event.averageSpeed?.toFixed(0) || '?'} km/h</p>
                                                            <p className="text-red-500 font-medium">⚠️ Đang kẹt xe</p>
                                                            <p className="text-blue-600 font-medium">🕐 Phát hiện lúc: {(event.observedAt || event.startTime) ? new Date(event.observedAt || event.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <div className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(event.riskScore)}`}>
                                                        {Math.round(event.riskScore)}%
                                                    </div>
                                                    {event.isSimulated ? (
                                                        <span className="text-xs text-orange-500 font-semibold">🟡 Mô phỏng</span>
                                                    ) : (
                                                        <span className="text-xs text-green-500 font-semibold">🟢 Real-time</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: EXTERNAL EVENTS */}
                        <div className="bg-white rounded-lg shadow-lg p-4">
                            <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                                <span>🎉</span>
                                <span>Sự Kiện ({externalEvents.length})</span>
                            </h3>
                            {externalEvents.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">Không có sự kiện nào</p>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {externalEvents.slice(0, 10).map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={() => onEventClick?.(event)}
                                            className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all"
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#BFDBFE'}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    <div className="text-2xl">{getEventIcon(event.type)}</div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: '#111827' }}>{event.name}</p>
                                                        <p className="text-xs text-gray-600">{event.venue}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            📆 {event.dateFormatted} • 🕒 {event.startTimeFormatted} - {event.endTimeFormatted}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            👥 {event.estimatedAttendees.toLocaleString()} người
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <div className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(event.riskScore)}`}>
                                                        {Math.round(event.riskScore)}%
                                                    </div>
                                                    {event.minutesFromNow > 0 && (
                                                        <span className="text-xs text-gray-400">
                                                            {event.minutesFromNow < 60
                                                                ? `${event.minutesFromNow} phút nữa`
                                                                : event.minutesFromNow < 1440
                                                                    ? `${Math.floor(event.minutesFromNow / 60)}h ${event.minutesFromNow % 60}m nữa`
                                                                    : `${Math.floor(event.minutesFromNow / 1440)} ngày nữa`
                                                            }
                                                        </span>
                                                    )}
                                                    {event.minutesFromNow <= 0 && event.minutesFromNow >= -60 && (
                                                        <span className="text-xs text-green-500 font-semibold">🔴 Đang diễn ra</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PredictiveTimeline;
