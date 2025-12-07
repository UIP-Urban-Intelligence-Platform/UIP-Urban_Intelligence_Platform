/**
 * @file Tooltip.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/Tooltip
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Tooltip component compatible with react-leaflet's Tooltip API.
 * Displays hover tooltips for markers and other map elements.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import React, { ReactNode } from 'react';
import { Popup as RMGPopup } from 'react-map-gl/maplibre';
import type { LatLngExpression } from './types';

export interface TooltipProps {
    children?: ReactNode;
    position?: LatLngExpression;
    direction?: 'right' | 'left' | 'top' | 'bottom' | 'center' | 'auto';
    permanent?: boolean;
    sticky?: boolean;
    interactive?: boolean;
    opacity?: number;
    className?: string;
    offset?: [number, number];
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

export const Tooltip: React.FC<TooltipProps> = ({
    children,
    position,
    direction = 'auto',
    permanent = false,
    opacity = 0.9,
    className,
    offset = [0, 0],
}) => {
    // If no position, this is used as a child of Marker
    // Tooltips are handled differently in MapLibre - we'll use a simple div overlay
    if (!position) {
        // Return children wrapped in tooltip-styled div
        return (
            <div
                className={`maplibre-tooltip ${className || ''}`}
                style={{
                    background: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    opacity,
                    pointerEvents: permanent ? 'auto' : 'none',
                }}
            >
                {children}
            </div>
        );
    }

    const [lng, lat] = getCoordinates(position);

    // Convert direction to anchor
    const anchorMap: Record<string, string> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
        center: 'center',
        auto: 'bottom',
    };

    return (
        <RMGPopup
            longitude={lng}
            latitude={lat}
            anchor={anchorMap[direction] as any || 'bottom'}
            closeButton={false}
            closeOnClick={!permanent}
            offset={offset}
            className={`maplibre-tooltip ${className || ''}`}
        >
            <div
                style={{
                    background: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    opacity,
                }}
            >
                {children}
            </div>
        </RMGPopup>
    );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip;
