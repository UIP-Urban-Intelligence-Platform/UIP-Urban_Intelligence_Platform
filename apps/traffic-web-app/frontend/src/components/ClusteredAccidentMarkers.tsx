/**
 * ClusteredAccidentMarkers Component - Road Accident Clustering Layer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/ClusteredAccidentMarkers
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-12-09
 * @modified 2025-12-09
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * Renders road accident markers with severity-based emoji icons and intelligent clustering.
 * Visualizes accident locations, types, severities, and casualties for traffic safety analysis.
 *
 * Features:
 * - Severity-based emoji icons (💀🚨⚠️⚡)
 * - Color-coded severity levels (Fatal/Severe/Moderate/Minor)
 * - Accident type classification
 * - Casualties and vehicle count display
 *
 * Usage:
 *   <ClusteredAccidentMarkers
 *     accidents={accidentData}
 *     zoom={mapZoom}
 *     bounds={mapBounds}
 *     visible={filters.showAccidents}
 *   />
 *
 * @see {@link https://smartdatamodels.org/dataModel.Transportation/RoadAccident|NGSI-LD RoadAccident}
 */

import React, { useMemo, useCallback } from 'react';
import { Marker, Popup, Tooltip, DivIcon } from './map';
import { useMap } from './map/useMap';
import { useSupercluster, ClusterPoint } from '../hooks/useSupercluster';
import { Accident } from '../types';
import { format, parseISO } from 'date-fns';

interface ClusteredAccidentMarkersProps {
    accidents: Accident[];
    visible: boolean;
    zoom: number;
    bounds: [number, number, number, number];
    onAccidentClick?: (accident: Accident) => void;
}

// Get accident severity info
const getSeverityInfo = (severity: string) => {
    const sev = severity?.toLowerCase() || 'minor';

    if (sev === 'fatal') {
        return {
            bg: '#000000',
            border: '#374151',
            emoji: '💀',
            text: 'Fatal',
            textColor: '#000000'
        };
    } else if (sev === 'severe') {
        return {
            bg: '#DC2626',
            border: '#991B1B',
            emoji: '🚨',
            text: 'Severe',
            textColor: '#DC2626'
        };
    } else if (sev === 'moderate') {
        return {
            bg: '#F59E0B',
            border: '#D97706',
            emoji: '⚠️',
            text: 'Moderate',
            textColor: '#F59E0B'
        };
    } else {
        return {
            bg: '#EAB308',
            border: '#CA8A04',
            emoji: '⚡',
            text: 'Minor',
            textColor: '#EAB308'
        };
    }
};

// Create cluster icon
const createClusterIcon = (count: number, severityCounts: { fatal: number; severe: number; moderate: number; minor: number }) => {
    const size = count < 10 ? 40 : count < 30 ? 50 : 60;
    const fontSize = count < 10 ? 14 : count < 30 ? 16 : 18;

    // Determine cluster color based on most severe accident
    let bg = '#EAB308';
    let border = '#CA8A04';

    if (severityCounts.fatal > 0) {
        bg = '#000000';
        border = '#374151';
    } else if (severityCounts.severe > 0) {
        bg = '#DC2626';
        border = '#991B1B';
    } else if (severityCounts.moderate > 0) {
        bg = '#F59E0B';
        border = '#D97706';
    }

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
        className: 'accident-cluster-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Create individual accident icon with emoji
const createAccidentIcon = (accident: Accident) => {
    const { bg, border, emoji } = getSeverityInfo(accident.severity);

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
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          ${emoji}
        </div>
      </div>
    `,
        className: 'accident-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
};

export const ClusteredAccidentMarkers: React.FC<ClusteredAccidentMarkersProps> = ({
    accidents,
    visible,
    zoom,
    bounds,
    onAccidentClick,
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

    // Convert accidents to cluster points
    const clusterPoints: ClusterPoint[] = useMemo(() => {
        return accidents
            .filter((accident) => {
                const lat = accident?.location?.latitude || (accident?.location as any)?.lat;
                const lng = accident?.location?.longitude || (accident?.location as any)?.lng;
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
            })
            .map((accident) => ({
                id: accident.id,
                lat: accident.location.latitude || (accident.location as any).lat,
                lng: accident.location.longitude || (accident.location as any).lng,
                properties: {
                    accident,
                    severity: accident.severity,
                },
            }));
    }, [accidents]);

    // Use supercluster
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

    console.log('🚨 ClusteredAccidentMarkers:', {
        total: accidents.length,
        clusterPoints: clusterPoints.length,
        visibleClusters: clusters.length,
        zoom,
    });

    return (
        <>
            {clusters.map((cluster) => {
                if (cluster.isCluster) {
                    // Count severities in cluster
                    const severities = cluster.properties?.points?.map((p: any) => p.severity?.toLowerCase()) || [];
                    const severityCounts = {
                        fatal: severities.filter((s: string) => s === 'fatal').length,
                        severe: severities.filter((s: string) => s === 'severe').length,
                        moderate: severities.filter((s: string) => s === 'moderate').length,
                        minor: severities.filter((s: string) => s === 'minor').length,
                    };

                    return (
                        <Marker
                            key={`accident-cluster-${cluster.id}`}
                            position={[cluster.lat, cluster.lng]}
                            icon={createClusterIcon(cluster.pointCount || 0, severityCounts)}
                            eventHandlers={{
                                click: () => handleClusterClick(cluster),
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                                <strong>{cluster.pointCount} accidents</strong>
                                <br />
                                {severityCounts.fatal > 0 && <span style={{ color: '#000', fontSize: '11px' }}>💀 {severityCounts.fatal} Fatal</span>}
                                {severityCounts.severe > 0 && <span style={{ color: '#DC2626', fontSize: '11px' }}><br />🚨 {severityCounts.severe} Severe</span>}
                                {severityCounts.moderate > 0 && <span style={{ color: '#F59E0B', fontSize: '11px' }}><br />⚠️ {severityCounts.moderate} Moderate</span>}
                            </Tooltip>
                        </Marker>
                    );
                }

                // Individual accident marker
                const accident = cluster.properties?.accident as Accident;
                if (!accident) return null;

                const lat = cluster.lat;
                const lng = cluster.lng;
                const { text: severityText, textColor } = getSeverityInfo(accident.severity);

                return (
                    <Marker
                        key={accident.id}
                        position={[lat, lng]}
                        icon={createAccidentIcon(accident)}
                        eventHandlers={{
                            click: () => onAccidentClick?.(accident),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                            {severityText} - {accident.type}
                        </Tooltip>
                        <Popup>
                            <div className="p-3 min-w-[260px] bg-white text-gray-900">
                                <h3 className="font-bold text-lg mb-2 text-red-600">Accident</h3>
                                <p className="text-sm text-gray-600 mb-2">{accident.location.address}</p>

                                <div className="space-y-1 mb-2">
                                    <p className="text-sm">
                                        <span className="font-semibold">Type:</span> {accident.type}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Severity:</span>{' '}
                                        <span
                                            className="font-semibold"
                                            style={{ color: textColor }}
                                        >
                                            {severityText.toUpperCase()}
                                        </span>
                                    </p>
                                    {accident.vehicles !== undefined && (
                                        <p className="text-sm">
                                            <span className="font-semibold">Vehicles:</span> {accident.vehicles}
                                        </p>
                                    )}
                                    {accident.casualties !== undefined && accident.casualties > 0 && (
                                        <p className="text-sm font-semibold text-red-600">
                                            Casualties: {accident.casualties}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {format(parseISO(accident.timestamp || accident.dateDetected || new Date().toISOString()), 'PPpp')}
                                    </p>
                                </div>

                                {accident.description && (
                                    <p className="text-sm mt-2 p-2 bg-gray-100 rounded">{accident.description}</p>
                                )}

                                <button
                                    onClick={() => onAccidentClick?.(accident)}
                                    className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
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

export default ClusteredAccidentMarkers;
