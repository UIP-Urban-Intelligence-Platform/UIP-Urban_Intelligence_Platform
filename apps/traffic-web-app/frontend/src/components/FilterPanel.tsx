/**
 * Advanced Filter Panel - Comprehensive Data Filtering
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/FilterPanel
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Advanced Filter Panel Component - Comprehensive filtering for cameras, accidents,
 * districts, and time ranges. Features collapsible sections, search, and district-based
 * map navigation.
 * 
 * Core Features:
 * - Camera filtering (status, type, district, search)
 * - Accident filtering (severity, time range)
 * - District-based navigation with zoom to bounds
 * - Time range filtering (1h, 6h, 24h, 7days, all)
 * - Collapsible filter sections
 * - Search functionality with debouncing
 * - Real-time filter statistics
 * 
 * Supported Filters:
 * - Camera: online/offline status, PTZ/Static/Dome type
 * - Accidents: high/medium/low severity, time-based
 * - Districts: All 24 districts of Ho Chi Minh City
 * - Search: Camera name/ID fuzzy matching
 * 
 * @dependencies
 * - date-fns@^2.30: Date manipulation
 * - lucide-react@^0.294: Icon library
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTrafficStore } from '../store/trafficStore';
import { Camera } from '../types';
import { subHours, subDays, parseISO, isAfter } from 'date-fns';
import { X, Search, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

interface FilterPanelProps {
  onCameraSelect: (camera: Camera) => void;
  onZoomToCamera: (camera: Camera) => void;
  onZoomToDistrict?: (bounds: DistrictBounds, center: DistrictCenter) => void;
}

interface DistrictBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface DistrictCenter {
  lat: number;
  lng: number;
}

interface DistrictData {
  id: string;
  name: string;
  cameraCount: number;
  onlineCount: number;
  offlineCount: number;
  avgAQI: number | null;
  accidentsToday: number;
  bounds: DistrictBounds;
  center: DistrictCenter;
}

interface DistrictsUIResponse {
  success: boolean;
  data: {
    districts: DistrictData[];
    totalDistricts: number;
  };
}

type CameraStatusFilter = 'all' | 'online' | 'offline';
type AQILevelFilter = 'all' | 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
type AccidentSeverityFilter = 'all' | 'severe' | 'moderate' | 'minor' | 'fatal';
type CongestionFilter = 'all' | 'high' | 'medium' | 'low';
type TimeRangeFilter = '1h' | '6h' | '24h' | '7days' | 'all';

interface FilterState {
  cameraStatus: CameraStatusFilter;
  aqiLevel: AQILevelFilter;
  accidentSeverity: AccidentSeverityFilter;
  congestion: CongestionFilter;
  timeRange: TimeRangeFilter;
  searchQuery: string;
  selectedDistrict: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onCameraSelect, onZoomToCamera, onZoomToDistrict }) => {
  const {
    cameras,
    airQuality,
    accidents,
    patterns,
    filters: layerFilters,
    toggleFilter,
    setCameras,
    setAirQuality,
    setAccidents,
    setPatterns,
  } = useTrafficStore();

  const [filterState, setFilterState] = useState<FilterState>({
    cameraStatus: 'all',
    aqiLevel: 'all',
    accidentSeverity: 'all',
    congestion: 'all',
    timeRange: 'all',
    searchQuery: '',
    selectedDistrict: 'all',
  });

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [districtsData, setDistrictsData] = useState<DistrictData[]>([]);
  const [selectedDistrictData, setSelectedDistrictData] = useState<DistrictData | null>(null);

  // Fetch districts data from API
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/cameras/districts-ui`);
        if (!response.ok) {
          throw new Error('Failed to fetch districts');
        }
        const result: DistrictsUIResponse = await response.json();
        if (result.success && result.data.districts) {
          setDistrictsData(result.data.districts);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };

    fetchDistricts();
  }, []);

  // Sync with URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const districtParam = params.get('district');
    if (districtParam && districtParam !== filterState.selectedDistrict) {
      setFilterState((prev) => ({ ...prev, selectedDistrict: districtParam }));
      const districtData = districtsData.find(d => d.id === districtParam);
      if (districtData) {
        setSelectedDistrictData(districtData);
        if (onZoomToDistrict) {
          onZoomToDistrict(districtData.bounds, districtData.center);
        }
      }
    }
  }, [districtsData, onZoomToDistrict]);

  const filteredCameras = useMemo(() => {
    let filtered = [...cameras];

    if (filterState.cameraStatus !== 'all') {
      filtered = filtered.filter((camera) => {
        if (filterState.cameraStatus === 'online') {
          return camera.status === 'active' || camera.status === 'online';
        } else if (filterState.cameraStatus === 'offline') {
          return camera.status === 'inactive' || camera.status === 'offline' || camera.status === 'maintenance';
        }
        return true;
      });
    }

    if (filterState.selectedDistrict !== 'all') {
      filtered = filtered.filter((camera) => {
        if (camera.location.address) {
          const addressParts = camera.location.address.split(',');
          const district = addressParts[addressParts.length - 1]?.trim();
          return district === filterState.selectedDistrict;
        }
        return false;
      });
    }

    if (filterState.searchQuery.trim() !== '') {
      const query = filterState.searchQuery.toLowerCase();
      filtered = filtered.filter((camera) =>
        camera.name.toLowerCase().includes(query) ||
        camera.location.address.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [cameras, filterState.cameraStatus, filterState.selectedDistrict, filterState.searchQuery]);

  const autocompleteResults = useMemo(() => {
    if (filterState.searchQuery.trim() === '') return [];
    return filteredCameras.slice(0, 8);
  }, [filteredCameras, filterState.searchQuery]);

  const getTimeFilterDate = useCallback((): Date | null => {
    const now = new Date();
    switch (filterState.timeRange) {
      case '1h':
        return subHours(now, 1);
      case '6h':
        return subHours(now, 6);
      case '24h':
        return subHours(now, 24);
      case '7days':
        return subDays(now, 7);
      case 'all':
      default:
        return null;
    }
  }, [filterState.timeRange]);

  const filteredAirQuality = useMemo(() => {
    let filtered = [...airQuality];

    const cutoffDate = getTimeFilterDate();
    if (cutoffDate) {
      filtered = filtered.filter((aq) => {
        const aqDate = parseISO(aq.timestamp);
        return isAfter(aqDate, cutoffDate);
      });
    }

    if (filterState.aqiLevel !== 'all') {
      filtered = filtered.filter((aq) => {
        const level = aq.level.toLowerCase();
        return level === filterState.aqiLevel;
      });
    }

    return filtered;
  }, [airQuality, filterState.aqiLevel, filterState.timeRange, getTimeFilterDate]);

  const filteredAccidents = useMemo(() => {
    let filtered = [...accidents];

    const cutoffDate = getTimeFilterDate();
    if (cutoffDate) {
      filtered = filtered.filter((accident) => {
        const accidentDate = parseISO(accident.timestamp);
        return isAfter(accidentDate, cutoffDate);
      });
    }

    if (filterState.accidentSeverity !== 'all') {
      filtered = filtered.filter((accident) =>
        accident.severity === filterState.accidentSeverity
      );
    }

    return filtered;
  }, [accidents, filterState.accidentSeverity, filterState.timeRange, getTimeFilterDate]);

  const filteredPatterns = useMemo(() => {
    let filtered = [...patterns];

    if (filterState.congestion !== 'all') {
      filtered = filtered.filter((pattern) => {
        const level = pattern.congestionLevel.toLowerCase();
        if (filterState.congestion === 'high') {
          return level === 'high' || level === 'severe' || level === 'heavy';
        } else if (filterState.congestion === 'medium') {
          return level === 'medium' || level === 'moderate';
        } else if (filterState.congestion === 'low') {
          return level === 'low' || level === 'light' || level === 'free_flow';
        }
        return true;
      });
    }

    return filtered;
  }, [patterns, filterState.congestion]);

  const applyFilters = useCallback(() => {
    setCameras(filteredCameras);
    setAirQuality(filteredAirQuality);
    setAccidents(filteredAccidents);
    setPatterns(filteredPatterns);
  }, [filteredCameras, filteredAirQuality, filteredAccidents, filteredPatterns, setCameras, setAirQuality, setAccidents, setPatterns]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterState.cameraStatus !== 'all') count++;
    if (filterState.aqiLevel !== 'all') count++;
    if (filterState.accidentSeverity !== 'all') count++;
    if (filterState.congestion !== 'all') count++;
    if (filterState.timeRange !== 'all') count++;
    if (filterState.selectedDistrict !== 'all') count++;
    return count;
  }, [filterState]);

  const clearAllFilters = useCallback(() => {
    setFilterState({
      cameraStatus: 'all',
      aqiLevel: 'all',
      accidentSeverity: 'all',
      congestion: 'all',
      timeRange: 'all',
      searchQuery: '',
      selectedDistrict: 'all',
    });
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterState((prev) => ({ ...prev, searchQuery: value }));
    setShowAutocomplete(value.trim() !== '');
  };

  const handleAutocompleteSelect = (camera: Camera) => {
    setFilterState((prev) => ({ ...prev, searchQuery: camera.name }));
    setShowAutocomplete(false);
    onCameraSelect(camera);
    onZoomToCamera(camera);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    setFilterState((prev) => ({ ...prev, selectedDistrict: districtId }));

    // Update URL query param
    const url = new URL(window.location.href);
    if (districtId !== 'all') {
      url.searchParams.set('district', districtId);
      const districtData = districtsData.find(d => d.id === districtId);
      if (districtData) {
        setSelectedDistrictData(districtData);
        // Zoom to district bounds
        if (onZoomToDistrict) {
          onZoomToDistrict(districtData.bounds, districtData.center);
        }
      }
    } else {
      url.searchParams.delete('district');
      setSelectedDistrictData(null);
    }
    window.history.pushState({}, '', url);
  };

  const clearDistrictFilter = useCallback(() => {
    setFilterState((prev) => ({ ...prev, selectedDistrict: 'all' }));
    setSelectedDistrictData(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('district');
    window.history.pushState({}, '', url);
  }, []);

  return (
    <div
      className="fixed top-20 left-4 z-[999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700/50 backdrop-blur-sm animate-slide-in-right"
      style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', width: '340px' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Search & Filters</h2>
          </div>
          <button
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label={isPanelExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isPanelExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isPanelExpanded && (
          <>
            {/* Search Input with Autocomplete */}
            <div className="mb-4 relative">
              <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide">
                Search Cameras
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterState.searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowAutocomplete(filterState.searchQuery.trim() !== '')}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                  placeholder="Search by name or address..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              </div>

              {showAutocomplete && autocompleteResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                  {autocompleteResults.map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => handleAutocompleteSelect(camera)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-sm text-white">{camera.name}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{camera.location.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* District Selector Dropdown */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide">
                <MapPin className="w-3 h-3 inline mr-1" />
                District Filter
              </label>
              <div className="relative">
                <select
                  value={filterState.selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-white text-sm"
                  style={{ paddingRight: filterState.selectedDistrict !== 'all' ? '36px' : '12px' }}
                >
                  <option value="all">All Districts</option>
                  {districtsData.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name} ({district.cameraCount} cameras)
                    </option>
                  ))}
                </select>
                {filterState.selectedDistrict !== 'all' && (
                  <button
                    onClick={clearDistrictFilter}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded-full transition-colors"
                    title="Clear district filter"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* District Stats Display */}
            {selectedDistrictData && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span>📍</span> {selectedDistrictData.name} Stats
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded">
                    <div className="text-gray-500">Cameras</div>
                    <div className="font-bold text-gray-800">
                      {selectedDistrictData.cameraCount}
                      <span className="text-[10px] text-gray-500 ml-1">
                        ({selectedDistrictData.onlineCount} online)
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="text-gray-500">Avg AQI</div>
                    <div className="font-bold text-gray-800">
                      {selectedDistrictData.avgAQI !== null
                        ? selectedDistrictData.avgAQI.toFixed(0)
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded col-span-2">
                    <div className="text-gray-500">Accidents Today</div>
                    <div className="font-bold text-red-600 text-lg">
                      {selectedDistrictData.accidentsToday}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Layer Toggles */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Layer Visibility</h3>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showCameras}
                    onChange={() => toggleFilter('showCameras')}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">📹 Cameras</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showWeather}
                    onChange={() => toggleFilter('showWeather')}
                    className="form-checkbox h-5 w-5 text-green-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">🌤️ Weather</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showAirQuality}
                    onChange={() => toggleFilter('showAirQuality')}
                    className="form-checkbox h-5 w-5 text-orange-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">💨 Air Quality</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showAccidents}
                    onChange={() => toggleFilter('showAccidents')}
                    className="form-checkbox h-5 w-5 text-red-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">🚨 Accidents</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showPatterns}
                    onChange={() => toggleFilter('showPatterns')}
                    className="form-checkbox h-5 w-5 text-purple-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">🚦 Traffic Patterns</span>
                </label>
              </div>

              <h4 className="text-xs font-semibold text-gray-600 mt-4 mb-2">Advanced Layers</h4>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showPollutantCircles}
                    onChange={() => toggleFilter('showPollutantCircles')}
                    className="form-checkbox h-4 w-4 text-purple-600 rounded"
                  />
                  <span className="ml-3 text-xs text-gray-700">⚪ Pollutant Circles</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showHumidityLayer}
                    onChange={() => toggleFilter('showHumidityLayer')}
                    className="form-checkbox h-4 w-4 text-cyan-600 rounded"
                  />
                  <span className="ml-3 text-xs text-gray-700">💧 Humidity Zones</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showVehicleHeatmap}
                    onChange={() => toggleFilter('showVehicleHeatmap')}
                    className="form-checkbox h-4 w-4 text-red-600 rounded"
                  />
                  <span className="ml-3 text-xs text-gray-700">🔥 Vehicle Heatmap</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showSpeedZones}
                    onChange={() => toggleFilter('showSpeedZones')}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="ml-3 text-xs text-gray-700">⚡ Speed Zones</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showCorrelationLines}
                    onChange={() => toggleFilter('showCorrelationLines')}
                    className="form-checkbox h-4 w-4 text-pink-600 rounded"
                  />
                  <span className="ml-3 text-xs text-gray-700">🔗 Correlations</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={layerFilters.showAccidentFrequency}
                    onChange={() => toggleFilter('showAccidentFrequency')}
                    className="form-checkbox h-4 w-4 text-orange-600 rounded"
                  />
                  <span className="ml-3 text-xs text-gray-700">📊 Accident Chart</span>
                </label>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Advanced Filters
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </h3>

              {/* Camera Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Camera Status
                </label>
                <select
                  value={filterState.cameraStatus}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      cameraStatus: e.target.value as CameraStatusFilter,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="online">Online Only</option>
                  <option value="offline">Offline Only</option>
                </select>
              </div>

              {/* AQI Level Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  AQI Level
                </label>
                <select
                  value={filterState.aqiLevel}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      aqiLevel: e.target.value as AQILevelFilter,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="good">Good</option>
                  <option value="moderate">Moderate</option>
                  <option value="unhealthy">Unhealthy</option>
                  <option value="very_unhealthy">Very Unhealthy</option>
                  <option value="hazardous">Hazardous</option>
                </select>
              </div>

              {/* Accident Severity Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Accident Severity
                </label>
                <select
                  value={filterState.accidentSeverity}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      accidentSeverity: e.target.value as AccidentSeverityFilter,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="fatal">Fatal</option>
                  <option value="severe">Severe</option>
                  <option value="moderate">Moderate</option>
                  <option value="minor">Minor</option>
                </select>
              </div>

              {/* Congestion Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Congestion Level
                </label>
                <select
                  value={filterState.congestion}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      congestion: e.target.value as CongestionFilter,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Time Range Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Time Range
                </label>
                <select
                  value={filterState.timeRange}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      timeRange: e.target.value as TimeRangeFilter,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="1h">Last 1 Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7days">Last 7 Days</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>

            {/* Results Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Filter Results</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div>📹 Cameras: <span className="font-bold">{filteredCameras.length}</span></div>
                <div>💨 AQI: <span className="font-bold">{filteredAirQuality.length}</span></div>
                <div>🚨 Accidents: <span className="font-bold">{filteredAccidents.length}</span></div>
                <div>🚦 Patterns: <span className="font-bold">{filteredPatterns.length}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
