/**
 * Air Quality Routes - AirQualityObserved API Endpoints
 * 
 * @module apps/traffic-web-app/backend/src/routes/airQualityRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for querying air quality observation entities with pollutant data,
 * AQI calculations, and camera location joins.
 * 
 * Endpoints:
 * - GET /api/air-quality: List air quality observations
 * - GET /api/air-quality/:id: Get specific AQI observation
 * - GET /api/air-quality/near: Find AQI near location
 * - GET /api/air-quality/current: Current AQI for all cameras
 * 
 * Pollutant Data:
 * - aqi: Air Quality Index (0-500 scale)
 * - pm25: Fine particulate matter (µg/m³)
 * - pm10: Coarse particulate matter (µg/m³)
 * - no2: Nitrogen dioxide (ppb)
 * - o3: Ozone (ppb)
 * - co: Carbon monoxide (ppm)
 * - so2: Sulfur dioxide (ppb)
 */

import { Router, Request, Response } from 'express';
import { StellioService } from '../services/stellioService';
import { AirQualityQueryParams } from '../types';
import { logger } from '../utils/logger';

const router = Router();
const stellioService = new StellioService();

/**
 * GET /api/air-quality
 * Fetch air quality data from Stellio with camera join
 * 
 * Features:
 * 1. Queries AirQualityObserved entities from Stellio
 * 2. Extracts all pollutants: aqi, pm25, pm10, no2, o3, co, so2
 * 3. Joins with camera location via refDevice relationship
 * 4. Calculates AQI level category:
 *    - 0-50: "good"
 *    - 51-100: "moderate"
 *    - 101-150: "unhealthy_sensitive"
 *    - 151-200: "unhealthy"
 *    - 201-300: "very_unhealthy"
 *    - 301+: "hazardous"
 * 5. Returns array with full AQI data + category + color code
 * 
 * Query Parameters:
 * - level: Filter by AQI level (good/moderate/unhealthy_sensitive/unhealthy/very_unhealthy/hazardous)
 * - minAqi: Filter by minimum AQI value (e.g., ?minAqi=100 returns AQI >= 100)
 * - limit: Maximum number of records to return (default: 100)
 * 
 * Response 200:
 * {
 *   success: true,
 *   count: number,
 *   data: AirQuality[]
 * }
 * 
 * Response 400:
 * {
 *   success: false,
 *   message: string,
 *   error: string
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
    const queryParams: AirQualityQueryParams = {};

    // Level filter
    if (req.query.level) {
      const level = String(req.query.level).toLowerCase();
      const validLevels = ['good', 'moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'];

      if (!validLevels.includes(level)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid level parameter. Must be one of: good, moderate, unhealthy_sensitive, unhealthy, very_unhealthy, hazardous.',
          error: `Invalid value: ${req.query.level}`
        });
      }

      queryParams.level = level as 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
    }

    // MinAqi filter
    if (req.query.minAqi) {
      const minAqi = parseFloat(String(req.query.minAqi));

      if (isNaN(minAqi) || minAqi < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid minAqi parameter. Must be a non-negative number.',
          error: `Invalid value: ${req.query.minAqi}`
        });
      }

      queryParams.minAqi = minAqi;
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

    logger.info('GET /api/air-quality - Query params:', queryParams);

    // Fetch air quality data from Stellio
    const airQualityData = await stellioService.getAirQualityData(queryParams);

    // Return successful response with 200 status
    return res.status(200).json({
      success: true,
      count: airQualityData.length,
      data: airQualityData
    });
  } catch (error) {
    // Log error details
    logger.error('Error in GET /api/air-quality:', error);

    // Return error response with 500 status
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch air quality data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/air-quality/pollutants
 * Get detailed individual pollutant data with health level assessmentsh health level assessments
 * 
 * This endpoint provides comprehensive pollutant-specific data with health level
 * classifications based on WHO guidelines. Each pollutant is assessed independently
 * with value, unit, health level, and color code for visualization.
 * 
 * Query Parameters:
 * - pollutants: Comma-separated pollutant types to include (pm25,pm10,no2,o3,co,so2)
 *               If not specified, returns all pollutants
 * - cameraId: Filter by specific camera ID
 * - limit: Maximum number of results (default: 100)
 * 
 * Health Level Thresholds (WHO Guidelines):
 * PM2.5 (μg/m³):
 *   - good: 0-12
 *   - moderate: 12-35
 *   - unhealthy: 35-55
 *   - very_unhealthy: 55+
 * 
 * PM10 (μg/m³):
 *   - good: 0-50
 *   - moderate: 50-150
 *   - unhealthy: 150-250
 *   - very_unhealthy: 250+
 * 
 * NO2 (μg/m³):
 *   - good: 0-40
 *   - moderate: 40-100
 *   - unhealthy: 100-200
 *   - very_unhealthy: 200+
 * 
 * O3 (μg/m³):
 *   - good: 0-50
 *   - moderate: 50-100
 *   - unhealthy: 100-168
 *   - very_unhealthy: 168+
 * 
 * CO (mg/m³):
 *   - good: 0-4
 *   - moderate: 4-9
 *   - unhealthy: 9-15
 *   - very_unhealthy: 15+
 * 
 * SO2 (μg/m³):
 *   - good: 0-40
 *   - moderate: 40-80
 *   - unhealthy: 80-380
 *   - very_unhealthy: 380+
 * 
 * Color Codes:
 * - good: #10b981 (green)
 * - moderate: #fbbf24 (yellow)
 * - unhealthy: #f97316 (orange)
 * - very_unhealthy: #dc2626 (red)
 * 
 * Response Format:
 * {
 *   success: true,
 *   count: number,
 *   cameras: [{
 *     cameraId: string,
 *     location: {lat: number, lng: number},
 *     dateObserved: string,
 *     pollutants: {
 *       pm25: {
 *         value: number,
 *         unit: "μg/m³",
 *         level: "good" | "moderate" | "unhealthy" | "very_unhealthy",
 *         color: string
 *       },
 *       pm10: {...},
 *       no2: {...},
 *       o3: {...},
 *       co: {value, unit: "mg/m³", level, color},
 *       so2: {...}
 *     }
 *   }]
 * }
 * 
 * Example Usage:
 * - GET /api/air-quality/pollutants
 * - GET /api/air-quality/pollutants?pollutants=pm25,pm10,no2
 * - GET /api/air-quality/pollutants?cameraId=urn:ngsi-ld:Camera:001&pollutants=pm25,o3
 */
router.get('/pollutants', async (req: Request, res: Response) => {
  try {
    const { pollutants, cameraId, limit } = req.query;

    logger.info(`GET /api/air-quality/pollutants - pollutants=${pollutants}, cameraId=${cameraId}, limit=${limit}`);

    // Build query params for Stellio
    const queryParams: AirQualityQueryParams = {};

    if (cameraId) {
      queryParams.cameraId = cameraId as string;
    }

    if (limit) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter. Must be a positive number between 1 and 1000.'
        });
      }
      queryParams.limit = limitNum;
    }

    // Parse pollutant filter
    const pollutantFilter = pollutants
      ? String(pollutants).split(',').map(p => p.trim().toLowerCase())
      : null;

    // Validate pollutant types
    const validPollutants = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2'];
    if (pollutantFilter) {
      const invalid = pollutantFilter.filter(p => !validPollutants.includes(p));
      if (invalid.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid pollutant types: ${invalid.join(', ')}. Valid types: ${validPollutants.join(', ')}`
        });
      }
    }

    // Fetch air quality data from Stellio
    const airQualityData = await stellioService.getAirQualityData(queryParams);

    // Helper function to calculate pollutant health level
    const getPollutantLevel = (pollutant: string, value: number | null): {
      level: string;
      color: string;
    } => {
      if (value === null || value === undefined) {
        return { level: 'unknown', color: '#6b7280' };
      }

      let level = 'good';
      let color = '#10b981';

      switch (pollutant) {
        case 'pm25':
          if (value >= 55) {
            level = 'very_unhealthy';
            color = '#dc2626';
          } else if (value >= 35) {
            level = 'unhealthy';
            color = '#f97316';
          } else if (value >= 12) {
            level = 'moderate';
            color = '#fbbf24';
          }
          break;

        case 'pm10':
          if (value >= 250) {
            level = 'very_unhealthy';
            color = '#dc2626';
          } else if (value >= 150) {
            level = 'unhealthy';
            color = '#f97316';
          } else if (value >= 50) {
            level = 'moderate';
            color = '#fbbf24';
          }
          break;

        case 'no2':
          if (value >= 200) {
            level = 'very_unhealthy';
            color = '#dc2626';
          } else if (value >= 100) {
            level = 'unhealthy';
            color = '#f97316';
          } else if (value >= 40) {
            level = 'moderate';
            color = '#fbbf24';
          }
          break;

        case 'o3':
          if (value >= 168) {
            level = 'very_unhealthy';
            color = '#dc2626';
          } else if (value >= 100) {
            level = 'unhealthy';
            color = '#f97316';
          } else if (value >= 50) {
            level = 'moderate';
            color = '#fbbf24';
          }
          break;

        case 'co':
          if (value >= 15) {
            level = 'very_unhealthy';
            color = '#dc2626';
          } else if (value >= 9) {
            level = 'unhealthy';
            color = '#f97316';
          } else if (value >= 4) {
            level = 'moderate';
            color = '#fbbf24';
          }
          break;

        case 'so2':
          if (value >= 380) {
            level = 'very_unhealthy';
            color = '#dc2626';
          } else if (value >= 80) {
            level = 'unhealthy';
            color = '#f97316';
          } else if (value >= 40) {
            level = 'moderate';
            color = '#fbbf24';
          }
          break;
      }

      return { level, color };
    };

    // Transform to detailed pollutant format
    const cameras = airQualityData.map(item => {
      const pollutantData: any = {};

      // Include only requested pollutants or all if not specified
      if (!pollutantFilter || pollutantFilter.includes('pm25')) {
        const { level, color } = getPollutantLevel('pm25', item.pm25);
        pollutantData.pm25 = {
          value: item.pm25,
          unit: 'μg/m³',
          level,
          color
        };
      }

      if (!pollutantFilter || pollutantFilter.includes('pm10')) {
        const { level, color } = getPollutantLevel('pm10', item.pm10);
        pollutantData.pm10 = {
          value: item.pm10,
          unit: 'μg/m³',
          level,
          color
        };
      }

      if (!pollutantFilter || pollutantFilter.includes('no2')) {
        const { level, color } = getPollutantLevel('no2', item.no2);
        pollutantData.no2 = {
          value: item.no2,
          unit: 'μg/m³',
          level,
          color
        };
      }

      if (!pollutantFilter || pollutantFilter.includes('o3')) {
        const { level, color } = getPollutantLevel('o3', item.o3);
        pollutantData.o3 = {
          value: item.o3,
          unit: 'μg/m³',
          level,
          color
        };
      }

      if (!pollutantFilter || pollutantFilter.includes('co')) {
        const { level, color } = getPollutantLevel('co', item.co);
        pollutantData.co = {
          value: item.co,
          unit: 'mg/m³',
          level,
          color
        };
      }

      if (!pollutantFilter || pollutantFilter.includes('so2')) {
        const { level, color } = getPollutantLevel('so2', item.so2);
        pollutantData.so2 = {
          value: item.so2,
          unit: 'μg/m³',
          level,
          color
        };
      }

      return {
        cameraId: item.cameraId,
        location: item.location,
        dateObserved: item.dateObserved,
        pollutants: pollutantData
      };
    });

    logger.info(`Returned ${cameras.length} camera locations with pollutant data`);

    return res.status(200).json({
      success: true,
      count: cameras.length,
      cameras
    });

  } catch (error) {
    logger.error(`Error fetching pollutant data: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/air-quality/:id
 * Fetch single air quality observation by ID
 * 
 * Response 200: { success: true, data: AirQuality }
 * Response 404: { success: false, message: string }
 * Response 500: { success: false, message: string, error: string }
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`GET /api/air-quality/${id}`);

    // Fetch all air quality data and find by ID
    const airQualityData = await stellioService.getAirQualityData();
    const airQuality = airQualityData.find(aq => aq.id === id);

    if (!airQuality) {
      return res.status(404).json({
        success: false,
        message: 'Air quality observation not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: airQuality
    });
  } catch (error) {
    logger.error(`Error in GET /api/air-quality/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch air quality observation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
