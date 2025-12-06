/**
 * Pattern Routes - Traffic Pattern & Congestion API Endpoints
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/routes/patternRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for querying traffic patterns, congestion zones, and flow analysis
 * with temporal grids and heatmap data generation.
 * 
 * Endpoints:
 * - GET /api/patterns: List traffic patterns
 * - GET /api/patterns/:id: Get specific pattern details
 * - GET /api/patterns/congestion: Congestion zone analysis
 * - GET /api/patterns/heatmap: Traffic density heatmap data
 * - GET /api/patterns/temporal: Temporal grid analysis
 * 
 * Pattern Data:
 * - patternType: congestion, free-flow, slow-moving
 * - intensity: 0-100 scale
 * - affectedRoads: array of road segments
 * - duration: start/end timestamps
 * - vehicleCount: estimated vehicle count
 */

import { Router, Request, Response } from 'express';
import { genericNgsiService } from '../services/genericNgsiService';
import { temporalGrid, heatmapData } from '../utils/transformations';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/patterns
 * Fetch traffic patterns with filters
 * 
 * Query Parameters:
 * - congestion: Filter by congestion level (high, medium, low)
 * - type: Filter by pattern type (rush_hour, normal, off_peak)
 * - currentTime: Filter patterns active at current time (true/false)
 * - limit: Maximum number of results (default: 100, max: 1000)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { congestion, type, currentTime, limit = 100 } = req.query;

    logger.info(`Fetching traffic patterns with filters: congestion=${congestion}, type=${type}, currentTime=${currentTime}, limit=${limit}`);

    // Build query params
    const queryParams: any = {};

    if (congestion) {
      const validCongestionLevels = ['high', 'medium', 'low'];
      if (!validCongestionLevels.includes(congestion as string)) {
        return res.status(400).json({
          success: false,
          error: `Invalid congestion level. Must be one of: ${validCongestionLevels.join(', ')}`
        });
      }
      queryParams.congestion = congestion;
    }

    if (type) {
      const validTypes = ['rush_hour', 'normal', 'off_peak'];
      if (!validTypes.includes(type as string)) {
        return res.status(400).json({
          success: false,
          error: `Invalid pattern type. Must be one of: ${validTypes.join(', ')}`
        });
      }
      queryParams.type = type;
    }

    if (currentTime) {
      queryParams.currentTime = currentTime === 'true';
    }

    if (limit) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter. Must be a positive number.'
        });
      }
      queryParams.limit = Math.min(limitNum, 1000);
    }

    // Fetch patterns using generic service
    const patterns = await genericNgsiService.fetchEntities('TrafficPattern', queryParams);

    logger.info(`Returned ${patterns.length} traffic patterns`);

    return res.status(200).json({
      success: true,
      count: patterns.length,
      data: patterns
    });

  } catch (error) {
    logger.error(`Error fetching traffic patterns: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/patterns/vehicle-heatmap
 * Get vehicle density heatmap by location and timeation and time
 * 
 * Response:
 * {
 *   success: true,
 *   count: number,
 *   data: [{lat, lng, value, hour, patternId}]
 * }
 */
router.get('/vehicle-heatmap', async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching vehicle heatmap from traffic patterns');

    // Fetch traffic pattern data
    const patterns = await genericNgsiService.fetchEntities('TrafficPattern', {});

    if (patterns.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Create temporal grid
    const grid = temporalGrid(patterns, ['location', 'hour']);

    // Convert to heatmap format
    const heatmap = heatmapData(grid);

    logger.info(`Returned ${heatmap.length} heatmap data points`);

    return res.status(200).json({
      success: true,
      count: heatmap.length,
      data: heatmap
    });

  } catch (error) {
    logger.error(`Error fetching vehicle heatmap: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/patterns/speed-zones
 * Traffic speed visualization with zone categorization
 * 
 * This endpoint analyzes traffic patterns and categorizes them into speed zones
 * based on average speed measurements. Each zone is represented as a polygon
 * created from the locations of affected cameras, with color-coded visualization
 * for different speed ranges.
 * 
 * Speed Categories:
 * - Slow: < 20 km/h (congested traffic, red zone)
 * - Medium: 20-40 km/h (moderate traffic, yellow zone)
 * - Fast: > 40 km/h (free-flowing traffic, green zone)
 * 
 * Query Parameters:
 * - currentTime: Filter patterns active at current time (true/false)
 *                Checks if current hour falls within pattern's timeRange
 * 
 * Features:
 * 1. Queries TrafficPattern entities with avgSpeed from Stellio
 * 2. Groups patterns into speed categories based on avgSpeed thresholds
 * 3. Creates polygon geometry from affected camera locations (convex hull)
 * 4. Calculates min/max/avg speed statistics per zone
 * 5. Returns GeoJSON FeatureCollection for map visualization
 * 6. Supports temporal filtering for current traffic conditions
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
 *         speedCategory: "slow" | "medium" | "fast",
 *         avgSpeed: number,
 *         minSpeed: number,
 *         maxSpeed: number,
 *         color: "#ff0000" | "#ffaa00" | "#00ff00",
 *         patternIds: string[],
 *         patternCount: number
 *       }
 *     }],
 *     metadata: {
 *       totalZones: number,
 *       totalPatterns: number,
 *       timestamp: string
 *     }
 *   }
 * }
 * 
 * Example Usage:
 * - GET /api/patterns/speed-zones
 * - GET /api/patterns/speed-zones?currentTime=true
 */
router.get('/speed-zones', async (req: Request, res: Response) => {
  try {
    const { currentTime } = req.query;
    const filterByTime = currentTime === 'true';

    logger.info(`Fetching speed zones from traffic patterns (currentTime filter: ${filterByTime})`);

    // Fetch traffic patterns
    let patterns = await genericNgsiService.fetchEntities('TrafficPattern', {});

    // Filter by current time if requested
    if (filterByTime) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      patterns = patterns.filter(pattern => {
        if (!pattern.timeRange) return false;

        const startTime = pattern.timeRange.start || pattern.timeRange.startTime || '00:00';
        const endTime = pattern.timeRange.end || pattern.timeRange.endTime || '23:59';

        // Simple time comparison (assumes times are in HH:MM format)
        return currentTimeStr >= startTime && currentTimeStr <= endTime;
      });

      logger.debug(`Filtered to ${patterns.length} active patterns for current time`);
    }

    if (patterns.length === 0) {
      logger.info('No patterns found matching criteria');
      return res.status(200).json({
        success: true,
        data: {
          type: 'FeatureCollection',
          features: [],
          metadata: {
            totalZones: 0,
            totalPatterns: 0,
            timestamp: new Date().toISOString()
          }
        }
      });
    }

    // Define speed categories with correct thresholds
    const speedCategories = [
      { name: 'slow', min: 0, max: 20, color: '#ff0000' },
      { name: 'medium', min: 20, max: 40, color: '#ffaa00' },
      { name: 'fast', min: 40, max: Infinity, color: '#00ff00' }
    ];

    // Group patterns by speed category
    const zonesByCategory = new Map<string, any[]>();

    patterns.forEach(pattern => {
      const speed = pattern.avgSpeed || pattern.speed || 0;

      // Find matching category
      const category = speedCategories.find(cat => speed >= cat.min && speed < cat.max);

      if (category && pattern.location) {
        if (!zonesByCategory.has(category.name)) {
          zonesByCategory.set(category.name, []);
        }

        zonesByCategory.get(category.name)!.push({
          id: pattern.id,
          speed,
          location: pattern.location
        });
      }
    });

    // Create GeoJSON features for each category
    const features: any[] = [];

    zonesByCategory.forEach((categoryPatterns, categoryName) => {
      const category = speedCategories.find(c => c.name === categoryName)!;

      // Calculate statistics
      const speeds = categoryPatterns.map(p => p.speed);
      const avgSpeed = Math.round((speeds.reduce((sum, s) => sum + s, 0) / speeds.length) * 10) / 10;
      const minSpeed = Math.round(Math.min(...speeds) * 10) / 10;
      const maxSpeed = Math.round(Math.max(...speeds) * 10) / 10;

      // Get all locations for convex hull
      const locations = categoryPatterns
        .filter(p => p.location && p.location.lat && p.location.lng)
        .map(p => ({ lat: p.location.lat, lng: p.location.lng }));

      if (locations.length >= 3) {
        // Generate convex hull polygon
        const hull = generateConvexHullForSpeedZone(locations);

        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [hull.map(point => [point.lng, point.lat])]
          },
          properties: {
            speedCategory: categoryName,
            avgSpeed,
            minSpeed,
            maxSpeed,
            color: category.color,
            patternIds: categoryPatterns.map(p => p.id),
            patternCount: categoryPatterns.length
          }
        });
      } else if (locations.length > 0) {
        // For single or double points, create a small circular polygon
        const center = locations[0];
        const radius = 0.002; // ~200m
        const circlePoints: any[] = [];

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * 2 * Math.PI;
          circlePoints.push({
            lat: center.lat + radius * Math.cos(angle),
            lng: center.lng + radius * Math.sin(angle)
          });
        }

        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [circlePoints.map(point => [point.lng, point.lat])]
          },
          properties: {
            speedCategory: categoryName,
            avgSpeed,
            minSpeed,
            maxSpeed,
            color: category.color,
            patternIds: categoryPatterns.map(p => p.id),
            patternCount: categoryPatterns.length
          }
        });
      }
    });

    const geoJsonData = {
      type: 'FeatureCollection' as const,
      features,
      metadata: {
        totalZones: features.length,
        totalPatterns: patterns.length,
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`Returned ${features.length} speed zones from ${patterns.length} patterns`);

    return res.status(200).json({
      success: true,
      data: geoJsonData
    });

  } catch (error) {
    logger.error(`Error fetching speed zones: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Helper: Generate convex hull for speed zone
 */
function generateConvexHullForSpeedZone(points: Array<{ lat: number; lng: number }>): Array<{ lat: number; lng: number }> {
  if (points.length < 3) {
    return points;
  }

  // Find the bottom-most point
  let bottomPoint = points[0];
  for (const point of points) {
    if (point.lat < bottomPoint.lat || (point.lat === bottomPoint.lat && point.lng < bottomPoint.lng)) {
      bottomPoint = point;
    }
  }

  // Sort points by polar angle
  const sortedPoints = points.slice().sort((a, b) => {
    if (a === bottomPoint) return -1;
    if (b === bottomPoint) return 1;

    const angleA = Math.atan2(a.lat - bottomPoint.lat, a.lng - bottomPoint.lng);
    const angleB = Math.atan2(b.lat - bottomPoint.lat, b.lng - bottomPoint.lng);

    if (angleA < angleB) return -1;
    if (angleA > angleB) return 1;

    const distA = Math.sqrt(Math.pow(a.lat - bottomPoint.lat, 2) + Math.pow(a.lng - bottomPoint.lng, 2));
    const distB = Math.sqrt(Math.pow(b.lat - bottomPoint.lat, 2) + Math.pow(b.lng - bottomPoint.lng, 2));
    return distA - distB;
  });

  // Build convex hull
  const hull: Array<{ lat: number; lng: number }> = [sortedPoints[0], sortedPoints[1]];

  for (let i = 2; i < sortedPoints.length; i++) {
    while (hull.length >= 2) {
      const o = hull[hull.length - 2];
      const a = hull[hull.length - 1];
      const b = sortedPoints[i];

      const cross = (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

      if (cross > 0) break;
      hull.pop();
    }

    hull.push(sortedPoints[i]);
  }

  return hull;
}

/**
 * GET /api/patterns/vehicle-heatmap
 * Vehicle density heatmap data with spatial interpolation
 * 
 * This endpoint generates heatmap-ready data points for visualizing vehicle density
 * across the monitored area. It uses Inverse Distance Weighting (IDW) interpolation
 * to create a smooth density surface from discrete camera measurements.
 * 
 * Features:
 * 1. Queries TrafficPattern entities with avgVehicleCount from Stellio
 * 2. Retrieves camera locations for each pattern's affectedCameras
 * 3. Creates grid points with 100m spacing within pattern areas
 * 4. Applies IDW (Inverse Distance Weighting) interpolation for smooth gradients
 * 5. Normalizes intensity values to 0-1 scale for heatmap rendering
 * 6. Supports time range filtering for temporal analysis
 * 
 * IDW Interpolation Algorithm:
 * - Power parameter: 2 (standard inverse square distance)
 * - Influence radius: 500m (only nearby cameras affect each point)
 * - Weight formula: w = 1 / (distance^power)
 * - Interpolated value: Σ(value * weight) / Σ(weight)
 * 
 * Query Parameters:
 * - timeRange: Time range filter in format "HH:MM-HH:MM" (e.g., "07:00-09:00")
 *              Filters patterns by their timeRange property
 * - gridSpacing: Grid point spacing in meters (default: 100, min: 50, max: 500)
 * - power: IDW power parameter (default: 2, min: 1, max: 5)
 * - radius: Influence radius in meters (default: 500, min: 100, max: 2000)
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     points: [{
 *       lat: number,
 *       lng: number,
 *       intensity: number (0-1 normalized)
 *     }],
 *     maxIntensity: number (original max vehicle count),
 *     metadata: {
 *       timeRange: string | "all",
 *       patternCount: number,
 *       totalPoints: number,
 *       avgVehicles: number,
 *       gridSpacing: number,
 *       power: number,
 *       radius: number
 *     }
 *   }
 * }
 * 
 * Example Usage:
 * - GET /api/patterns/vehicle-heatmap
 * - GET /api/patterns/vehicle-heatmap?timeRange=07:00-09:00
 * - GET /api/patterns/vehicle-heatmap?timeRange=17:00-19:00&gridSpacing=150
 */
router.get('/vehicle-heatmap', async (req: Request, res: Response) => {
  try {
    const {
      timeRange,
      gridSpacing = 100,
      power = 2,
      radius = 500
    } = req.query;

    // Validate parameters
    const gridSpacingNum = parseInt(String(gridSpacing), 10);
    if (isNaN(gridSpacingNum) || gridSpacingNum < 50 || gridSpacingNum > 500) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gridSpacing parameter. Must be between 50 and 500 meters.'
      });
    }

    const powerNum = parseFloat(String(power));
    if (isNaN(powerNum) || powerNum < 1 || powerNum > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid power parameter. Must be between 1 and 5.'
      });
    }

    const radiusNum = parseFloat(String(radius));
    if (isNaN(radiusNum) || radiusNum < 100 || radiusNum > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid radius parameter. Must be between 100 and 2000 meters.'
      });
    }

    // Validate timeRange format if provided
    if (timeRange) {
      const timeRangeRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
      if (!timeRangeRegex.test(String(timeRange))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid timeRange format. Use HH:MM-HH:MM (e.g., 07:00-09:00)'
        });
      }
    }

    logger.info(`Generating vehicle heatmap: timeRange=${timeRange || 'all'}, gridSpacing=${gridSpacingNum}m, power=${powerNum}, radius=${radiusNum}m`);

    // Fetch traffic patterns from Stellio
    const patterns = await genericNgsiService.fetchEntities('TrafficPattern', {});

    // Filter patterns by time range if specified
    let filteredPatterns = patterns;
    if (timeRange) {
      const [startTime, endTime] = String(timeRange).split('-');
      filteredPatterns = patterns.filter(pattern => {
        if (!pattern.timeRange) return false;

        const patternStart = pattern.timeRange.start || pattern.timeRange.startTime;
        const patternEnd = pattern.timeRange.end || pattern.timeRange.endTime;

        // Check if pattern's time range overlaps with requested range
        return (
          (patternStart <= endTime && patternEnd >= startTime) ||
          (patternStart >= startTime && patternStart <= endTime) ||
          (patternEnd >= startTime && patternEnd <= endTime)
        );
      });
    }

    if (filteredPatterns.length === 0) {
      logger.info('No patterns found matching criteria');
      return res.status(200).json({
        success: true,
        data: {
          points: [],
          maxIntensity: 0,
          metadata: {
            timeRange: String(timeRange || 'all'),
            patternCount: 0,
            totalPoints: 0,
            avgVehicles: 0,
            gridSpacing: gridSpacingNum,
            power: powerNum,
            radius: radiusNum
          }
        }
      });
    }

    logger.debug(`Processing ${filteredPatterns.length} patterns for heatmap generation`);

    // Extract camera locations and vehicle counts from patterns
    const cameraData: Array<{
      lat: number;
      lng: number;
      vehicleCount: number;
    }> = [];

    for (const pattern of filteredPatterns) {
      const vehicleCount = pattern.avgVehicleCount || pattern.vehicleCount || 0;

      // Get location from pattern
      if (pattern.location && pattern.location.lat && pattern.location.lng) {
        cameraData.push({
          lat: pattern.location.lat,
          lng: pattern.location.lng,
          vehicleCount
        });
      }
    }

    if (cameraData.length === 0) {
      logger.warn('No valid camera locations found in patterns');
      return res.status(200).json({
        success: true,
        data: {
          points: [],
          maxIntensity: 0,
          metadata: {
            timeRange: String(timeRange || 'all'),
            patternCount: filteredPatterns.length,
            totalPoints: 0,
            avgVehicles: 0,
            gridSpacing: gridSpacingNum,
            power: powerNum,
            radius: radiusNum
          }
        }
      });
    }

    // Calculate bounding box for grid generation
    const lats = cameraData.map(c => c.lat);
    const lngs = cameraData.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding to bounding box (10%)
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const paddedMinLat = minLat - latRange * 0.1;
    const paddedMaxLat = maxLat + latRange * 0.1;
    const paddedMinLng = minLng - lngRange * 0.1;
    const paddedMaxLng = maxLng + lngRange * 0.1;

    // Generate grid points (100m spacing)
    const gridPoints: Array<{ lat: number; lng: number }> = [];
    const metersPerDegreeLat = 111320; // Approximate meters per degree latitude
    const metersPerDegreeLng = 111320 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180);

    const latStep = gridSpacingNum / metersPerDegreeLat;
    const lngStep = gridSpacingNum / metersPerDegreeLng;

    for (let lat = paddedMinLat; lat <= paddedMaxLat; lat += latStep) {
      for (let lng = paddedMinLng; lng <= paddedMaxLng; lng += lngStep) {
        gridPoints.push({ lat, lng });
      }
    }

    logger.debug(`Generated ${gridPoints.length} grid points`);

    // Apply IDW interpolation to each grid point
    const interpolatedPoints = gridPoints.map(point => {
      let weightedSum = 0;
      let weightSum = 0;

      for (const camera of cameraData) {
        const distance = calculateHaversineDistance(
          point.lat,
          point.lng,
          camera.lat,
          camera.lng
        );

        // Only include cameras within influence radius
        if (distance <= radiusNum) {
          // Avoid division by zero for points exactly at camera location
          const adjustedDistance = Math.max(distance, 1);
          const weight = 1 / Math.pow(adjustedDistance, powerNum);

          weightedSum += camera.vehicleCount * weight;
          weightSum += weight;
        }
      }

      const interpolatedValue = weightSum > 0 ? weightedSum / weightSum : 0;

      return {
        lat: point.lat,
        lng: point.lng,
        value: interpolatedValue
      };
    });

    // Filter out points with zero or very low values (< 1 vehicle)
    const significantPoints = interpolatedPoints.filter(p => p.value >= 1);

    // Find max intensity for normalization
    const maxIntensity = Math.max(...cameraData.map(c => c.vehicleCount), 1);

    // Normalize intensity to 0-1 scale
    const normalizedPoints = significantPoints.map(point => ({
      lat: Math.round(point.lat * 1000000) / 1000000,
      lng: Math.round(point.lng * 1000000) / 1000000,
      intensity: Math.round((point.value / maxIntensity) * 1000) / 1000
    }));

    // Calculate average vehicles
    const avgVehicles = cameraData.length > 0
      ? Math.round((cameraData.reduce((sum, c) => sum + c.vehicleCount, 0) / cameraData.length) * 10) / 10
      : 0;

    logger.info(`Generated vehicle heatmap with ${normalizedPoints.length} points, max intensity: ${maxIntensity}, avg vehicles: ${avgVehicles}`);

    return res.status(200).json({
      success: true,
      data: {
        points: normalizedPoints,
        maxIntensity,
        metadata: {
          timeRange: String(timeRange || 'all'),
          patternCount: filteredPatterns.length,
          totalPoints: normalizedPoints.length,
          avgVehicles,
          gridSpacing: gridSpacingNum,
          power: powerNum,
          radius: radiusNum
        }
      }
    });

  } catch (error) {
    logger.error(`Error generating vehicle heatmap: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate vehicle heatmap'
    });
  }
});

/**
 * Helper: Calculate Haversine distance between two points
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default router;
