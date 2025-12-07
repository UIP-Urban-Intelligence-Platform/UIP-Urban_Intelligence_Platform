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
 *
 * @description
 * LayersControl component compatible with react-leaflet's LayersControl API.
 * Provides toggle controls for map layers with modern UI design.

 */

import React, { ReactNode, useState, createContext, useContext } from 'react';

// Map style types
export type MapStyleType = 'osm' | 'satellite' | 'terrain';

// Layer icons
const LAYER_ICONS: Record<string, string> = {
    'OpenStreetMap': '🗺️',
    'Satellite': '🛰️',
    'Terrain': '⛰️',
};

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
    onBaseLayerChange?: (layerName: string, styleType: MapStyleType) => void;
}

export const LayersControl: React.FC<LayersControlProps> & {
    BaseLayer: typeof BaseLayer;
    Overlay: typeof Overlay;
} = ({
    children,
    position = 'topright',
    collapsed = true,
    onBaseLayerChange,
}) => {
        const [isExpanded, setIsExpanded] = useState(!collapsed);
        const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
        const [activeBaseLayer, setActiveBaseLayerState] = useState<string | null>(null);

        // Wrapper to emit event when base layer changes
        const setActiveBaseLayer = (name: string) => {
            setActiveBaseLayerState(name);
            // Map layer names to style types
            const styleMap: Record<string, MapStyleType> = {
                'OpenStreetMap': 'osm',
                'Satellite': 'satellite',
                'Terrain': 'terrain',
            };
            const styleType = styleMap[name] || 'osm';
            onBaseLayerChange?.(name, styleType);
        };

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
            topleft: { top: '80px', left: '10px' },
            topright: { top: '80px', right: '10px' },
            bottomleft: { bottom: '40px', left: '10px' },
            bottomright: { bottom: '40px', right: '10px' },
        };

        return (
            <LayersContext.Provider value={{ visibleLayers, toggleLayer, activeBaseLayer, setActiveBaseLayer }}>
                <div
                    className="maplibre-layers-control"
                    style={{
                        position: 'absolute',
                        zIndex: 1000,
                        ...positionStyles[position],
                    }}
                >
                    {/* Toggle Button */}
                    {collapsed && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="group"
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease',
                                transform: isExpanded ? 'scale(0.95)' : 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = isExpanded ? 'scale(0.95)' : 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                            }}
                            title="Map Layers"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    transition: 'transform 0.3s ease',
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                            >
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                            </svg>
                        </button>
                    )}

                    {/* Expanded Panel */}
                    {(isExpanded || !collapsed) && (
                        <div
                            style={{
                                position: 'absolute',
                                top: collapsed ? '52px' : '0',
                                right: '0',
                                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '16px',
                                padding: '16px',
                                minWidth: '220px',
                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                animation: 'slideIn 0.2s ease-out',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '12px',
                                paddingBottom: '12px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '8px',
                                        padding: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                            <polyline points="2 17 12 22 22 17"></polyline>
                                            <polyline points="2 12 12 17 22 12"></polyline>
                                        </svg>
                                    </span>
                                    <span style={{
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Map Layers
                                    </span>
                                </div>
                                {collapsed && (
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            width: '28px',
                                            height: '28px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Layer Options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {children}
                            </div>
                        </div>
                    )}
                </div>

                {/* Animation keyframes */}
                <style>{`
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}</style>
            </LayersContext.Provider>
        );
    };

// BaseLayer component with modern design
export interface BaseLayerProps {
    children?: ReactNode;
    name: string;
    checked?: boolean;
}

export const BaseLayer: React.FC<BaseLayerProps> = ({ children, name, checked = false }) => {
    const context = useContext(LayersContext);
    const [isHovered, setIsHovered] = useState(false);

    if (!context) {
        return <>{children}</>;
    }

    const { activeBaseLayer, setActiveBaseLayer } = context;
    const isActive = activeBaseLayer === name || (activeBaseLayer === null && checked);
    const icon = LAYER_ICONS[name] || '📍';

    // Set initial active base layer
    React.useEffect(() => {
        if (checked && activeBaseLayer === null) {
            setActiveBaseLayer(name);
        }
    }, [checked, name, activeBaseLayer, setActiveBaseLayer]);

    return (
        <div
            onClick={() => setActiveBaseLayer(name)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: isActive
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)'
                    : isHovered
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'transparent',
                border: isActive
                    ? '1px solid rgba(102, 126, 234, 0.5)'
                    : '1px solid transparent',
                transition: 'all 0.2s ease',
                transform: isHovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
            }}
        >
            {/* Icon */}
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isActive
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
            }}>
                {icon}
            </div>

            {/* Label */}
            <div style={{ flex: 1 }}>
                <span style={{
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    letterSpacing: '0.3px',
                }}>
                    {name}
                </span>
            </div>

            {/* Check indicator */}
            {isActive && (
                <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            )}

            {isActive && children}
        </div>
    );
};

BaseLayer.displayName = 'BaseLayer';

// Overlay component with modern design
export interface OverlayProps {
    children?: ReactNode;
    name: string;
    checked?: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({ children, name, checked = false }) => {
    const context = useContext(LayersContext);
    const [isHovered, setIsHovered] = useState(false);

    if (!context) {
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
        <div
            onClick={() => toggleLayer(name)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: isVisible
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                    : isHovered
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'transparent',
                border: isVisible
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid transparent',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Toggle switch */}
            <div style={{
                width: '36px',
                height: '20px',
                borderRadius: '10px',
                background: isVisible
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.2)',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: isVisible ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
            }}>
                <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: isVisible ? '18px' : '2px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }} />
            </div>

            {/* Label */}
            <span style={{
                color: isVisible ? 'white' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                fontWeight: isVisible ? '500' : '400',
            }}>
                {name}
            </span>

            {isVisible && children}
        </div>
    );
};

Overlay.displayName = 'Overlay';

// Attach sub-components
LayersControl.BaseLayer = BaseLayer;
LayersControl.Overlay = Overlay;

export default LayersControl;
