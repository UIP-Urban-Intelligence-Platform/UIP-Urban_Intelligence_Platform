/**
 * Citizen Report Markers - Map Report Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/CitizenReportMarkers
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Citizen Report Markers Component - Displays crowdsourced reports on map.
 * Shows citizen-submitted reports with type-specific icons and colors.
 * 
 * Features:
 * - Type-based marker colors (air quality, congestion, accident, infrastructure)
 * - Custom icons for each report type
 * - Interactive popups with report details
 * - Photo display for reports with images
 * - Timestamp formatting
 * - Click handlers for detailed views
 * 
 * Report Types:
 * - Air Quality: Green marker
 * - Congestion: Orange marker
 * - Accident: Red marker
 * - Infrastructure: Blue marker
 * 
 * @dependencies
 * - react-map-gl@^7.1: MapLibre GL React bindings (MIT license)
 * - maplibre-gl@^4.7: Interactive maps (BSD-3-Clause)
 * - date-fns@^2.30: Date formatting
 */

import React, { useEffect, useCallback } from 'react';
import { Marker, Popup, useMap, DivIcon, latLngBounds } from './map';
import { CitizenReport, ReportType } from '../types/citizenReport';
import { format } from 'date-fns';

interface CitizenReportMarkersProps {
    reports: CitizenReport[];
    onReportClick?: (report: CitizenReport) => void;
}

// Define marker colors for each report type
const REPORT_COLORS: Record<ReportType, string> = {
    accident: '#EF4444', // Red
    traffic_jam: '#F59E0B', // Yellow/Amber
    flood: '#3B82F6', // Blue
    road_damage: '#1F2937', // Dark gray/black
    other: '#8B5CF6' // Purple
};

// Create custom marker icon - MapLibre compatible
const createMarkerIcon = (reportType: ReportType, aiVerified: boolean) => {
    const color = REPORT_COLORS[reportType];
    const opacity = aiVerified ? 1 : 0.6;

    const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer; pointer-events: auto;">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" 
            fill="${color}" 
            opacity="${opacity}" 
            stroke="#fff" 
            stroke-width="2"
            style="pointer-events: auto;"/>
      <circle cx="16" cy="16" r="6" fill="#fff" style="pointer-events: auto;"/>
      ${!aiVerified ? '<circle cx="16" cy="16" r="3" fill="#fbbf24" style="pointer-events: auto;"/>' : ''}
    </svg>
  `;

    return new DivIcon({
        html: svgIcon,
        className: 'custom-marker-icon',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42]
    });
};

// Get report type emoji
const getReportTypeEmoji = (reportType: ReportType): string => {
    const emojis: Record<ReportType, string> = {
        traffic_jam: '🚦',
        accident: '🚨',
        flood: '🌊',
        road_damage: '🕳️',
        other: '⚠️'
    };
    return emojis[reportType];
};

// Get AQI level and color
const getAQIInfo = (aqi: number) => {
    if (aqi <= 50) return { level: 'Good', color: 'text-green-600' };
    if (aqi <= 100) return { level: 'Moderate', color: 'text-yellow-600' };
    if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: 'text-orange-600' };
    if (aqi <= 200) return { level: 'Unhealthy', color: 'text-red-600' };
    if (aqi <= 300) return { level: 'Very Unhealthy', color: 'text-purple-600' };
    return { level: 'Hazardous', color: 'text-red-800' };
};

// Validate if coordinates are valid
// Latitude: -90 to 90, Longitude: -180 to 180
const isValidCoordinates = (lat: number, lng: number): boolean => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        return false;
    }
    // Check standard ranges
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return true;
    }
    // Check if swapped (lng in lat position, lat in lng position)
    if (lng >= -90 && lng <= 90 && lat >= -180 && lat <= 180) {
        return true; // Will be handled by getNormalizedCoordinates
    }
    return false;
};

// Get normalized coordinates - auto-swap if needed
const getNormalizedCoordinates = (lat: number, lng: number): [number, number] => {
    // Valid case
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
    }
    // Swapped case
    if (lng >= -90 && lng <= 90 && lat >= -180 && lat <= 180) {
        return [lng, lat];
    }
    // Fallback (should not reach here if isValidCoordinates was called first)
    return [lat, lng];
};

// Popup content component - receives onPopupClose from Marker
interface PopupContentProps {
    report: CitizenReport;
    onPopupClose?: () => void;
}

const PopupContent: React.FC<PopupContentProps> = ({ report, onPopupClose }) => {
    return (
        <div className="citizen-report-popup relative">
            {/* Close Button */}
            <button
                className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    // Use the callback from Marker to properly close popup and reset state
                    onPopupClose?.();
                }}
                aria-label="Close popup"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <span className="text-xl">{getReportTypeEmoji(report.reportType)}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base capitalize drop-shadow-sm">
                                {report.reportType.replace('_', ' ')}
                            </h3>
                            <p className="text-xs text-white/80">
                                {format(new Date(report.dateObserved), 'MMM dd, yyyy HH:mm')}
                            </p>
                        </div>
                    </div>
                    {report.aiVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-400/90 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm">
                            ✓ Verified
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400/90 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm">
                            ⏳ Pending
                        </span>
                    )}
                </div>
            </div>

            {/* Image */}
            {report.imageUrl && (
                <div className="relative">
                    <img
                        src={report.imageUrl}
                        alt="Report evidence"
                        className="w-full h-44 object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1f2937/ffffff?text=No+Image';
                        }}
                    />
                    {report.aiVerified && (
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                            {(report.aiConfidence * 100).toFixed(0)}% AI confidence
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3 bg-slate-800/50">
                {/* Description */}
                {report.description && (
                    <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
                        <p className="text-sm text-slate-200 italic leading-relaxed">"{report.description}"</p>
                    </div>
                )}

                {/* Location Info */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 border border-slate-600/30">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-400">📍</span>
                        <span className="font-medium text-slate-300">Location:</span>
                        <span className="text-slate-400 font-mono text-xs">
                            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-400">👤</span>
                        <span className="font-medium text-slate-300">User:</span>
                        <span className="text-slate-400">{report.userId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-purple-400">🆔</span>
                        <span className="font-medium text-slate-300">Report ID:</span>
                        <span className="text-slate-500 font-mono text-xs">{report.reportId.substring(0, 8)}...</span>
                    </div>
                </div>

                {/* Weather & Air Quality Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Weather Context */}
                    {report.weatherContext && (
                        <div className="bg-sky-900/40 rounded-lg p-3 border border-sky-700/40">
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-base">🌤️</span>
                                <span className="font-semibold text-sky-300 text-sm">Weather</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Temp:</span>
                                    <span className="font-semibold text-slate-200">
                                        {report.weatherContext.temperature.toFixed(1)}°C
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Condition:</span>
                                    <span className="font-medium text-slate-200 capitalize">
                                        {report.weatherContext.condition}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Humidity:</span>
                                    <span className="font-medium text-slate-200">
                                        {report.weatherContext.humidity}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Wind:</span>
                                    <span className="font-medium text-slate-200">
                                        {report.weatherContext.windSpeed} m/s
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Air Quality Context */}
                    {report.airQualityContext && (
                        <div className="bg-violet-900/40 rounded-lg p-3 border border-violet-700/40">
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-base">🌫️</span>
                                <span className="font-semibold text-violet-300 text-sm">Air Quality</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">AQI:</span>
                                    <span className={`font-bold px-1.5 py-0.5 rounded ${getAQIInfo(report.airQualityContext.aqi).color}`}>
                                        {report.airQualityContext.aqi}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className={`text-xs font-medium ${getAQIInfo(report.airQualityContext.aqi).color}`}>
                                        ({getAQIInfo(report.airQualityContext.aqi).level})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">PM2.5:</span>
                                    <span className="font-medium text-slate-200">
                                        {report.airQualityContext.pm25.toFixed(1)} μg/m³
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">PM10:</span>
                                    <span className="font-medium text-slate-200">
                                        {report.airQualityContext.pm10.toFixed(1)} μg/m³
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Main:</span>
                                    <span className="font-medium text-slate-200 uppercase">
                                        {report.airQualityContext.dominantPollutant}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CitizenReportMarkers: React.FC<CitizenReportMarkersProps> = ({
    reports,
    onReportClick
}) => {
    const map = useMap();
    // Track if initial fit bounds has been done to prevent zoom reset on data refresh
    const hasInitialFitRef = React.useRef(false);

    // Filter out reports with invalid coordinates
    const validReports = React.useMemo(() => {
        return reports.filter(report => {
            const isValid = isValidCoordinates(report.latitude, report.longitude);
            if (!isValid) {
                console.warn(`Skipping report ${report.id} with invalid coordinates: lat=${report.latitude}, lng=${report.longitude}`);
            }
            return isValid;
        });
    }, [reports]);

    // Center map on first report - ONLY on initial load, not on data refresh
    useEffect(() => {
        // Skip if already done initial fit or no reports
        if (hasInitialFitRef.current || validReports.length === 0 || !map) {
            return;
        }

        try {
            const coordinates = validReports.map(r => getNormalizedCoordinates(r.latitude, r.longitude));
            console.log('📍 CitizenReportMarkers - Initial fit bounds with coordinates:', coordinates);

            const bounds = latLngBounds(coordinates);
            const boundsLike = bounds.toBoundsLike();
            console.log('📍 CitizenReportMarkers - Bounds:', {
                sw: bounds.getSouthWest(),
                ne: bounds.getNorthEast(),
                boundsLike
            });

            // Use toBoundsLike() to get the proper format for fitBounds
            map.fitBounds(boundsLike, { padding: [50, 50], maxZoom: 14 });

            // Mark as done - won't fit bounds again on data refresh
            hasInitialFitRef.current = true;
        } catch (error) {
            console.warn('Failed to fit bounds:', error);
        }
    }, [validReports, map]);

    const handleMarkerClick = useCallback((report: CitizenReport) => {
        onReportClick?.(report);
        const [lat, lng] = getNormalizedCoordinates(report.latitude, report.longitude);
        map.setView([lat, lng], 15);
    }, [map, onReportClick]);

    return (
        <>
            {validReports.map((report) => {
                const [lat, lng] = getNormalizedCoordinates(report.latitude, report.longitude);
                return (
                    <Marker
                        key={report.id}
                        position={[lat, lng]}
                        icon={createMarkerIcon(report.reportType, report.aiVerified)}
                        eventHandlers={{
                            click: () => handleMarkerClick(report)
                        }}
                    >
                        <Popup maxWidth={400} closeButton={false}>
                            <PopupContent report={report} />
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};
