/**
 * Accident Routes - RoadAccident API Endpoints
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/routes/accidentRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for querying road accident entities with severity filtering,
 * temporal queries, and geo-spatial searches.
 * 
 * Endpoints:
 * - GET /api/accidents: List accidents with filters
 * - GET /api/accidents/:id: Get specific accident details
 * - GET /api/accidents/recent: Recent accidents (last N hours)
 * - GET /api/accidents/severe: High severity accidents only
 * 
 * Accident Data:
 * - severity: minor, moderate, severe, critical
 * - accidentType: collision, rollover, pedestrian, etc.
 * - casualties: number of injured/deaths
 * - vehiclesInvolved: count
 * - roadCondition: dry, wet, icy
 * - weatherCondition: clear, rain, fog
 */

import { Router, Request, Response } from 'express';
import { genericNgsiService } from '../services/genericNgsiService';
import { logger } from '../utils/logger';
import { Neo4jService } from '../services/neo4jService';

const router = Router();

/**
 * GET /api/accidents
 * Fetch accident data with filters
 * 
 * Query Parameters:
 * - hours: Filter accidents from last N hours
 * - severity: Filter by severity (severe, moderate, minor)
 * - cameraId: Filter by affected camera ID
 * - limit: Maximum number of results (default: all, use 0 or 'all' for no limit)
 * - page: Page number for pagination (default: 1)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { hours, severity, cameraId, limit, page = 1 } = req.query;
    // If no limit specified or limit=0 or limit='all', return ALL accidents
    const noLimit = !limit || limit === '0' || limit === 'all';
    logger.info(`Fetching accidents from Stellio: hours=${hours}, severity=${severity}, cameraId=${cameraId}, limit=${noLimit ? 'ALL' : limit}, page=${page}`);

    // Build query params
    const queryParams: any = {};
    if (hours) {
      const hoursNum = parseInt(hours as string);
      if (isNaN(hoursNum) || hoursNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid hours parameter. Must be a positive number.'
        });
      }
      queryParams.hours = hoursNum;
    }
    if (severity) {
      const validSeverities = ['severe', 'moderate', 'minor'];
      if (!validSeverities.includes(severity as string)) {
        return res.status(400).json({
          success: false,
          error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
        });
      }
      queryParams.severity = severity;
    }
    if (cameraId) {
      queryParams.cameraId = cameraId;
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

    // Fetch accidents using generic service - supports both Accident and RoadAccident types
    const accidents = await genericNgsiService.fetchEntities('Accident', queryParams);

    // Apply pagination only if limit is specified
    if (noLimit) {
      // Return ALL accidents without pagination
      logger.info(`Returned ALL ${accidents.length} accidents from Stellio`);
      return res.status(200).json({
        success: true,
        count: accidents.length,
        totalPages: 1,
        currentPage: 1,
        totalCount: accidents.length,
        data: accidents
      });
    }

    // Pagination mode
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 100;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAccidents = accidents.slice(startIndex, endIndex);
    const totalPages = Math.ceil(accidents.length / limitNum);

    logger.info(`Returned ${paginatedAccidents.length} accidents from Stellio (page ${pageNum}/${totalPages})`);

    return res.status(200).json({
      success: true,
      count: paginatedAccidents.length,
      totalPages,
      currentPage: pageNum,
      totalCount: accidents.length,
      data: paginatedAccidents
    });
  } catch (error) {
    logger.error(`Error fetching accidents from Stellio: ${error}`);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/accidents/:id
 * Fetch single accident by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Accident ID is required'
      });
    }

    logger.info(`Fetching accident by ID: ${id}`);

    // Fetch single accident
    const accident = await genericNgsiService.fetchEntityById('RoadAccident', id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        error: 'Accident not found'
      });
    }

    logger.info(`Returned accident: ${id}`);

    return res.status(200).json({
      success: true,
      data: accident
    });

  } catch (error) {
    logger.error(`Error fetching accident by ID: ${error}`);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
