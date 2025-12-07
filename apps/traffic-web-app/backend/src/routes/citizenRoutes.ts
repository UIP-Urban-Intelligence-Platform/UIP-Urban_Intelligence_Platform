/**
 * Citizen Report Routes - Citizen Observation API Endpoints
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/backend/src/routes/citizenRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-12-05
 * @modified 2025-12-05
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * RESTful API endpoints for querying CitizenObservation entities from Stellio.
 * Acts as a proxy to avoid CORS issues when frontend queries Stellio directly.
 * 
 * Endpoints:
 * - GET /api/citizen-reports: List all citizen reports with optional filters
 * - GET /api/citizen-reports/:id: Get specific report by ID
 * - GET /api/citizen-reports/stats: Get aggregated statistics
 * 
 * @dependencies
 * - express@^4.18: Web framework
 * - axios@^1.6: HTTP client for Stellio queries
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();

// Stellio Context Broker URL
const STELLIO_URL = process.env.STELLIO_URL || 'http://localhost:8080';

/**
 * Transform NGSI-LD entity to CitizenReport format
 */
function transformEntity(entity: any) {
    const id = entity.id?.split(':').pop() || '';
    return {
        id,
        reportId: id,
        userId: entity.reportedBy?.object?.split(':').pop() || 'unknown',
        reportType: entity.category?.value || 'other',
        description: entity.description?.value || '',
        latitude: entity.location?.value?.coordinates?.[1] || 0,
        longitude: entity.location?.value?.coordinates?.[0] || 0,
        imageUrl: entity.imageSnapshot?.value || '',
        dateObserved: entity.dateObserved?.value || new Date().toISOString(),
        createdAt: entity.dateObserved?.value || new Date().toISOString(),
        status: entity.aiVerified?.value ? 'verified' : 'pending_verification',
        aiVerified: entity.aiVerified?.value || false,
        aiConfidence: entity.aiConfidence?.value || 0,
        weatherContext: entity.weatherContext?.value,
        airQualityContext: entity.airQualityContext?.value
    };
}

/**
 * GET /api/citizen-reports
 * List all citizen reports with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { reportType, aiVerified, minConfidence, limit = 100 } = req.query;

        // Build query parameters
        const params: any = {
            type: 'CitizenObservation',
            limit: Number(limit)
        };

        // Build NGSI-LD query filters
        const qParts: string[] = [];
        if (reportType) qParts.push(`category=="${reportType}"`);
        if (aiVerified !== undefined) qParts.push(`aiVerified==${aiVerified}`);
        if (minConfidence !== undefined) qParts.push(`aiConfidence>=${minConfidence}`);
        if (qParts.length > 0) params.q = qParts.join(';');

        const response = await axios.get(`${STELLIO_URL}/ngsi-ld/v1/entities`, {
            params,
            headers: { 'Accept': 'application/json' },
            timeout: 30000
        });

        const reports = (response.data || []).map(transformEntity);

        return res.json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Handle 404 (no entities found) as empty result
            if (error.response?.status === 404) {
                return res.json({
                    success: true,
                    count: 0,
                    data: []
                });
            }
            logger.error('Failed to query citizen reports from Stellio:', {
                status: error.response?.status,
                message: error.message
            });
        } else {
            logger.error('Failed to query citizen reports:', error);
        }

        return res.json({
            success: true,
            count: 0,
            data: [],
            warning: 'Failed to fetch from Stellio, returning empty result'
        });
    }
});

/**
 * GET /api/citizen-reports/stats
 * Get aggregated statistics for citizen reports
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${STELLIO_URL}/ngsi-ld/v1/entities`, {
            params: {
                type: 'CitizenObservation',
                limit: 10000
            },
            headers: { 'Accept': 'application/json' },
            timeout: 30000
        });

        const reports = (response.data || []).map(transformEntity);
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentReports = reports.filter((r: any) => new Date(r.dateObserved) > last24h);
        const verifiedReports = reports.filter((r: any) => r.aiVerified);

        const byType = reports.reduce((acc: any, r: any) => {
            acc[r.reportType] = (acc[r.reportType] || 0) + 1;
            return acc;
        }, {});

        const byStatus = reports.reduce((acc: any, r: any) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});

        const avgConfidence = verifiedReports.length > 0
            ? verifiedReports.reduce((sum: number, r: any) => sum + r.aiConfidence, 0) / verifiedReports.length
            : 0;

        res.json({
            success: true,
            data: {
                total: reports.length,
                byType,
                byStatus,
                verified: verifiedReports.length,
                unverified: reports.length - verifiedReports.length,
                avgConfidence,
                last24Hours: recentReports.length
            }
        });
    } catch (error) {
        logger.error('Failed to get citizen report stats:', error);
        res.json({
            success: true,
            data: {
                total: 0,
                byType: { traffic_jam: 0, accident: 0, flood: 0, road_damage: 0, other: 0 },
                byStatus: { pending_verification: 0, verified: 0, rejected: 0 },
                verified: 0,
                unverified: 0,
                avgConfidence: 0,
                last24Hours: 0
            }
        });
    }
});

/**
 * GET /api/citizen-reports/:id
 * Get a specific citizen report by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const entityId = id.startsWith('urn:ngsi-ld:') ? id : `urn:ngsi-ld:CitizenObservation:${id}`;

        const response = await axios.get(`${STELLIO_URL}/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`, {
            headers: { 'Accept': 'application/json' },
            timeout: 30000
        });

        const report = transformEntity(response.data);

        return res.json({
            success: true,
            data: report
        });
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }
        logger.error('Failed to get citizen report:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch report'
        });
    }
});

export default router;
