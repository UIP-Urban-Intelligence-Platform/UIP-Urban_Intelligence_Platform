/**
 * @file CircleMarker.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/CircleMarker
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description CircleMarker component compatible with react-leaflet's CircleMarker API.
 * Renders circle markers on the map using MapLibre GL JS.
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

export interface CircleMarkerProps {
    center: LatLngExpression;
    radius?: number;
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

// Convert position to [lng, lat] for MapLibre
function getCoordinates(position: LatLngExpression): [number, number] {
    if (Array.isArray(position)) {
        return [position[1], position[0]]; // [lng, lat]
    }
    if ('lat' in position && 'lng' in position) {
        return [position.lng, position.lat];
    }
    if ('latitude' in position && 'longitude' in position) {
        return [position.longitude, position.latitude];
    }
    throw new Error('Invalid position format');
}

export const CircleMarker: React.FC<CircleMarkerProps> = ({
    center,
    radius = 10,
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
    const sourceId = `circle-source-${id}`;
    const layerId = `circle-layer-${id}`;
    // Note: outlineLayerId can be used for stroke effect if needed
    // const outlineLayerId = `circle-outline-${id}`;
    const { current: map } = useReactMapGL();
    const [showPopup, setShowPopup] = useState(false);
    const [lng, lat] = getCoordinates(center);

    // Create GeoJSON point
    const geojson: GeoJSON.Feature<GeoJSON.Point> = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Point',
            coordinates: [lng, lat],
        },
    };

    // Get styling options
    const strokeColor = color || pathOptions.color || '#3388ff';
    const strokeWidth = weight ?? pathOptions.weight ?? 2;
    const strokeOpacity = opacity ?? pathOptions.opacity ?? 1;
    const fill = fillColor || pathOptions.fillColor || strokeColor;
    const fillOp = fillOpacity ?? pathOptions.fillOpacity ?? 0.5;

    // Set up event handlers
    useEffect(() => {
        if (!map) return;

        const handleClick = (e: any) => {
            if (e.features?.length > 0 && e.features[0].layer.id === layerId) {
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

    return (
        <>
            <Source id={sourceId} type="geojson" data={geojson}>
                {/* Fill circle */}
                <Layer
                    id={layerId}
                    type="circle"
                    paint={{
                        'circle-radius': radius,
                        'circle-color': fill,
                        'circle-opacity': fillOp,
                        'circle-stroke-color': strokeColor,
                        'circle-stroke-width': strokeWidth,
                        'circle-stroke-opacity': strokeOpacity,
                    }}
                />
            </Source>

            {/* Popup for children */}
            {showPopup && children && (
                <RMGPopup
                    longitude={lng}
                    latitude={lat}
                    anchor="bottom"
                    onClose={() => setShowPopup(false)}
                >
                    {children}
                </RMGPopup>
            )}
        </>
    );
};

CircleMarker.displayName = 'CircleMarker';

export default CircleMarker;
