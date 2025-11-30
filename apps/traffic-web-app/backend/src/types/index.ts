/**
 * @module apps/traffic-web-app/backend/src/types/index
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * TypeScript type definitions and interfaces for the traffic monitoring system.
 * Provides comprehensive type safety for all data structures used across
 * the application, including NGSI-LD entities, API requests/responses,
 * and internal data models.
 * 
 * Core Type Categories:
 * - Entity Types: Camera, Vehicle, Accident, Weather, AirQuality, TrafficPattern
 * - Query Parameters: CameraQueryParams, AccidentQueryParams, WeatherQueryParams
 * - Response Types: PaginatedResponse, EntityCollection, HealthStatus
 * - Agent Types: InvestigationReport, HealthAdvice, PredictiveTimeline
 * - WebSocket Types: WebSocketMessage, ClientSubscription
 * - Geospatial Types: Coordinates, BoundingBox, GeoJSON types
 * 
 * Benefits:
 * - Full type safety across frontend and backend
 * - Auto-completion in IDEs
 * - Compile-time error detection
 * - Self-documenting code
 * - Contract between API endpoints and consumers
 * 
 * @dependencies
 * - None (pure TypeScript interfaces and types)
 * 
 * @example
 * ```typescript
 * import { Camera, CameraQueryParams, Accident } from './types';
 * 
 * const camera: Camera = {
 *   id: 'urn:ngsi-ld:Camera:001',
 *   cameraName: 'Quận 1 - Lê Lợi',
 *   location: { lat: 10.762622, lng: 106.660172 },
 *   status: 'online',
 *   cameraType: 'PTZ',
 *   dateModified: '2024-11-27T10:00:00Z'
 * };
 * 
 * const params: CameraQueryParams = {
 *   status: 'online',
 *   type: 'PTZ',
 *   limit: 100
 * };
 * ```
 */

export interface Camera {
  id: string;
  name?: string;
  cameraName: string;
  type?: 'PTZ' | 'Static' | 'Dome' | 'Unknown';
  cameraType: 'PTZ' | 'Static' | 'Dome' | 'Unknown';
  location: {
    lat: number;
    lng: number;
  };
  status: 'online' | 'offline';
  streamUrl?: string;
  lastUpdate?: string;
  dateModified: string;
  district?: string;
}

export interface CameraQueryParams {
  status?: 'online' | 'offline';
  type?: 'PTZ' | 'Static' | 'Dome';
  bbox?: string; // format: minLat,minLng,maxLat,maxLng
  limit?: number;
}

export interface Weather {
  id: string;
  cameraId: string;
  location: {
    lat: number;
    lng: number;
  };
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: string;
  weatherType: string;
  pressure?: number;
  visibility?: number;
  dateObserved: string;
}

export interface WeatherQueryParams {
  cameraId?: string;
  limit?: number;
}

export interface AirQuality {
  id: string;
  cameraId: string;
  location: {
    lat: number;
    lng: number;
  };
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
  so2: number;
  level: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  colorCode: string;
  dateObserved: string;
}

export interface AirQualityQueryParams {
  level?: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  minAqi?: number;
  cameraId?: string;
  limit?: number;
}

// Road Accident Types
export interface RoadAccident {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  dateDetected: string;
  accidentType: 'collision' | 'pedestrian' | 'vehicle_breakdown' | 'debris' | 'other';
  severity: 'severe' | 'moderate' | 'minor';
  affectedCamera?: string;
  vehicleCount?: number;
  speedVariance?: number;
  confidence?: number;
  description?: string;
}

export interface AccidentQueryParams {
  hours?: number;
  severity?: 'severe' | 'moderate' | 'minor';
  cameraId?: string;
  limit?: number;
  page?: number;
}

// Traffic Pattern Types
export interface TrafficPatternData {
  id: string;
  name: string;
  patternType: 'rush_hour' | 'normal' | 'off_peak';
  timeRange: {
    start: string;
    end: string;
  };
  daysOfWeek: string[];
  avgVehicleCount: number;
  peakVehicleCount: number;
  avgSpeed: number;
  congestionLevel: 'high' | 'medium' | 'low';
  confidence: number;
  affectedCameras: string[];
  geometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface PatternQueryParams {
  congestion?: 'high' | 'medium' | 'low';
  type?: 'rush_hour' | 'normal' | 'off_peak';
  currentTime?: boolean;
  limit?: number;
}

// Analytics Types
export interface PollutantData {
  location: {
    lat: number;
    lng: number;
  };
  cameraId: string;
  pollutants: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    o3?: number;
    co?: number;
    so2?: number;
  };
  dateObserved: string;
}

export interface HumidityZone {
  zoneId: number;
  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  dataPointCount: number;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface AccidentFrequency {
  hour: number[];
  count: number[];
  dayOfWeek: string[];
  dailyCounts: Record<string, number>;
}

export interface VehicleHeatmapPoint {
  lat: number;
  lng: number;
  value: number;
  hour: number;
  patternId: string;
}

export interface SpeedZone {
  patternId: string;
  name: string;
  category: 'slow' | 'medium' | 'fast';
  avgSpeed: number;
  color: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface DistrictOption {
  id: string;
  name: string;
  cameraCount: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface Accident {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  type: 'collision' | 'pedestrian' | 'motorcycle' | 'vehicle' | 'other';
  severity: 'minor' | 'moderate' | 'severe' | 'fatal';
  description: string;
  timestamp: string;
  resolved: boolean;
  casualties?: number;
}

export interface TrafficPattern {
  id: string;
  patternType: string;
  roadSegment: string;
  location: {
    startPoint: { latitude: number; longitude: number };
    endPoint: { latitude: number; longitude: number };
  };
  averageSpeed: number;
  vehicleCount: number;
  congestionLevel: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe';
  timeOfDay: string;
  dayOfWeek: string;
  timeRange?: string;
  daysOfWeek: string[];
  affectedCameras: string[];
  avgVehicleCount?: number;
  historicalData: {
    date: string;
    averageSpeed: number;
    vehicleCount: number;
  }[];
  predictions?: {
    nextHour: number;
    confidence: number;
  };
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'camera' | 'cameras' | 'weather' | 'weathers' | 'air_quality' | 'air_qualities' | 'accident' | 'accidents' | 'pattern' | 'patterns' | 'update';
  data: Camera | Camera[] | Weather | Weather[] | AirQuality | AirQuality[] | Accident | Accident[] | TrafficPattern | TrafficPattern[] | any;
  timestamp: string;
}
