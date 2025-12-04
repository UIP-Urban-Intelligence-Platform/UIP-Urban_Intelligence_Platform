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
    type: 'concert' | 'sports' | 'conference' | 'festival' | 'emergency' | 'construction';
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

interface PreemptiveAction {
    id: string;
    type: 'green_wave' | 'detour' | 'alert' | 'signal_adjustment';
    label: string;
    description: string;
    targetArea: string;
    estimatedImpact: string;
    requiredRiskLevel: number; // Minimum risk score to enable
    icon: string;
    status: 'available' | 'active' | 'disabled';
}

interface RouteAlternative {
    routeId: string;
    name: string;
    currentDelay: number; // minutes
    predictedDelay: number; // minutes
    distanceKm: number;
}

interface PredictiveTimelineProps {
    predictions: CongestionPrediction[];
    events: ExternalEvent[];
    actions: PreemptiveAction[];
    routes?: RouteAlternative[];
    onActionTrigger?: (action: PreemptiveAction) => void;
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
    const icons = {
        concert: '🎵',
        sports: '⚽',
        conference: '💼',
        festival: '🎉',
        emergency: '🚨',
        construction: '🚧'
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
    actions,
    routes = [],
    onActionTrigger,
    onEventClick,
    onClose,
    onRefresh,
    isLoading = false,
    autoRefreshInterval = 60
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
    const [countdown, setCountdown] = useState(autoRefreshInterval);    // =====================================================
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
            level: peak.predictedCongestion
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
                current: pred.currentCongestion,
                predicted: pred.predictedCongestion,
                confidence: pred.confidence * 100,
                timestamp: pred.timestamp
            };
        }).filter((d) => d.minutesFromNow >= 0 && d.minutesFromNow <= 120);
    }, [predictions, currentTime]);

    // =====================================================
    // EVENT MARKERS ON TIMELINE
    // =====================================================

    const eventMarkers = useMemo(() => {
        return events.map((event) => {
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);
            const minutesFromNow = Math.floor((startTime.getTime() - currentTime.getTime()) / 60000);
            const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

            return {
                ...event,
                minutesFromNow,
                durationMinutes,
                startTimeFormatted: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                endTimeFormatted: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }).filter((e) => e.minutesFromNow <= 120);
    }, [events, currentTime]);

    // =====================================================
    // ACTION HANDLER
    // =====================================================

    const handleActionTrigger = (action: PreemptiveAction) => {
        if (action.status === 'disabled') return;

        const newActiveActions = new Set(activeActions);
        if (newActiveActions.has(action.id)) {
            newActiveActions.delete(action.id);
        } else {
            newActiveActions.add(action.id);
        }
        setActiveActions(newActiveActions);

        if (onActionTrigger) {
            onActionTrigger(action);
        }
    };

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
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
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

                    {/* UPCOMING EVENTS */}
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                            <span>📅</span>
                            <span>Sự Kiện Sắp Tới ({events.length})</span>
                        </h3>
                        {eventMarkers.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">Không có sự kiện nào trong 2 giờ tới</p>
                        ) : (
                            <div className="space-y-2">
                                {eventMarkers.slice(0, 5).map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => onEventClick?.(event)}
                                        className="p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#111827'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3">
                                                <div className="text-2xl">{getEventIcon(event.type)}</div>
                                                <div>
                                                    <p className="font-semibold" style={{ color: '#111827' }}>{event.name}</p>
                                                    <p className="text-xs text-gray-600">{event.venue}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        🕒 {event.startTimeFormatted} - {event.endTimeFormatted} • 👥 {event.estimatedAttendees.toLocaleString()} người
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(event.riskScore)}`}>
                                                {event.riskScore}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PREEMPTIVE ACTIONS */}
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                            <span>⚡</span>
                            <span>Hành Động Khuyến Nghị</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {actions.map((action) => {
                                const isActive = activeActions.has(action.id);
                                const isDisabled = action.status === 'disabled' || peakRisk.level < action.requiredRiskLevel;

                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => handleActionTrigger(action)}
                                        disabled={isDisabled}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isDisabled
                                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                            : isActive
                                                ? 'bg-gray-100 shadow-lg'
                                                : 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md'
                                            }`}
                                        style={!isDisabled ? { borderColor: isActive ? '#111827' : '#E5E7EB' } : undefined}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-2xl">{action.icon}</span>
                                            {isActive && <span className="font-bold text-sm" style={{ color: '#111827' }}>✓ Đang Hoạt Động</span>}
                                        </div>
                                        <p className="font-semibold text-sm mb-1" style={{ color: '#111827' }}>{action.label}</p>
                                        <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
                                        <p className="text-xs text-gray-500 mt-2">📍 {action.targetArea}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ROUTE ALTERNATIVES */}
                    {routes.length > 0 && (
                        <div className="bg-white rounded-lg shadow-lg p-4">
                            <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                                <span>🛣️</span>
                                <span>Tuyến Đường Thay Thế</span>
                            </h3>
                            <div className="space-y-2">
                                {routes.map((route) => (
                                    <div key={route.routeId} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#111827'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold" style={{ color: '#111827' }}>{route.name}</span>
                                            <span className="text-sm text-gray-600">{route.distanceKm.toFixed(1)} km</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-600">Hiện tại:</span>
                                                <span className="ml-1 font-semibold" style={{ color: '#111827' }}>+{route.currentDelay} phút</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Dự đoán:</span>
                                                <span className="ml-1 font-semibold" style={{ color: '#111827' }}>+{route.predictedDelay} phút</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PredictiveTimeline;
