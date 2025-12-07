/**
 * @file useMapEvents.ts
 * @module apps/traffic-web-app/frontend/src/components/map/useMapEvents
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Hook for handling map events with Leaflet-compatible API.
 * Translates events to match react-leaflet's useMapEvents interface.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useCallback } from 'react';
import { useMap as useReactMapGL } from 'react-map-gl/maplibre';
import { LatLng } from './types';

interface LeafletPoint {
    x: number;
    y: number;
}

interface LeafletMouseEvent {
    latlng: LatLng;
    containerPoint: LeafletPoint;
    originalEvent: MouseEvent;
    target: any;
}

interface LeafletMoveEvent {
    target: any;
}

interface MapEventHandlers {
    click?: (e: LeafletMouseEvent) => void;
    dblclick?: (e: LeafletMouseEvent) => void;
    mousedown?: (e: LeafletMouseEvent) => void;
    mouseup?: (e: LeafletMouseEvent) => void;
    mouseover?: (e: LeafletMouseEvent) => void;
    mouseout?: (e: LeafletMouseEvent) => void;
    mousemove?: (e: LeafletMouseEvent) => void;
    contextmenu?: (e: LeafletMouseEvent) => void;
    movestart?: (e: LeafletMoveEvent) => void;
    move?: (e: LeafletMoveEvent) => void;
    moveend?: (e: LeafletMoveEvent) => void;
    zoomstart?: (e: LeafletMoveEvent) => void;
    zoom?: (e: LeafletMoveEvent) => void;
    zoomend?: (e: LeafletMoveEvent) => void;
    drag?: (e: LeafletMoveEvent) => void;
    dragstart?: (e: LeafletMoveEvent) => void;
    dragend?: (e: LeafletMoveEvent) => void;
    load?: (e: LeafletMoveEvent) => void;
}

/**
 * useMapEvents - Subscribe to map events with Leaflet-compatible API
 * 
 * @param handlers Object containing event handler functions
 * @returns null (component doesn't render anything)
 * 
 * @example
 * useMapEvents({
 *   click: (e) => console.log(e.latlng.lat, e.latlng.lng),
 *   moveend: () => console.log('Map moved'),
 * });
 */
export function useMapEvents(handlers: MapEventHandlers): null {
    const { current: map } = useReactMapGL();

    // Convert MapLibre event to Leaflet-compatible event
    const createLeafletMouseEvent = useCallback((e: maplibregl.MapMouseEvent): LeafletMouseEvent => {
        return {
            latlng: new LatLng(e.lngLat.lat, e.lngLat.lng),
            containerPoint: {
                x: e.point.x,
                y: e.point.y,
            },
            originalEvent: e.originalEvent,
            target: map,
        };
    }, [map]);

    const createLeafletMoveEvent = useCallback((): LeafletMoveEvent => {
        return {
            target: map,
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;

        const cleanupFunctions: Array<() => void> = [];

        // Mouse events
        if (handlers.click) {
            const handler = (e: maplibregl.MapMouseEvent) => handlers.click!(createLeafletMouseEvent(e));
            map.on('click', handler);
            cleanupFunctions.push(() => map.off('click', handler));
        }

        if (handlers.dblclick) {
            const handler = (e: maplibregl.MapMouseEvent) => handlers.dblclick!(createLeafletMouseEvent(e));
            map.on('dblclick', handler);
            cleanupFunctions.push(() => map.off('dblclick', handler));
        }

        if (handlers.mousedown) {
            const handler = (e: maplibregl.MapMouseEvent) => handlers.mousedown!(createLeafletMouseEvent(e));
            map.on('mousedown', handler);
            cleanupFunctions.push(() => map.off('mousedown', handler));
        }

        if (handlers.mouseup) {
            const handler = (e: maplibregl.MapMouseEvent) => handlers.mouseup!(createLeafletMouseEvent(e));
            map.on('mouseup', handler);
            cleanupFunctions.push(() => map.off('mouseup', handler));
        }

        if (handlers.mousemove) {
            const handler = (e: maplibregl.MapMouseEvent) => handlers.mousemove!(createLeafletMouseEvent(e));
            map.on('mousemove', handler);
            cleanupFunctions.push(() => map.off('mousemove', handler));
        }

        if (handlers.contextmenu) {
            const handler = (e: maplibregl.MapMouseEvent) => handlers.contextmenu!(createLeafletMouseEvent(e));
            map.on('contextmenu', handler);
            cleanupFunctions.push(() => map.off('contextmenu', handler));
        }

        // Move events
        if (handlers.movestart) {
            const handler = () => handlers.movestart!(createLeafletMoveEvent());
            map.on('movestart', handler);
            cleanupFunctions.push(() => map.off('movestart', handler));
        }

        if (handlers.move) {
            const handler = () => handlers.move!(createLeafletMoveEvent());
            map.on('move', handler);
            cleanupFunctions.push(() => map.off('move', handler));
        }

        if (handlers.moveend) {
            const handler = () => handlers.moveend!(createLeafletMoveEvent());
            map.on('moveend', handler);
            cleanupFunctions.push(() => map.off('moveend', handler));
        }

        // Zoom events
        if (handlers.zoomstart) {
            const handler = () => handlers.zoomstart!(createLeafletMoveEvent());
            map.on('zoomstart', handler);
            cleanupFunctions.push(() => map.off('zoomstart', handler));
        }

        if (handlers.zoom) {
            const handler = () => handlers.zoom!(createLeafletMoveEvent());
            map.on('zoom', handler);
            cleanupFunctions.push(() => map.off('zoom', handler));
        }

        if (handlers.zoomend) {
            const handler = () => handlers.zoomend!(createLeafletMoveEvent());
            map.on('zoomend', handler);
            cleanupFunctions.push(() => map.off('zoomend', handler));
        }

        // Drag events
        if (handlers.dragstart) {
            const handler = () => handlers.dragstart!(createLeafletMoveEvent());
            map.on('dragstart', handler);
            cleanupFunctions.push(() => map.off('dragstart', handler));
        }

        if (handlers.drag) {
            const handler = () => handlers.drag!(createLeafletMoveEvent());
            map.on('drag', handler);
            cleanupFunctions.push(() => map.off('drag', handler));
        }

        if (handlers.dragend) {
            const handler = () => handlers.dragend!(createLeafletMoveEvent());
            map.on('dragend', handler);
            cleanupFunctions.push(() => map.off('dragend', handler));
        }

        // Load event
        if (handlers.load) {
            const handler = () => handlers.load!(createLeafletMoveEvent());
            map.on('load', handler);
            cleanupFunctions.push(() => map.off('load', handler));
        }

        // Cleanup
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [map, handlers, createLeafletMouseEvent, createLeafletMoveEvent]);

    return null;
}

export default useMapEvents;
