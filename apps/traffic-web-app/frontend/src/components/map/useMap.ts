/**
 * @file useMap.ts
 * @module apps/traffic-web-app/frontend/src/components/map/useMap
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Hook to access the map instance from any child component.
 * Compatible with react-leaflet's useMap() API.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import { useMap as useReactMapGL } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';

// Extended map interface with Leaflet-compatible methods
export interface MapInstance {
    // Leaflet-compatible methods
    setView: (center: [number, number], zoom?: number) => void;
    flyTo: (center: [number, number], zoom?: number) => void;
    getCenter: () => { lat: number; lng: number };
    getZoom: () => number;
    getBounds: () => {
        getSouthWest: () => { lat: number; lng: number };
        getNorthEast: () => { lat: number; lng: number };
        getCenter: () => { lat: number; lng: number };
    };
    fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: number | number[]; maxZoom?: number }) => void;
    panTo: (center: [number, number]) => void;
    setZoom: (zoom: number) => void;
    invalidateSize: () => void;
    removeLayer: (layer: any) => void;
    addLayer: (layer: any) => void;
    hasLayer: (layer: any) => boolean;
    eachLayer: (callback: (layer: any) => void) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler: (...args: any[]) => void) => void;
    // Original MapLibre methods
    getMap: () => MapRef | null;
}

/**
 * useMap - Get map instance with Leaflet-compatible API
 * 
 * @returns Map instance with both MapLibre and Leaflet-compatible methods
 */
export function useMap(): MapInstance {
    const { current: map } = useReactMapGL();

    if (!map) {
        throw new Error('useMap must be used within a MapContainer');
    }

    // Create a proxy that adds Leaflet-compatible methods
    const mapWithLeafletAPI = new Proxy(map as unknown as MapInstance, {
        get(_target, prop) {
            const actualMap = map; // Use the original map ref
            // Leaflet-compatible methods
            switch (prop) {
                case 'setView':
                    return (center: [number, number], zoom?: number) => {
                        actualMap.jumpTo({ center: [center[1], center[0]], zoom });
                    };

                case 'flyTo':
                    return (center: [number, number], zoom?: number) => {
                        actualMap.flyTo({ center: [center[1], center[0]], zoom, duration: 1500 });
                    };

                case 'getCenter':
                    return () => {
                        const center = actualMap.getCenter();
                        return { lat: center.lat, lng: center.lng };
                    };

                case 'getZoom':
                    return () => actualMap.getZoom();

                case 'getBounds':
                    return () => {
                        const bounds = actualMap.getBounds();
                        return {
                            getSouthWest: () => ({ lat: bounds.getSouth(), lng: bounds.getWest() }),
                            getNorthEast: () => ({ lat: bounds.getNorth(), lng: bounds.getEast() }),
                            getCenter: () => {
                                const center = bounds.getCenter();
                                return { lat: center.lat, lng: center.lng };
                            },
                        };
                    };

                case 'fitBounds':
                    return (bounds: [[number, number], [number, number]], options?: { padding?: number | number[]; maxZoom?: number }) => {
                        // bounds can be either:
                        // - Leaflet format: [[lat, lng], [lat, lng]] where lat is in [-90, 90]
                        // - MapLibre format: [[lng, lat], [lng, lat]] where first value is lng in [-180, 180]

                        // Detect format by checking if first value of first point is a valid longitude (> 90 or < -90)
                        // or if second value is a valid latitude (within [-90, 90])
                        const [[a, b], [c, d]] = bounds;

                        let mlBounds: [[number, number], [number, number]];

                        // If first value looks like longitude (outside lat range but inside lng range)
                        // Then it's already MapLibre format [[lng, lat], [lng, lat]]
                        const firstIsLng = (a < -90 || a > 90) && (a >= -180 && a <= 180);
                        const secondIsLat = b >= -90 && b <= 90;

                        if (firstIsLng || (secondIsLat && Math.abs(a) > Math.abs(b))) {
                            // Already MapLibre format [[lng, lat], [lng, lat]]
                            mlBounds = bounds;
                        } else {
                            // Leaflet format [[lat, lng], [lat, lng]] - convert to [[lng, lat], [lng, lat]]
                            mlBounds = [
                                [b, a], // [lng, lat]
                                [d, c], // [lng, lat]
                            ];
                        }

                        // Validate before calling fitBounds
                        const [[lng1, lat1], [lng2, lat2]] = mlBounds;
                        if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
                            console.error('Invalid bounds latitude:', { mlBounds, original: bounds });
                            return;
                        }
                        if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) {
                            console.error('Invalid bounds longitude:', { mlBounds, original: bounds });
                            return;
                        }

                        actualMap.fitBounds(mlBounds, {
                            padding: typeof options?.padding === 'number' ? options.padding : 50,
                            maxZoom: options?.maxZoom,
                        });
                    };

                case 'panTo':
                    return (center: [number, number]) => {
                        actualMap.panTo([center[1], center[0]]);
                    };

                case 'setZoom':
                    return (zoom: number) => {
                        actualMap.setZoom(zoom);
                    };

                case 'invalidateSize':
                    return () => {
                        actualMap.resize();
                    };

                case 'removeLayer':
                case 'addLayer':
                case 'hasLayer':
                case 'eachLayer':
                    // These are no-ops for compatibility - layers are handled differently in MapLibre
                    return () => { };

                case 'on':
                    return (event: string, handler: (...args: any[]) => void) => {
                        // Convert Leaflet event names to MapLibre
                        const eventMap: Record<string, string> = {
                            'moveend': 'moveend',
                            'zoomend': 'zoomend',
                            'click': 'click',
                            'mousemove': 'mousemove',
                            'load': 'load',
                        };
                        const mlEvent = eventMap[event] || event;
                        actualMap.on(mlEvent, handler);
                    };

                case 'off':
                    return (event: string, handler: (...args: any[]) => void) => {
                        actualMap.off(event, handler);
                    };

                case 'getMap':
                    return () => actualMap;

                default:
                    // Return original MapLibre method/property
                    const value = (actualMap as any)[prop];
                    if (typeof value === 'function') {
                        return value.bind(actualMap);
                    }
                    return value;
            }
        },
    }) as MapInstance;

    return mapWithLeafletAPI;
}

export default useMap;
