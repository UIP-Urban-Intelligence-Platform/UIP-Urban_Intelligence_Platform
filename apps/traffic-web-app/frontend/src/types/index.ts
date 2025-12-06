/**
 * TypeScript Type Definitions - Core Types and Interfaces
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/frontend/src/types/index
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Centralized TypeScript type definitions and interfaces for entire frontend application.
 * Defines data structures for all entity types (Camera, Weather, AirQuality, Accident,
 * TrafficPattern, CitizenReport), WebSocket messages, API responses, and UI state.
 * 
 * Core type categories:
 * - Entities: Camera, Weather, AirQuality, Accident, TrafficPattern, CitizenReport
 * - Geospatial: Location, GeoCoordinates, BoundingBox
 * - Temporal: TimeRange, HistoricalData
 * - WebSocket: WebSocketMessage, MessageType
 * - UI State: LayerVisibility, FilterState, ViewMode
 * - API: ApiResponse, PaginatedResponse, ErrorResponse
 * 
 * @dependencies
 * - typescript@5.1.6 - Type system and inference
 * 
 * @example
 * ```typescript
 * import { Camera, Weather, WebSocketMessage } from './types';
 * 
 * const camera: Camera = {
 *   id: 'urn:ngsi-ld:Camera:001',
 *   name: 'District 1 Main Street',
 *   location: { latitude: 10.762622, longitude: 106.660172 },
 *   status: 'active'
 * };
 * ```
 */
export interface Camera {
  id: string;
  name: string;
  cameraName?: string; // Backend compatibility
  type?: 'PTZ' | 'Static' | 'Dome';
  cameraType?: string; // Backend compatibility
  location: {
    latitude: number;
    longitude: number;
    address: string;
    lat?: number; // Backend compatibility
    lng?: number; // Backend compatibility
  };
  status: 'active' | 'inactive' | 'maintenance' | 'online' | 'offline';
  streamUrl?: string;
  lastUpdate: string;
  dateModified?: string;
  district?: string; // District information
}

export interface Weather {
  id: string;
  cameraId?: string;
  location: {
    latitude: number;
    longitude: number;
    district: string;
    lat?: number;
    lng?: number;
  };
  temperature: number;
  humidity: number;
  rainfall: number;
  precipitation?: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  weatherType?: string;
  timestamp: string;
  dateObserved?: string;
  dateModified?: string;
}

export interface AirQuality {
  id: string;
  cameraId?: string;
  location: {
    latitude: number;
    longitude: number;
    station: string;
    lat?: number;
    lng?: number;
  };
  aqi: number;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
  level: 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  colorCode?: string;
  timestamp: string;
  dateObserved?: string;
  dateModified?: string;
}

export interface Accident {
  id: string;
  affectedCamera?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    lat?: number;
    lng?: number;
  };
  type: 'collision' | 'pedestrian' | 'motorcycle' | 'vehicle' | 'other' | 'Multi-Vehicle' | 'Single-Vehicle';
  severity: 'minor' | 'moderate' | 'severe' | 'fatal';
  description: string;
  timestamp: string;
  dateDetected?: string;
  dateModified?: string;
  resolved: boolean;
  casualties?: number;
  vehicles?: number;
  confidence?: number;
}

export interface TrafficPattern {
  id: string;
  patternType: string;
  congestionLevel: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe' | 'high' | 'medium' | 'low';
  timeRange: string;
  daysOfWeek: string[];
  affectedCameras: string[];
  avgVehicleCount?: number;
  roadSegment?: string;
  location?: {
    startPoint: {
      latitude: number;
      longitude: number;
      lat?: number;
      lng?: number;
    };
    endPoint: {
      latitude: number;
      longitude: number;
      lat?: number;
      lng?: number;
    };
  };
  averageSpeed?: number;
  vehicleCount?: number;
  timeOfDay?: string;
  dayOfWeek?: string;
  historicalData?: {
    date: string;
    averageSpeed: number;
    vehicleCount: number;
  }[];
  predictions?: {
    nextHour: number;
    confidence: number;
  };
  timestamp: string;
  dateModified?: string;
}

export interface WebSocketMessage {
  type:
  | 'initial'
  | 'camera_update'
  | 'cameras'
  | 'weather_update'
  | 'weathers'
  | 'aqi_update'
  | 'air_qualities'
  | 'new_accident'
  | 'accidents'
  | 'pattern_change'
  | 'patterns'
  | 'accident_alert'
  | 'aqi_warning'
  | 'ping'
  | 'pong'
  | 'camera'
  | 'weather'
  | 'air_quality'
  | 'accident'
  | 'pattern'
  | 'update'
  | 'connection'
  | 'subscribed';
  priority?: 'high' | 'medium' | 'low';
  data?: any;
  message?: string;
  timestamp: string;
}

export interface CorrelationData {
  totalAccidents: number;
  accidentsWithPatterns: number;
  correlationRate: number;
  byPattern: PatternAnalysis[];
  byCongestion: {
    high: number;
    medium: number;
    low: number;
  };
  avgVehicleCount: number;
  insights: string;
}

export interface PatternAnalysis {
  patternId: string;
  patternType: string;
  congestionLevel: string;
  timeRange: string;
  daysOfWeek: string[];
  affectedCameras: string[];
  accidentCount: number;
  avgSeverity: string;
  severityBreakdown: {
    severe: number;
    moderate: number;
    minor: number;
  };
}

// =====================================================
// NEW DATA TYPES FOR EXTENDED FEATURES
// =====================================================

export interface PollutantValue {
  value: number;
  unit: string;
  level: 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

export interface PollutantData {
  id: string;
  cameraId: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  pollutants: {
    pm25: PollutantValue;
    pm10: PollutantValue;
    co: PollutantValue;
    no2: PollutantValue;
    so2: PollutantValue;
    o3: PollutantValue;
  };
  timestamp: string;
  dateObserved?: string;
}

export interface HumidityZone {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    humidityLevel: number;
    visibilityLevel: number;
    averageHumidity: number;
    averageVisibility: number;
    colorCode: string;
    level: 'clear' | 'moderate' | 'poor' | 'very_poor';
    stationCount: number;
    timestamp: string;
  };
}

export interface HumidityZonesCollection {
  type: 'FeatureCollection';
  features: HumidityZone[];
  metadata: {
    totalZones: number;
    generatedAt: string;
    coverage: string;
  };
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  vehicleCount: number;
  avgSpeed: number;
  timestamp: string;
  congestionLevel: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe';
}

export interface VehicleHeatmapData {
  points: HeatmapPoint[];
  maxIntensity: number;
  timeRange: string;
  totalVehicles: number;
  averageSpeed: number;
  generatedAt: string;
}

export interface SpeedZone {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    speedCategory: 'very_slow' | 'slow' | 'moderate' | 'fast' | 'very_fast';
    averageSpeed: number;
    speedLimit?: number;
    vehicleCount: number;
    congestionLevel: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe';
    colorCode: string;
    label: string;
    cameraCount: number;
    roadSegments: string[];
    timestamp: string;
  };
}

export interface SpeedZonesCollection {
  type: 'FeatureCollection';
  features: SpeedZone[];
  metadata: {
    totalZones: number;
    generatedAt: string;
    averageSpeed: number;
    speedRange: {
      min: number;
      max: number;
    };
  };
}

export interface District {
  id: string;
  name: string;
  cameraCount: number;
  onlineCount: number;
  offlineCount: number;
  avgAQI: number | null;
  accidentsToday: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  geometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface DistrictsUIResponse {
  success: boolean;
  data: {
    districts: District[];
    totalDistricts: number;
  };
}

export interface AccidentFrequencyData {
  hourly: HourlyFrequency[];
  daily: DailyFrequency[];
  weekly: WeeklyFrequency[];
  metadata: {
    startDate: string;
    endDate: string;
    totalAccidents: number;
    averagePerDay: number;
    peakHour: number;
    peakDay: string;
    mostDangerousDay: string;
  };
}

export interface HourlyFrequency {
  hour: number;
  fatal: number;
  severe: number;
  moderate: number;
  minor: number;
  total: number;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface DailyFrequency {
  date: string;
  fatal: number;
  severe: number;
  moderate: number;
  minor: number;
  total: number;
  dayOfWeek: string;
}

export interface WeeklyFrequency {
  dayOfWeek: string;
  dayIndex: number;
  fatal: number;
  severe: number;
  moderate: number;
  minor: number;
  total: number;
  average: number;
}
