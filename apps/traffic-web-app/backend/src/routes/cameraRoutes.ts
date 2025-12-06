/**
 * Camera Routes - Traffic Camera API Endpoints
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/routes/cameraRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * RESTful API endpoints for querying traffic camera entities (TrafficFlowObserved)
 * with geo-spatial filtering, image URL retrieval, and real-time traffic metrics.
 * 
 * Endpoints:
 * - GET /api/cameras: List all cameras with optional filters
 * - GET /api/cameras/:id: Get specific camera by ID
 * - GET /api/cameras/near: Find cameras near a location (geo-spatial query)
 * - GET /api/cameras/bbox: Get cameras within bounding box
 * - GET /api/cameras/:id/image: Fetch latest camera image
 * - GET /api/cameras/:id/metrics: Get traffic metrics (intensity, occupancy, speed)
 * 
 * Query Parameters:
 * - limit: Maximum number of results (default 100)
 * - offset: Pagination offset
 * - lat/lon: Coordinates for near queries
 * - maxDistance: Search radius in meters
 * - minIntensity/maxIntensity: Filter by traffic intensity
 * - includeMetrics: Include ItemFlowObserved data
 * 
 * Response Format:
 * - JSON with NGSI-LD entity structure
 * - GeoJSON-compatible location format
 * - ISO 8601 timestamps
 * 
 * @dependencies
 * - express@^4.18: Web framework
 * - StellioService: NGSI-LD entity queries
 * 
 * @example
 * GET /api/cameras/near?lat=10.8231&lon=106.6297&maxDistance=5000&limit=50
 */

import { Router, Request, Response } from 'express';
import { StellioService } from '../services/stellioService';
import { CameraQueryParams } from '../types';
import { logger } from '../utils/logger';
import { genericNgsiService } from '../services/genericNgsiService';

const router = Router();
const stellioService = new StellioService();

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calculate Haversine distance between two points
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in meters
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

// =====================================================
// ROUTES
// =====================================================

/**
 * GET /api/cameras
 * Fetch all cameras from Stellio NGSI-LD Context Broker
 * 
 * Query Parameters:
 * - status: Filter by camera status (online/offline)
 * - type: Filter by camera type (PTZ/Static/Dome)
 * - bbox: Geographic bounding box filter (minLat,minLng,maxLat,maxLng)
 * - limit: Maximum number of cameras to return (default: 100)
 * 
 * Response 200:
 * {
 *   success: true,
 *   count: number,
 *   data: Camera[]
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
    const queryParams: CameraQueryParams = {};

    // Status filter: online or offline
    if (req.query.status) {
      const status = String(req.query.status).toLowerCase();
      if (status === 'online' || status === 'offline') {
        queryParams.status = status as 'online' | 'offline';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid status parameter. Must be "online" or "offline".',
          error: `Invalid value: ${req.query.status}`
        });
      }
    }

    // Camera type filter: PTZ, Static, or Dome
    if (req.query.type) {
      const type = String(req.query.type);
      if (type === 'PTZ' || type === 'Static' || type === 'Dome') {
        queryParams.type = type as 'PTZ' | 'Static' | 'Dome';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid type parameter. Must be "PTZ", "Static", or "Dome".',
          error: `Invalid value: ${req.query.type}`
        });
      }
    }

    // Bounding box filter: minLat,minLng,maxLat,maxLng
    if (req.query.bbox) {
      const bbox = String(req.query.bbox);
      const coords = bbox.split(',').map(c => c.trim());

      if (coords.length !== 4) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bbox parameter. Format must be: minLat,minLng,maxLat,maxLng',
          error: `Invalid value: ${req.query.bbox}`
        });
      }

      const [minLat, minLng, maxLat, maxLng] = coords.map(c => parseFloat(c));

      if (coords.some(c => isNaN(parseFloat(c)))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bbox parameter. All coordinates must be valid numbers.',
          error: `Invalid value: ${req.query.bbox}`
        });
      }

      if (minLat >= maxLat || minLng >= maxLng) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bbox parameter. Min values must be less than max values.',
          error: `minLat=${minLat} >= maxLat=${maxLat} or minLng=${minLng} >= maxLng=${maxLng}`
        });
      }

      queryParams.bbox = bbox;
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

    // District filter parameter
    if (req.query.district) {
      const district = String(req.query.district).trim();
      if (district.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid district parameter. Cannot be empty.',
          error: `Invalid value: ${req.query.district}`
        });
      }
      // Will be filtered after fetching from Stellio
    }

    logger.info('GET /api/cameras - Query params:', queryParams);

    // Fetch cameras from Stellio
    let cameras = await stellioService.getCameras(queryParams);

    // Apply district filter if provided
    if (req.query.district) {
      const districtFilter = String(req.query.district).trim().toLowerCase();
      cameras = cameras.filter(camera => {
        const cameraDistrict = (camera.district || '').toLowerCase();
        return cameraDistrict === districtFilter;
      });
      logger.info(`District filter applied: ${districtFilter}, ${cameras.length} cameras matched`);
    }

    // Return successful response with 200 status
    return res.status(200).json({
      success: true,
      count: cameras.length,
      data: cameras
    });
  } catch (error) {
    // Log error details
    logger.error('Error in GET /api/cameras:', error);

    // Return error response with 500 status
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cameras',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cameras/districts
 * Get cameras grouped by district
 * 
 * This endpoint returns all cameras organized by their district assignment.
 * Each district key (e.g., "district_1", "district_3") contains an array of
 * camera objects within that district.
 * 
 * Response Format:
 * {
 *   "district_1": [
 *     {
 *       "id": "urn:ngsi-ld:Camera:001",
 *       "name": "Camera 001",
 *       "location": {"lat": 10.8, "lng": 106.6},
 *       "status": "online",
 *       "district": "district_1"
 *     },
 *     ...
 *   ],
 *   "district_3": [
 *     {
 *       "id": "urn:ngsi-ld:Camera:002",
 *       "name": "Camera 002",
 *       "location": {"lat": 10.82, "lng": 106.62},
 *       "status": "online",
 *       "district": "district_3"
 *     },
 *     ...
 *   ],
 *   ...
 * }
 * 
 * Example Usage:
 * - GET /api/cameras/districts
 */
router.get('/districts', async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching cameras grouped by district');

    // Fetch all cameras from Stellio
    const cameras = await stellioService.getCameras({});

    // Group cameras by district
    const groupedByDistrict: Record<string, any[]> = {};

    for (const camera of cameras) {
      const district = camera.district || 'Unknown';

      if (!groupedByDistrict[district]) {
        groupedByDistrict[district] = [];
      }

      groupedByDistrict[district].push(camera);
    }

    const districtCount = Object.keys(groupedByDistrict).length;
    const totalCameras = cameras.length;

    logger.info(`Returned ${totalCameras} cameras grouped into ${districtCount} districts`);

    // Return cameras grouped by district keys
    return res.status(200).json(groupedByDistrict);

  } catch (error) {
    logger.error(`Error fetching cameras by district: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/cameras/districts-ui
 * District selector data with comprehensive metrics
 * 
 * This endpoint provides enriched district information for UI dropdowns/selectors,
 * aggregating data from multiple entity types to give a complete overview of each
 * district's status, environmental conditions, and safety metrics.
 * 
 * Features:
 * 1. Groups cameras by district with online/offline status counts
 * 2. Calculates average AQI per district from AirQualityObserved entities
 * 3. Counts recent accidents (today) per district from RoadAccident entities
 * 4. Computes geographic bounds (min/max lat/lng) for each district
 * 5. Calculates center coordinates from bounds
 * 6. Returns total district count in metadata
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     districts: [{
 *       id: string,
 *       name: string,
 *       cameraCount: number,
 *       onlineCount: number,
 *       offlineCount: number,
 *       avgAQI: number | null,
 *       accidentsToday: number,
 *       bounds: {
 *         minLat: number,
 *         maxLat: number,
 *         minLng: number,
 *         maxLng: number
 *       },
 *       center: {
 *         lat: number,
 *         lng: number
 *       }
 *     }],
 *     totalDistricts: number
 *   }
 * }
 * 
 * AQI Calculation:
 * - Fetches all AirQualityObserved entities with location data
 * - Groups by district using closest camera matching
 * - Averages AQI values per district (null if no data available)
 * 
 * Accidents Counting:
 * - Fetches RoadAccident entities for today (dateObserved >= start of day)
 * - Counts accidents per district based on location proximity
 * - Returns 0 if no accidents found for today
 * 
 * Camera Status:
 * - Online: status === 'online' (operational cameras)
 * - Offline: status !== 'online' (inactive, maintenance, or unknown status)
 * 
 * Example Usage:
 * - GET /api/cameras/districts-ui
 */
router.get('/districts-ui', async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching districts UI options with enriched data');

    // Define HCMC district boundaries (approximate coordinates)
    const districtBoundaries: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number; name: string }> = {
      'District 1': { minLat: 10.762, maxLat: 10.790, minLng: 106.686, maxLng: 106.708, name: 'Quận 1' },
      'District 3': { minLat: 10.765, maxLat: 10.792, minLng: 106.662, maxLng: 106.685, name: 'Quận 3' },
      'District 4': { minLat: 10.745, maxLat: 10.770, minLng: 106.690, maxLng: 106.710, name: 'Quận 4' },
      'District 5': { minLat: 10.745, maxLat: 10.765, minLng: 106.650, maxLng: 106.675, name: 'Quận 5' },
      'District 6': { minLat: 10.730, maxLat: 10.755, minLng: 106.615, maxLng: 106.650, name: 'Quận 6' },
      'District 7': { minLat: 10.710, maxLat: 10.745, minLng: 106.690, maxLng: 106.730, name: 'Quận 7' },
      'District 8': { minLat: 10.695, maxLat: 10.730, minLng: 106.620, maxLng: 106.690, name: 'Quận 8' },
      'District 10': { minLat: 10.755, maxLat: 10.785, minLng: 106.655, maxLng: 106.685, name: 'Quận 10' },
      'District 11': { minLat: 10.745, maxLat: 10.775, minLng: 106.630, maxLng: 106.660, name: 'Quận 11' },
      'Binh Thanh': { minLat: 10.795, maxLat: 10.830, minLng: 106.685, maxLng: 106.720, name: 'Bình Thạnh' },
      'Tan Binh': { minLat: 10.775, maxLat: 10.815, minLng: 106.630, maxLng: 106.670, name: 'Tân Bình' },
      'Tan Phu': { minLat: 10.770, maxLat: 10.815, minLng: 106.600, maxLng: 106.640, name: 'Tân Phú' },
      'Phu Nhuan': { minLat: 10.790, maxLat: 10.810, minLng: 106.670, maxLng: 106.695, name: 'Phú Nhuận' },
      'Go Vap': { minLat: 10.815, maxLat: 10.865, minLng: 106.650, maxLng: 106.690, name: 'Gò Vấp' },
      'Binh Tan': { minLat: 10.740, maxLat: 10.790, minLng: 106.580, maxLng: 106.625, name: 'Bình Tân' },
      'Thu Duc': { minLat: 10.815, maxLat: 10.900, minLng: 106.720, maxLng: 106.820, name: 'Thủ Đức' },
    };

    // Helper function to determine district from coordinates
    const getDistrictFromCoordinates = (lat: number, lng: number): string => {
      for (const [districtKey, bounds] of Object.entries(districtBoundaries)) {
        if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng) {
          return bounds.name;
        }
      }
      return 'Other Areas'; // For cameras outside defined districts
    };

    // Fetch all cameras
    const cameras = await stellioService.getCameras({});

    // Fetch air quality data
    const airQualityData = await genericNgsiService.fetchEntities('AirQualityObserved', {});

    // Fetch accidents for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    const accidents = await genericNgsiService.fetchEntities('RoadAccident', {});
    const accidentsToday = accidents.filter(accident => {
      const accidentDate = accident.dateObserved || accident.timestamp;
      return accidentDate && accidentDate >= todayStartISO;
    });

    logger.debug(`Found ${cameras.length} cameras, ${airQualityData.length} AQI records, ${accidentsToday.length} accidents today`);

    // Group cameras by district based on coordinates
    const grouped: Record<string, any[]> = {};

    for (const camera of cameras) {
      const lat = camera.location?.lat;
      const lng = camera.location?.lng;

      if (!lat || !lng) continue;

      const district = getDistrictFromCoordinates(lat, lng);

      if (!grouped[district]) {
        grouped[district] = [];
      }

      grouped[district].push(camera);
    }

    // Helper: Find closest camera to a location
    const findClosestCamera = (location: { lat: number; lng: number }, districtCameras: any[]): any | null => {
      if (!location || !location.lat || !location.lng) return null;

      let closestCamera: any | null = null;
      let minDistance = Infinity;

      for (const camera of districtCameras) {
        if (!camera.location || !camera.location.lat || !camera.location.lng) continue;

        const distance = haversineDistance(
          location.lat,
          location.lng,
          camera.location.lat,
          camera.location.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCamera = camera;
        }
      }

      return minDistance < 2000 ? closestCamera : null; // 2km threshold
    };

    // Convert to district options
    const districts = Object.entries(grouped).map(([districtId, districtCameras]) => {
      // Calculate camera status counts
      const onlineCount = districtCameras.filter(c => c.status === 'online').length;
      const offlineCount = districtCameras.length - onlineCount;

      // Calculate bounds
      const lats = districtCameras
        .map(c => c.location?.lat)
        .filter(v => typeof v === 'number');

      const lngs = districtCameras
        .map(c => c.location?.lng)
        .filter(v => typeof v === 'number');

      const minLat = lats.length > 0 ? Math.min(...lats) : 0;
      const maxLat = lats.length > 0 ? Math.max(...lats) : 0;
      const minLng = lngs.length > 0 ? Math.min(...lngs) : 0;
      const maxLng = lngs.length > 0 ? Math.max(...lngs) : 0;

      const bounds = { minLat, maxLat, minLng, maxLng };

      // Calculate center coordinates
      const center = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2
      };

      // Calculate average AQI for this district
      let avgAQI: number | null = null;
      const districtAQI = airQualityData.filter(aqi => {
        if (!aqi.location || !aqi.location.lat || !aqi.location.lng) return false;
        return findClosestCamera(aqi.location, districtCameras) !== null;
      });

      if (districtAQI.length > 0) {
        const aqiValues = districtAQI
          .map(aqi => aqi.AQI || aqi.aqi)
          .filter(v => typeof v === 'number');

        if (aqiValues.length > 0) {
          avgAQI = Math.round(aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length);
        }
      }

      // Count accidents today for this district
      const districtAccidents = accidentsToday.filter(accident => {
        if (!accident.location || !accident.location.lat || !accident.location.lng) return false;
        return findClosestCamera(accident.location, districtCameras) !== null;
      });

      return {
        id: districtId,
        name: districtId,
        cameraCount: districtCameras.length,
        onlineCount,
        offlineCount,
        avgAQI,
        accidentsToday: districtAccidents.length,
        bounds,
        center
      };
    });

    logger.info(`Returned ${districts.length} district options with enriched data`);

    return res.status(200).json({
      success: true,
      data: {
        districts,
        totalDistricts: districts.length
      }
    });

  } catch (error) {
    logger.error(`Error fetching districts UI options: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/cameras/nearby
 * Find cameras, weather, AQI, and accidents within a radius
 * 
 * Request Body:
 * {
 *   lat: number,
 *   lng: number,
 *   radius: number (meters)
 * }
 * 
 * Response 200:
 * {
 *   success: true,
 *   data: {
 *     center: {lat, lng},
 *     radius: number,
 *     cameras: Camera[],
 *     weather: Weather[],
 *     airQuality: AirQuality[],
 *     accidents: Accident[],
 *     counts: {cameras, weather, airQuality, accidents}
 *   }
 * }
 */
router.post('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.body;

    // Validate input
    if (typeof lat !== 'number' || typeof lng !== 'number' || typeof radius !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: lat, lng, and radius must be numbers'
      });
    }

    if (radius < 0 || radius > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid radius: must be between 0 and 50000 meters'
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude: must be between -90 and 90'
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude: must be between -180 and 180'
      });
    }

    logger.info(`POST /api/cameras/nearby - Center: ${lat}, ${lng}, Radius: ${radius}m`);

    // Fetch all data in parallel
    const [allCameras, allWeather, allAirQuality, allAccidents] = await Promise.all([
      stellioService.getCameras({}),
      genericNgsiService.fetchEntities('Weather'),
      genericNgsiService.fetchEntities('AirQuality'),
      genericNgsiService.fetchEntities('Accident')
    ]);

    // Filter cameras within radius
    const cameras = allCameras.filter(camera => {
      if (!camera.location || typeof camera.location.lat !== 'number' || typeof camera.location.lng !== 'number') {
        return false;
      }
      const distance = haversineDistance(lat, lng, camera.location.lat, camera.location.lng);
      return distance <= radius;
    });

    // Filter weather within radius
    const weather = (allWeather as any[]).filter(w => {
      if (!w.location || typeof w.location.lat !== 'number' || typeof w.location.lng !== 'number') {
        return false;
      }
      const distance = haversineDistance(lat, lng, w.location.lat, w.location.lng);
      return distance <= radius;
    });

    // Filter air quality within radius
    const airQuality = (allAirQuality as any[]).filter(aqi => {
      if (!aqi.location || typeof aqi.location.lat !== 'number' || typeof aqi.location.lng !== 'number') {
        return false;
      }
      const distance = haversineDistance(lat, lng, aqi.location.lat, aqi.location.lng);
      return distance <= radius;
    });

    // Filter accidents within radius
    const accidents = (allAccidents as any[]).filter(accident => {
      if (!accident.location) {
        return false;
      }
      // Accident uses latitude/longitude, not lat/lng
      const accidentLat = accident.location.latitude;
      const accidentLng = accident.location.longitude;

      if (typeof accidentLat !== 'number' || typeof accidentLng !== 'number') {
        return false;
      }

      const distance = haversineDistance(lat, lng, accidentLat, accidentLng);
      return distance <= radius;
    });

    logger.info(`Found within ${radius}m: ${cameras.length} cameras, ${weather.length} weather, ${airQuality.length} AQI, ${accidents.length} accidents`);

    // Return results
    return res.status(200).json({
      success: true,
      data: {
        center: { lat, lng },
        radius,
        cameras,
        weather,
        airQuality,
        accidents,
        counts: {
          cameras: cameras.length,
          weather: weather.length,
          airQuality: airQuality.length,
          accidents: accidents.length
        }
      }
    });

  } catch (error) {
    logger.error('Error in POST /api/cameras/nearby:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cameras/:id
 * Fetch single camera by ID from Stellio
 * 
 * Response 200: { success: true, data: Camera }
 * Response 404: { success: false, message: string }
 * Response 500: { success: false, message: string, error: string }
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`GET /api/cameras/${id}`);

    const camera = await stellioService.getCameraById(id);

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: camera
    });
  } catch (error) {
    logger.error(`Error in GET /api/cameras/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch camera',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
