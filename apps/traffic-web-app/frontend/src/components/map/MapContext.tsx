/**
 * @file MapContext.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/MapContext
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Map Context - Shared Map State Provider
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

interface MapContextValue {
    map: MapRef | null;
    setMap: (map: MapRef | null) => void;
    isLoaded: boolean;
    setIsLoaded: (loaded: boolean) => void;
}

export const MapContext = createContext<MapContextValue | null>(null);

interface MapProviderProps {
    children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
    const [map, setMapState] = useState<MapRef | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const setMap = useCallback((newMap: MapRef | null) => {
        setMapState(newMap);
    }, []);

    return (
        <MapContext.Provider value={{ map, setMap, isLoaded, setIsLoaded }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMapContext = (): MapContextValue => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMapContext must be used within a MapProvider');
    }
    return context;
};
