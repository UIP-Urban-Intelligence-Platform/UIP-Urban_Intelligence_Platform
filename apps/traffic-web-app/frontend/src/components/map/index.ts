/**
 * Map Components - MapLibre GL JS + react-map-gl Wrappers
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/map
 * @author Nguyễn Nhật Quang
 * @created 2025-12-07
 * @modified 2025-12-07
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * MIT-licensed map components built on react-map-gl (MIT) and MapLibre GL JS (BSD-3-Clause).
 * Provides API-compatible replacements for react-leaflet components to achieve 100% MIT compatibility.
 * 
 * Components exported:
 * - MapContainer: Main map wrapper
 * - TileLayer: Tile layer (handled via mapStyle)
 * - Marker: Point markers with custom icons
 * - Popup: Information popups
 * - Polyline: Line geometries
 * - Polygon: Polygon geometries
 * - CircleMarker: Circle markers
 * - Tooltip: Hover tooltips
 * - LayersControl: Layer visibility controls
 * - useMap: Map instance hook
 * - useMapEvents: Map event handlers hook
 * 
 * @dependencies
 * - react-map-gl@^7.1: MIT License
 * - maplibre-gl@^4.7: BSD-3-Clause License (MIT-compatible)
 */

// Core map components
export { MapContainer } from './MapContainer';
export type { MapContainerRef } from './MapContainer';
export { Marker, Icon, DivIcon, createIcon, createDivIcon } from './Marker';
export type { IconOptions, MarkerProps } from './Marker';
export { Popup } from './Popup';
export { Polyline } from './Polyline';
export { Polygon } from './Polygon';
export { CircleMarker } from './CircleMarker';
export { Tooltip } from './Tooltip';
export { LayersControl, BaseLayer, Overlay } from './LayersControl';
export type { MapStyleType } from './LayersControl';
export { ScaleControl } from './ScaleControl';
export { ZoomControl } from './ZoomControl';

// Map styles
export { getMapStyle } from './MapContainer';
export type { MapStyleType as MapContainerStyleType } from './MapContainer';

// Hooks
export { useMap } from './useMap';
export type { MapInstance } from './useMap';
export { useMapEvents } from './useMapEvents';

// Context
export { MapContext, MapProvider } from './MapContext';

// Types
export type { MapRef, LngLatLike, LngLatBoundsLike, LatLngExpression, LatLngTuple, PathOptions, LatLngBounds } from './types';

// Utilities & Classes
export { toMapLibreCoords, toLatLng, latLngBounds, LatLng, latLng } from './types';
