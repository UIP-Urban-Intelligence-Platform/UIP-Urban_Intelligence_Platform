/**
 * @file Marker.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/Marker
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Marker component compatible with react-leaflet's Marker API.
 * Supports custom icons, popups, tooltips, and event handlers.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import React, { ReactNode, useMemo, useCallback, useState } from 'react';
import { Marker as RMGMarker, Popup as RMGPopup } from 'react-map-gl/maplibre';
import type { LatLngExpression } from './types';

// Leaflet-compatible Icon interface
export interface IconOptions {
    iconUrl?: string;
    iconRetinaUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    shadowUrl?: string;
    shadowSize?: [number, number];
    shadowAnchor?: [number, number];
    className?: string;
    html?: string;
}

export interface Icon {
    options: IconOptions;
}

export interface DivIcon extends Icon {
    options: IconOptions & {
        html: string;
        className?: string;
    };
}

export interface MarkerProps {
    position: LatLngExpression;
    icon?: Icon | DivIcon | IconOptions;
    children?: ReactNode;
    draggable?: boolean;
    opacity?: number;
    zIndexOffset?: number;
    eventHandlers?: {
        click?: (e: any) => void;
        dblclick?: (e: any) => void;
        mousedown?: (e: any) => void;
        mouseup?: (e: any) => void;
        mouseover?: (e: any) => void;
        mouseout?: (e: any) => void;
        dragstart?: (e: any) => void;
        drag?: (e: any) => void;
        dragend?: (e: any) => void;
    };
}

// Validate coordinates are within valid ranges
// Latitude: -90 to 90, Longitude: -180 to 180
function validateCoordinates(lat: number, lng: number): [number, number] {
    // Check if values are valid numbers
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
    }

    // Check if latitude is within valid range
    if (lat < -90 || lat > 90) {
        // If longitude is within latitude range, values might be swapped
        if (lng >= -90 && lng <= 90) {
            console.warn(`Coordinates appear to be swapped. Swapping lat=${lat} with lng=${lng}`);
            return [lat, lng]; // Return as [lng, lat] - they were swapped in input
        }
        throw new Error(`Invalid latitude value: ${lat}. Must be between -90 and 90`);
    }

    // Check if longitude is within valid range
    if (lng < -180 || lng > 180) {
        throw new Error(`Invalid longitude value: ${lng}. Must be between -180 and 180`);
    }

    return [lng, lat]; // Return as [lng, lat] for MapLibre
}

// Convert position to [lng, lat] for MapLibre
function getCoordinates(position: LatLngExpression): [number, number] {
    let lat: number;
    let lng: number;

    if (Array.isArray(position)) {
        // Leaflet format: [lat, lng]
        [lat, lng] = position;
    } else if ('lat' in position && 'lng' in position) {
        lat = position.lat;
        lng = position.lng;
    } else if ('latitude' in position && 'longitude' in position) {
        lat = position.latitude;
        lng = position.longitude;
    } else {
        throw new Error('Invalid position format');
    }

    return validateCoordinates(lat, lng);
}

// Get icon options from icon prop
function getIconOptions(icon?: Icon | DivIcon | IconOptions): IconOptions {
    if (!icon) {
        return {
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        };
    }

    if ('options' in icon) {
        return icon.options;
    }

    return icon as IconOptions;
}

export const Marker: React.FC<MarkerProps> = ({
    position,
    icon,
    children,
    draggable = false,
    opacity = 1,
    eventHandlers = {},
}) => {
    const [lng, lat] = getCoordinates(position);
    const iconOptions = getIconOptions(icon);
    const [showPopup, setShowPopup] = useState(false);

    // Calculate anchor for MapLibre GL
    // MapLibre only accepts: 'center', 'top', 'bottom', 'left', 'right',
    // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    // We use 'center' and handle offset manually in the marker content
    const anchor = useMemo((): 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
        if (iconOptions.iconAnchor && iconOptions.iconSize) {
            const [anchorX, anchorY] = iconOptions.iconAnchor;
            const [width, height] = iconOptions.iconSize;

            // Determine anchor position based on relative anchor point
            const xRatio = anchorX / width;
            const yRatio = anchorY / height;

            // Map to closest valid anchor string
            if (yRatio >= 0.8) {
                // Anchor near bottom
                if (xRatio <= 0.3) return 'bottom-left';
                if (xRatio >= 0.7) return 'bottom-right';
                return 'bottom';
            } else if (yRatio <= 0.2) {
                // Anchor near top
                if (xRatio <= 0.3) return 'top-left';
                if (xRatio >= 0.7) return 'top-right';
                return 'top';
            } else {
                // Anchor near center vertically
                if (xRatio <= 0.3) return 'left';
                if (xRatio >= 0.7) return 'right';
                return 'center';
            }
        }
        return 'bottom';
    }, [iconOptions.iconAnchor, iconOptions.iconSize]);

    // Handle click events
    const handleClick = useCallback((e: any) => {
        setShowPopup(true);
        eventHandlers.click?.(e);
    }, [eventHandlers]);

    // Render custom icon or default marker
    const renderMarkerContent = () => {
        if (iconOptions.html) {
            // DivIcon with custom HTML
            return (
                <div
                    dangerouslySetInnerHTML={{ __html: iconOptions.html }}
                    className={iconOptions.className || ''}
                    style={{
                        opacity,
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                    }}
                />
            );
        }

        if (iconOptions.iconUrl) {
            // Image-based icon
            const [width, height] = iconOptions.iconSize || [25, 41];
            const [anchorX, anchorY] = iconOptions.iconAnchor || [12, 41];

            return (
                <div
                    style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        opacity,
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        // Use transform to position the anchor point correctly
                        transform: `translate(-${anchorX}px, -${anchorY}px)`,
                    }}
                >
                    <img
                        src={iconOptions.iconUrl}
                        alt="marker"
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'block',
                        }}
                    />
                </div>
            );
        }

        // Default marker
        return (
            <div
                style={{
                    width: '25px',
                    height: '41px',
                    background: '#2b7cff',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    opacity,
                }}
            />
        );
    };

    // Extract popup and tooltip children
    const popupChild = React.Children.toArray(children).find(
        (child): child is React.ReactElement =>
            React.isValidElement(child) && (child.type as any)?.displayName === 'Popup'
    );

    // Note: Tooltip support can be added later if needed
    // const tooltipChild = React.Children.toArray(children).find(
    //   (child): child is React.ReactElement =>
    //     React.isValidElement(child) && (child.type as any)?.displayName === 'Tooltip'
    // );

    return (
        <>
            <RMGMarker
                longitude={lng}
                latitude={lat}
                anchor={anchor}
                draggable={draggable}
                onClick={handleClick}
                onDragStart={eventHandlers.dragstart}
                onDrag={eventHandlers.drag}
                onDragEnd={eventHandlers.dragend}
            >
                {renderMarkerContent()}
            </RMGMarker>

            {/* Render popup when marker is clicked */}
            {showPopup && popupChild && (
                <RMGPopup
                    longitude={lng}
                    latitude={lat}
                    anchor="bottom"
                    onClose={() => setShowPopup(false)}
                    closeOnClick={false}
                    closeButton={popupChild.props.closeButton ?? true}
                    offset={iconOptions.popupAnchor ? [iconOptions.popupAnchor[0], -iconOptions.popupAnchor[1]] : [0, -41]}
                    maxWidth={popupChild.props.maxWidth ? `${popupChild.props.maxWidth}px` : undefined}
                >
                    {/* Clone children and inject onClose callback for custom close buttons */}
                    {React.isValidElement(popupChild.props.children)
                        ? React.cloneElement(popupChild.props.children as React.ReactElement, {
                            onPopupClose: () => setShowPopup(false)
                        })
                        : popupChild.props.children
                    }
                </RMGPopup>
            )}
        </>
    );
};

Marker.displayName = 'Marker';

// Helper factory classes to create Icon and DivIcon objects
// These mimic Leaflet's Icon and DivIcon class constructors

export class Icon {
    options: IconOptions;

    constructor(options: IconOptions) {
        this.options = options;
    }
}

export class DivIcon {
    options: IconOptions & { html: string; className?: string };

    constructor(options: IconOptions & { html: string; className?: string }) {
        this.options = {
            ...options,
            html: options.html,
            className: options.className || '',
        };
    }
}

// Factory functions (alternative to class constructors)
export function createIcon(options: IconOptions): Icon {
    return new Icon(options);
}

export function createDivIcon(options: IconOptions & { html: string; className?: string }): DivIcon {
    return new DivIcon(options);
}

export default Marker;
