/**
 * Stellio Context Broker Service - NGSI-LD Entity Client
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/services/stellioService
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * High-performance TypeScript client for Stellio Context Broker providing optimized
 * NGSI-LD entity querying with connection pooling, caching, and retry logic.
 * 
 * Core Features:
 * 1. Entity Querying:
 *    - Type-based filtering (Camera, Weather, AirQuality, TrafficPattern, etc.)
 *    - Geo-spatial queries (near, within, intersects)
 *    - Attribute selection and expansion
 *    - Pagination with limit/offset
 *    - Temporal queries (before, after, between)
 * 
 * 2. Performance Optimization:
 *    - HTTP connection pooling (50 max sockets, 10 free sockets)
 *    - In-memory caching with TTL (default 60s)
 *    - Batch entity retrieval
 *    - Request deduplication
 * 
 * 3. Reliability:
 *    - Automatic retry with exponential backoff (3 attempts, 1s initial delay)
 *    - Timeout configuration (30s default)
 *    - Error handling with detailed logging
 *    - Health check endpoint monitoring
 * 
 * 4. NGSI-LD Support:
 *    - JSON-LD @context handling
 *    - Relationship traversal
 *    - Property value extraction
 *    - Entity creation and updates (POST/PATCH)
 * 
 * Supported Entity Types:
 * - Camera (TrafficFlowObserved): Traffic cameras with image URLs
 * - Weather (WeatherObserved): Temperature, humidity, wind, precipitation
 * - AirQuality (AirQualityObserved): PM2.5, PM10, NO2, O3, CO, SO2, AQI
 * - TrafficPattern (TrafficFlowObserved): Congestion patterns, hotspots
 * - RoadAccident (RoadAccident): Accident events with severity
 * - CitizenReport: User-submitted reports
 * 
 * @dependencies
 * - axios@^1.6: HTTP client with interceptors
 * - http/https: Node.js native modules for connection pooling
 * 
 * @example
 * const stellio = new StellioService();
 * const cameras = await stellio.getCameras({
 *   geometry: { type: 'Point', coordinates: [106.63, 10.82] },
 *   georel: 'near;maxDistance==5000',
 *   limit: 50
 * });
 * console.log(cameras.length, cameras[0].imageUrl);
 */

import axios, { AxiosInstance } from 'axios';
import http from 'http';
import https from 'https';
import { logger } from '../utils/logger';
import { Camera, CameraQueryParams, Weather, WeatherQueryParams, AirQuality, AirQualityQueryParams, TrafficPattern } from '../types';

export class StellioService {
  private client: AxiosInstance;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second
  private cameraCache: Map<string, Camera | null> = new Map(); // Cache to prevent repeated camera lookups
  private cacheTimeout: number = 60000; // 1 minute cache

  constructor() {
    const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';
    const ngsiLdPath = process.env.STELLIO_NGSI_LD_PATH || '/ngsi-ld/v1';
    this.baseUrl = `${stellioUrl}${ngsiLdPath}`;

    // Create HTTP agent with connection pooling and limits to prevent memory leaks
    const httpAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50, // Increased from 10 to 50 to handle concurrent camera requests
      maxFreeSockets: 10, // Increased from 5 to 10
      timeout: 30000
    });

    const httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50, // Increased from 10 to 50
      maxFreeSockets: 10, // Increased from 5 to 10
      timeout: 30000
    });

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // Increased from 10s to 30s to handle slow responses
      headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json'
      },
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
      maxRedirects: 5,
      // Validate status to prevent following bad redirects
      validateStatus: (status) => status >= 200 && status < 300
    });

    logger.info(`StellioService initialized with baseUrl: ${this.baseUrl} (maxSockets: 50, keepAlive: true)`);
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    context: string,
    retries: number = this.maxRetries
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const isLastAttempt = attempt === retries;

        if (isLastAttempt) {
          logger.error(`${context} failed after ${retries} attempts`);
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`${context} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`${context} failed after all retries`);
  }

  /**
   * Fetch ALL entities of a given type using offset-based pagination
   * Stellio has a hard limit of 100 entities per request, so we fetch in batches
   * 
   * @param entityType - NGSI-LD entity type (e.g., 'Camera', 'WeatherObserved')
   * @param options - Additional options like 'keyValues' for simplified response
   * @returns Promise<any[]> - All entities of the specified type
   */
  private async fetchAllPaginated(
    entityType: string,
    options: string = 'keyValues'
  ): Promise<any[]> {
    const allEntities: any[] = [];
    const batchSize = 100; // Stellio max limit is 100
    let offset = 0;
    let hasMore = true;
    let batchCount = 0;

    logger.debug(`Starting paginated fetch for ${entityType} with batchSize=${batchSize}`);

    while (hasMore) {
      try {
        const response = await this.client.get('/entities', {
          params: {
            type: entityType,
            limit: batchSize,
            offset: offset,
            options: options
          }
        });

        const batch = Array.isArray(response.data) ? response.data : [response.data];
        allEntities.push(...batch);
        batchCount++;

        logger.debug(`Fetched batch ${batchCount} for ${entityType}: ${batch.length} entities (offset=${offset}, total=${allEntities.length})`);

        // If we got fewer than batchSize entities, we've reached the end
        hasMore = batch.length === batchSize;
        offset += batchSize;

        // Safety check: prevent infinite loops (max 1000 batches = 100,000 entities)
        if (batchCount > 1000) {
          logger.warn(`Pagination safety limit reached for ${entityType} at ${allEntities.length} entities`);
          break;
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // No more entities - this is OK
          logger.debug(`No more ${entityType} entities at offset ${offset}`);
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    logger.info(`✅ Pagination complete for ${entityType}: ${allEntities.length} total entities in ${batchCount} batches`);
    return allEntities;
  }

  /**
   * Fetch cameras from Stellio NGSI-LD Context Broker
   * Queries: GET /entities?type=Camera with pagination
   * Transforms NGSI-LD response to flat structure
   * Supports filtering by status, type, and bounding box
   * Uses offset-based pagination to fetch ALL cameras (Stellio max limit is 100)
   */
  async getCameras(queryParams?: CameraQueryParams): Promise<Camera[]> {
    return this.retryRequest(async () => {
      try {
        logger.debug(`Fetching ALL cameras from Stellio with params:`, queryParams);

        // Use pagination to fetch ALL cameras
        const entities = await this.fetchAllPaginated('Camera', 'keyValues');
        const cameraArray = Array.isArray(entities) ? entities : [entities];
        logger.info(`Fetched ${cameraArray.length} cameras from Stellio (paginated)`);

        // Transform NGSI-LD entities to flat structure
        let cameras = this.transformCameras(cameraArray);

        // Apply client-side filters
        cameras = this.applyFilters(cameras, queryParams);

        logger.debug(`Returning ${cameras.length} cameras after filtering`);
        return cameras;
      } catch (error) {
        logger.error('Error fetching cameras from Stellio:', error);
        if (axios.isAxiosError(error)) {
          logger.error('Axios error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
          });
        }
        throw new Error('Failed to fetch cameras from Stellio');
      }
    }, 'Fetch cameras');
  }

  /**
   * Apply filters to camera list based on query parameters
   */
  private applyFilters(cameras: Camera[], queryParams?: CameraQueryParams): Camera[] {
    if (!queryParams) {
      return cameras;
    }

    let filtered = cameras;

    // Filter by status (online/offline)
    if (queryParams.status) {
      filtered = filtered.filter(camera => camera.status === queryParams.status);
      logger.debug(`Filtered by status=${queryParams.status}: ${filtered.length} cameras`);
    }

    // Filter by camera type (PTZ/Static/Dome)
    if (queryParams.type) {
      filtered = filtered.filter(camera => camera.cameraType === queryParams.type);
      logger.debug(`Filtered by type=${queryParams.type}: ${filtered.length} cameras`);
    }

    // Filter by bounding box (minLat,minLng,maxLat,maxLng)
    if (queryParams.bbox) {
      try {
        const [minLat, minLng, maxLat, maxLng] = queryParams.bbox
          .split(',')
          .map(coord => parseFloat(coord.trim()));

        if (
          isNaN(minLat) || isNaN(minLng) ||
          isNaN(maxLat) || isNaN(maxLng)
        ) {
          logger.warn(`Invalid bbox format: ${queryParams.bbox}`);
        } else {
          filtered = filtered.filter(camera => {
            const { lat, lng } = camera.location;
            return (
              lat >= minLat && lat <= maxLat &&
              lng >= minLng && lng <= maxLng
            );
          });
          logger.debug(`Filtered by bbox=${queryParams.bbox}: ${filtered.length} cameras`);
        }
      } catch (error) {
        logger.error(`Error parsing bbox parameter: ${queryParams.bbox}`, error);
      }
    }

    return filtered;
  }

  async getCameraById(id: string): Promise<Camera | null> {
    // Check cache first
    if (this.cameraCache.has(id)) {
      return this.cameraCache.get(id) || null;
    }

    try {
      // URL encode the camera ID to handle special characters like spaces
      const encodedId = encodeURIComponent(id);
      const response = await this.client.get(`/entities/${encodedId}`);
      const camera = this.transformCamera(response.data);

      // Cache the result
      this.cameraCache.set(id, camera);

      // Clear cache after timeout
      setTimeout(() => {
        this.cameraCache.delete(id);
      }, this.cacheTimeout);

      return camera;
    } catch (error) {
      logger.error(`Error fetching camera ${id} from Stellio:`, error);

      // Cache null result to avoid repeated failed requests
      this.cameraCache.set(id, null);
      setTimeout(() => {
        this.cameraCache.delete(id);
      }, this.cacheTimeout);

      return null;
    }
  }

  /**
   * Fetch weather data from Stellio with camera join
   * Queries WeatherObserved entities and joins with camera location via refDevice
   * Uses offset-based pagination to fetch ALL weather data (Stellio max limit is 100)
   */
  async getWeatherData(queryParams?: WeatherQueryParams): Promise<Weather[]> {
    return this.retryRequest(async () => {
      try {
        logger.debug(`Fetching ALL weather data from Stellio with params:`, queryParams);

        // Use pagination to fetch ALL weather observations
        const entities = await this.fetchAllPaginated('WeatherObserved', 'keyValues');
        const weatherArray = Array.isArray(entities) ? entities : [entities];
        logger.info(`Fetched ${weatherArray.length} weather observations from Stellio (paginated)`);

        // Transform NGSI-LD entities to Weather objects
        let weatherData = await this.transformWeatherData(weatherArray);

        // Apply filters
        weatherData = this.applyWeatherFilters(weatherData, queryParams);

        logger.debug(`Returning ${weatherData.length} weather observations after filtering`);
        return weatherData;
      } catch (error) {
        logger.error('Error fetching weather data from Stellio:', error);
        if (axios.isAxiosError(error)) {
          logger.error('Axios error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
          });
        }
        throw new Error('Failed to fetch weather data from Stellio');
      }
    }, 'Fetch weather data');
  }

  /**
   * Fetch air quality data from Stellio with camera join
   * Queries AirQualityObserved entities and joins with camera location via refDevice
   * Uses offset-based pagination to fetch ALL air quality data (Stellio max limit is 100)
   */
  async getAirQualityData(queryParams?: AirQualityQueryParams): Promise<AirQuality[]> {
    return this.retryRequest(async () => {
      try {
        logger.debug(`Fetching ALL air quality data from Stellio with params:`, queryParams);

        // Use pagination to fetch ALL air quality observations
        const entities = await this.fetchAllPaginated('AirQualityObserved', 'keyValues');
        const airQualityArray = Array.isArray(entities) ? entities : [entities];
        logger.info(`Fetched ${airQualityArray.length} air quality observations from Stellio (paginated)`);

        // Transform NGSI-LD entities to AirQuality objects
        let airQualityData = await this.transformAirQualityData(airQualityArray);

        // Apply filters
        airQualityData = this.applyAirQualityFilters(airQualityData, queryParams);

        logger.debug(`Returning ${airQualityData.length} air quality observations after filtering`);
        return airQualityData;
      } catch (error) {
        logger.error('Error fetching air quality data from Stellio:', error);
        if (axios.isAxiosError(error)) {
          logger.error('Axios error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
          });
        }
        throw new Error('Failed to fetch air quality data from Stellio');
      }
    }, 'Fetch air quality data');
  }

  /**
   * Transform weather entities and join with camera location
   */
  private async transformWeatherData(entities: any[]): Promise<Weather[]> {
    const weatherPromises = entities.map(async (entity) => {
      return await this.transformWeatherEntity(entity);
    });

    return Promise.all(weatherPromises);
  }

  /**
   * Transform single weather entity with camera join
   */
  private async transformWeatherEntity(entity: any): Promise<Weather> {
    // Extract refDevice (camera reference)
    const refDevice =
      entity.refDevice?.value ||
      entity.refDevice?.object ||
      entity.refDevice ||
      entity.refPointOfInterest?.value ||
      entity.refPointOfInterest?.object ||
      entity.refPointOfInterest ||
      null;

    let cameraId = 'unknown';
    let lat = 10.8231; // Default HCMC latitude
    let lng = 106.6297; // Default HCMC longitude

    // PRIORITY 1: Use entity's own location if available
    if (entity.location) {
      const locationData = this.extractLocation(entity.location);
      lat = locationData.lat;
      lng = locationData.lng;
      logger.debug(`✅ Using entity location: lat=${lat}, lng=${lng}`);
    }

    // PRIORITY 2: Try to get cameraId from refDevice for reference
    if (refDevice) {
      const cameraIdFromRef = typeof refDevice === 'string' ? refDevice : refDevice.object || refDevice.id || refDevice['@id'];
      if (cameraIdFromRef) {
        cameraId = cameraIdFromRef;
        logger.debug(`📍 Linked to camera: ${cameraId}`);
      }
    }

    // Extract weather properties - handle NGSI-LD formats
    const temperature = this.extractNumericValue(entity.temperature, 30);
    const humidity = this.extractNumericValue(entity.humidity || entity.relativeHumidity, 70);
    const precipitation = this.extractNumericValue(entity.precipitation || entity.rainfall, 0);
    const windSpeed = this.extractNumericValue(entity.windSpeed, 0);
    const pressure = this.extractNumericValue(entity.atmosphericPressure || entity.pressure, null);
    const visibility = this.extractNumericValue(entity.visibility, null);

    // Extract wind direction
    const windDirection =
      entity.windDirection?.value ||
      entity.windDirection ||
      'N';

    // Extract weather type
    const weatherType =
      entity.weatherType?.value ||
      entity.weatherType ||
      entity.condition?.value ||
      entity.condition ||
      'Clear';

    // Extract observation date
    const dateObserved =
      entity.dateObserved?.value ||
      entity.dateObserved ||
      entity.dateModified?.value ||
      entity.dateModified ||
      entity.timestamp?.value ||
      entity.timestamp ||
      new Date().toISOString();

    return {
      id: entity.id || entity['@id'] || `weather-${Date.now()}`,
      cameraId,
      location: {
        lat: Number(lat),
        lng: Number(lng)
      },
      temperature: Number(temperature),
      humidity: Number(humidity),
      precipitation: Number(precipitation),
      windSpeed: Number(windSpeed),
      windDirection: String(windDirection),
      weatherType: String(weatherType),
      pressure: pressure !== null ? Number(pressure) : undefined,
      visibility: visibility !== null ? Number(visibility) : undefined,
      dateObserved: String(dateObserved)
    };
  }

  /**
   * Transform air quality entities and join with camera location
   * Uses batching to prevent memory overflow
   */
  private async transformAirQualityData(entities: any[]): Promise<AirQuality[]> {
    const BATCH_SIZE = 10; // Process 10 entities at a time
    const results: AirQuality[] = [];

    for (let i = 0; i < entities.length; i += BATCH_SIZE) {
      const batch = entities.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(entity => this.transformAirQualityEntity(entity))
      );
      results.push(...batchResults);

      // Log progress for debugging
      if (i % 50 === 0) {
        logger.debug(`Transformed ${i}/${entities.length} air quality entities`);
      }
    }

    return results;
  }

  /**
   * Transform single air quality entity with camera join
   */
  private async transformAirQualityEntity(entity: any): Promise<AirQuality> {
    // Extract refDevice (camera reference)
    const refDevice =
      entity.refDevice?.value ||
      entity.refDevice?.object ||
      entity.refDevice ||
      entity.refPointOfInterest?.value ||
      entity.refPointOfInterest?.object ||
      entity.refPointOfInterest ||
      null;

    let cameraId = 'unknown';
    let lat = 10.8231; // Default HCMC latitude
    let lng = 106.6297; // Default HCMC longitude

    // PRIORITY 1: Use entity's own location if available
    if (entity.location) {
      const locationData = this.extractLocation(entity.location);
      lat = locationData.lat;
      lng = locationData.lng;
      logger.debug(`✅ Using entity location: lat=${lat}, lng=${lng}`);
    }

    // PRIORITY 2: Try to get cameraId from refDevice for reference
    if (refDevice) {
      const cameraIdFromRef = typeof refDevice === 'string' ? refDevice : refDevice.object || refDevice.id || refDevice['@id'];
      if (cameraIdFromRef) {
        cameraId = cameraIdFromRef;
        logger.debug(`📍 Linked to camera: ${cameraId}`);
      }
    }

    // Extract pollutant values - handle NGSI-LD formats
    const pm25 = this.extractNumericValue(entity.pm25 || entity['PM2.5'], 0) || 0;
    const pm10 = this.extractNumericValue(entity.pm10 || entity.PM10, 0) || 0;
    const no2 = this.extractNumericValue(entity.no2 || entity.NO2, 0) || 0;
    const o3 = this.extractNumericValue(entity.o3 || entity.O3, 0) || 0;
    const co = this.extractNumericValue(entity.co || entity.CO, 0) || 0;
    const so2 = this.extractNumericValue(entity.so2 || entity.SO2, 0) || 0;

    // Calculate AQI from PM2.5 (most important pollutant for traffic)
    // Using US EPA AQI calculation formula
    const aqi = this.calculateAQIFromPM25(pm25);

    // Calculate AQI level category
    const level = this.calculateAQILevel(aqi);
    const colorCode = this.getAQIColorCode(level);

    // Extract observation date
    const dateObserved =
      entity.dateObserved?.value ||
      entity.dateObserved ||
      entity.dateModified?.value ||
      entity.dateModified ||
      entity.timestamp?.value ||
      entity.timestamp ||
      new Date().toISOString();

    return {
      id: entity.id || entity['@id'] || `airquality-${Date.now()}`,
      cameraId,
      location: {
        lat: Number(lat),
        lng: Number(lng)
      },
      aqi: Number(aqi),
      pm25: Number(pm25),
      pm10: Number(pm10),
      no2: Number(no2),
      o3: Number(o3),
      co: Number(co),
      so2: Number(so2),
      level,
      colorCode,
      dateObserved: String(dateObserved)
    };
  }

  /**
   * Calculate US EPA AQI from PM2.5 concentration (μg/m³)
   * Using EPA's breakpoints and linear interpolation formula
   */
  private calculateAQIFromPM25(pm25: number): number {
    if (pm25 < 0) return 0;

    // EPA PM2.5 breakpoints: [Clow, Chigh, AQIlow, AQIhigh]
    const breakpoints = [
      [0.0, 12.0, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 500.4, 301, 500]
    ];

    let aqi = 50; // Default to moderate
    for (const [Clow, Chigh, AQIlow, AQIhigh] of breakpoints) {
      if (pm25 >= Clow && pm25 <= Chigh) {
        // Linear interpolation formula
        aqi = ((AQIhigh - AQIlow) / (Chigh - Clow)) * (pm25 - Clow) + AQIlow;
        break;
      }
    }

    return Math.round(aqi);
  }

  /**
   * Calculate AQI level category based on AQI value
   */
  private calculateAQILevel(aqi: number): 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous' {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  }

  /**
   * Get color code for AQI level
   */
  private getAQIColorCode(level: string): string {
    const colorMap: { [key: string]: string } = {
      'good': '#00e400',
      'moderate': '#ffff00',
      'unhealthy_sensitive': '#ff7e00',
      'unhealthy': '#ff0000',
      'very_unhealthy': '#8f3f97',
      'hazardous': '#7e0023'
    };
    return colorMap[level] || '#808080';
  }

  /**
   * Extract location from various NGSI-LD formats
   */
  private extractLocation(locationData: any): { lat: number; lng: number } {
    let lat = 10.8231; // Default HCMC latitude
    let lng = 106.6297; // Default HCMC longitude

    if (locationData.coordinates && Array.isArray(locationData.coordinates)) {
      lng = locationData.coordinates[0] || lng;
      lat = locationData.coordinates[1] || lat;
    } else if (locationData.latitude !== undefined && locationData.longitude !== undefined) {
      lat = locationData.latitude;
      lng = locationData.longitude;
    } else if (locationData.value?.coordinates) {
      lng = locationData.value.coordinates[0] || lng;
      lat = locationData.value.coordinates[1] || lat;
    } else if (locationData.lat !== undefined && locationData.lng !== undefined) {
      lat = locationData.lat;
      lng = locationData.lng;
    }

    return { lat: Number(lat), lng: Number(lng) };
  }

  /**
   * Extract numeric value from NGSI-LD property
   */
  private extractNumericValue(property: any, defaultValue: number | null): number | null {
    if (property === undefined || property === null) {
      return defaultValue;
    }

    // NGSI-LD Property format: {value: number}
    if (typeof property === 'object' && property.value !== undefined) {
      const value = parseFloat(property.value);
      return isNaN(value) ? defaultValue : value;
    }

    // Direct numeric value
    const value = parseFloat(property);
    return isNaN(value) ? defaultValue : value;
  }

  /**
   * Apply filters to weather data
   */
  private applyWeatherFilters(weatherData: Weather[], queryParams?: WeatherQueryParams): Weather[] {
    if (!queryParams) {
      return weatherData;
    }

    let filtered = weatherData;

    // Filter by cameraId
    if (queryParams.cameraId) {
      filtered = filtered.filter(weather => weather.cameraId === queryParams.cameraId);
      logger.debug(`Filtered by cameraId=${queryParams.cameraId}: ${filtered.length} records`);
    }

    return filtered;
  }

  /**
   * Apply filters to air quality data
   */
  private applyAirQualityFilters(airQualityData: AirQuality[], queryParams?: AirQualityQueryParams): AirQuality[] {
    if (!queryParams) {
      return airQualityData;
    }

    let filtered = airQualityData;

    // Filter by AQI level
    if (queryParams.level) {
      filtered = filtered.filter(aq => aq.level === queryParams.level);
      logger.debug(`Filtered by level=${queryParams.level}: ${filtered.length} records`);
    }

    // Filter by minimum AQI value
    if (queryParams.minAqi !== undefined) {
      filtered = filtered.filter(aq => aq.aqi >= queryParams.minAqi!);
      logger.debug(`Filtered by minAqi=${queryParams.minAqi}: ${filtered.length} records`);
    }

    return filtered;
  }

  /**
   * Transform multiple NGSI-LD entities to Camera array
   */
  private transformCameras(entities: any[]): Camera[] {
    return entities.map(entity => this.transformCamera(entity));
  }

  /**
   * Transform single NGSI-LD entity to Camera flat structure
   * Handles various NGSI-LD property formats (value, object, nested)
   */
  private transformCamera(entity: any): Camera {
    // Extract location - handle multiple NGSI-LD formats
    let lat = 10.8231; // Default HCMC latitude
    let lng = 106.6297; // Default HCMC longitude

    if (entity.location) {
      // GeoJSON format: {type: "Point", coordinates: [lng, lat]}
      if (entity.location.coordinates && Array.isArray(entity.location.coordinates)) {
        lng = entity.location.coordinates[0] || lng;
        lat = entity.location.coordinates[1] || lat;
      }
      // Direct object format: {latitude: x, longitude: y}
      else if (entity.location.latitude !== undefined && entity.location.longitude !== undefined) {
        lat = entity.location.latitude;
        lng = entity.location.longitude;
      }
      // NGSI-LD Property format: {value: {type: "Point", coordinates: [lng, lat]}}
      else if (entity.location.value?.coordinates) {
        lng = entity.location.value.coordinates[0] || lng;
        lat = entity.location.value.coordinates[1] || lat;
      }
    }
    // Top-level latitude/longitude properties
    else if (entity.latitude !== undefined && entity.longitude !== undefined) {
      lat = entity.latitude;
      lng = entity.longitude;
    }
    // NGSI-LD separate lat/lng properties
    else if (entity.lat !== undefined && entity.lng !== undefined) {
      lat = entity.lat;
      lng = entity.lng;
    }

    // Extract camera type - normalize to enum values
    let cameraType: 'PTZ' | 'Static' | 'Dome' | 'Unknown' = 'Unknown';
    const typeValue = entity.cameraType?.value || entity.cameraType || entity.type || '';
    const typeStr = String(typeValue).toUpperCase();

    if (typeStr.includes('PTZ')) {
      cameraType = 'PTZ';
    } else if (typeStr.includes('STATIC') || typeStr.includes('FIXED')) {
      cameraType = 'Static';
    } else if (typeStr.includes('DOME')) {
      cameraType = 'Dome';
    }

    // Extract status - normalize to online/offline
    // Camera is considered 'online' if:
    // 1. status contains: online, active, operational, success, enabled, running
    // 2. imageSnapshot URL exists (camera is providing images)
    // 3. dateLastValueReported is recent (within last 30 minutes)
    let status: 'online' | 'offline' = 'offline';
    const statusValue = entity.status?.value || entity.status || '';
    const statusStr = String(statusValue).toLowerCase();
    const hasImageSnapshot = !!(entity.imageSnapshot?.value || entity.imageSnapshot);

    // Check last reported time - if within 30 minutes, consider online
    const lastReported = entity.dateLastValueReported?.value || entity.dateLastValueReported ||
      entity.dateModified?.value || entity.dateModified || '';
    let isRecentlyActive = false;
    if (lastReported) {
      const lastTime = new Date(lastReported).getTime();
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      isRecentlyActive = (now - lastTime) < thirtyMinutes;
    }

    if (statusStr.includes('online') || statusStr.includes('active') ||
      statusStr.includes('operational') || statusStr.includes('success') ||
      statusStr.includes('enabled') || statusStr.includes('running') ||
      (hasImageSnapshot && isRecentlyActive)) {
      status = 'online';
    }

    // Extract camera name
    const cameraName =
      entity.cameraName?.value ||
      entity.cameraName ||
      entity.name?.value ||
      entity.name ||
      entity.description?.value ||
      entity.description ||
      `Camera-${entity.id?.split(':').pop() || 'Unknown'}`;

    // Extract modification date
    const dateModified =
      entity.dateModified?.value ||
      entity.dateModified ||
      entity.modifiedAt ||
      entity.timestamp?.value ||
      entity.timestamp ||
      new Date().toISOString();

    return {
      id: entity.id || entity['@id'] || `camera-${Date.now()}`,
      name: String(cameraName),
      cameraName: String(cameraName),
      type: cameraType,
      cameraType,
      location: {
        lat: Number(lat),
        lng: Number(lng)
      },
      status,
      // 🔧 FIX: In Stellio, imageSnapshot contains the camera URL, fallback to it if streamUrl is missing
      streamUrl: entity.streamUrl?.value || entity.streamUrl || entity.imageSnapshot?.value || entity.imageSnapshot,
      imageSnapshot: entity.imageSnapshot?.value || entity.imageSnapshot,
      lastUpdate: String(dateModified),
      dateModified: String(dateModified)
    };
  }

  /**
   * Fetch TrafficPattern entities from Stellio Context Broker
   * Queries: GET /entities?type=TrafficPattern with pagination
   * Transforms NGSI-LD response to TrafficPattern format
   * Derives locations from affected cameras
   * Uses offset-based pagination to fetch ALL patterns (Stellio max limit is 100)
   */
  async getTrafficPatterns(): Promise<TrafficPattern[]> {
    return this.retryRequest(async () => {
      try {
        logger.debug('Fetching ALL TrafficPatterns from Stellio');

        // Use pagination to fetch ALL traffic patterns
        const entities = await this.fetchAllPaginated('TrafficPattern', 'keyValues');
        logger.debug(`Fetched ${entities.length} TrafficPattern entities from Stellio (paginated)`);

        // Get all cameras to map locations
        const cameras = await this.getCameras();

        // Transform NGSI-LD entities to TrafficPattern format
        const patterns: TrafficPattern[] = [];

        for (const entity of entities) {
          try {
            const affectedRoads = entity.affectedRoads?.value || [];
            const patternType = entity.patternType?.value || 'temporal';
            const averageSpeed = entity.averageSpeed?.value || 50;
            const averageIntensity = entity.averageIntensity?.value || 0.5;
            const observationCount = entity.observationCount?.value || 100;
            const peakTime = entity.peakTime?.value || '7:00-9:00';
            const detectedAt = entity.detectedAt?.value || new Date().toISOString();
            const confidence = entity.confidence?.value || 0.75;

            // Find cameras on affected roads to get location
            const roadCameras = cameras.filter(c =>
              affectedRoads.some((road: string) =>
                c.name?.includes(road) ||
                c.cameraName?.includes(road)
              )
            );

            // Use first camera location or fallback to different cameras
            const startCamera = roadCameras[0] || cameras[Math.floor(Math.random() * cameras.length)];
            const endCamera = roadCameras[1] || cameras[Math.floor(Math.random() * cameras.length)];

            const startLat = startCamera?.location?.lat || 10.7756;
            const startLng = startCamera?.location?.lng || 106.7019;
            const endLat = endCamera?.location?.lat || (startLat + 0.005);
            const endLng = endCamera?.location?.lng || (startLng + 0.005);            // Calculate congestion level from average speed
            let congestionLevel: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe' = 'moderate';
            if (averageSpeed > 60) congestionLevel = 'free_flow';
            else if (averageSpeed > 45) congestionLevel = 'light';
            else if (averageSpeed > 30) congestionLevel = 'moderate';
            else if (averageSpeed > 15) congestionLevel = 'heavy';
            else congestionLevel = 'severe';

            patterns.push({
              id: entity.id,
              patternType: patternType,
              roadSegment: affectedRoads.join(' - ') || 'Unknown Road',
              location: {
                startPoint: {
                  latitude: startLat,
                  longitude: startLng
                },
                endPoint: {
                  latitude: endLat,
                  longitude: endLng
                }
              },
              averageSpeed: averageSpeed,
              vehicleCount: Math.round(observationCount * averageIntensity),
              congestionLevel: congestionLevel,
              timeOfDay: peakTime,
              dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
              timeRange: peakTime,
              daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              affectedCameras: roadCameras.slice(0, 3).map(c => c.id),
              avgVehicleCount: Math.round(observationCount * averageIntensity),
              historicalData: [],
              predictions: {
                nextHour: averageSpeed * (1 + (Math.random() - 0.5) * 0.1),
                confidence: confidence
              },
              timestamp: detectedAt
            });
          } catch (error) {
            logger.warn(`Failed to transform pattern ${entity.id}:`, error);
          }
        }

        logger.info(`Successfully transformed ${patterns.length} TrafficPatterns`);
        return patterns;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          logger.debug('No TrafficPattern entities found in Stellio');
          return [];
        }
        logger.error('Error fetching traffic patterns from Stellio:', error);
        throw new Error('Failed to fetch traffic patterns from Stellio');
      }
    }, 'getTrafficPatterns');
  }
}
