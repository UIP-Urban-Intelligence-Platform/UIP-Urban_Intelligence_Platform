/**
 * @file Popup.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/Popup
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Popup component compatible with react-leaflet's Popup API.
 * Can be used standalone or as a child of Marker component.
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

export interface PopupProps {
    children?: ReactNode;
    position?: LatLngExpression;
    className?: string;
    maxWidth?: number;
    minWidth?: number;
    maxHeight?: number;
    autoPan?: boolean;
    autoPanPadding?: [number, number];
    closeButton?: boolean;
    closeOnClick?: boolean;
    closeOnEscapeKey?: boolean;
    offset?: [number, number];
    onClose?: () => void;
    onOpen?: () => void;
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

export const Popup: React.FC<PopupProps> = ({
    children,
    position,
    className,
    maxWidth = 300,
    closeButton = true,
    closeOnClick = true,
    offset = [0, 0],
    onClose,
    onOpen,
}) => {
    // If no position provided, this is a child of Marker and will be handled there
    if (!position) {
        return <>{children}</>;
    }

    const [lng, lat] = getCoordinates(position);

    return (
        <RMGPopup
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            closeButton={closeButton}
            closeOnClick={closeOnClick}
            onClose={onClose}
            onOpen={onOpen}
            offset={offset}
            maxWidth={`${maxWidth}px`}
            className={className}
        >
            <div style={{ maxWidth: `${maxWidth}px` }}>
                {children}
            </div>
        </RMGPopup>
    );
};

Popup.displayName = 'Popup';

export default Popup;
