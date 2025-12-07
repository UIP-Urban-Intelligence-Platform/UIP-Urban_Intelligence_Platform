/**
 * Weather Routes - WeatherObserved API Endpoints
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/routes/weatherRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for querying weather observation entities with camera joins,
 * temporal filtering, and geo-spatial queries.
 * 
 * Endpoints:
 * - GET /api/weather: List weather observations
 * - GET /api/weather/:id: Get specific weather observation
 * - GET /api/weather/near: Find weather near location
 * - GET /api/weather/current: Get current weather for all cameras
 * 
 * Weather Data:
 * - temperature (°C)
 * - humidity (%)
 * - pressure (hPa)
 * - windSpeed (m/s)
 * - windDirection (degrees)
 * - precipitation (mm)
 * - weatherType (clear, cloudy, rain, storm)
 * - visibility (meters)
 */

import { Router, Request, Response } from 'express';
import { StellioService } from '../services/stellioService';
import { WeatherQueryParams } from '../types';
import { logger } from '../utils/logger';

const router = Router();
const stellioService = new StellioService();

/**
 * GET /api/weather
 * Fetch weather data from Stellio with camera join
 * 
 * Features:
 * 1. Fetches WeatherObserved entities from Stellio
 * 2. Extracts temperature, humidity, pressure, windSpeed, windDirection, precipitation, weatherType, visibility
 * 3. Joins with camera location via refDevice relationship
 * 4. Returns array with full weather data + camera location
 * 
 * Query Parameters:
 * - cameraId: Filter weather data for specific camera
 * - limit: Maximum number of records to return (default: 100)
 * 
 * Response 200:
 * {
 *   success: true,
 *   count: number,
 *   data: Weather[]
 * }
 * 
 * Response 500:
 * {
 *   success: false,
 *   message: string,
 *   error: string
 * }
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Parse and validate query parameters
    const queryParams: WeatherQueryParams = {};

    // CameraId filter
    if (req.query.cameraId) {
      queryParams.cameraId = String(req.query.cameraId);
    }

    // Limit parameter
    if (req.query.limit) {
      const limit = parseInt(String(req.query.limit), 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter. Must be a number between 1 and 1000.',
          error: `Invalid value: ${req.query.limit}`
        });
      }
      queryParams.limit = limit;
    }

    logger.info('GET /api/weather - Query params:', queryParams);

    // Fetch weather data from Stellio
    const weatherData = await stellioService.getWeatherData(queryParams);

    // Return successful response with 200 status
    return res.status(200).json({
      success: true,
      count: weatherData.length,
      data: weatherData
    });
  } catch (error) {
    // Log error details
    logger.error('Error in GET /api/weather:', error);

    // Return error response with 500 status
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weather data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/weather/humidity-zones
 * Spatial humidity aggregation using k-means clustering
 * 
 * This endpoint performs spatial clustering of weather stations based on humidity
 * readings and generates zone polygons using convex hull algorithm. Each zone
 * includes average humidity, comfort level assessment, and camera assignments.
 * 
 * Features:
 * 1. Fetches WeatherObserved entities from Stellio with humidity data
 * 2. Performs k-means spatial clustering (k=5-8 zones based on data density)
 * 3. Calculates average humidity for each zone
 * 4. Generates zone boundary polygon using convex hull of cameras in cluster
 * 5. Determines comfort level based on humidity thresholds
 * 6. Returns GeoJSON FeatureCollection for map visualization
 * 7. Implements 5-minute response caching for performance
 * 
 * Humidity Comfort Levels:
 * - comfortable: 30-50% (ideal indoor/outdoor humidity)
 * - moderate: 50-70% (acceptable but may feel muggy)
 * - uncomfortable: <30% or >70% (too dry or too humid)
 * 
 * Query Parameters:
 * - zones: Number of zones to create (5-8, default: auto-calculated based on data)
 * - minCamerasPerZone: Minimum cameras required per zone (default: 2)
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     type: "FeatureCollection",
 *     features: [{
 *       type: "Feature",
 *       geometry: {
 *         type: "Polygon",
 *         coordinates: [[[lng, lat], [lng, lat], ...]]
 *       },
 *       properties: {
 *         zoneId: string,
 *         avgHumidity: number,
 *         comfortLevel: "comfortable" | "moderate" | "uncomfortable",
 *         color: string,
 *         cameraCount: number,
 *         cameras: string[],
 *         minHumidity: number,
 *         maxHumidity: number
 *       }
 *     }],
 *     metadata: {
 *       totalZones: number,
 *       totalCameras: number,
 *       avgHumidity: number,
 *       generatedAt: string,
 *       cacheExpiry: string
 *     }
 *   }
 * }
 * 
 * Example Usage:
 * - GET /api/weather/humidity-zones
 * - GET /api/weather/humidity-zones?zones=6&minCamerasPerZone=3
 */

// Cache for humidity zones (5-minute TTL)
let humidityZonesCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

router.get('/humidity-zones', async (req: Request, res: Response) => {
  try {
    const { zones, minCamerasPerZone = 2 } = req.query;

    // Check cache first
    const now = Date.now();
    if (humidityZonesCache && (now - humidityZonesCache.timestamp) < CACHE_TTL_MS) {
      logger.info('Returning cached humidity zones data');
      return res.status(200).json({
        success: true,
        data: humidityZonesCache.data,
        cached: true
      });
    }

    logger.info(`Generating humidity zones: zones=${zones}, minCamerasPerZone=${minCamerasPerZone}`);

    // Validate parameters
    const minCamerasNum = parseInt(String(minCamerasPerZone), 10);
    if (isNaN(minCamerasNum) || minCamerasNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid minCamerasPerZone parameter. Must be a positive integer.'
      });
    }

    if (zones) {
      const zonesNum = parseInt(String(zones), 10);
      if (isNaN(zonesNum) || zonesNum < 5 || zonesNum > 8) {
        return res.status(400).json({
          success: false,
          error: 'Invalid zones parameter. Must be between 5 and 8.'
        });
      }
    }

    // Fetch weather data from Stellio
    const weatherData = await stellioService.getWeatherData({});

    // Filter out weather observations without humidity or location
    const validWeatherData = weatherData.filter(w =>
      w.humidity !== null &&
      w.humidity !== undefined &&
      w.location &&
      typeof w.location.lat === 'number' &&
      typeof w.location.lng === 'number'
    );

    if (validWeatherData.length === 0) {
      logger.warn('No valid weather data with humidity found');
      return res.status(200).json({
        success: true,
        data: {
          type: 'FeatureCollection',
          features: [],
          metadata: {
            totalZones: 0,
            totalCameras: 0,
            avgHumidity: 0,
            generatedAt: new Date().toISOString(),
            cacheExpiry: new Date(now + CACHE_TTL_MS).toISOString()
          }
        }
      });
    }

    // Determine optimal number of zones (k) based on data density
    let k = zones ? parseInt(String(zones), 10) : Math.min(8, Math.max(5, Math.floor(validWeatherData.length / 5)));
    k = Math.min(k, validWeatherData.length); // Can't have more zones than data points

    logger.info(`Performing k-means clustering with k=${k} on ${validWeatherData.length} weather stations`);

    // Perform k-means clustering
    const clusters = performKMeansClustering(validWeatherData, k);

    // Filter out clusters with too few cameras
    const validClusters = clusters.filter(cluster => cluster.cameras.length >= minCamerasNum);

    if (validClusters.length === 0) {
      logger.warn('No valid clusters after filtering by minimum camera count');
      return res.status(200).json({
        success: true,
        data: {
          type: 'FeatureCollection',
          features: [],
          metadata: {
            totalZones: 0,
            totalCameras: validWeatherData.length,
            avgHumidity: calculateOverallAvgHumidity(validWeatherData),
            generatedAt: new Date().toISOString(),
            cacheExpiry: new Date(now + CACHE_TTL_MS).toISOString()
          }
        }
      });
    }

    // Generate GeoJSON FeatureCollection
    const features = validClusters.map((cluster, index) => {
      const avgHumidity = cluster.avgHumidity;
      const comfortLevel = getHumidityComfortLevel(avgHumidity);
      const color = getComfortLevelColor(comfortLevel);

      // Generate convex hull polygon
      const polygon = generateConvexHull(cluster.cameras.map((c: any) => c.location));

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polygon.map(point => [point.lng, point.lat])]
        },
        properties: {
          zoneId: `zone_${index + 1}`,
          avgHumidity: Math.round(avgHumidity * 10) / 10,
          comfortLevel,
          color,
          cameraCount: cluster.cameras.length,
          cameras: cluster.cameras.map((c: any) => c.cameraId),
          minHumidity: Math.round(cluster.minHumidity * 10) / 10,
          maxHumidity: Math.round(cluster.maxHumidity * 10) / 10
        }
      };
    });

    const geoJsonData = {
      type: 'FeatureCollection' as const,
      features,
      metadata: {
        totalZones: validClusters.length,
        totalCameras: validWeatherData.length,
        avgHumidity: Math.round(calculateOverallAvgHumidity(validWeatherData) * 10) / 10,
        generatedAt: new Date().toISOString(),
        cacheExpiry: new Date(now + CACHE_TTL_MS).toISOString()
      }
    };

    // Cache the result
    humidityZonesCache = {
      data: geoJsonData,
      timestamp: now
    };

    logger.info(`Generated ${validClusters.length} humidity zones with ${validWeatherData.length} cameras`);

    return res.status(200).json({
      success: true,
      data: geoJsonData,
      cached: false
    });

  } catch (error) {
    logger.error(`Error generating humidity zones: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Helper: Perform k-means clustering on weather data
 */
function performKMeansClustering(weatherData: any[], k: number): any[] {
  // Extract coordinates for clustering
  const points = weatherData.map(w => ({
    lat: w.location.lat,
    lng: w.location.lng,
    humidity: w.humidity,
    cameraId: w.cameraId,
    data: w
  }));

  // Initialize centroids randomly
  const centroids: Array<{ lat: number; lng: number }> = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < k; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * points.length);
    } while (usedIndices.has(randomIndex));

    usedIndices.add(randomIndex);
    centroids.push({
      lat: points[randomIndex].lat,
      lng: points[randomIndex].lng
    });
  }

  // Perform k-means iterations
  const maxIterations = 50;
  let assignments: number[] = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    const newAssignments = points.map(point => {
      let minDist = Infinity;
      let nearestCentroid = 0;

      centroids.forEach((centroid, idx) => {
        const dist = Math.sqrt(
          Math.pow(point.lat - centroid.lat, 2) +
          Math.pow(point.lng - centroid.lng, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          nearestCentroid = idx;
        }
      });

      return nearestCentroid;
    });

    // Check convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
      break;
    }

    assignments = newAssignments;

    // Update centroids
    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i);

      if (clusterPoints.length > 0) {
        centroids[i] = {
          lat: clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length,
          lng: clusterPoints.reduce((sum, p) => sum + p.lng, 0) / clusterPoints.length
        };
      }
    }
  }

  // Build clusters with statistics
  const clusters: any[] = [];

  for (let i = 0; i < k; i++) {
    const clusterPoints = points.filter((_, idx) => assignments[idx] === i);

    if (clusterPoints.length > 0) {
      const humidities = clusterPoints.map(p => p.humidity);
      const avgHumidity = humidities.reduce((sum, h) => sum + h, 0) / humidities.length;

      clusters.push({
        centroid: centroids[i],
        cameras: clusterPoints.map(p => ({
          cameraId: p.cameraId,
          location: { lat: p.lat, lng: p.lng },
          humidity: p.humidity
        })),
        avgHumidity,
        minHumidity: Math.min(...humidities),
        maxHumidity: Math.max(...humidities)
      });
    }
  }

  return clusters;
}

/**
 * Helper: Generate convex hull for a set of points
 * Uses Graham scan algorithm
 */
function generateConvexHull(points: Array<{ lat: number; lng: number }>): Array<{ lat: number; lng: number }> {
  if (points.length < 3) {
    return points;
  }

  // Find the bottom-most point (or left-most in case of tie)
  let bottomPoint = points[0];
  for (const point of points) {
    if (point.lat < bottomPoint.lat || (point.lat === bottomPoint.lat && point.lng < bottomPoint.lng)) {
      bottomPoint = point;
    }
  }

  // Sort points by polar angle with respect to bottom point
  const sortedPoints = points.slice().sort((a, b) => {
    if (a === bottomPoint) return -1;
    if (b === bottomPoint) return 1;

    const angleA = Math.atan2(a.lat - bottomPoint.lat, a.lng - bottomPoint.lng);
    const angleB = Math.atan2(b.lat - bottomPoint.lat, b.lng - bottomPoint.lng);

    if (angleA < angleB) return -1;
    if (angleA > angleB) return 1;

    // If angles are equal, sort by distance
    const distA = Math.sqrt(Math.pow(a.lat - bottomPoint.lat, 2) + Math.pow(a.lng - bottomPoint.lng, 2));
    const distB = Math.sqrt(Math.pow(b.lat - bottomPoint.lat, 2) + Math.pow(b.lng - bottomPoint.lng, 2));
    return distA - distB;
  });

  // Build convex hull using Graham scan
  const hull: Array<{ lat: number; lng: number }> = [sortedPoints[0], sortedPoints[1]];

  for (let i = 2; i < sortedPoints.length; i++) {
    while (hull.length >= 2) {
      const cross = crossProduct(
        hull[hull.length - 2],
        hull[hull.length - 1],
        sortedPoints[i]
      );

      if (cross > 0) {
        break;
      }

      hull.pop();
    }

    hull.push(sortedPoints[i]);
  }

  return hull;
}

/**
 * Helper: Calculate cross product for convex hull
 */
function crossProduct(
  o: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
}

/**
 * Helper: Determine humidity comfort level
 */
function getHumidityComfortLevel(humidity: number): 'comfortable' | 'moderate' | 'uncomfortable' {
  if (humidity >= 30 && humidity <= 50) {
    return 'comfortable';
  } else if (humidity > 50 && humidity <= 70) {
    return 'moderate';
  } else {
    return 'uncomfortable';
  }
}

/**
 * Helper: Get color for comfort level
 */
function getComfortLevelColor(level: string): string {
  switch (level) {
    case 'comfortable':
      return '#10b981'; // green
    case 'moderate':
      return '#fbbf24'; // yellow
    case 'uncomfortable':
      return '#f97316'; // orange
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Helper: Calculate overall average humidity
 */
function calculateOverallAvgHumidity(weatherData: any[]): number {
  if (weatherData.length === 0) return 0;
  const sum = weatherData.reduce((acc, w) => acc + (w.humidity || 0), 0);
  return sum / weatherData.length;
}

/**
 * GET /api/weather/:id
 * Fetch single weather observation by ID
 * 
 * Response 200: { success: true, data: Weather }
 * Response 404: { success: false, message: string }
 * Response 500: { success: false, message: string, error: string }
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`GET /api/weather/${id}`);

    // Fetch all weather data and find by ID
    const weatherData = await stellioService.getWeatherData();
    const weather = weatherData.find(w => w.id === id);

    if (!weather) {
      return res.status(404).json({
        success: false,
        message: 'Weather observation not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: weather
    });
  } catch (error) {
    logger.error(`Error in GET /api/weather/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weather observation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
