1/**
 * ClusteredMarkers Component - Marker Clustering Layer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @description
 * Component that renders clustered markers using Supercluster.
 * Automatically clusters nearby markers when zoomed out.
 */

import React, { useMemo, useCallback } from 'react';
import { Marker, Popup, Tooltip, DivIcon } from './map';
import { useSupercluster, ClusterPoint, ClusterResult } from '../hooks/useSupercluster';
import { Camera } from '../types';

// Helper functions for weather/AQI display
interface WeatherData {
    temperature: number;
    condition: string;
    humidity: number;
}

interface AQIData {
    aqi: number;
    level: string;
}

interface ClusteredMarkersProps {
    cameras: Camera[];
    zoom: number;
    bounds: [number, number, number, number]; // [west, south, east, north]
    onCameraClick: (camera: Camera) => void;
    mapRef: React.MutableRefObject<any>;
    getWeatherAtLocation?: (lat: number, lng: number) => WeatherData | null;
    getAQIAtLocation?: (lat: number, lng: number) => AQIData | null;
    getRecentAccidentsCount?: (lat: number, lng: number) => number;
    getAQIColor?: (level: string) => string;
}

// Create cluster icon using DivIcon
const createClusterIcon = (count: number, size: 'small' | 'medium' | 'large') => {
    const sizeMap = {
        small: { diameter: 40, fontSize: 14 },
        medium: { diameter: 50, fontSize: 16 },
        large: { diameter: 60, fontSize: 18 },
    };

    const { diameter, fontSize } = sizeMap[size];
    const colorMap = {
        small: { bg: '#3B82F6', border: '#2563EB' },    // Blue
        medium: { bg: '#F59E0B', border: '#D97706' },   // Yellow/Orange
        large: { bg: '#EF4444', border: '#DC2626' },    // Red
    };
    const { bg, border } = colorMap[size];

    return new DivIcon({
        html: `
      <div style="
        background: ${bg};
        width: ${diameter}px;
        height: ${diameter}px;
        border-radius: 50%;
        border: 3px solid ${border};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
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
        className: 'cluster-marker',
        iconSize: [diameter, diameter],
        iconAnchor: [diameter / 2, diameter / 2],
    });
};

// Create camera icon using DivIcon
const createCameraIcon = (status: string) => {
    const statusColors: Record<string, { bg: string; border: string; pulse: string }> = {
        active: { bg: '#10B981', border: '#059669', pulse: '#34D399' },
        online: { bg: '#10B981', border: '#059669', pulse: '#34D399' },
        inactive: { bg: '#EF4444', border: '#DC2626', pulse: '#F87171' },
        offline: { bg: '#EF4444', border: '#DC2626', pulse: '#F87171' },
        maintenance: { bg: '#F59E0B', border: '#D97706', pulse: '#FBBF24' },
        unknown: { bg: '#6B7280', border: '#4B5563', pulse: '#9CA3AF' },
    };

    const colors = statusColors[status] || statusColors.unknown;

    return new DivIcon({
        html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          background: ${colors.bg};
          border: 2px solid ${colors.border};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="16" height="16">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
      </div>
    `,
        className: 'camera-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
};

// Get cluster size category
const getClusterSize = (count: number): 'small' | 'medium' | 'large' => {
    if (count < 10) return 'small';
    if (count < 50) return 'medium';
    return 'large';
};

export const ClusteredMarkers: React.FC<ClusteredMarkersProps> = ({
    cameras,
    zoom,
    bounds,
    onCameraClick,
    mapRef,
    getWeatherAtLocation,
    getAQIAtLocation,
    getRecentAccidentsCount,
    getAQIColor,
}) => {
    // Convert bounds array to object format for useSupercluster
    const boundsObj = useMemo(() => ({
        west: bounds[0],
        south: bounds[1],
        east: bounds[2],
        north: bounds[3],
    }), [bounds]);

    // Convert cameras to cluster points
    const clusterPoints: ClusterPoint[] = useMemo(() => {
        return cameras
            .filter((camera) => {
                const lat = camera?.location?.latitude || (camera?.location as any)?.lat;
                const lng = camera?.location?.longitude || (camera?.location as any)?.lng;
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
            })
            .map((camera) => ({
                id: camera.id,
                lat: camera.location.latitude || (camera.location as any).lat,
                lng: camera.location.longitude || (camera.location as any).lng,
                properties: {
                    camera,
                },
            }));
    }, [cameras]);

    // Use supercluster hook
    const { clusters, getClusterExpansionZoom } = useSupercluster(clusterPoints, boundsObj, zoom, {
        radius: 60,
        maxZoom: 17,
        minZoom: 0,
        minPoints: 2,
    });

    // Handle cluster click - zoom to expansion level
    const handleClusterClick = useCallback(
        (cluster: ClusterResult) => {
            if (cluster.isCluster && typeof cluster.id === 'number' && mapRef.current) {
                const expansionZoom = getClusterExpansionZoom(cluster.id);
                const targetZoom = Math.min(expansionZoom, 18);
                mapRef.current.flyTo([cluster.lat, cluster.lng], targetZoom, {
                    duration: 0.5,
                });
            }
        },
        [getClusterExpansionZoom, mapRef]
    );

    console.log('🔵 ClusteredMarkers:', {
        totalCameras: cameras.length,
        clusterPoints: clusterPoints.length,
        visibleClusters: clusters.length,
        zoom,
        bounds,
    });

    return (
        <>
            {clusters.map((cluster) => {
                if (cluster.isCluster) {
                    // Render cluster marker
                    const size = getClusterSize(cluster.pointCount || 0);
                    return (
                        <Marker
                            key={`cluster-${cluster.id}`}
                            position={[cluster.lat, cluster.lng]}
                            icon={createClusterIcon(cluster.pointCount || 0, size)}
                            eventHandlers={{
                                click: () => handleClusterClick(cluster),
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                                <strong>{cluster.pointCount} cameras</strong>
                                <br />
                                <span style={{ fontSize: '11px', color: '#666' }}>Click to zoom in</span>
                            </Tooltip>
                        </Marker>
                    );
                }

                // Render individual camera marker
                const camera = cluster.properties?.camera as Camera;
                if (!camera) return null;

                const lat = cluster.lat;
                const lng = cluster.lng;
                const nearbyWeather = getWeatherAtLocation?.(lat, lng);
                const nearbyAQI = getAQIAtLocation?.(lat, lng);
                const recentAccidents = getRecentAccidentsCount?.(lat, lng) ?? 0;

                return (
                    <Marker
                        key={camera.id}
                        position={[lat, lng]}
                        icon={createCameraIcon(camera.status)}
                        eventHandlers={{
                            click: () => onCameraClick(camera),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                            <strong>{camera.name}</strong>
                        </Tooltip>
                        <Popup>
                            <div className="p-3 min-w-[280px] bg-white text-gray-900">
                                <h3 className="font-bold text-lg mb-2 text-blue-600">{camera.name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{camera.location.address}</p>

                                <div className="space-y-1 mb-3">
                                    <p className="text-sm">
                                        <span className="font-semibold">Type:</span> {camera.type || 'Static'}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Status:</span>{' '}
                                        <span
                                            className={`font-semibold ${camera.status === 'active' || camera.status === 'online'
                                                ? 'text-green-600'
                                                : camera.status === 'inactive' || camera.status === 'offline'
                                                    ? 'text-red-600'
                                                    : 'text-yellow-600'
                                                }`}
                                        >
                                            {camera.status}
                                        </span>
                                    </p>
                                </div>

                                {nearbyWeather && (
                                    <div className="border-t pt-2 mb-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Current Weather:</p>
                                        <p className="text-sm">{nearbyWeather.temperature}°C, {nearbyWeather.condition}</p>
                                        <p className="text-xs text-gray-600">Humidity: {nearbyWeather.humidity}%</p>
                                    </div>
                                )}

                                {nearbyAQI && (
                                    <div className="border-t pt-2 mb-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Air Quality:</p>
                                        <p className="text-sm">
                                            AQI: <span style={{ color: getAQIColor?.(nearbyAQI.level) || '#666', fontWeight: 'bold' }}>
                                                {nearbyAQI.aqi}
                                            </span> ({nearbyAQI.level})
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-2">
                                    <p className="text-sm">
                                        <span className="font-semibold">Recent Accidents (24h):</span>{' '}
                                        <span className={recentAccidents > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                                            {recentAccidents}
                                        </span>
                                    </p>
                                </div>

                                {camera.streamUrl && (
                                    <a
                                        href={camera.streamUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block mt-3 text-center bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors shadow-sm"
                                    >
                                        View Stream
                                    </a>
                                )}

                                <button
                                    onClick={() => onCameraClick(camera)}
                                    className="block w-full mt-2 text-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
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

export default ClusteredMarkers;
