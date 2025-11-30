/**
 * Correlation Routes - Cross-Entity Relationship Analysis API
 * 
 * @module apps/traffic-web-app/backend/src/routes/correlationRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for analyzing correlations between different entity types:
 * traffic-weather, traffic-AQI, accident-pattern relationships.
 * 
 * Endpoints:
 * - GET /api/correlations/accident-pattern: Accident-traffic pattern correlation
 * - GET /api/correlations/weather-traffic: Weather impact on traffic
 * - GET /api/correlations/aqi-traffic: Air quality-traffic relationship
 * - GET /api/correlations/multi-factor: Multi-variable correlation analysis
 * 
 * Correlation Metrics:
 * - Pearson correlation coefficient (-1 to 1)
 * - Spatial proximity (meters)
 * - Temporal overlap (minutes)
 * - Confidence score (0-100%)
 */

import { Router, Request, Response } from 'express';
import { genericNgsiService } from '../services/genericNgsiService';
import { accidentPatternCorrelation } from '../utils/transformations';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/correlations/accident-pattern
 * Correlate accidents with traffic patterns
 * 
 * This endpoint analyzes the relationship between road accidents and traffic patterns
 * by matching accidents with patterns based on:
 * - Same camera location
 * - Accident time within pattern timeRange
 * - Accident day matching pattern daysOfWeek
 * 
 * Response includes:
 * - Overall correlation rate (% of accidents matching patterns)
 * - Breakdown by congestion level (high/medium/low)
 * - Accidents per pattern with severity analysis
 * - Average vehicle count when accidents occur
 * - Generated insights about dangerous patterns
 * 
 * Example Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalAccidents": 45,
 *     "accidentsWithPatterns": 32,
 *     "correlationRate": 71,
 *     "byPattern": [{
 *       "patternId": "urn:ngsi-ld:TrafficPattern:001",
 *       "patternType": "rush_hour",
 *       "congestionLevel": "high",
 *       "accidentCount": 12,
 *       "avgSeverity": "moderate",
 *       "severityBreakdown": { "severe": 3, "moderate": 6, "minor": 3 }
 *     }],
 *     "byCongestion": { "high": 20, "medium": 8, "low": 4 },
 *     "avgVehicleCount": 85,
 *     "insights": "71% of accidents correlate with known traffic patterns..."
 *   }
 * }
 */
router.get('/accident-pattern', async (_req: Request, res: Response) => {
  try {
    logger.info('Analyzing accident-pattern correlation');

    // Fetch all accidents from NGSI-LD
    logger.debug('Fetching accidents from Stellio...');
    const accidents = await genericNgsiService.fetchEntities('RoadAccident', {});

    if (accidents.length === 0) {
      logger.info('No accidents found for correlation analysis');
      return res.status(200).json({
        success: true,
        data: {
          totalAccidents: 0,
          accidentsWithPatterns: 0,
          correlationRate: 0,
          byPattern: [],
          byCongestion: { high: 0, medium: 0, low: 0 },
          avgVehicleCount: 0,
          insights: 'No accidents available for correlation analysis'
        }
      });
    }

    logger.debug(`Found ${accidents.length} accidents`);

    // Fetch all traffic patterns from NGSI-LD
    logger.debug('Fetching traffic patterns from Stellio...');
    const patterns = await genericNgsiService.fetchEntities('TrafficPattern', {});

    if (patterns.length === 0) {
      logger.warn('No traffic patterns found for correlation analysis');
      return res.status(200).json({
        success: true,
        data: {
          totalAccidents: accidents.length,
          accidentsWithPatterns: 0,
          correlationRate: 0,
          byPattern: [],
          byCongestion: { high: 0, medium: 0, low: 0 },
          avgVehicleCount: 0,
          insights: 'No traffic patterns available for correlation. Cannot determine accident-pattern relationships.'
        }
      });
    }

    logger.debug(`Found ${patterns.length} traffic patterns`);

    // Perform correlation analysis
    logger.info('Performing correlation analysis...');
    const correlation = accidentPatternCorrelation(accidents, patterns);

    logger.info(`Correlation analysis complete: ${correlation.correlationRate}% correlation rate, ${correlation.accidentsWithPatterns}/${correlation.totalAccidents} accidents matched`);

    return res.status(200).json({
      success: true,
      data: correlation
    });

  } catch (error) {
    logger.error(`Error analyzing accident-pattern correlation: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze accident-pattern correlation'
    });
  }
});

export default router;
