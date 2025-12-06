/**
 * Traffic Store - Global State Management with Zustand
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/frontend/src/store/trafficStore
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Centralized state management for traffic application using Zustand with persistence.
 * Manages all entity data, layer visibility, filters, and UI state.
 * 
 * State Categories:
 * 1. Entity Data:
 *    - cameras: Array of Camera entities
 *    - weather: Array of Weather observations
 *    - airQuality: Array of AirQuality observations
 *    - accidents: Array of RoadAccident entities
 *    - patterns: Array of TrafficPattern entities
 * 
 * 2. Derived Data:
 *    - pollutants: Aggregated pollutant data by location
 *    - humidityZones: Humidity zone GeoJSON
 *    - vehicleHeatmap: Traffic density heatmap data
 *    - speedZones: Speed zone GeoJSON
 *    - accidentFrequency: Accident frequency by time
 * 
 * 3. UI State:
 *    - Layer visibility toggles (cameras, heatmaps, zones, etc.)
 *    - Filter values (intensity, AQI, time range)
 *    - Loading states
 *    - Error messages
 * 
 * 4. Methods:
 *    - refreshData(): Fetch all data from API
 *    - setLayerVisibility(): Toggle layer on/off
 *    - setFilters(): Update filter values
 *    - clearCache(): Reset persisted state
 * 
 * Persistence:
 * - localStorage with 'traffic-store' key
 * - Auto-save on state changes
 * - Hydration on app load
 * 
 * @dependencies
 * - zustand@^4.4: State management
 * - zustand/middleware: Persistence middleware
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Camera,
  Weather,
  AirQuality,
  Accident,
  TrafficPattern,
  PollutantData,
  HumidityZonesCollection,
  VehicleHeatmapData,
  SpeedZonesCollection,
  District,
  AccidentFrequencyData
} from '../types';
import { api } from '../services/api';

// =====================================================
// FILTER INTERFACES
// =====================================================

export interface FilterState {
  showCameras: boolean;
  showWeather: boolean;
  showAirQuality: boolean;
  showAccidents: boolean;
  showPatterns: boolean;
  showAQIHeatmap: boolean;
  showWeatherOverlay: boolean;
  showAccidentMarkers: boolean;
  showPatternZones: boolean;
  showPollutantCircles: boolean;
  showHumidityLayer: boolean;
  showVehicleHeatmap: boolean;
  showSpeedZones: boolean;
  showCorrelationLines: boolean;
  showAccidentFrequency: boolean;
  showRoutePlanner: boolean;
  // AI Agents
  showHealthAdvisor: boolean;
  showInvestigator: boolean;
  showPredictive: boolean;
  // Citizen Reports
  showCitizenReports: boolean;
  showCitizenForm: boolean;
  districts: string[];
  severityFilter: ('minor' | 'moderate' | 'severe' | 'fatal')[];
  aqiLevelFilter: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

// =====================================================
// STORE INTERFACE
// =====================================================

interface TrafficStore {
  // State - Original
  cameras: Camera[];
  weather: Weather[];
  airQuality: AirQuality[];
  accidents: Accident[];
  patterns: TrafficPattern[];
  selectedCamera: Camera | null;
  selectedAccident: Accident | null;
  selectedPattern: TrafficPattern | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  filters: FilterState;
  lastUpdate: Date | null;

  // State - Extended
  pollutants: PollutantData[];
  humidityZones: HumidityZonesCollection | null;
  vehicleHeatmap: VehicleHeatmapData | null;
  speedZones: SpeedZonesCollection | null;
  districts: District[];
  selectedDistrict: string | null;
  accidentFrequency: AccidentFrequencyData | null;

  // Actions - Data Management
  setCameras: (cameras: Camera[]) => void;
  addCamera: (camera: Camera) => void;
  setWeather: (weather: Weather[]) => void;
  addWeather: (weather: Weather) => void;
  setAirQuality: (airQuality: AirQuality[]) => void;
  addAirQuality: (airQuality: AirQuality) => void;
  setAccidents: (accidents: Accident[]) => void;
  addAccident: (accident: Accident) => void;
  setPatterns: (patterns: TrafficPattern[]) => void;
  addPattern: (pattern: TrafficPattern) => void;

  // Actions - Extended Data Management
  setPollutants: (pollutants: PollutantData[]) => void;
  setHumidityZones: (zones: HumidityZonesCollection | null) => void;
  setVehicleHeatmap: (heatmap: VehicleHeatmapData | null) => void;
  setSpeedZones: (zones: SpeedZonesCollection | null) => void;
  setDistricts: (districts: District[]) => void;
  setSelectedDistrict: (districtId: string | null) => void;
  setAccidentFrequency: (data: AccidentFrequencyData | null) => void;

  // Actions - Selection
  setSelectedCamera: (camera: Camera | null) => void;
  setSelectedAccident: (accident: Accident | null) => void;
  setSelectedPattern: (pattern: TrafficPattern | null) => void;

  // Actions - Connection & Loading
  setIsConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Filters
  toggleFilter: (filterName: keyof FilterState) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Actions - Data Loading (Original)
  loadAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
  handleWebSocketUpdate: (event: any) => void;

  // Actions - Data Loading (Extended)
  loadPollutants: (pollutantTypes?: string[]) => Promise<void>;
  loadHumidityZones: () => Promise<void>;
  loadVehicleHeatmap: (timeRange?: string) => Promise<void>;
  loadSpeedZones: (currentTime?: boolean) => Promise<void>;
  loadDistricts: () => Promise<void>;
  loadAccidentFrequency: (days?: number) => Promise<void>;
  selectDistrict: (districtId: string | null) => void;

  // Computed Values (Getters)
  getFilteredCameras: () => Camera[];
  getFilteredAccidents: () => Accident[];
  getFilteredAirQuality: () => AirQuality[];
  getActivePatterns: () => TrafficPattern[];
  getAccidentsByDistrict: () => Record<string, Accident[]>;
  getAverageAQI: () => number;
}

// =====================================================
// DEFAULT FILTER STATE
// =====================================================

const defaultFilters: FilterState = {
  showCameras: true,
  showWeather: false,
  showAirQuality: false,
  showAccidents: true,
  showPatterns: false,
  showAQIHeatmap: false,
  showWeatherOverlay: false,
  showAccidentMarkers: true,
  showPatternZones: false,
  showPollutantCircles: false,
  showHumidityLayer: false,
  showVehicleHeatmap: false,
  showSpeedZones: false,
  showCorrelationLines: false,
  showAccidentFrequency: false,
  showRoutePlanner: false,
  // AI Agents
  showHealthAdvisor: false,
  showInvestigator: false,
  showPredictive: false,
  // Citizen Reports
  showCitizenReports: false,
  showCitizenForm: false,
  districts: [],
  severityFilter: [],
  aqiLevelFilter: [],
  dateRange: {
    start: null,
    end: null,
  },
};

// =====================================================
// ZUSTAND STORE WITH PERSISTENCE
// =====================================================

export const useTrafficStore = create<TrafficStore>()(
  persist(
    (set, get) => ({
      // =============================================
      // INITIAL STATE
      // =============================================
      cameras: [],
      weather: [],
      airQuality: [],
      accidents: [],
      patterns: [],
      selectedCamera: null,
      selectedAccident: null,
      selectedPattern: null,
      isConnected: false,
      loading: false,
      error: null,
      filters: defaultFilters,
      lastUpdate: null,

      // Extended State
      pollutants: [],
      humidityZones: null,
      vehicleHeatmap: null,
      speedZones: null,
      districts: [],
      selectedDistrict: null,
      accidentFrequency: null,

      // =============================================
      // DATA MANAGEMENT ACTIONS
      // =============================================
      setCameras: (cameras) => set({ cameras, lastUpdate: new Date() }),

      addCamera: (camera) =>
        set((state) => {
          const exists = state.cameras.find((c) => c.id === camera.id);
          if (exists) {
            return {
              cameras: state.cameras.map((c) => (c.id === camera.id ? camera : c)),
              lastUpdate: new Date(),
            };
          }
          return {
            cameras: [...state.cameras, camera],
            lastUpdate: new Date(),
          };
        }),

      setWeather: (weather) => set({ weather, lastUpdate: new Date() }),

      addWeather: (weather) =>
        set((state) => {
          const exists = state.weather.find((w) => w.id === weather.id);
          if (exists) {
            return {
              weather: state.weather.map((w) => (w.id === weather.id ? weather : w)),
              lastUpdate: new Date(),
            };
          }
          return {
            weather: [...state.weather, weather],
            lastUpdate: new Date(),
          };
        }),

      setAirQuality: (airQuality) => set({ airQuality, lastUpdate: new Date() }),

      addAirQuality: (airQuality) =>
        set((state) => {
          const exists = state.airQuality.find((a) => a.id === airQuality.id);
          if (exists) {
            return {
              airQuality: state.airQuality.map((a) =>
                a.id === airQuality.id ? airQuality : a
              ),
              lastUpdate: new Date(),
            };
          }
          return {
            airQuality: [...state.airQuality, airQuality],
            lastUpdate: new Date(),
          };
        }),

      setAccidents: (accidents) => set({ accidents, lastUpdate: new Date() }),

      addAccident: (accident) =>
        set((state) => {
          const exists = state.accidents.find((a) => a.id === accident.id);
          if (exists) {
            return {
              accidents: state.accidents.map((a) =>
                a.id === accident.id ? accident : a
              ),
              lastUpdate: new Date(),
            };
          }
          return {
            accidents: [...state.accidents, accident],
            lastUpdate: new Date(),
          };
        }),

      setPatterns: (patterns) => set({ patterns, lastUpdate: new Date() }),

      addPattern: (pattern) =>
        set((state) => {
          const exists = state.patterns.find((p) => p.id === pattern.id);
          if (exists) {
            return {
              patterns: state.patterns.map((p) => (p.id === pattern.id ? pattern : p)),
              lastUpdate: new Date(),
            };
          }
          return {
            patterns: [...state.patterns, pattern],
            lastUpdate: new Date(),
          };
        }),

      // =============================================
      // EXTENDED DATA MANAGEMENT ACTIONS
      // =============================================
      setPollutants: (pollutants) => set({ pollutants, lastUpdate: new Date() }),
      setHumidityZones: (zones) => set({ humidityZones: zones, lastUpdate: new Date() }),
      setVehicleHeatmap: (heatmap) => set({ vehicleHeatmap: heatmap, lastUpdate: new Date() }),
      setSpeedZones: (zones) => set({ speedZones: zones, lastUpdate: new Date() }),
      setDistricts: (districts) => set({ districts, lastUpdate: new Date() }),
      setSelectedDistrict: (districtId) => set({ selectedDistrict: districtId }),
      setAccidentFrequency: (data) => set({ accidentFrequency: data, lastUpdate: new Date() }),

      // =============================================
      // SELECTION ACTIONS
      // =============================================
      setSelectedCamera: (camera) => set({ selectedCamera: camera }),
      setSelectedAccident: (accident) => set({ selectedAccident: accident }),
      setSelectedPattern: (pattern) => set({ selectedPattern: pattern }),

      // =============================================
      // CONNECTION & LOADING ACTIONS
      // =============================================
      setIsConnected: (connected) => set({ isConnected: connected }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // =============================================
      // FILTER ACTIONS
      // =============================================
      toggleFilter: (filterName) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterName]: !state.filters[filterName as keyof FilterState],
          },
        })),

      updateFilters: (newFilters) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...newFilters,
          },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      // =============================================
      // DATA LOADING ACTIONS
      // =============================================
      loadAllData: async () => {
        set({ loading: true, error: null });
        try {
          // Load data with individual error handling to prevent total failure
          const results = await Promise.allSettled([
            api.cameras.getAll().catch(err => {
              console.warn('Failed to load cameras:', err);
              return [];
            }),
            api.weather.getAll().catch(err => {
              console.warn('Failed to load weather:', err);
              return [];
            }),
            api.airQuality.getAll().catch(err => {
              console.warn('Failed to load air quality:', err);
              return [];
            }),
            api.accidents.getAll().catch(err => {
              console.warn('Failed to load accidents:', err);
              return [];
            }),
            api.patterns.getAll().catch(err => {
              console.warn('Failed to load patterns:', err);
              return [];
            }),
          ]);

          const cameras = results[0].status === 'fulfilled' ? results[0].value : [];
          const weather = results[1].status === 'fulfilled' ? results[1].value : [];
          const airQuality = results[2].status === 'fulfilled' ? results[2].value : [];
          const accidents = results[3].status === 'fulfilled' ? results[3].value : [];
          const patterns = results[4].status === 'fulfilled' ? results[4].value : [];

          set({
            cameras,
            weather,
            airQuality,
            accidents,
            patterns,
            loading: false,
            lastUpdate: new Date(),
          });

          console.log('✅ Data loaded successfully:', {
            cameras: cameras.length,
            weather: weather.length,
            airQuality: airQuality.length,
            accidents: accidents.length,
            patterns: patterns.length
          });
        } catch (error) {
          console.error('Error loading data:', error);
          // Don't fail completely - set empty arrays and continue
          set({
            cameras: [],
            weather: [],
            airQuality: [],
            accidents: [],
            patterns: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load data',
          });
        }
      },

      refreshData: async () => {
        const { loadAllData } = get();
        api.clearCache();
        await loadAllData();
      },

      handleWebSocketUpdate: (event) => {
        const { type, data } = event;

        switch (type) {
          case 'camera_update':
            get().addCamera(data as Camera);
            break;
          case 'weather_update':
            // DISABLED: WebSocket weather updates use default coordinates
            // TODO: Fix backend to send correct coordinates in WebSocket updates
            console.log('⚠️ Ignoring weather WebSocket update (incorrect coordinates)');
            break;
          case 'aqi_update':
          case 'air_quality':
            // DISABLED: WebSocket air quality updates use default coordinates
            // TODO: Fix backend to send correct coordinates in WebSocket updates
            console.log('⚠️ Ignoring air quality WebSocket update (incorrect coordinates)');
            break;
          case 'new_accident':
          case 'accident':
            get().addAccident(data as Accident);
            break;
          case 'pattern_change':
          case 'pattern':
            get().addPattern(data as TrafficPattern);
            break;
          default:
            console.log('Unknown WebSocket event type:', type);
        }
      },

      // =============================================
      // EXTENDED DATA LOADING ACTIONS
      // =============================================
      loadPollutants: async (pollutantTypes?: string[]) => {
        try {
          const pollutants = await api.airQuality.getPollutants(pollutantTypes);
          set({ pollutants, lastUpdate: new Date() });
        } catch (error) {
          console.error('Error loading pollutants:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load pollutants' });
        }
      },

      loadHumidityZones: async () => {
        try {
          const humidityZones = await api.weather.getHumidityZones();
          set({ humidityZones, lastUpdate: new Date() });
        } catch (error) {
          console.error('Error loading humidity zones:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load humidity zones' });
        }
      },

      loadVehicleHeatmap: async (timeRange?: string) => {
        try {
          const vehicleHeatmap = await api.patterns.getVehicleHeatmap(timeRange);
          set({ vehicleHeatmap, lastUpdate: new Date() });
        } catch (error) {
          console.error('Error loading vehicle heatmap:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load vehicle heatmap' });
        }
      },

      loadSpeedZones: async (currentTime: boolean = false) => {
        try {
          const speedZones = await api.patterns.getSpeedZones(currentTime);
          set({ speedZones, lastUpdate: new Date() });
        } catch (error) {
          console.error('Error loading speed zones:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load speed zones' });
        }
      },

      loadDistricts: async () => {
        try {
          const response = await api.districts.getAll();
          if (response.success && response.data.districts) {
            set({ districts: response.data.districts, lastUpdate: new Date() });
          }
        } catch (error) {
          console.error('Error loading districts:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load districts' });
        }
      },

      loadAccidentFrequency: async (days: number = 30) => {
        try {
          const accidentFrequency = await api.analytics.getAccidentFrequency(days);
          set({ accidentFrequency, lastUpdate: new Date() });
        } catch (error) {
          console.error('Error loading accident frequency:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load accident frequency' });
        }
      },

      selectDistrict: (districtId: string | null) => {
        set({ selectedDistrict: districtId });
      },

      // =============================================
      // COMPUTED VALUES (GETTERS)
      // =============================================
      getFilteredCameras: () => {
        const { cameras, filters } = get();
        if (!filters.showCameras) return [];

        return cameras.filter((camera) => {
          // Filter by district
          if (filters.districts.length > 0) {
            const district = camera.location.address.split(',')[0].trim();
            if (!filters.districts.includes(district)) return false;
          }

          return true;
        });
      },

      getFilteredAccidents: () => {
        const { accidents, filters } = get();
        if (!filters.showAccidents) return [];

        return accidents.filter((accident) => {
          // Filter by severity
          if (filters.severityFilter.length > 0) {
            if (!filters.severityFilter.includes(accident.severity)) return false;
          }

          // Filter by district
          if (filters.districts.length > 0) {
            const district = accident.location.address.split(',')[0].trim();
            if (!filters.districts.includes(district)) return false;
          }

          // Filter by date range
          if (filters.dateRange.start && filters.dateRange.end) {
            const accidentDate = new Date(accident.timestamp);
            if (accidentDate < filters.dateRange.start || accidentDate > filters.dateRange.end) {
              return false;
            }
          }

          return true;
        });
      },

      getFilteredAirQuality: () => {
        const { airQuality, filters } = get();
        if (!filters.showAirQuality) return [];

        return airQuality.filter((aqi) => {
          // Filter by AQI level
          if (filters.aqiLevelFilter.length > 0) {
            if (!filters.aqiLevelFilter.includes(aqi.level)) return false;
          }

          // Filter by district
          if (filters.districts.length > 0) {
            // Try to get district from station name or default
            const district = aqi.location.station?.split(',')[0]?.trim() || 'Unknown';
            if (!filters.districts.includes(district)) return false;
          }

          return true;
        });
      },

      getActivePatterns: () => {
        const { patterns, filters } = get();
        if (!filters.showPatterns) return [];

        const now = new Date();
        return patterns.filter((pattern) => {
          // Check if pattern is currently active based on timeRange
          const [startTime, endTime] = pattern.timeRange.split('-').map(t => t.trim());
          const currentHour = now.getHours();
          const startHour = parseInt(startTime.split(':')[0]);
          const endHour = parseInt(endTime.split(':')[0]);

          const isActive = currentHour >= startHour && currentHour < endHour;

          // Filter by district - skip if no location
          if (filters.districts.length > 0 && pattern.location) {
            // TrafficPattern may not have district in location, skip this filter for patterns
            // Or you can extract from startPoint/endPoint if needed
            return isActive;
          }

          return isActive;
        });
      },

      getAccidentsByDistrict: () => {
        const { accidents } = get();
        const grouped: Record<string, Accident[]> = {};

        accidents.forEach((accident) => {
          const district = accident.location.address.split(',')[0].trim();
          if (!grouped[district]) {
            grouped[district] = [];
          }
          grouped[district].push(accident);
        });

        return grouped;
      },

      getAverageAQI: () => {
        const { airQuality } = get();
        if (airQuality.length === 0) return 0;

        const total = airQuality.reduce((sum, aqi) => sum + aqi.aqi, 0);
        return Math.round(total / airQuality.length);
      },
    }),
    {
      name: 'traffic-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);
