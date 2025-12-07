/**
 * Map Context - Shared Map State Provider
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
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
