/**
 * @module apps/traffic-web-app/frontend/src/components/MapLegend
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Collapsible map legend component explaining color codes and symbols for traffic patterns
 * and air quality visualization modes. Supports three display modes: congestion-only, AQI-only,
 * and dual-mode showing both simultaneously. Provides user-friendly interpretation of heatmap
 * colors and pattern zone indicators.
 * 
 * Core features:
 * - Expandable/collapsible panel
 * - Three display modes: congestion, AQI, dual
 * - Color gradient scales for congestion levels (green → red)
 * - AQI threshold ranges with health implications
 * - Pattern zone symbol explanations
 * - Camera marker type legends
 * 
 * @dependencies
 * - react@18.2.0 - Component state management
 * - lucide-react@0.263.1 - ChevronDown, ChevronUp, Layers icons
 * 
 * @example
 * ```tsx
 * <MapLegend
 *   displayMode={currentMode}
 *   onDisplayModeChange={(mode) => setDisplayMode(mode)}
 * />
 * ```
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface MapLegendProps {
    displayMode?: 'congestion' | 'aqi' | 'dual';
    onDisplayModeChange?: (mode: 'congestion' | 'aqi' | 'dual') => void;
}

const MapLegend: React.FC<MapLegendProps> = ({
    displayMode = 'dual',
    onDisplayModeChange
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="fixed top-2 right-2 z-[998] w-64 animate-slide-in-right">
            {/* Display Mode Selector */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700/50 backdrop-blur-sm mb-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-white" />
                        <h3 className="text-sm font-bold text-white">Display Mode</h3>
                    </div>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onDisplayModeChange?.('congestion')}
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${displayMode === 'congestion'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                }`}
                        >
                            Congestion
                        </button>
                        <button
                            onClick={() => onDisplayModeChange?.('aqi')}
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${displayMode === 'aqi'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                }`}
                        >
                            AQI
                        </button>
                        <button
                            onClick={() => onDisplayModeChange?.('dual')}
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${displayMode === 'dual'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                }`}
                        >
                            Dual
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend Panel */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 flex items-center justify-between hover:from-purple-700 hover:to-fuchsia-700 transition-all"
                >
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-white" />
                        <h3 className="text-sm font-bold text-white">Map Legend</h3>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-white" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-white" />
                    )}
                </button>

                {isExpanded && (
                    <div className="p-4 space-y-4">
                        {/* Congestion Legend */}
                        {displayMode !== 'aqi' && (
                            <div>
                                <div className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide">
                                    Congestion:
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-green-500 border border-green-400 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">Low</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-400 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">Medium</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-orange-500 border border-orange-400 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">High</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AQI Legend */}
                        {displayMode !== 'congestion' && (
                            <div className={displayMode !== 'aqi' ? 'border-t border-gray-700 pt-4' : ''}>
                                <div className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide">
                                    AQI Levels:
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-green-500 border border-green-400 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">Good (0-50)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-300 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">Moderate (51-100)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-orange-500 border border-orange-400 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">Unhealthy (101-150)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-red-500 border border-red-400 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">Very Unhealthy (151-200)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-purple-600 border border-purple-500 shadow-sm" />
                                        <span className="text-xs text-gray-300 font-medium">Hazardous (200+)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dual View Note */}
                        {displayMode === 'dual' && (
                            <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                                <p className="text-[10px] text-amber-200 font-medium leading-relaxed">
                                    <strong className="text-amber-100">Dual View:</strong> Border shows congestion, fill shows AQI level
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapLegend;
