/**
 * ClusteredPatternMarkers Component - Traffic Pattern Clustering Layer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/ClusteredPatternMarkers
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-12-09
 * @modified 2025-12-09
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * Renders traffic pattern markers with intelligent clustering and pattern-type based icons.
 * Visualizes historical traffic patterns detected by Pattern Recognition Agent including
 * rush hours, anomalies, weekly patterns, and ARIMA forecasts.
 *
 * Features:
 * - Pattern type-based icons (🌀🚦⚠️🚧📍🔄)
 * - Congestion level coloring (red/orange/green)
 * - Time range and affected cameras display
 * - Rush hour detection visualization
 *
 * Usage:
 *   <ClusteredPatternMarkers
 *     patterns={trafficPatterns}
 *     zoom={mapZoom}
 *     bounds={mapBounds}
 *     visible={filters.showPatterns}
 *   />
 *
 * Note: Requires ≥30 observations in Neo4j for pattern detection.
 */

import React, { useMemo, useCallback } from 'react';
import { Marker, Popup, Tooltip, DivIcon } from './map';
import { useMap } from './map/useMap';
import { useSupercluster, ClusterPoint } from '../hooks/useSupercluster';
import { TrafficPattern } from '../types';

interface ClusteredPatternMarkersProps {
    patterns: TrafficPattern[];
    visible: boolean;
    zoom: number;
    bounds: [number, number, number, number];
    onPatternClick?: (pattern: TrafficPattern) => void;
}

// Get congestion color
const getCongestionColor = (level: string) => {
    const levelLower = level?.toLowerCase() || 'low';
    if (levelLower.includes('high') || levelLower.includes('severe')) {
        return { bg: '#EF4444', border: '#DC2626', text: 'High' };
    } else if (levelLower.includes('medium') || levelLower.includes('moderate')) {
        return { bg: '#F59E0B', border: '#D97706', text: 'Medium' };
    } else {
        return { bg: '#10B981', border: '#059669', text: 'Low' };
    }
};

// Create cluster icon
const createClusterIcon = (count: number, dominantLevel: string) => {
    const size = count < 5 ? 40 : count < 15 ? 50 : 60;
    const fontSize = count < 5 ? 14 : count < 15 ? 16 : 18;
    const { bg, border } = getCongestionColor(dominantLevel);

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
        className: 'pattern-cluster-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Create individual pattern icon
const createPatternIcon = (pattern: TrafficPattern) => {
    const { bg, border } = getCongestionColor(pattern.congestionLevel);

    // Determine emoji based on pattern type
    let emoji = '🌀';
    const patternType = pattern.patternType?.toLowerCase() || '';

    if (patternType.includes('congestion') || patternType.includes('jam')) {
        emoji = '🚦';
    } else if (patternType.includes('accident') || patternType.includes('incident')) {
        emoji = '⚠️';
    } else if (patternType.includes('construction') || patternType.includes('roadwork')) {
        emoji = '🚧';
    } else if (patternType.includes('event')) {
        emoji = '📍';
    } else if (patternType.includes('recurring')) {
        emoji = '🔄';
    }

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
        className: 'pattern-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
};

export const ClusteredPatternMarkers: React.FC<ClusteredPatternMarkersProps> = ({
    patterns,
    visible,
    zoom,
    bounds,
    onPatternClick,
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

    // Convert patterns to cluster points - use startPoint from location
    const clusterPoints: ClusterPoint[] = useMemo(() => {
        return patterns
            .filter((p) => {
                const startPoint = p.location?.startPoint;
                if (startPoint) {
                    const lat = startPoint?.latitude || (startPoint as any)?.lat;
                    const lng = startPoint?.longitude || (startPoint as any)?.lng;
                    return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
                }
                return false;
            })
            .map((p) => {
                const startPoint = p.location!.startPoint;
                const lat = startPoint?.latitude || (startPoint as any)?.lat;
                const lng = startPoint?.longitude || (startPoint as any)?.lng;
                return {
                    id: p.id,
                    lat,
                    lng,
                    properties: {
                        pattern: p,
                        congestionLevel: p.congestionLevel,
                    },
                };
            });
    }, [patterns]);    // Use supercluster
    const { clusters, getClusterExpansionZoom } = useSupercluster(clusterPoints, boundsObj, zoom, {
        radius: 60,
        maxZoom: 15,
        minZoom: 0,
        minPoints: 2,
    });

    // Handle cluster click
    const handleClusterClick = useCallback((cluster: any) => {
        if (cluster.isCluster && typeof cluster.id === 'number' && map) {
            const expansionZoom = getClusterExpansionZoom(cluster.id);
            map.flyTo([cluster.lat, cluster.lng], Math.min(expansionZoom, 18));
        }
    }, [getClusterExpansionZoom, map]);

    console.log('🌀 ClusteredPatternMarkers:', {
        total: patterns.length,
        clusterPoints: clusterPoints.length,
        visibleClusters: clusters.length,
        zoom,
    });

    return (
        <>
            {clusters.map((cluster) => {
                if (cluster.isCluster) {
                    // Determine dominant congestion level
                    const levels = cluster.properties?.points?.map((p: any) => p.congestionLevel) || [];
                    const dominantLevel = levels.filter((l: string) =>
                        l?.toLowerCase().includes('high') || l?.toLowerCase().includes('severe')
                    ).length > 0 ? 'high' : levels[0] || 'low';

                    return (
                        <Marker
                            key={`pattern-cluster-${cluster.id}`}
                            position={[cluster.lat, cluster.lng]}
                            icon={createClusterIcon(cluster.pointCount || 0, dominantLevel)}
                            eventHandlers={{
                                click: () => handleClusterClick(cluster),
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                                <strong>{cluster.pointCount} traffic patterns</strong>
                                <br />
                                <span style={{ fontSize: '11px' }}>Click to expand</span>
                            </Tooltip>
                        </Marker>
                    );
                }

                // Individual pattern marker
                const pattern = cluster.properties?.pattern as TrafficPattern;
                if (!pattern) return null;

                const lat = cluster.lat;
                const lng = cluster.lng;
                const { text: levelText } = getCongestionColor(pattern.congestionLevel);

                return (
                    <Marker
                        key={pattern.id}
                        position={[lat, lng]}
                        icon={createPatternIcon(pattern)}
                        eventHandlers={{
                            click: () => onPatternClick?.(pattern),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                            {pattern.patternType} - {levelText}
                        </Tooltip>
                        <Popup>
                            <div className="p-3 min-w-[260px] bg-white text-gray-900">
                                <h3 className="font-bold text-lg mb-2 text-purple-600">Traffic Pattern</h3>

                                <div className="space-y-1 mb-2">
                                    <p className="text-sm">
                                        <span className="font-semibold">Type:</span> {pattern.patternType}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Congestion:</span>{' '}
                                        <span
                                            className="font-semibold"
                                            style={{ color: getCongestionColor(pattern.congestionLevel).bg }}
                                        >
                                            {levelText}
                                        </span>
                                    </p>
                                    {pattern.timeRange && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Time:</span> {pattern.timeRange}
                                        </p>
                                    )}
                                    {pattern.averageSpeed !== undefined && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Avg Speed:</span> {pattern.averageSpeed} km/h
                                        </p>
                                    )}
                                    {pattern.vehicleCount !== undefined && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Vehicles:</span> {pattern.vehicleCount}
                                        </p>
                                    )}
                                    {pattern.affectedCameras && pattern.affectedCameras.length > 0 && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Cameras:</span> {pattern.affectedCameras.length}
                                        </p>
                                    )}
                                </div>

                                {pattern.predictions && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded">
                                        <p className="text-sm">
                                            <span className="font-semibold">Prediction:</span> {pattern.predictions.nextHour} km/h
                                            <br />
                                            <span className="text-xs">
                                                ({(pattern.predictions.confidence * 100).toFixed(1)}% confidence)
                                            </span>
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => onPatternClick?.(pattern)}
                                    className="mt-3 w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                                >
                                    View Details
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default ClusteredPatternMarkers;
