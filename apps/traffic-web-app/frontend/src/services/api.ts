/**
 * API Service - REST Client for Traffic Backend
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/frontend/src/services/api
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Axios-based HTTP client providing typed API methods for all backend endpoints.
 * Includes caching, retry logic, error handling, and request/response interceptors.
 * 
 * API Endpoint Groups:
 * 1. Cameras (/api/cameras): Traffic camera entities
 * 2. Weather (/api/weather): Weather observations
 * 3. Air Quality (/api/air-quality): AQI and pollutant data
 * 4. Accidents (/api/accidents): Road accident events
 * 5. Patterns (/api/patterns): Traffic congestion patterns
 * 6. Analytics (/api/analytics): Aggregated metrics and correlations
 * 7. Historical (/api/historical): Time-series data
 * 8. Correlation (/api/correlation): Entity relationship data
 * 9. Routing (/api/routing): Route planning
 * 10. Geocoding (/api/geocoding): Address/coordinate conversion
 * 11. Agents (/api/agents): AI agent interactions
 * 12. Multi-Agent (/api/multi-agent): Combined agent queries
 * 
 * Features:
 * - In-memory caching with 30s TTL
 * - Automatic retry on 5xx errors (3 attempts)
 * - Request timeout (30s default)
 * - TypeScript type safety
 * - Error normalization
 * - Loading state tracking
 * 
 * @dependencies
 * - axios@^1.6: HTTP client
 * 
 * @example
 * import { apiService } from './services/api';
 * const cameras = await apiService.getCameras({ limit: 50 });
 * const weather = await apiService.getWeather({ limit: 10 });
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  Camera,
  Weather,
  AirQuality,
  Accident,
  TrafficPattern,
  CorrelationData,
  PollutantData,
  HumidityZonesCollection,
  VehicleHeatmapData,
  SpeedZonesCollection,
  DistrictsUIResponse,
  AccidentFrequencyData
} from '../types';

// =====================================================
// API CONFIGURATION & TYPES
// =====================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CACHE_DURATION = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
const MAX_CONCURRENT_REQUESTS = 10; // Limit concurrent requests to prevent backend overload

export interface CameraFilters {
  district?: string;
  status?: 'online' | 'offline' | 'maintenance';
  search?: string;
  minLatitude?: number;
  maxLatitude?: number;
  minLongitude?: number;
  maxLongitude?: number;
}

export interface AirQualityFilters {
  district?: string;
  level?: string;
  minAQI?: number;
  maxAQI?: number;
  startDate?: string;
  endDate?: string;
}

export interface AccidentFilters {
  district?: string;
  type?: string;
  severity?: 'minor' | 'moderate' | 'severe' | 'fatal';
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
  lat?: number;
  lon?: number;
  radius?: number;
}

export interface PatternFilters {
  district?: string;
  patternType?: string;
  congestionLevel?: 'low' | 'moderate' | 'high' | 'severe';
  timeRange?: string;
  roadSegment?: string;
}

export interface HistoricalAQIParams {
  cameraId?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  aggregation?: 'hourly' | 'daily' | 'weekly';
  district?: string;
}

// =====================================================
// CACHE IMPLEMENTATION
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern?: RegExp): void {
    if (!pattern) {
      this.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new APICache();

// =====================================================
// REQUEST QUEUE - LIMIT CONCURRENT REQUESTS
// =====================================================

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = MAX_CONCURRENT_REQUESTS;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.run();
    });
  }

  private async run() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift();

    if (fn) {
      try {
        await fn();
      } finally {
        this.running--;
        this.run();
      }
    }
  }
}

const requestQueue = new RequestQueue();

// =====================================================
// AXIOS INSTANCE WITH INTERCEPTORS
// =====================================================

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // Add retry configuration
    validateStatus: (status) => status >= 200 && status < 500 // Don't retry 4xx errors
  });

  // Request interceptor - add loading state and logging
  client.interceptors.request.use(
    (config) => {
      if (config.method === 'get') {
        config.params = { ...config.params, _t: Date.now() };
      }

      if (import.meta.env.DEV) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params);
      }

      // Emit loading event
      window.dispatchEvent(new CustomEvent('api:loading:start', {
        detail: { url: config.url }
      }));

      return config;
    },
    (error) => {
      console.error('[API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - retry logic and error handling
  client.interceptors.response.use(
    (response) => {
      window.dispatchEvent(new CustomEvent('api:loading:end', {
        detail: { url: response.config.url }
      }));

      if (import.meta.env.DEV) {
        console.log(`[API] Response ${response.config.url}:`, response.data);
      }

      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { _retryCount?: number };

      window.dispatchEvent(new CustomEvent('api:loading:end', {
        detail: { url: error.config?.url }
      }));

      // Retry logic for network errors or 5xx errors
      if (
        config &&
        (!error.response || (error.response.status >= 500 && error.response.status < 600)) &&
        (config._retryCount || 0) < MAX_RETRY_ATTEMPTS
      ) {
        config._retryCount = (config._retryCount || 0) + 1;
        const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);

        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`[API] Retry ${config._retryCount}/${MAX_RETRY_ATTEMPTS} for ${config.url}`);
        return client.request(config);
      }

      console.error('[API] Response error:', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code
      });

      // Enhanced error message for common issues
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout after 30s: ${error.config?.url}`);
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error(`Network error - Backend may be offline. Check ${API_BASE_URL}/health`);
      } else if (!error.response) {
        throw new Error(`No response from backend server. Is it running on ${API_BASE_URL}?`);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const generateCacheKey = (endpoint: string, params?: any): string => {
  const sortedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${endpoint}:${sortedParams}`;
};

// =====================================================
// API SERVICE
// =====================================================

export const api = {
  // ===================================================
  // CAMERAS
  // ===================================================
  cameras: {
    getAll: async (filters?: CameraFilters): Promise<Camera[]> => {
      try {
        const cacheKey = generateCacheKey('/cameras', filters);
        const cached = cache.get<Camera[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/cameras', { params: filters });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching cameras:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<Camera> => {
      try {
        const cacheKey = generateCacheKey(`/cameras/${id}`);
        const cached = cache.get<Camera>(cacheKey);
        if (cached) return cached;

        // Use request queue to limit concurrent requests
        return await requestQueue.add(async () => {
          const response = await apiClient.get(`/cameras/${id}`);
          const data = response.data.data;
          cache.set(cacheKey, data);
          return data;
        });
      } catch (error) {
        console.error(`Error fetching camera ${id}:`, error);
        throw error;
      }
    },
  },

  // ===================================================
  // WEATHER
  // ===================================================
  weather: {
    getAll: async (cameraId?: string): Promise<Weather[]> => {
      try {
        const cacheKey = generateCacheKey('/weather', { cameraId });
        const cached = cache.get<Weather[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/weather', {
          params: cameraId ? { cameraId } : undefined
        });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
      }
    },

    getHumidityZones: async (): Promise<HumidityZonesCollection> => {
      try {
        const cacheKey = generateCacheKey('/weather/humidity-zones');
        const cached = cache.get<HumidityZonesCollection>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/weather/humidity-zones');
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching humidity zones:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // AIR QUALITY
  // ===================================================
  airQuality: {
    getAll: async (filters?: AirQualityFilters): Promise<AirQuality[]> => {
      try {
        const cacheKey = generateCacheKey('/air-quality', filters);
        const cached = cache.get<AirQuality[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/air-quality', { params: filters });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching air quality:', error);
        throw error;
      }
    },

    getPollutants: async (pollutants?: string[]): Promise<PollutantData[]> => {
      try {
        const cacheKey = generateCacheKey('/air-quality/pollutants', { pollutants });
        const cached = cache.get<PollutantData[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/air-quality/pollutants', {
          params: pollutants && pollutants.length > 0 ? { pollutants: pollutants.join(',') } : undefined
        });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching pollutants:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // ACCIDENTS
  // ===================================================
  accidents: {
    getAll: async (filters?: AccidentFilters): Promise<Accident[]> => {
      try {
        const cacheKey = generateCacheKey('/accidents', filters);
        const cached = cache.get<Accident[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/accidents', { params: filters });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching accidents:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<Accident> => {
      try {
        const cacheKey = generateCacheKey(`/accidents/${id}`);
        const cached = cache.get<Accident>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get(`/accidents/${id}`);
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error(`Error fetching accident ${id}:`, error);
        throw error;
      }
    },

    getByArea: async (lat: number, lon: number, radius: number = 5): Promise<Accident[]> => {
      try {
        const cacheKey = generateCacheKey('/accidents/area', { lat, lon, radius });
        const cached = cache.get<Accident[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/accidents', {
          params: { lat, lon, radius },
        });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching accidents by area:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // TRAFFIC PATTERNS
  // ===================================================
  patterns: {
    getAll: async (filters?: PatternFilters): Promise<TrafficPattern[]> => {
      try {
        const cacheKey = generateCacheKey('/patterns', filters);
        const cached = cache.get<TrafficPattern[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/patterns', { params: filters });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching patterns:', error);
        throw error;
      }
    },

    getByRoadSegment: async (roadSegment: string): Promise<any> => {
      try {
        const cacheKey = generateCacheKey(`/patterns/${roadSegment}`);
        const cached = cache.get<any>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get(`/patterns/${roadSegment}`);
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error(`Error fetching pattern for road segment ${roadSegment}:`, error);
        throw error;
      }
    },

    getRoadSegments: async (): Promise<any[]> => {
      try {
        const cacheKey = generateCacheKey('/patterns/road-segments');
        const cached = cache.get<any[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/patterns/road-segments');
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching road segments:', error);
        throw error;
      }
    },

    getVehicleHeatmap: async (timeRange?: string): Promise<VehicleHeatmapData> => {
      try {
        const cacheKey = generateCacheKey('/patterns/vehicle-heatmap', { timeRange });
        const cached = cache.get<VehicleHeatmapData>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/patterns/vehicle-heatmap', {
          params: timeRange ? { timeRange } : undefined
        });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching vehicle heatmap:', error);
        throw error;
      }
    },

    getSpeedZones: async (currentTime: boolean = false): Promise<SpeedZonesCollection> => {
      try {
        const cacheKey = generateCacheKey('/patterns/speed-zones', { currentTime });
        const cached = cache.get<SpeedZonesCollection>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/patterns/speed-zones', {
          params: { currentTime }
        });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching speed zones:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // CORRELATIONS
  // ===================================================
  correlations: {
    getAccidentPatternCorrelation: async (): Promise<CorrelationData> => {
      try {
        const cacheKey = generateCacheKey('/correlations/accident-pattern');
        const cached = cache.get<CorrelationData>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/correlations/accident-pattern');
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching accident-pattern correlation:', error);
        throw error;
      }
    },

    getAll: async (): Promise<any[]> => {
      try {
        const cacheKey = generateCacheKey('/correlations');
        const cached = cache.get<any[]>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/correlations');
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching correlations:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // ANALYTICS
  // ===================================================
  analytics: {
    getHotspots: async (): Promise<any> => {
      try {
        const cacheKey = generateCacheKey('/analytics/hotspots');
        const cached = cache.get<any>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/analytics/hotspots');
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching hotspots:', error);
        throw error;
      }
    },

    getAccidentFrequency: async (days: number = 30): Promise<AccidentFrequencyData> => {
      try {
        const cacheKey = generateCacheKey('/analytics/accident-frequency', { days });
        const cached = cache.get<AccidentFrequencyData>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/analytics/accident-frequency', {
          params: { days }
        });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching accident frequency:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // CAMERAS EXTENDED
  // ===================================================
  districts: {
    getAll: async (): Promise<DistrictsUIResponse> => {
      try {
        const cacheKey = generateCacheKey('/cameras/districts-ui');
        const cached = cache.get<DistrictsUIResponse>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/cameras/districts-ui');
        const data = response.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching districts:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // HISTORICAL DATA
  // ===================================================
  historical: {
    getAQI: async (params?: HistoricalAQIParams): Promise<any> => {
      try {
        const cacheKey = generateCacheKey('/historical/aqi', params);
        const cached = cache.get<any>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/historical/aqi', { params });
        const data = response.data.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching historical AQI:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // ROUTING
  // ===================================================
  routing: {
    calculateRoutes: async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
      preferences?: { fastest?: boolean; healthiest?: boolean; safest?: boolean }
    ): Promise<any> => {
      try {
        const response = await apiClient.post('/routing/calculate', {
          origin,
          destination,
          preferences: preferences || { fastest: true }
        });
        return response.data;
      } catch (error) {
        console.error('Error calculating routes:', error);
        throw error;
      }
    },

    getZones: async (): Promise<any> => {
      try {
        const cacheKey = generateCacheKey('/routing/zones');
        const cached = cache.get<any>(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get('/routing/zones');
        const data = response.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Error fetching routing zones:', error);
        throw error;
      }
    },

    clearCache: async (): Promise<void> => {
      try {
        await apiClient.delete('/routing/cache');
        cache.invalidate(/\/routing\//);
      } catch (error) {
        console.error('Error clearing routing cache:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // GEOCODING
  // ===================================================
  geocoding: {
    search: async (query: string, limit: number = 5): Promise<any> => {
      try {
        const response = await apiClient.get('/geocoding/search', {
          params: { q: query, limit }
        });
        return response.data;
      } catch (error) {
        console.error('Error searching geocoding:', error);
        throw error;
      }
    },

    reverse: async (lat: number, lng: number): Promise<any> => {
      try {
        const response = await apiClient.get('/geocoding/reverse', {
          params: { lat, lng }
        });
        return response.data;
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        throw error;
      }
    },
  },

  // ===================================================
  // UTILITY METHODS
  // ===================================================
  clearCache: () => cache.clear(),
  invalidateCache: (pattern?: RegExp) => cache.invalidate(pattern),

  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health');
      return response.data.data?.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
};

export default api;
