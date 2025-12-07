/**
 * @file types.ts
 * @module apps/traffic-web-app/frontend/src/components/map/types
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Map Types - TypeScript Definitions for Map Components
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import type { Map as MaplibreMap, LngLatLike as MLLngLatLike, LngLatBoundsLike as MLLngLatBoundsLike } from 'maplibre-gl';
import type { MapRef as RMGMapRef } from 'react-map-gl/maplibre';

// Re-export types from maplibre-gl
export type LngLatLike = MLLngLatLike;
export type LngLatBoundsLike = MLLngLatBoundsLike;

// Map reference type
export type MapRef = RMGMapRef;
export type MapInstance = MaplibreMap;

// Coordinate types (Leaflet-compatible)
export type LatLngTuple = [number, number]; // [lat, lng]
export type LatLngExpression = LatLngTuple | { lat: number; lng: number } | { latitude: number; longitude: number };

// Convert LatLngExpression to [lng, lat] for MapLibre
export function toMapLibreCoords(latLng: LatLngExpression): [number, number] {
    if (Array.isArray(latLng)) {
        return [latLng[1], latLng[0]]; // [lng, lat]
    }
    if ('lat' in latLng && 'lng' in latLng) {
        return [latLng.lng, latLng.lat];
    }
    if ('latitude' in latLng && 'longitude' in latLng) {
        return [latLng.longitude, latLng.latitude];
    }
    throw new Error('Invalid LatLngExpression');
}

// Convert [lng, lat] to [lat, lng] for compatibility
export function toLatLng(coords: [number, number]): LatLngTuple {
    return [coords[1], coords[0]];
}

// PathOptions (Leaflet-compatible)
export interface PathOptions {
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    dashArray?: string;
    dashOffset?: string;
    lineCap?: 'butt' | 'round' | 'square';
    lineJoin?: 'bevel' | 'round' | 'miter';
}

// Event types
export interface MapMouseEvent {
    lngLat: { lng: number; lat: number };
    point: { x: number; y: number };
    originalEvent: MouseEvent;
}

export interface MapLayerMouseEvent extends MapMouseEvent {
    features?: GeoJSON.Feature[];
}

// Bounds type
export interface LatLngBounds {
    getSouthWest(): { lat: number; lng: number };
    getNorthEast(): { lat: number; lng: number };
    getCenter(): { lat: number; lng: number };
    contains(latLng: LatLngExpression): boolean;
    toBoundsLike(): [[number, number], [number, number]];
}

// LatLngBounds implementation
class LatLngBoundsImpl implements LatLngBounds {
    private sw: { lat: number; lng: number };
    private ne: { lat: number; lng: number };

    constructor(positions: LatLngExpression[]) {
        if (positions.length === 0) {
            throw new Error('Cannot create bounds from empty array');
        }

        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        for (const pos of positions) {
            let lat: number, lng: number;
            if (Array.isArray(pos)) {
                [lat, lng] = pos;
            } else if ('lat' in pos && 'lng' in pos) {
                lat = pos.lat;
                lng = pos.lng;
            } else if ('latitude' in pos && 'longitude' in pos) {
                lat = pos.latitude;
                lng = pos.longitude;
            } else {
                continue;
            }
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        }

        this.sw = { lat: minLat, lng: minLng };
        this.ne = { lat: maxLat, lng: maxLng };
    }

    getSouthWest() { return this.sw; }
    getNorthEast() { return this.ne; }

    getCenter() {
        return {
            lat: (this.sw.lat + this.ne.lat) / 2,
            lng: (this.sw.lng + this.ne.lng) / 2
        };
    }

    contains(latLng: LatLngExpression): boolean {
        let lat: number, lng: number;
        if (Array.isArray(latLng)) {
            [lat, lng] = latLng;
        } else if ('lat' in latLng && 'lng' in latLng) {
            lat = latLng.lat;
            lng = latLng.lng;
        } else if ('latitude' in latLng && 'longitude' in latLng) {
            lat = latLng.latitude;
            lng = latLng.longitude;
        } else {
            return false;
        }
        return lat >= this.sw.lat && lat <= this.ne.lat &&
            lng >= this.sw.lng && lng <= this.ne.lng;
    }

    toBoundsLike(): [[number, number], [number, number]] {
        return [[this.sw.lng, this.sw.lat], [this.ne.lng, this.ne.lat]];
    }
}

// Factory function - Leaflet-compatible API
export function latLngBounds(positions: LatLngExpression[]): LatLngBounds {
    return new LatLngBoundsImpl(positions);
}

// LatLng class - Leaflet-compatible (with distanceTo method)
export class LatLng {
    readonly lat: number;
    readonly lng: number;

    constructor(lat: number, lng: number) {
        this.lat = lat;
        this.lng = lng;
    }

    // Haversine distance in meters
    distanceTo(other: LatLng | { lat: number; lng: number }): number {
        const R = 6371000; // Earth radius in meters
        const lat1 = this.lat * Math.PI / 180;
        const lat2 = other.lat * Math.PI / 180;
        const deltaLat = (other.lat - this.lat) * Math.PI / 180;
        const deltaLng = (other.lng - this.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    equals(other: LatLng | { lat: number; lng: number }): boolean {
        return this.lat === other.lat && this.lng === other.lng;
    }

    toString(): string {
        return `LatLng(${this.lat}, ${this.lng})`;
    }
}

// Factory function for LatLng
export function latLng(lat: number, lng: number): LatLng;
export function latLng(coords: [number, number]): LatLng;
export function latLng(latOrCoords: number | [number, number], lng?: number): LatLng {
    if (Array.isArray(latOrCoords)) {
        return new LatLng(latOrCoords[0], latOrCoords[1]);
    }
    return new LatLng(latOrCoords, lng!);
}
