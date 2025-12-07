/**
 * @file Polyline.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/Polyline
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Polyline component compatible with react-leaflet's Polyline API.
 * Renders line geometries on the map using MapLibre GL JS.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import React, { useId, useEffect, ReactNode, useState } from 'react';
import { Source, Layer, Popup as RMGPopup } from 'react-map-gl/maplibre';
import { useMap as useReactMapGL } from 'react-map-gl/maplibre';
import type { LatLngExpression, PathOptions } from './types';

export interface PolylineProps {
    positions: LatLngExpression[] | LatLngExpression[][];
    pathOptions?: PathOptions;
    color?: string;
    weight?: number;
    opacity?: number;
    dashArray?: string;
    children?: ReactNode;
    eventHandlers?: {
        click?: (e: any) => void;
        mouseover?: (e: any) => void;
        mouseout?: (e: any) => void;
    };
}

// Convert positions to GeoJSON coordinates [lng, lat]
function toGeoJSONCoordinates(positions: LatLngExpression[]): [number, number][] {
    return positions.map((pos) => {
        if (Array.isArray(pos)) {
            return [pos[1], pos[0]] as [number, number]; // [lng, lat]
        }
        if ('lat' in pos && 'lng' in pos) {
            return [pos.lng, pos.lat] as [number, number];
        }
        if ('latitude' in pos && 'longitude' in pos) {
            return [pos.longitude, pos.latitude] as [number, number];
        }
        throw new Error('Invalid position format');
    });
}

export const Polyline: React.FC<PolylineProps> = ({
    positions,
    pathOptions = {},
    color,
    weight,
    opacity,
    dashArray,
    children,
    eventHandlers = {},
}) => {
    const id = useId().replace(/:/g, '');
    const sourceId = `polyline-source-${id}`;
    const layerId = `polyline-layer-${id}`;
    const { current: map } = useReactMapGL();
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null);

    // Determine if positions is multi-line or single line
    const isMultiLine = Array.isArray(positions[0]) && Array.isArray(positions[0][0]);

    // Convert positions to GeoJSON
    const geojson: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> = isMultiLine
        ? {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiLineString',
                coordinates: (positions as LatLngExpression[][]).map(toGeoJSONCoordinates),
            },
        }
        : {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: toGeoJSONCoordinates(positions as LatLngExpression[]),
            },
        };

    // Get styling options
    const lineColor = color || pathOptions.color || '#3388ff';
    const lineWidth = weight ?? pathOptions.weight ?? 3;
    const lineOpacity = opacity ?? pathOptions.opacity ?? 1;

    // Set up event handlers
    useEffect(() => {
        if (!map) return;

        const handleClick = (e: any) => {
            if (e.features?.length > 0 && e.features[0].layer.id === layerId) {
                setPopupPosition([e.lngLat.lng, e.lngLat.lat]);
                setShowPopup(true);
                eventHandlers.click?.(e);
            }
        };

        const handleMouseEnter = (e: any) => {
            map.getCanvas().style.cursor = 'pointer';
            eventHandlers.mouseover?.(e);
        };

        const handleMouseLeave = (e: any) => {
            map.getCanvas().style.cursor = '';
            eventHandlers.mouseout?.(e);
        };

        map.on('click', layerId, handleClick);
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);

        return () => {
            map.off('click', layerId, handleClick);
            map.off('mouseenter', layerId, handleMouseEnter);
            map.off('mouseleave', layerId, handleMouseLeave);
        };
    }, [map, layerId, eventHandlers]);

    // Parse dashArray for MapLibre format
    const lineDasharray = dashArray
        ? dashArray.split(/[,\s]+/).map(Number)
        : undefined;

    return (
        <>
            <Source id={sourceId} type="geojson" data={geojson}>
                <Layer
                    id={layerId}
                    type="line"
                    paint={{
                        'line-color': lineColor,
                        'line-width': lineWidth,
                        'line-opacity': lineOpacity,
                        ...(lineDasharray && { 'line-dasharray': lineDasharray }),
                    }}
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                    }}
                />
            </Source>

            {/* Popup for children */}
            {showPopup && popupPosition && children && (
                <RMGPopup
                    longitude={popupPosition[0]}
                    latitude={popupPosition[1]}
                    anchor="bottom"
                    onClose={() => setShowPopup(false)}
                >
                    {children}
                </RMGPopup>
            )}
        </>
    );
};

Polyline.displayName = 'Polyline';

export default Polyline;
