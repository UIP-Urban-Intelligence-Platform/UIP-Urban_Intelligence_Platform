/**
 * @file Polygon.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/Polygon
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Polygon component compatible with react-leaflet's Polygon API.
 * Renders filled polygon areas on the map using MapLibre GL JS.
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

export interface PolygonProps {
    positions: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][];
    pathOptions?: PathOptions;
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    children?: ReactNode;
    eventHandlers?: {
        click?: (e: any) => void;
        mouseover?: (e: any) => void;
        mouseout?: (e: any) => void;
    };
}

// Convert positions to GeoJSON coordinates [lng, lat]
function toGeoJSONCoordinates(positions: LatLngExpression[]): [number, number][] {
    const coords = positions.map((pos) => {
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

    // Ensure polygon is closed
    if (coords.length > 0) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            coords.push([...first]);
        }
    }

    return coords;
}

export const Polygon: React.FC<PolygonProps> = ({
    positions,
    pathOptions = {},
    color,
    weight,
    opacity,
    fillColor,
    fillOpacity,
    children,
    eventHandlers = {},
}) => {
    const id = useId().replace(/:/g, '');
    const sourceId = `polygon-source-${id}`;
    const fillLayerId = `polygon-fill-${id}`;
    const outlineLayerId = `polygon-outline-${id}`;
    const { current: map } = useReactMapGL();
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null);

    // Determine geometry type based on positions structure
    let coordinates: [number, number][][] | [number, number][][][];

    // Check if it's a simple polygon or multi-polygon
    const firstElement = positions[0];
    if (Array.isArray(firstElement)) {
        const secondElement = firstElement[0];
        if (Array.isArray(secondElement)) {
            const thirdElement = secondElement[0];
            if (Array.isArray(thirdElement)) {
                // Multi-polygon: [[[lat, lng], ...], ...]
                coordinates = (positions as LatLngExpression[][][]).map(
                    poly => poly.map(ring => toGeoJSONCoordinates(ring))
                );
            } else {
                // Polygon with holes: [[lat, lng], ...]
                coordinates = [(positions as LatLngExpression[][]).map(ring => toGeoJSONCoordinates(ring))];
            }
        } else {
            // Simple polygon: [lat, lng][]
            coordinates = [[toGeoJSONCoordinates(positions as LatLngExpression[])]];
        }
    } else {
        // Simple polygon with objects
        coordinates = [[toGeoJSONCoordinates(positions as LatLngExpression[])]];
    }

    const isMultiPolygon = coordinates.length > 1 || (coordinates[0] && coordinates[0].length > 1 && coordinates[0][0].length > 2);

    const geojson: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> = isMultiPolygon
        ? {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiPolygon',
                coordinates: coordinates as [number, number][][][],
            },
        }
        : {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: coordinates[0] || [[]],
            },
        };

    // Get styling options
    const strokeColor = color || pathOptions.color || '#3388ff';
    const strokeWidth = weight ?? pathOptions.weight ?? 2;
    const strokeOpacity = opacity ?? pathOptions.opacity ?? 0.6;
    const fill = fillColor || pathOptions.fillColor || strokeColor;
    const fillOp = fillOpacity ?? pathOptions.fillOpacity ?? 0.3;

    // Set up event handlers
    useEffect(() => {
        if (!map) return;

        const handleClick = (e: any) => {
            if (e.features?.length > 0) {
                const feature = e.features[0];
                if (feature.layer.id === fillLayerId || feature.layer.id === outlineLayerId) {
                    setPopupPosition([e.lngLat.lng, e.lngLat.lat]);
                    setShowPopup(true);
                    eventHandlers.click?.(e);
                }
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

        map.on('click', fillLayerId, handleClick);
        map.on('mouseenter', fillLayerId, handleMouseEnter);
        map.on('mouseleave', fillLayerId, handleMouseLeave);

        return () => {
            map.off('click', fillLayerId, handleClick);
            map.off('mouseenter', fillLayerId, handleMouseEnter);
            map.off('mouseleave', fillLayerId, handleMouseLeave);
        };
    }, [map, fillLayerId, outlineLayerId, eventHandlers]);

    return (
        <>
            <Source id={sourceId} type="geojson" data={geojson}>
                {/* Fill layer */}
                <Layer
                    id={fillLayerId}
                    type="fill"
                    paint={{
                        'fill-color': fill,
                        'fill-opacity': fillOp,
                    }}
                />
                {/* Outline layer */}
                <Layer
                    id={outlineLayerId}
                    type="line"
                    paint={{
                        'line-color': strokeColor,
                        'line-width': strokeWidth,
                        'line-opacity': strokeOpacity,
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

Polygon.displayName = 'Polygon';

export default Polygon;
