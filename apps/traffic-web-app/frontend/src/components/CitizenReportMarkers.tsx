/**
 * Citizen Report Markers - Map Report Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
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
 * - react-leaflet@^4.2: Map markers
 * - leaflet@^1.9: Icon creation
 * - date-fns@^2.30: Date formatting
 */

import React, { useEffect, useCallback } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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

// Create custom marker icon
const createMarkerIcon = (reportType: ReportType, aiVerified: boolean) => {
    const color = REPORT_COLORS[reportType];
    const opacity = aiVerified ? 1 : 0.6;

    const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" 
            fill="${color}" 
            opacity="${opacity}" 
            stroke="#fff" 
            stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#fff"/>
      ${!aiVerified ? '<circle cx="16" cy="16" r="3" fill="#fbbf24"/>' : ''}
    </svg>
  `;

    return L.divIcon({
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

export const CitizenReportMarkers: React.FC<CitizenReportMarkersProps> = ({
    reports,
    onReportClick
}) => {
    const map = useMap();

    // Center map on first report if available
    useEffect(() => {
        if (reports.length > 0 && map) {
            const bounds = L.latLngBounds(
                reports.map(r => [r.latitude, r.longitude])
            );
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }, [reports, map]);

    const handleMarkerClick = useCallback((report: CitizenReport) => {
        onReportClick?.(report);
        map.setView([report.latitude, report.longitude], 15, { animate: true });
    }, [map, onReportClick]);

    return (
        <>
            {reports.map((report) => (
                <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={createMarkerIcon(report.reportType, report.aiVerified)}
                    eventHandlers={{
                        click: () => handleMarkerClick(report)
                    }}
                >
                    <Popup className="citizen-report-popup" maxWidth={400}>
                        <div className="p-2 min-w-[300px]">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getReportTypeEmoji(report.reportType)}</span>
                                    <div>
                                        <h3 className="font-bold text-gray-800 capitalize">
                                            {report.reportType.replace('_', ' ')}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(report.dateObserved), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {report.aiVerified ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                            ✓ Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                            ⏳ Pending
                                        </span>
                                    )}
                                    {report.aiVerified && (
                                        <span className="text-xs text-gray-600">
                                            {(report.aiConfidence * 100).toFixed(0)}% confidence
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Image */}
                            {report.imageUrl && (
                                <div className="mb-3">
                                    <img
                                        src={report.imageUrl}
                                        alt="Report evidence"
                                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Description */}
                            {report.description && (
                                <div className="mb-3">
                                    <p className="text-sm text-gray-700 italic">"{report.description}"</p>
                                </div>
                            )}

                            {/* Location */}
                            <div className="mb-3 p-2 bg-gray-50 rounded text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-600">📍 Location:</span>
                                    <span className="text-gray-700">
                                        {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-600">👤 User:</span>
                                    <span className="text-gray-700">{report.userId}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-600">🆔 Report ID:</span>
                                    <span className="text-gray-700 font-mono">{report.reportId.substring(0, 8)}...</span>
                                </div>
                            </div>

                            {/* Weather Context */}
                            {report.weatherContext && (
                                <div className="mb-3 p-2 bg-blue-50 rounded text-xs space-y-1">
                                    <div className="font-semibold text-blue-800 mb-1">🌤️ Weather</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-gray-600">Temp:</span>
                                            <span className="ml-1 text-gray-800 font-medium">
                                                {report.weatherContext.temperature.toFixed(1)}°C
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Condition:</span>
                                            <span className="ml-1 text-gray-800 font-medium">
                                                {report.weatherContext.condition}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Humidity:</span>
                                            <span className="ml-1 text-gray-800 font-medium">
                                                {report.weatherContext.humidity}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Wind:</span>
                                            <span className="ml-1 text-gray-800 font-medium">
                                                {report.weatherContext.windSpeed} m/s {report.weatherContext.windDirection}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Air Quality Context */}
                            {report.airQualityContext && (
                                <div className="p-2 bg-purple-50 rounded text-xs space-y-1">
                                    <div className="font-semibold text-purple-800 mb-1">🌫️ Air Quality</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-gray-600">AQI:</span>
                                            <span className={`ml-1 font-bold ${getAQIInfo(report.airQualityContext.aqi).color}`}>
                                                {report.airQualityContext.aqi}
                                            </span>
                                            <span className="ml-1 text-gray-600 text-xs">
                                                ({getAQIInfo(report.airQualityContext.aqi).level})
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">PM2.5:</span>
                                            <span className="ml-1 text-gray-800 font-medium">
                                                {report.airQualityContext.pm25.toFixed(1)} μg/m³
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">PM10:</span>
                                            <span className="ml-1 text-gray-800 font-medium">
                                                {report.airQualityContext.pm10.toFixed(1)} μg/m³
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Main:</span>
                                            <span className="ml-1 text-gray-800 font-medium uppercase">
                                                {report.airQualityContext.dominantPollutant}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};
