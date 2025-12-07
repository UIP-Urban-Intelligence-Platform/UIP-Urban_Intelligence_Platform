/**
 * Route Planner - Multi-Criteria Route Optimization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/RoutePlanner
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Route Planner Component - Multi-criteria route planning with three optimization modes:
 * fastest (time), safest (accident avoidance), and healthiest (air quality).
 * 
 * Features:
 * - Three route optimization criteria:
 *   1. Fastest: Minimize travel time
 *   2. Safest: Avoid high-accident areas
 *   3. Healthiest: Avoid poor air quality zones
 * - Geocoding search for origin/destination
 * - Route comparison table
 * - Route visualization on map
 * - Distance, duration, and quality metrics
 * - Alternative route suggestions
 * 
 * @dependencies
 * - lucide-react@^0.294: UI icons
 * - Nominatim: Geocoding service
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Navigation, Clock, Leaf, Shield, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface LatLng {
  lat: number;
  lng: number;
}

interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
  type: string;
  boundingbox: [string, string, string, string];
  displayName: string;
}

interface CalculatedRoute {
  geometry: GeoJSON.Feature<GeoJSON.LineString>;
  distance: number; // meters
  duration: number; // seconds
  aqiScore: number; // 0-100
  weatherScore: number; // 0-100
  accidentScore: number; // 0-100
  trafficScore: number; // 0-100
  totalScore: number;
  rank: number; // 1-3
  warnings: string[];
}

interface RoutePlannerProps {
  onRouteSelect: (route: CalculatedRoute | null) => void;
  onRoutesCalculated: (routes: CalculatedRoute[]) => void;
  onClose?: () => void;
}

type RoutePreference = 'fastest' | 'healthiest' | 'safest';

// =====================================================
// ROUTE PLANNER COMPONENT
// =====================================================

const RoutePlanner: React.FC<RoutePlannerProps> = ({ onRouteSelect, onRoutesCalculated, onClose }) => {
  // ========== STATE ==========
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [preference, setPreference] = useState<RoutePreference>('fastest');
  const [routes, setRoutes] = useState<CalculatedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<CalculatedRoute | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete states
  const [originSuggestions, setOriginSuggestions] = useState<GeocodingResult[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodingResult[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Expanded route details
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);

  // Refs for click outside handling
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  // ========== AUTOCOMPLETE LOGIC ==========

  const searchAddress = useCallback(async (query: string): Promise<GeocodingResult[]> => {
    if (query.length < 2) return [];

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/geocoding/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Geocoding error:', err);
      return [];
    }
  }, []);

  // Debounce for autocomplete
  useEffect(() => {
    if (originInput.length < 2) {
      setOriginSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      const results = await searchAddress(originInput);
      setOriginSuggestions(results);
      setLoadingSuggestions(false);
      setShowOriginSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [originInput, searchAddress]);

  useEffect(() => {
    if (destinationInput.length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      const results = await searchAddress(destinationInput);
      setDestinationSuggestions(results);
      setLoadingSuggestions(false);
      setShowDestinationSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [destinationInput, searchAddress]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========== ROUTE CALCULATION ==========

  const calculateRoutes = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/routing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          preferences: {
            [preference]: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Route calculation failed');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setRoutes(data.data);
        onRoutesCalculated(data.data);

        // Auto-select best route
        if (data.data.length > 0) {
          const bestRoute = data.data[0];
          setSelectedRoute(bestRoute);
          onRouteSelect(bestRoute);
        }
      } else {
        throw new Error('No routes found');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate routes');
      setRoutes([]);
    } finally {
      setIsCalculating(false);
    }
  };

  // ========== HANDLERS ==========

  const handleOriginSelect = (result: GeocodingResult) => {
    setOrigin({ lat: result.lat, lng: result.lng });
    setOriginInput(result.displayName);
    setShowOriginSuggestions(false);
  };

  const handleDestinationSelect = (result: GeocodingResult) => {
    setDestination({ lat: result.lat, lng: result.lng });
    setDestinationInput(result.displayName);
    setShowDestinationSuggestions(false);
  };

  const handleRouteClick = (route: CalculatedRoute) => {
    setSelectedRoute(route);
    onRouteSelect(route);
  };

  const handleClearRoutes = () => {
    setRoutes([]);
    setSelectedRoute(null);
    setOrigin(null);
    setDestination(null);
    setOriginInput('');
    setDestinationInput('');
    setError(null);
    onRouteSelect(null);
    onRoutesCalculated([]);
  };

  const toggleRouteExpand = (rank: number) => {
    setExpandedRouteId(expandedRouteId === rank ? null : rank);
  };

  // ========== UTILITY FUNCTIONS ==========

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getScoreColor = (score: number): string => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'bg-blue-500';
    if (rank === 2) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getRankLabel = (rank: number): string => {
    if (rank === 1) return 'Best';
    if (rank === 2) return 'Good';
    return 'Alternative';
  };

  // ========== RENDER ==========

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-lg z-[1000] max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Route Planner
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close Route Planner"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Origin Input */}
        <div className="space-y-2" ref={originRef}>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Search className="w-4 h-4" />
            Origin
          </label>
          <div className="relative">
            <input
              type="text"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              onFocus={() => setShowOriginSuggestions(true)}
              placeholder="VD: Quận 1, Bến Thành, Nguyễn Huệ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            />
            {loadingSuggestions && showOriginSuggestions && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}

            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                {originSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOriginSelect(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm"
                  >
                    <div className="font-medium text-gray-900">{suggestion.address}</div>
                    <div className="text-xs text-gray-500">{suggestion.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Destination Input */}
        <div className="space-y-2" ref={destinationRef}>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Search className="w-4 h-4" />
            Destination
          </label>
          <div className="relative">
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onFocus={() => setShowDestinationSuggestions(true)}
              placeholder="VD: Phú Mỹ Hưng, Tân Sơn Nhất..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            />
            {loadingSuggestions && showDestinationSuggestions && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}

            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                {destinationSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDestinationSelect(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm"
                  >
                    <div className="font-medium text-gray-900">{suggestion.address}</div>
                    <div className="text-xs text-gray-500">{suggestion.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preference Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Route Preference</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPreference('fastest')}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${preference === 'fastest'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              <Clock className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Fastest</div>
            </button>
            <button
              onClick={() => setPreference('healthiest')}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${preference === 'healthiest'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              <Leaf className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Healthiest</div>
            </button>
            <button
              onClick={() => setPreference('safest')}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${preference === 'safest'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              <Shield className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Safest</div>
            </button>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateRoutes}
          disabled={!origin || !destination || isCalculating}
          className={`w-full py-3 rounded-lg font-medium transition-all ${!origin || !destination || isCalculating
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          {isCalculating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              Calculating...
            </span>
          ) : (
            'Calculate Routes'
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Routes Results */}
        {routes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Routes Found ({routes.length})</h3>
              <button
                onClick={handleClearRoutes}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>

            {routes.map((route) => (
              <div
                key={route.rank}
                className={`border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${selectedRoute?.rank === route.rank
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => handleRouteClick(route)}
              >
                {/* Route Header */}
                <div className="p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`${getRankColor(route.rank)} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {getRankLabel(route.rank)}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        Route {route.rank}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRouteExpand(route.rank);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedRouteId === route.rank ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Distance:</span>
                      <span className="ml-1 font-medium">{formatDistance(route.distance)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-1 font-medium">{formatDuration(route.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRouteId === route.rank && (
                  <div className="p-3 bg-white space-y-3 border-t border-gray-200">
                    {/* Scores */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">Health & Safety Scores</div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Air Quality:</span>
                          <span className={`font-medium ${getScoreColor(route.aqiScore)}`}>
                            {route.aqiScore.toFixed(0)}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${Math.max(0, 100 - route.aqiScore)}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Weather:</span>
                          <span className={`font-medium ${getScoreColor(route.weatherScore)}`}>
                            {route.weatherScore.toFixed(0)}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.max(0, 100 - route.weatherScore)}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Accident Risk:</span>
                          <span className={`font-medium ${getScoreColor(route.accidentScore)}`}>
                            {route.accidentScore.toFixed(0)}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full"
                            style={{ width: `${Math.max(0, 100 - route.accidentScore)}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Traffic:</span>
                          <span className={`font-medium ${getScoreColor(route.trafficScore)}`}>
                            {route.trafficScore.toFixed(0)}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{ width: `${Math.max(0, 100 - route.trafficScore)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span className="text-gray-700">Overall Score:</span>
                          <span className={getScoreColor(route.totalScore)}>
                            {route.totalScore.toFixed(1)}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {route.warnings.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Warnings ({route.warnings.length})
                        </div>
                        {route.warnings.map((warning, idx) => (
                          <div
                            key={idx}
                            className="bg-yellow-50 border-l-4 border-yellow-400 p-2 text-xs text-yellow-800"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {routes.length === 0 && !error && !isCalculating && origin && destination && (
          <div className="text-center py-8 text-gray-500">
            <Navigation className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Click "Calculate Routes" to find the best paths</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePlanner;
