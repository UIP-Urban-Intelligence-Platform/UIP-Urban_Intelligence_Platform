/**
 * @file MapContainer.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/MapContainer
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description React-leaflet compatible MapContainer using react-map-gl + MapLibre GL JS.
 * Provides the same API as react-leaflet's MapContainer for easy migration.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import React, { useRef, useCallback, forwardRef, useImperativeHandle, ReactNode } from 'react';
import Map, { MapRef, ViewStateChangeEvent, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { MapProvider, useMapContext } from './MapContext';
import type { LatLngExpression } from './types';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenStreetMap tile style for MapLibre
const OSM_STYLE = {
    version: 8 as const,
    sources: {
        osm: {
            type: 'raster' as const,
            tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
    },
    layers: [
        {
            id: 'osm',
            type: 'raster' as const,
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
        },
    ],
};

export interface MapContainerRef {
    getMap: () => MapRef | null;
    flyTo: (center: LatLngExpression, zoom?: number) => void;
    setView: (center: LatLngExpression, zoom?: number) => void;
    getCenter: () => { lat: number; lng: number } | null;
    getZoom: () => number | null;
    getBounds: () => {
        getSouthWest: () => { lat: number; lng: number };
        getNorthEast: () => { lat: number; lng: number };
    } | null;
    fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: number | number[] }) => void;
}

export interface MapContainerProps {
    children?: ReactNode;
    center?: LatLngExpression;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    className?: string;
    style?: React.CSSProperties;
    zoomControl?: boolean;
    scrollWheelZoom?: boolean;
    doubleClickZoom?: boolean;
    dragging?: boolean;
    whenCreated?: (map: MapRef) => void;
    whenReady?: () => void;
    onClick?: (e: { latlng: { lat: number; lng: number } }) => void;
    onMoveEnd?: (e: { target: MapRef }) => void;
    onZoomEnd?: (e: { target: MapRef }) => void;
}

// Inner component that uses context
const MapContainerInner = forwardRef<MapContainerRef, MapContainerProps>(({
    children,
    center = [10.8231, 106.6297], // Default: Ho Chi Minh City
    zoom = 13,
    minZoom = 1,
    maxZoom = 19,
    className = '',
    style,
    // zoomControl is handled by ZoomControl component separately
    scrollWheelZoom = true,
    doubleClickZoom = true,
    dragging = true,
    whenCreated,
    whenReady,
    onClick,
    onMoveEnd,
    onZoomEnd,
}, ref) => {
    const mapRef = useRef<MapRef>(null);
    const { setMap, setIsLoaded } = useMapContext();

    // Convert center to [lng, lat] format
    const getInitialCenter = (): [number, number] => {
        if (Array.isArray(center)) {
            return [center[1], center[0]]; // Convert [lat, lng] to [lng, lat]
        }
        if ('lat' in center && 'lng' in center) {
            return [center.lng, center.lat];
        }
        if ('latitude' in center && 'longitude' in center) {
            return [center.longitude, center.latitude];
        }
        return [106.6297, 10.8231]; // Default HCMC
    };

    const [lng, lat] = getInitialCenter();

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        getMap: () => mapRef.current,
        flyTo: (newCenter: LatLngExpression, newZoom?: number) => {
            if (!mapRef.current) return;
            const [newLng, newLat] = Array.isArray(newCenter)
                ? [newCenter[1], newCenter[0]]
                : 'lat' in newCenter
                    ? [newCenter.lng, newCenter.lat]
                    : [newCenter.longitude, newCenter.latitude];
            mapRef.current.flyTo({ center: [newLng, newLat], zoom: newZoom });
        },
        setView: (newCenter: LatLngExpression, newZoom?: number) => {
            if (!mapRef.current) return;
            const [newLng, newLat] = Array.isArray(newCenter)
                ? [newCenter[1], newCenter[0]]
                : 'lat' in newCenter
                    ? [newCenter.lng, newCenter.lat]
                    : [newCenter.longitude, newCenter.latitude];
            mapRef.current.jumpTo({ center: [newLng, newLat], zoom: newZoom });
        },
        getCenter: () => {
            if (!mapRef.current) return null;
            const center = mapRef.current.getCenter();
            return { lat: center.lat, lng: center.lng };
        },
        getZoom: () => mapRef.current?.getZoom() ?? null,
        getBounds: () => {
            if (!mapRef.current) return null;
            const bounds = mapRef.current.getBounds();
            return {
                getSouthWest: () => ({ lat: bounds.getSouth(), lng: bounds.getWest() }),
                getNorthEast: () => ({ lat: bounds.getNorth(), lng: bounds.getEast() }),
            };
        },
        fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: number | number[] }) => {
            if (!mapRef.current) return;
            // bounds is [[south, west], [north, east]] in Leaflet format
            // Convert to MapLibre format [[west, south], [east, north]]
            const mlBounds: [[number, number], [number, number]] = [
                [bounds[0][1], bounds[0][0]], // [west, south]
                [bounds[1][1], bounds[1][0]], // [east, north]
            ];
            mapRef.current.fitBounds(mlBounds, {
                padding: typeof options?.padding === 'number' ? options.padding : 50
            });
        },
    }), []);

    const handleLoad = useCallback(() => {
        if (mapRef.current) {
            setMap(mapRef.current);
            setIsLoaded(true);
            whenCreated?.(mapRef.current);
            whenReady?.();
        }
    }, [setMap, setIsLoaded, whenCreated, whenReady]);

    const handleClick = useCallback((e: MapLayerMouseEvent) => {
        onClick?.({
            latlng: { lat: e.lngLat.lat, lng: e.lngLat.lng }
        });
    }, [onClick]);

    const handleMoveEnd = useCallback((_e: ViewStateChangeEvent) => {
        if (mapRef.current) {
            onMoveEnd?.({ target: mapRef.current });
        }
    }, [onMoveEnd]);

    const handleZoomEnd = useCallback((_e: ViewStateChangeEvent) => {
        if (mapRef.current) {
            onZoomEnd?.({ target: mapRef.current });
        }
    }, [onZoomEnd]);

    return (
        <div className={className} style={{ width: '100%', height: '100%' }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: lng,
                    latitude: lat,
                    zoom: zoom,
                }}
                style={{ width: '100%', height: '100%', ...style }}
                mapStyle={OSM_STYLE}
                minZoom={minZoom}
                maxZoom={maxZoom}
                scrollZoom={scrollWheelZoom}
                doubleClickZoom={doubleClickZoom}
                dragPan={dragging}
                dragRotate={false}
                pitchWithRotate={false}
                touchZoomRotate={true}
                onLoad={handleLoad}
                onClick={handleClick}
                onMoveEnd={handleMoveEnd}
                onZoomEnd={handleZoomEnd}
                attributionControl={true}
            >
                {children}
            </Map>
        </div>
    );
});

MapContainerInner.displayName = 'MapContainerInner';

// Main component that provides context
export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>((props, ref) => {
    return (
        <MapProvider>
            <MapContainerInner ref={ref} {...props} />
        </MapProvider>
    );
});

MapContainer.displayName = 'MapContainer';
