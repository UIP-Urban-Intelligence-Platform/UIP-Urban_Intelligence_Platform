/**
 * ClusteredAQIMarkers Component - Air Quality Station Clustering Layer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/ClusteredAQIMarkers
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-12-09
 * @modified 2025-12-09
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * Renders air quality monitoring station markers with AQI-level based emoji icons.
 * Visualizes PM2.5, PM10, CO, NO2, SO2, O3 levels with health-based color coding
 * following EPA Air Quality Index standards.
 *
 * Features:
 * - AQI-level emoji faces (😊😐😷😨😱☠️)
 * - Color-coded health categories (Good to Hazardous)
 * - Pollutant breakdown (PM2.5, PM10, CO, NO2, SO2, O3)
 * - Real-time measurements with timestamps
 *
 * Usage:
 *   <ClusteredAQIMarkers
 *     airQuality={aqiData}
 *     zoom={mapZoom}
 *     bounds={mapBounds}
 *     visible={filters.showAirQuality}
 *   />
 *
 * @see {@link https://www.epa.gov/aqi|EPA Air Quality Index}
 */

import React, { useMemo, useCallback } from 'react';
import { Marker, Popup, Tooltip, DivIcon } from './map';
import { useMap } from './map/useMap';
import { useSupercluster, ClusterPoint } from '../hooks/useSupercluster';
import { AirQuality } from '../types';
import { format, parseISO } from 'date-fns';

interface ClusteredAQIMarkersProps {
    airQuality: AirQuality[];
    visible: boolean;
    zoom: number;
    bounds: [number, number, number, number];
}

// Get AQI color and level info
const getAQIInfo = (aqi: number) => {
    if (aqi <= 50) {
        return {
            bg: '#10B981',
            border: '#059669',
            level: 'Good',
            emoji: '😊',
            textColor: '#059669'
        };
    } else if (aqi <= 100) {
        return {
            bg: '#F59E0B',
            border: '#D97706',
            level: 'Moderate',
            emoji: '😐',
            textColor: '#D97706'
        };
    } else if (aqi <= 150) {
        return {
            bg: '#F97316',
            border: '#EA580C',
            level: 'Unhealthy for Sensitive',
            emoji: '😷',
            textColor: '#EA580C'
        };
    } else if (aqi <= 200) {
        return {
            bg: '#EF4444',
            border: '#DC2626',
            level: 'Unhealthy',
            emoji: '😨',
            textColor: '#DC2626'
        };
    } else if (aqi <= 300) {
        return {
            bg: '#9333EA',
            border: '#7E22CE',
            level: 'Very Unhealthy',
            emoji: '😱',
            textColor: '#7E22CE'
        };
    } else {
        return {
            bg: '#7C2D12',
            border: '#431407',
            level: 'Hazardous',
            emoji: '☠️',
            textColor: '#431407'
        };
    }
};

// Create cluster icon
const createClusterIcon = (count: number, avgAQI: number) => {
    const size = count < 10 ? 40 : count < 50 ? 50 : 60;
    const fontSize = count < 10 ? 14 : count < 50 ? 16 : 18;
    const { bg, border } = getAQIInfo(avgAQI);

    return new DivIcon({
        html: `
      <div style="
        background: ${bg};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${border};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${fontSize}px;
        font-family: system-ui, -apple-system, sans-serif;
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        ${count}
      </div>
    `,
        className: 'aqi-cluster-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Create individual AQI icon with emoji
const createAQIIcon = (aq: AirQuality) => {
    const { bg, border, emoji } = getAQIInfo(aq.aqi);

    return new DivIcon({
        html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background: ${bg};
          border: 2px solid ${border};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          ${emoji}
        </div>
      </div>
    `,
        className: 'aqi-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
};

export const ClusteredAQIMarkers: React.FC<ClusteredAQIMarkersProps> = ({
    airQuality,
    visible,
    zoom,
    bounds,
}) => {
    const map = useMap();

    if (!visible) return null;

    // Convert bounds to object
    const boundsObj = useMemo(() => ({
        west: bounds[0],
        south: bounds[1],
        east: bounds[2],
        north: bounds[3],
    }), [bounds]);

    // Convert air quality to cluster points
    const clusterPoints: ClusterPoint[] = useMemo(() => {
        return airQuality
            .filter((aq) => {
                const lat = (aq?.location as any)?.lat || aq?.location?.latitude;
                const lng = (aq?.location as any)?.lng || aq?.location?.longitude;
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
            })
            .map((aq) => ({
                id: aq.id,
                lat: (aq.location as any).lat || aq.location.latitude,
                lng: (aq.location as any).lng || aq.location.longitude,
                properties: {
                    airQuality: aq,
                    aqi: aq.aqi,
                },
            }));
    }, [airQuality]);

    // Use supercluster
    const { clusters, getClusterExpansionZoom } = useSupercluster(clusterPoints, boundsObj, zoom, {
        radius: 70,
        maxZoom: 16,
        minZoom: 0,
        minPoints: 3,
    });

    // Handle cluster click
    const handleClusterClick = useCallback((cluster: any) => {
        if (cluster.isCluster && typeof cluster.id === 'number' && map) {
            const expansionZoom = getClusterExpansionZoom(cluster.id);
            map.flyTo([cluster.lat, cluster.lng], Math.min(expansionZoom, 18));
        }
    }, [getClusterExpansionZoom, map]);

    console.log('💨 ClusteredAQIMarkers:', {
        total: airQuality.length,
        clusterPoints: clusterPoints.length,
        visibleClusters: clusters.length,
        zoom,
    });

    return (
        <>
            {clusters.map((cluster) => {
                if (cluster.isCluster) {
                    // Calculate average AQI for cluster
                    const aqis = cluster.properties?.points?.map((p: any) => p.aqi) || [];
                    const avgAQI = aqis.reduce((sum: number, aqi: number) => sum + aqi, 0) / aqis.length || 50;

                    return (
                        <Marker
                            key={`aqi-cluster-${cluster.id}`}
                            position={[cluster.lat, cluster.lng]}
                            icon={createClusterIcon(cluster.pointCount || 0, avgAQI)}
                            eventHandlers={{
                                click: () => handleClusterClick(cluster),
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                                <strong>{cluster.pointCount} AQI stations</strong>
                                <br />
                                <span style={{ fontSize: '11px' }}>Avg AQI: {Math.round(avgAQI)}</span>
                            </Tooltip>
                        </Marker>
                    );
                }

                // Individual AQI marker
                const aq = cluster.properties?.airQuality as AirQuality;
                if (!aq) return null;

                const lat = cluster.lat;
                const lng = cluster.lng;
                const { level, textColor } = getAQIInfo(aq.aqi);

                return (
                    <Marker
                        key={aq.id}
                        position={[lat, lng]}
                        icon={createAQIIcon(aq)}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                            AQI: {aq.aqi} ({level})
                        </Tooltip>
                        <Popup>
                            <div className="p-3 min-w-[240px] bg-white text-gray-900">
                                <h3 className="font-bold text-lg mb-2 text-amber-600">Air Quality</h3>
                                <p className="text-sm text-gray-600 mb-2">{aq.location.station}</p>

                                <div className="space-y-1">
                                    <p className="text-sm">
                                        <span className="font-semibold">AQI:</span>{' '}
                                        <span
                                            className="font-semibold text-lg"
                                            style={{ color: textColor }}
                                        >
                                            {aq.aqi}
                                        </span>
                                        {' '}({level})
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">PM2.5:</span> {aq.pm25} µg/m³
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">PM10:</span> {aq.pm10} µg/m³
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">CO:</span> {aq.co} ppm
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">NO2:</span> {aq.no2} ppb
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {format(parseISO(aq.timestamp || aq.dateObserved || new Date().toISOString()), 'PPpp')}
                                    </p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default ClusteredAQIMarkers;
