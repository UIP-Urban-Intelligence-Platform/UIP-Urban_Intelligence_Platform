/**
 * ScaleControl Component - Map Scale Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @description
 * ScaleControl component compatible with react-leaflet's ScaleControl API.
 * Displays map scale indicator.
 */

import React, { useEffect, useRef } from 'react';
import { ScaleControl as MapLibreScaleControl } from 'maplibre-gl';
import { useMapContext } from './MapContext';

export interface ScaleControlProps {
    position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    maxWidth?: number;
    metric?: boolean;
    imperial?: boolean;
}

// Position mapping for MapLibre
const positionMap: Record<string, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = {
    topleft: 'top-left',
    topright: 'top-right',
    bottomleft: 'bottom-left',
    bottomright: 'bottom-right',
};

export const ScaleControl: React.FC<ScaleControlProps> = ({
    position = 'bottomleft',
    maxWidth = 100,
    metric = true,
    imperial = false,
}) => {
    const { map } = useMapContext();
    const controlRef = useRef<MapLibreScaleControl | null>(null);

    useEffect(() => {
        if (!map) return;

        // MapLibre ScaleControl supports 'metric', 'imperial', or 'nautical'
        const unit = metric ? 'metric' : imperial ? 'imperial' : 'metric';

        const control = new MapLibreScaleControl({
            maxWidth,
            unit,
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
    }, [map, position, maxWidth, metric, imperial]);

    // This component doesn't render anything - MapLibre handles the UI
    return null;
};

export default ScaleControl;
