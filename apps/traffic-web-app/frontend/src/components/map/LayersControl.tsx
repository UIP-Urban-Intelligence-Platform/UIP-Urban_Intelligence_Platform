/**
 * @file LayersControl.tsx
 * @module apps/traffic-web-app/frontend/src/components/map/LayersControl
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description LayersControl component compatible with react-leaflet's LayersControl API.
 * Provides toggle controls for map layers.
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 */

import React, { ReactNode, useState, createContext, useContext } from 'react';

// Context for managing layer visibility
interface LayersContextValue {
    visibleLayers: Set<string>;
    toggleLayer: (name: string) => void;
    activeBaseLayer: string | null;
    setActiveBaseLayer: (name: string) => void;
}

const LayersContext = createContext<LayersContextValue | null>(null);

export interface LayersControlProps {
    children?: ReactNode;
    position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    collapsed?: boolean;
}

export const LayersControl: React.FC<LayersControlProps> & {
    BaseLayer: typeof BaseLayer;
    Overlay: typeof Overlay;
} = ({
    children,
    position = 'topright',
    collapsed = true,
}) => {
        const [isExpanded, setIsExpanded] = useState(!collapsed);
        const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
        const [activeBaseLayer, setActiveBaseLayer] = useState<string | null>(null);

        const toggleLayer = (name: string) => {
            setVisibleLayers(prev => {
                const next = new Set(prev);
                if (next.has(name)) {
                    next.delete(name);
                } else {
                    next.add(name);
                }
                return next;
            });
        };

        // Position styles
        const positionStyles: Record<string, React.CSSProperties> = {
            topleft: { top: '10px', left: '10px' },
            topright: { top: '10px', right: '10px' },
            bottomleft: { bottom: '10px', left: '10px' },
            bottomright: { bottom: '10px', right: '10px' },
        };

        return (
            <LayersContext.Provider value={{ visibleLayers, toggleLayer, activeBaseLayer, setActiveBaseLayer }}>
                <div
                    className="maplibre-layers-control"
                    style={{
                        position: 'absolute',
                        zIndex: 1000,
                        ...positionStyles[position],
                        background: 'white',
                        borderRadius: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        minWidth: isExpanded ? '200px' : 'auto',
                    }}
                >
                    {collapsed && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{
                                padding: '8px 12px',
                                background: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: '100%',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span>🗂️ Layers</span>
                            <span>{isExpanded ? '▲' : '▼'}</span>
                        </button>
                    )}

                    {(isExpanded || !collapsed) && (
                        <div style={{ padding: '8px' }}>
                            {children}
                        </div>
                    )}
                </div>
            </LayersContext.Provider>
        );
    };

// BaseLayer component
export interface BaseLayerProps {
    children?: ReactNode;
    name: string;
    checked?: boolean;
}

export const BaseLayer: React.FC<BaseLayerProps> = ({ children, name, checked = false }) => {
    const context = useContext(LayersContext);

    if (!context) {
        // If not in LayersControl, just render children
        return <>{children}</>;
    }

    const { activeBaseLayer, setActiveBaseLayer } = context;
    const isActive = activeBaseLayer === name || (activeBaseLayer === null && checked);

    // Set initial active base layer
    React.useEffect(() => {
        if (checked && activeBaseLayer === null) {
            setActiveBaseLayer(name);
        }
    }, [checked, name, activeBaseLayer, setActiveBaseLayer]);

    return (
        <div style={{ marginBottom: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                    type="radio"
                    name="base-layer"
                    checked={isActive}
                    onChange={() => setActiveBaseLayer(name)}
                />
                <span>{name}</span>
            </label>
            {isActive && children}
        </div>
    );
};

BaseLayer.displayName = 'BaseLayer';

// Overlay component
export interface OverlayProps {
    children?: ReactNode;
    name: string;
    checked?: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({ children, name, checked = false }) => {
    const context = useContext(LayersContext);

    if (!context) {
        // If not in LayersControl, just render children if checked
        return checked ? <>{children}</> : null;
    }

    const { visibleLayers, toggleLayer } = context;
    const isVisible = visibleLayers.has(name);

    // Set initial visibility
    React.useEffect(() => {
        if (checked && !visibleLayers.has(name)) {
            toggleLayer(name);
        }
    }, []); // Only run once on mount

    return (
        <div style={{ marginBottom: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleLayer(name)}
                />
                <span>{name}</span>
            </label>
            {isVisible && children}
        </div>
    );
};

Overlay.displayName = 'Overlay';

// Attach sub-components
LayersControl.BaseLayer = BaseLayer;
LayersControl.Overlay = Overlay;

export default LayersControl;
