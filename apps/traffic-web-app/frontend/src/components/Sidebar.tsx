/**
 * Sidebar Component - Map Controls & Layer Management
 * 
 * @module apps/traffic-web-app/frontend/src/components/Sidebar
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Left sidebar providing layer toggles, filters, AI agent panels, and quick stats
 * for interactive map control and data exploration.
 * 
 * Key Sections:
 * 1. Layer Toggles:
 *    - Camera markers on/off
 *    - AQI heatmap visibility
 *    - Vehicle heatmap display
 *    - Speed zones overlay
 *    - Pattern zones visualization
 *    - Accident markers toggle
 *    - Weather overlay control
 *    - Correlation lines display
 * 
 * 2. Filters:
 *    - Traffic intensity range (0-100)
 *    - AQI severity levels (Good, Moderate, Unhealthy, etc.)
 *    - Time range selection (last 1h, 6h, 24h)
 *    - District/area filtering
 * 
 * 3. AI Agent Panels:
 *    - HealthAdvisorChat (EcoTwin): Collapsible chat interface
 *    - InvestigatorPanel (GraphRAG): Incident analysis panel
 *    - PredictiveTimeline (TrafficMaestro): Event prediction timeline
 * 
 * 4. Quick Stats:
 *    - Total cameras online
 *    - Active accidents count
 *    - Current average AQI
 *    - Congestion percentage
 * 
 * Features:
 * - Collapsible/expandable with ChevronLeft icon
 * - Persistent state via localStorage
 * - Real-time stat updates
 * - Icon-based visual indicators (lucide-react)
 * 
 * @dependencies
 * - lucide-react@^0.292: Icon library
 * - zustand: State management
 */

import React, { useState, useEffect } from 'react';
import { useTrafficStore } from '../store/trafficStore';
import { api } from '../services/api';
import {
  Camera,
  AlertTriangle,
  Cloud,
  Wind,
  Activity,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  Search,
  X,
  Navigation,
  Bot,
  Brain,
  TrendingUp,
  MessageSquare,
  Users,
  Info,
} from 'lucide-react';

interface SidebarProps {
  onCameraSelect?: (camera: any) => void;
  onZoomToCamera?: (camera: any) => void;
  onZoomToDistrict?: (bounds: any, center: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCameraSelect, onZoomToCamera, onZoomToDistrict }) => {
  const {
    cameras,
    accidents,
    weather,
    airQuality,
    patterns,
    filters,
    toggleFilter,
    isConnected,
  } = useTrafficStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: true,
    stats: true,
    search: true,
    legend: false,
    weather: false,
    accidents: false,
    agents: false,
    citizen: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [districtsData, setDistrictsData] = useState<any[]>([]);

  const activeAccidents = accidents.filter((a) => !a.resolved);

  // Fetch districts data
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const result = await api.districts.getAll();
        if (result.success && result.data.districts) {
          setDistrictsData(result.data.districts);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };
    fetchDistricts();
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Search autocomplete
  const autocompleteResults = searchQuery.trim() !== ''
    ? cameras
      .filter(cam => {
        const name = cam.name || cam.cameraName || '';
        const district = cam.district || '';
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) || district.toLowerCase().includes(query);
      })
      .slice(0, 5)
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowAutocomplete(value.trim() !== '');
  };

  const handleAutocompleteSelect = (camera: any) => {
    setSearchQuery(camera.name || camera.cameraName || '');
    setShowAutocomplete(false);
    if (onZoomToCamera) {
      onZoomToCamera(camera);
    }
    if (onCameraSelect) {
      onCameraSelect(camera);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    if (districtId !== 'all') {
      const district = districtsData.find(d => d.id === districtId);
      if (district && onZoomToDistrict) {
        onZoomToDistrict(district.bounds, district.center);
      }
    }
  };

  const clearDistrictFilter = () => {
    setSelectedDistrict('all');
  };

  const basicLayers = [
    { key: 'showCameras' as const, label: 'Cameras', icon: Camera, count: cameras.length, color: 'text-blue-400' },
    { key: 'showAccidents' as const, label: 'Accidents', icon: AlertTriangle, count: activeAccidents.length, color: 'text-red-400' },
    { key: 'showWeather' as const, label: 'Weather', icon: Cloud, count: weather.length, color: 'text-sky-400' },
    { key: 'showAirQuality' as const, label: 'Air Quality', icon: Wind, count: airQuality.length, color: 'text-amber-400' },
    { key: 'showPatterns' as const, label: 'Traffic Patterns', icon: Activity, count: patterns.length, color: 'text-purple-400' },
  ];

  const advancedLayers = [
    { key: 'showRoutePlanner' as const, label: 'Route Planner', icon: Navigation, color: 'text-blue-500' },
    { key: 'showAQIHeatmap' as const, label: 'AQI Heatmap', icon: Layers, color: 'text-orange-400' },
    { key: 'showWeatherOverlay' as const, label: 'Weather Overlay', icon: Cloud, color: 'text-cyan-400' },
    { key: 'showAccidentMarkers' as const, label: 'Accident Markers', icon: MapPin, color: 'text-rose-400' },
    { key: 'showPatternZones' as const, label: 'Pattern Zones', icon: BarChart3, color: 'text-indigo-400' },
    { key: 'showPollutantCircles' as const, label: 'Pollutant Circles', icon: Layers, color: 'text-gray-400' },
    { key: 'showHumidityLayer' as const, label: 'Humidity Zones', icon: Cloud, color: 'text-blue-300' },
    { key: 'showVehicleHeatmap' as const, label: 'Vehicle Heatmap', icon: Activity, color: 'text-red-300' },
    { key: 'showSpeedZones' as const, label: 'Speed Zones', icon: Activity, color: 'text-yellow-400' },
    { key: 'showCorrelationLines' as const, label: 'Correlations', icon: Activity, color: 'text-green-400' },
    { key: 'showAccidentFrequency' as const, label: 'Accident Chart', icon: BarChart3, color: 'text-pink-400' },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white h-full flex flex-col items-center border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 w-full flex justify-center">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="mt-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <div className="mt-4">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-sm shadow-green-200' : 'bg-gray-300'
              }`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white h-full overflow-y-auto flex flex-col border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
                Traffic Monitor
              </h1>
              <p className="text-xs text-gray-500 font-light">HCMC System</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'
                }`}
            />
            <span className="text-xs font-medium text-gray-700">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-light">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Search & Filters Section */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('search')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <Search className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-sm font-semibold text-gray-900">Search & Filters</h2>
          </div>
          {expandedSections.search ? (
            <ChevronUp className="w-4.5 h-4.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-4.5 h-4.5 text-gray-400" />
          )}
        </button>
        {expandedSections.search && (
          <div className="px-4 pb-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Search Cameras
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowAutocomplete(searchQuery.trim() !== '')}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                  placeholder="Search by name or address..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm transition-all"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>

              {/* Autocomplete dropdown */}
              {showAutocomplete && autocompleteResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {autocompleteResults.map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => handleAutocompleteSelect(camera)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-xs text-gray-900">{camera.name}</div>
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">{camera.location.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
                District Filter
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none text-gray-900 text-sm pr-8 transition-all"
                >
                  <option value="all">All Districts</option>
                  {districtsData.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name} ({district.cameraCount})
                    </option>
                  ))}
                </select>
                {selectedDistrict !== 'all' && (
                  <button
                    onClick={clearDistrictFilter}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title="Clear district filter"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Basic Layers */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('basic')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <Layers className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-sm font-semibold text-gray-900">Layer Visibility</h2>
          </div>
          {expandedSections.basic ? (
            <ChevronUp className="w-4.5 h-4.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-4.5 h-4.5 text-gray-400" />
          )}
        </button>
        {expandedSections.basic && (
          <div className="px-4 pb-4 space-y-0.5">
            {basicLayers.map(({ key, label, icon: Icon, count, color }) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filters[key]}
                      onChange={() => toggleFilter(key)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                    />
                  </div>
                  <Icon className={`w-4 h-4 ${color.replace('text-', 'text-').replace('-400', '-600')}`} />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {label}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 ${color.replace('-400', '-700')}`}>
                  {count}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Layers */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('advanced')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <Eye className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-base font-semibold text-gray-900">Advanced Layers</h2>
          </div>
          {expandedSections.advanced ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {expandedSections.advanced && (
          <div className="px-4 pb-4 space-y-0.5">
            {advancedLayers.map(({ key, label, icon: Icon, color }) => (
              <label
                key={key}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group"
              >
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={() => toggleFilter(key)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                />
                <Icon className={`w-4 h-4 ${color.replace('text-', 'text-').replace('-400', '-600')}`} />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('stats')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <BarChart3 className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-base font-semibold text-gray-900">Statistics</h2>
          </div>
          {expandedSections.stats ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {expandedSections.stats && (
          <div className="p-4 space-y-2.5">
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cameras</p>
                <Camera className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{cameras.length}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Accidents</p>
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{activeAccidents.length}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weather Stations</p>
                <Cloud className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{weather.length}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Air Quality</p>
                <Wind className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{airQuality.length}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Traffic Patterns</p>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{patterns.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('legend')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <Info className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-base font-semibold text-gray-900">Map Legend</h2>
          </div>
          {expandedSections.legend ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {expandedSections.legend && (
          <div className="px-4 pb-4 space-y-4">
            {/* Traffic Congestion Legend */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">
                Traffic Congestion
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-green-500 rounded border border-green-600 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Low (Free Flow)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-yellow-400 rounded border border-yellow-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Medium (Moderate)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-orange-500 rounded border border-orange-600 shadow-sm"></div>
                  <span className="text-xs text-gray-700">High (Heavy)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-red-600 rounded border border-red-700 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Severe</span>
                </div>
              </div>
            </div>

            {/* AQI Levels Legend */}
            <div className="border-t border-gray-100 pt-3.5">
              <h4 className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">
                AQI Levels
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-green-500 rounded border border-green-600 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Good (0-50)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-yellow-400 rounded border border-yellow-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Moderate (51-100)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-orange-500 rounded border border-orange-600 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Unhealthy (101-150)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-red-600 rounded border border-red-700 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Very Unhealthy (151-200)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-4 bg-purple-600 rounded border border-purple-700 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Hazardous (200+)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weather View Controls */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('weather')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <Cloud className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-base font-semibold text-gray-900">Weather View</h2>
          </div>
          {expandedSections.weather ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {expandedSections.weather && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-gray-500 mb-3">Select weather data to display on map:</p>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gray-900 text-white shadow-sm hover:bg-gray-800 transition-all">
              All Weather Data
            </button>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Temperature Only
            </button>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Rain/Precipitation
            </button>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Wind Direction & Speed
            </button>
          </div>
        )}
      </div>

      {/* Accident Timeline */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('accidents')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-base font-semibold text-gray-900">Accident Timeline</h2>
          </div>
          {expandedSections.accidents ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {expandedSections.accidents && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-gray-500 mb-3">Filter accidents by time:</p>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Last Hour
            </button>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Last 6 Hours
            </button>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Last 24 Hours
            </button>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Last 7 Days
            </button>
            <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gray-900 text-white shadow-sm hover:bg-gray-800 transition-all">
              All Time
            </button>
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
              <div><strong className="text-gray-900">{activeAccidents.length}</strong> active accidents</div>
              <div className="mt-1">Auto-refresh: 60s</div>
            </div>
          </div>
        )}
      </div>

      {/* AI Agents */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('agents')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <Bot className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-base font-semibold text-gray-900">AI Agents</h2>
          </div>
          {expandedSections.agents ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {expandedSections.agents && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-gray-500 mb-3">Toggle AI-powered analysis tools:</p>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group border border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.showHealthAdvisor}
                  onChange={() => toggleFilter('showHealthAdvisor')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                />
                <MessageSquare className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-gray-900 transition-colors">
                    Health Advisor
                  </div>
                  <div className="text-xs text-gray-500">Eco-Twin chat assistant</div>
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group border border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.showInvestigator}
                  onChange={() => {
                    console.log('🔄 Toggling showInvestigator from', filters.showInvestigator, 'to', !filters.showInvestigator);
                    toggleFilter('showInvestigator');
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                />
                <Brain className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-gray-900 transition-colors">
                    Graph Investigator
                  </div>
                  <div className="text-xs text-gray-500">AI Vision analysis</div>
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group border border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.showPredictive}
                  onChange={() => toggleFilter('showPredictive')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                />
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-gray-900 transition-colors">
                    Predictive Timeline
                  </div>
                  <div className="text-xs text-gray-500">Traffic forecasting</div>
                </div>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Citizen Reports */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('citizen')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-2.5">
            <Users className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <h2 className="text-base font-semibold text-gray-900">Citizen Reports</h2>
          </div>
          {expandedSections.citizen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {
          expandedSections.citizen && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-gray-500 mb-2">Community-submitted traffic reports:</p>

              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group border border-gray-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filters.showCitizenReports}
                    onChange={() => toggleFilter('showCitizenReports')}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                  />
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-gray-900 transition-colors">
                      Show Reports
                    </div>
                    <div className="text-xs text-gray-500">Display markers on map</div>
                  </div>
                </div>
              </label>

              <button
                onClick={() => toggleFilter('showCitizenForm')}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Submit New Report</span>
              </button>

              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                <div className="text-xs text-gray-500">Report traffic issues in real-time</div>
              </div>
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500 text-center font-light">
          © 2025 HCMC Traffic Monitor
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
