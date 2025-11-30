/**
 * Historical Routes - Time-Series Data via SPARQL Queries
 * 
 * @module apps/traffic-web-app/backend/src/routes/historicalRoutes
  * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for querying historical time-series data from Fuseki triplestore
 * using SPARQL queries. Provides trend analysis and temporal aggregations.
 * 
 * Endpoints:
 * - GET /api/historical/aqi: Historical AQI trends
 * - GET /api/historical/traffic: Historical traffic intensity
 * - GET /api/historical/weather: Weather history
 * - GET /api/historical/accidents: Accident timeline
 * 
 * Query Features:
 * - Date range filtering (startDate, endDate)
 * - Temporal aggregations (hourly, daily, weekly)
 * - Entity-specific queries (by camera, location, district)
 * - Pagination for large datasets
 * - CSV/JSON export formats
 */

import { Router, Request, Response } from 'express';
import { FusekiService } from '../services/fusekiService';
import { logger } from '../utils/logger';

const router = Router();
const fusekiService = new FusekiService();

/**
 * GET /api/historical/aqi
 * Query historical AQI trends via SPARQL from Fuseki
 * 
 * This endpoint retrieves historical air quality data from the Fuseki triple store
 * using SPARQL queries. Data is stored in named graphs and can be aggregated by
 * hour or day for trend analysis.
 * 
 * Query Parameters:
 * - days: Number of days to query (default: 7, max: 365)
 * - cameraId: Filter by specific camera ID (optional)
 * - groupBy: Aggregation method - 'hour', 'day', or undefined (default: none)
 * 
 * Response Format (Time-Series):
 * {
 *   success: true,
 *   count: 5,
 *   data: [
 *     {
 *       cameraId: "urn:ngsi-ld:Camera:001",
 *       timestamps: ["2025-11-04T10:00:00Z", "2025-11-04T11:00:00Z", ...],
 *       aqi: [45, 52, 48, ...],
 *       pm25: [12.3, 15.2, 14.1, ...],
 *       pm10: [23.4, 28.1, 26.5, ...],
 *       no2: [18.2, 20.5, 19.3, ...],
 *       o3: [35.6, 38.2, 36.8, ...],
 *       co: [0.8, 0.9, 0.85, ...],
 *       so2: [5.2, 6.1, 5.8, ...]
 *     }
 *   ],
 *   metadata: {
 *     days: 7,
 *     cameraId: "all",
 *     groupBy: "none",
 *     startDate: "2025-11-04T00:00:00Z",
 *     endDate: "2025-11-11T00:00:00Z"
 *   }
 * }
 * 
 * SPARQL Query Structure:
 * - Queries named graphs in Fuseki dataset
 * - Filters by date range and optional camera ID
 * - Retrieves AQI and all pollutant values
 * - Supports time-based aggregation (hour/day averages)
 * 
 * Example Usage:
 * - GET /api/historical/aqi?days=7
 * - GET /api/historical/aqi?days=30&groupBy=day
 * - GET /api/historical/aqi?days=7&cameraId=urn:ngsi-ld:Camera:001&groupBy=hour
 */
router.get('/aqi', async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const cameraId = req.query.cameraId as string | undefined;
    const groupBy = req.query.groupBy as string | undefined;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      logger.warn(`Invalid days parameter: ${days}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter. Must be between 1 and 365'
      });
    }

    // Validate groupBy parameter
    if (groupBy && !['hour', 'day'].includes(groupBy)) {
      logger.warn(`Invalid groupBy parameter: ${groupBy}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid groupBy parameter. Must be "hour" or "day"'
      });
    }

    logger.info(`Fetching historical AQI: days=${days}, cameraId=${cameraId || 'all'}, groupBy=${groupBy || 'none'}`);

    // Query Fuseki via SPARQL
    const timeSeriesData = await fusekiService.queryHistoricalAqi(days, cameraId, groupBy);

    logger.info(`Returned historical AQI data for ${timeSeriesData.length} cameras`);

    return res.status(200).json({
      success: true,
      count: timeSeriesData.length,
      data: timeSeriesData,
      metadata: {
        days,
        cameraId: cameraId || 'all',
        groupBy: groupBy || 'none',
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(`Error fetching historical AQI: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query historical AQI data'
    });
  }
});

/**
 * GET /api/historical/snapshot
 * Query historical snapshot at specific timestamp from Fuseki
 * 
 * This endpoint retrieves a complete snapshot of all traffic monitoring data
 * at a specific point in time from the Fuseki triple store. It aggregates
 * data from multiple entity types to provide a unified view for TimeMachine playback.
 * 
 * Query Parameters:
 * - timestamp: ISO 8601 timestamp (required) - e.g., "2025-11-10T08:00:00Z"
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     timestamp: "2025-11-10T08:00:00Z",
 *     aqi: [{
 *       cameraId: "urn:ngsi-ld:Camera:001",
 *       aqi: 45,
 *       pm25: 12.3,
 *       pm10: 23.4,
 *       no2: 18.2,
 *       o3: 35.6,
 *       co: 0.8,
 *       so2: 5.2,
 *       location: {lat: 10.8, lng: 106.6}
 *     }],
 *     weather: [{
 *       cameraId: "urn:ngsi-ld:Camera:001",
 *       temperature: 28.5,
 *       humidity: 75,
 *       pressure: 1013,
 *       windSpeed: 3.2,
 *       precipitation: 0,
 *       condition: "Clear",
 *       location: {lat: 10.8, lng: 106.6}
 *     }],
 *     patterns: [{
 *       patternId: "urn:ngsi-ld:TrafficPattern:001",
 *       cameraId: "urn:ngsi-ld:Camera:001",
 *       patternType: "rush_hour",
 *       congestionLevel: "high",
 *       avgVehicleCount: 85,
 *       avgSpeed: 15.5,
 *       timeRange: {start: "07:00", end: "09:00"},
 *       daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
 *       location: {lat: 10.8, lng: 106.6}
 *     }],
 *     accidents: [{
 *       accidentId: "urn:ngsi-ld:Accident:001",
 *       severity: "moderate",
 *       vehiclesInvolved: 2,
 *       description: "Rear-end collision",
 *       timestamp: "2025-11-10T07:45:00Z",
 *       location: {latitude: 10.8, longitude: 106.6}
 *     }]
 *   }
 * }
 * 
 * SPARQL Query:
 * - Queries data with timestamps within ±1 hour of requested timestamp
 * - Retrieves AQI values for all cameras
 * - Retrieves weather conditions for all cameras
 * - Retrieves active traffic patterns
 * - Retrieves accidents within 1h window
 * 
 * Example Usage:
 * - GET /api/historical/snapshot?timestamp=2025-11-10T08:00:00Z
 */
router.get('/snapshot', async (req: Request, res: Response) => {
  try {
    const timestamp = req.query.timestamp as string;

    // Validate timestamp parameter
    if (!timestamp) {
      logger.warn('Missing timestamp parameter for snapshot query');
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: timestamp (ISO 8601 format)'
      });
    }

    // Parse and validate timestamp format
    const requestedTime = new Date(timestamp);
    if (isNaN(requestedTime.getTime())) {
      logger.warn(`Invalid timestamp format: ${timestamp}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid timestamp format. Use ISO 8601 format (e.g., 2025-11-10T08:00:00Z)'
      });
    }

    logger.info(`Fetching historical snapshot at timestamp: ${timestamp}`);

    // Query Fuseki for complete snapshot
    const snapshot = await fusekiService.queryHistoricalSnapshot(timestamp);

    logger.info(`Returned historical snapshot with ${snapshot.aqi.length} AQI records, ${snapshot.weather.length} weather records, ${snapshot.patterns.length} patterns, ${snapshot.accidents.length} accidents`);

    return res.status(200).json({
      success: true,
      data: snapshot
    });

  } catch (error) {
    logger.error(`Error fetching historical snapshot: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query historical snapshot'
    });
  }
});

export default router;
