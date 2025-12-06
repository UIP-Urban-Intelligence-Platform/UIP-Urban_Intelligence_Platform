/**
 * Analytics Routes - Aggregated Metrics & Correlations API
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/routes/analyticsRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for analytics, aggregations, and derived insights from traffic,
 * weather, and air quality data.
 * 
 * Endpoints:
 * - GET /api/analytics/pollutants: Pollutant data by location
 * - GET /api/analytics/congestion: Congestion hotspot analysis
 * - GET /api/analytics/correlations: Cross-entity correlations
 * - GET /api/analytics/trends: Temporal trends
 * - GET /api/analytics/accidents/frequency: Accident frequency by time
 * - GET /api/analytics/accidents/hotspots: Accident-prone locations
 * - GET /api/analytics/heatmap: Traffic density heatmap
 * - GET /api/analytics/speed-zones: Speed zone categorization
 * - GET /api/analytics/districts: District-level aggregations
 * 
 * Analytics Features:
 * - Spatial clustering algorithms
 * - Temporal bucketing (hourly, daily, weekly)
 * - GeoJSON conversion for map visualization
 * - Statistical aggregations (mean, median, percentiles)
 * - Correlation detection (weather-traffic, AQI-traffic)
 */

import { Router, Request, Response } from 'express';
import { genericNgsiService } from '../services/genericNgsiService';
import { pollutantsByLocation, spatialClustering, zonesToGeoJson, timeBuckets, frequencyData, temporalGrid, heatmapData, categorizeSpeedZones, speedZonesToGeoJson, groupByField, districtOptions, accidentHotspotAnalysis } from '../utils/transformations';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/analytics/pollutants
 * Get detailed pollutant data by location
 * 
 * Query Parameters:
 * - cameraId: Filter by camera ID
 * - limit: Maximum number of results
 */
router.get('/pollutants', async (req: Request, res: Response) => {
  try {
    const { cameraId, limit } = req.query;

    logger.info(`Fetching pollutant analytics: cameraId=${cameraId}, limit=${limit}`);

    // Build query params
    const queryParams: any = {};
    if (cameraId) queryParams.cameraId = cameraId;
    if (limit) queryParams.limit = parseInt(limit as string);

    // Fetch air quality data (weather data with pollutants)
    const airQualityData = await genericNgsiService.fetchEntities('AirQuality', queryParams);

    // Transform to pollutant format
    const pollutants = pollutantsByLocation(airQualityData);

    logger.info(`Returned ${pollutants.length} pollutant data points`);

    return res.status(200).json({
      success: true,
      count: pollutants.length,
      data: pollutants
    });

  } catch (error) {
    logger.error(`Error fetching pollutant analytics: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/humidity-zones
 * Get spatial clusters of humidity zones
 * 
 * Query Parameters:
 * - clusterCount: Number of clusters (default: 10)
 */
router.get('/humidity-zones', async (req: Request, res: Response) => {
  try {
    const { clusterCount = 10 } = req.query;

    logger.info(`Fetching humidity zones analytics: clusterCount=${clusterCount}`);

    // Fetch weather data
    const weatherData = await genericNgsiService.fetchEntities('Weather', {});

    if (weatherData.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }

    // Apply spatial clustering
    const clusters = spatialClustering(weatherData, parseInt(clusterCount as string), 'kmeans');

    // Convert to GeoJSON
    const geoJson = zonesToGeoJson(clusters);

    logger.info(`Returned ${clusters.length} humidity zones`);

    return res.status(200).json({
      success: true,
      data: geoJson
    });

  } catch (error) {
    logger.error(`Error fetching humidity zones analytics: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/accident-frequency
 * Get accident frequency time series
 * 
 * Query Parameters:
 * - days: Number of days to analyze (default: 30)
 */
router.get('/accident-frequency', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;

    logger.info(`Fetching accident frequency analytics: days=${days}`);

    // Fetch accident data
    const accidents = await genericNgsiService.fetchEntities('RoadAccident', {});

    // Aggregate into time buckets
    const aggregated = timeBuckets(accidents, ['hour', 'dayOfWeek'], parseInt(days as string));

    // Convert to frequency format
    const frequency = frequencyData(aggregated);

    logger.info(`Returned accident frequency data for ${days} days`);

    return res.status(200).json({
      success: true,
      data: frequency
    });

  } catch (error) {
    logger.error(`Error fetching accident frequency analytics: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/vehicle-heatmap
 * Get vehicle density heatmap by location and time
 */
router.get('/vehicle-heatmap', async (_req: Request, res: Response) => {
  try {
    logger.info(`Fetching vehicle heatmap analytics`);

    // Fetch traffic pattern data
    const patterns = await genericNgsiService.fetchEntities('TrafficPattern', {});

    if (patterns.length === 0) {
      return res.status(200).json({
        success: true,
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
    logger.error(`Error fetching vehicle heatmap analytics: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/speed-zones
 * Get speed zone categorization with GeoJSON
 */
router.get('/speed-zones', async (_req: Request, res: Response) => {
  try {
    logger.info(`Fetching speed zones analytics`);

    // Fetch traffic patterns
    const patterns = await genericNgsiService.fetchEntities('TrafficPattern', {});

    // Fetch cameras for geometry calculation
    const cameras = await genericNgsiService.fetchEntities('Camera', {});

    // Define speed categories
    const categories = [
      { name: 'slow', min: 0, max: 20, color: '#ff0000' },
      { name: 'medium', min: 20, max: 50, color: '#ffff00' },
      { name: 'fast', min: 50, max: Infinity, color: '#00ff00' }
    ];

    // Categorize patterns into speed zones
    const zones = categorizeSpeedZones(patterns, categories, cameras);

    // Convert to GeoJSON
    const geoJson = speedZonesToGeoJson(zones);

    logger.info(`Returned ${zones.length} speed zones`);

    return res.status(200).json({
      success: true,
      data: geoJson
    });

  } catch (error) {
    logger.error(`Error fetching speed zones analytics: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/districts-ui
 * Get district options for UI dropdowns
 */
router.get('/districts-ui', async (_req: Request, res: Response) => {
  try {
    logger.info(`Fetching districts UI options`);

    // Fetch cameras
    const cameras = await genericNgsiService.fetchEntities('Camera', {});

    // Group by district
    const grouped = groupByField(cameras, 'district');

    // Convert to district options
    const options = districtOptions(grouped);

    logger.info(`Returned ${options.districts.length} district options`);

    return res.status(200).json({
      success: true,
      data: options
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
 * GET /api/analytics/hotspots
 * Identify accident hotspot cameras with risk analysis
 * 
 * Query Parameters:
 * - minAccidents: Minimum number of accidents to qualify as hotspot (default: 3)
 * - days: Number of days to analyze (default: 30)
 * 
 * Response Format:
 * [
 *   {
 *     cameraId: "urn:ngsi-ld:Camera:001",
 *     cameraName: "Nguyen Hue & Le Loi",
 *     location: { lat: 10.7769, lng: 106.7009 },
 *     accidentCount: 12,
 *     severityBreakdown: { severe: 3, moderate: 5, minor: 4 },
 *     mostCommonType: "collision",
 *     timePattern: { morning: 2, afternoon: 5, evening: 4, night: 1 },
 *     riskScore: 78
 *   }
 * ]
 * 
 * Risk Score Calculation (0-100):
 * - Total accidents: 40% (normalized)
 * - Severe accidents: 35% (weighted by severity)
 * - Moderate accidents: 15%
 * - Time consistency: 10% (consistent = higher risk)
 */
router.get('/hotspots', async (req: Request, res: Response) => {
  try {
    const minAccidents = req.query.minAccidents ? parseInt(req.query.minAccidents as string) : 3;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    // Validate parameters
    if (isNaN(minAccidents) || minAccidents < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid minAccidents parameter. Must be >= 1'
      });
    }

    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter. Must be between 1 and 365'
      });
    }

    logger.info(`Analyzing accident hotspots: minAccidents=${minAccidents}, days=${days}`);

    // Fetch all accidents
    const accidents = await genericNgsiService.fetchEntities('RoadAccident', {});

    if (accidents.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        metadata: {
          minAccidents,
          days,
          totalAccidents: 0
        }
      });
    }

    // Filter accidents within time range
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filteredAccidents = accidents.filter((accident: any) => {
      try {
        const accidentDate = new Date(accident.dateDetected);
        return accidentDate >= startDate;
      } catch {
        return false;
      }
    });

    logger.info(`Analyzing ${filteredAccidents.length} accidents from last ${days} days`);

    // Fetch cameras for location data
    const cameras = await genericNgsiService.fetchEntities('Camera', {});

    // Perform hotspot analysis
    const hotspots = accidentHotspotAnalysis(filteredAccidents, cameras, minAccidents);

    logger.info(`Identified ${hotspots.length} accident hotspots`);

    return res.status(200).json({
      success: true,
      count: hotspots.length,
      data: hotspots,
      metadata: {
        minAccidents,
        days,
        totalAccidents: filteredAccidents.length,
        analyzedCameras: cameras.length,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(`Error analyzing accident hotspots: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze accident hotspots'
    });
  }
});

/**
 * GET /api/analytics/accident-frequency
 * Time-series accident statistics and frequency analysis
 * 
 * This endpoint provides comprehensive temporal analysis of road accidents over
 * the past 30 days, aggregating data by hour of day, day of week, and calendar date.
 * It identifies peak accident hours, safest hours, and dangerous days to help
 * optimize traffic management and emergency response planning.
 * 
 * Query Parameters:
 * - days: Number of days to analyze (default: 30, max: 90)
 * 
 * Analysis Features:
 * 1. Hourly aggregation (0-23): Counts accidents per hour across all days
 * 2. Day of week aggregation (Mon-Sun): Identifies most dangerous days
 * 3. Daily totals: Calendar-based accident counts for trend analysis
 * 4. Peak hour detection: Top 3 hours with highest accident frequency
 * 5. Safest hour detection: Top 3 hours with lowest accident frequency
 * 6. Statistical insights: Total accidents, hourly averages, percentages
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     byHour: [{
 *       hour: 0-23,
 *       count: number,
 *       percentage: number
 *     }],
 *     byDayOfWeek: [{
 *       day: "Monday" | "Tuesday" | ... | "Sunday",
 *       count: number,
 *       percentage: number
 *     }],
 *     byDate: [{
 *       date: "2025-11-10",
 *       count: number
 *     }],
 *     insights: {
 *       peakHours: [17, 7, 19],
 *       safestHours: [2, 3, 4],
 *       mostDangerousDay: "Friday",
 *       totalAccidents: 145,
 *       avgAccidentsPerDay: 4.8,
 *       avgAccidentsPerHour: 6.0
 *     },
 *     metadata: {
 *       startDate: "2025-10-12T00:00:00Z",
 *       endDate: "2025-11-11T00:00:00Z",
 *       daysAnalyzed: 30
 *     }
 *   }
 * }
 * 
 * Example Usage:
 * - GET /api/analytics/accident-frequency
 * - GET /api/analytics/accident-frequency?days=60
 */
router.get('/accident-frequency', async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 90) {
      logger.warn(`Invalid days parameter: ${days}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter. Must be between 1 and 90'
      });
    }

    logger.info(`Analyzing accident frequency for last ${days} days`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch accidents from Stellio
    const accidents = await genericNgsiService.fetchEntities('RoadAccident', {});

    // Filter accidents within date range
    const filteredAccidents = accidents.filter(accident => {
      if (!accident.dateObserved) return false;
      const accidentDate = new Date(accident.dateObserved);
      return accidentDate >= startDate && accidentDate <= endDate;
    });

    if (filteredAccidents.length === 0) {
      logger.info('No accidents found in specified date range');
      return res.status(200).json({
        success: true,
        data: {
          byHour: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, percentage: 0 })),
          byDayOfWeek: [
            { day: 'Monday', count: 0, percentage: 0 },
            { day: 'Tuesday', count: 0, percentage: 0 },
            { day: 'Wednesday', count: 0, percentage: 0 },
            { day: 'Thursday', count: 0, percentage: 0 },
            { day: 'Friday', count: 0, percentage: 0 },
            { day: 'Saturday', count: 0, percentage: 0 },
            { day: 'Sunday', count: 0, percentage: 0 }
          ],
          byDate: [],
          insights: {
            peakHours: [],
            safestHours: [],
            mostDangerousDay: 'N/A',
            totalAccidents: 0,
            avgAccidentsPerDay: 0,
            avgAccidentsPerHour: 0
          },
          metadata: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            daysAnalyzed: days
          }
        }
      });
    }

    logger.debug(`Analyzing ${filteredAccidents.length} accidents`);

    // Initialize counters
    const hourCounts = Array(24).fill(0);
    const dayOfWeekCounts = Array(7).fill(0); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const dateCounts = new Map<string, number>();

    // Aggregate data
    filteredAccidents.forEach(accident => {
      const date = new Date(accident.dateObserved);

      // By hour
      const hour = date.getHours();
      hourCounts[hour]++;

      // By day of week
      const dayOfWeek = date.getDay();
      dayOfWeekCounts[dayOfWeek]++;

      // By date
      const dateKey = date.toISOString().split('T')[0];
      dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);
    });

    const totalAccidents = filteredAccidents.length;

    // Format by hour
    const byHour = hourCounts.map((count, hour) => ({
      hour,
      count,
      percentage: Math.round((count / totalAccidents) * 1000) / 10
    }));

    // Format by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const byDayOfWeek = dayOfWeekCounts.map((count, index) => ({
      day: dayNames[index],
      count,
      percentage: Math.round((count / totalAccidents) * 1000) / 10
    }));

    // Format by date (sorted chronologically)
    const byDate = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate insights

    // Peak hours (top 3)
    const sortedHours = byHour
      .map((item, index) => ({ hour: index, count: item.count }))
      .sort((a, b) => b.count - a.count);
    const peakHours = sortedHours.slice(0, 3).map(item => item.hour);

    // Safest hours (top 3)
    const safestHours = sortedHours
      .slice()
      .reverse()
      .slice(0, 3)
      .map(item => item.hour);

    // Most dangerous day
    const sortedDays = byDayOfWeek
      .slice()
      .sort((a, b) => b.count - a.count);
    const mostDangerousDay = sortedDays[0].day;

    // Averages
    const avgAccidentsPerDay = Math.round((totalAccidents / days) * 10) / 10;
    const avgAccidentsPerHour = Math.round((totalAccidents / (days * 24)) * 10) / 10;

    logger.info(`Accident frequency analysis complete: ${totalAccidents} total accidents, peak hours: ${peakHours.join(', ')}`);

    return res.status(200).json({
      success: true,
      data: {
        byHour,
        byDayOfWeek,
        byDate,
        insights: {
          peakHours,
          safestHours,
          mostDangerousDay,
          totalAccidents,
          avgAccidentsPerDay,
          avgAccidentsPerHour
        },
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysAnalyzed: days
        }
      }
    });

  } catch (error) {
    logger.error(`Error analyzing accident frequency: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze accident frequency'
    });
  }
});

export default router;

