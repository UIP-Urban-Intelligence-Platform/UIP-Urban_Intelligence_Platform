/**
 * @file ZoomControl.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/ZoomControl
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description ZoomControl component compatible with react-leaflet's ZoomControl API.
 * Provides zoom in/out buttons for the map.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef } from 'react';
import { NavigationControl } from 'maplibre-gl';
import { useMapContext } from './MapContext';

export interface ZoomControlProps {
    position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    zoomInText?: string;
    zoomInTitle?: string;
    zoomOutText?: string;
    zoomOutTitle?: string;
}

// Position mapping for MapLibre
const positionMap: Record<string, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = {
    topleft: 'top-left',
    topright: 'top-right',
    bottomleft: 'bottom-left',
    bottomright: 'bottom-right',
};

export const ZoomControl: React.FC<ZoomControlProps> = ({
    position = 'topright',
    // Note: MapLibre NavigationControl doesn't support custom text/titles
    // These props are kept for API compatibility
    zoomInText: _zoomInText,
    zoomInTitle: _zoomInTitle,
    zoomOutText: _zoomOutText,
    zoomOutTitle: _zoomOutTitle,
}) => {
    const { map } = useMapContext();
    const controlRef = useRef<NavigationControl | null>(null);

    useEffect(() => {
        if (!map) return;

        // NavigationControl includes zoom buttons and compass
        // To only show zoom, we use showCompass: false
        const control = new NavigationControl({
            showCompass: false,
            showZoom: true,
            visualizePitch: false,
        });

        map.addControl(control, positionMap[position]);
        controlRef.current = control;

        return () => {
            if (map && controlRef.current) {
                try {
                    map.removeControl(controlRef.current);
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        };
    }, [map, position]);

    // This component doesn't render anything - MapLibre handles the UI
    return null;
};

export default ZoomControl;
