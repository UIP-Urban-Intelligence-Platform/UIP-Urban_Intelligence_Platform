/**
 * Citizen Report Service - Crowdsourced Report API Client
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/frontend/src/services/citizenReportService
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Service class for communicating with external Citizen Ingestion API (FastAPI :8001).
 * Handles crowdsourced report submissions, retrieval, filtering, statistics, and status
 * updates. Note: This service targets the separate FastAPI ingestion service, NOT the
 * main Express backend (:5001).
 * 
 * Core features:
 * - Submit citizen reports with photo uploads (multipart/form-data)
 * - Fetch reports with advanced filtering (type, status, time range, location)
 * - Retrieve individual report details
 * - Update report status (pending → verified/rejected)
 * - Get aggregated statistics (total, verified, pending by type)
 * - Support for 5 report types (traffic_jam, accident, flood, road_damage, other)
 * 
 * @dependencies
 * - axios@1.4.0 - HTTP client with multipart support
 * - citizenReport types - TypeScript interfaces
 * 
 * @example
 * ```typescript
 * const report = await CitizenReportService.submitReport({
 *   type: 'accident',
 *   description: 'Minor collision at intersection',
 *   location: { latitude: 10.762622, longitude: 106.660172 },
 *   photo: imageFile
 * });
 * ```
 */
import axios, { AxiosInstance } from 'axios';
import { CitizenReport, CitizenReportSubmission, CitizenReportFilters, CitizenReportStats, ReportType, ReportStatus } from '../types/citizenReport';

// External Citizen Ingestion API (FastAPI :8001)
const CITIZEN_API_URL = import.meta.env.VITE_CITIZEN_API_URL || 'http://localhost:8001';

/**
 * Citizen Report Service
 * Calls EXTERNAL Citizen Ingestion API (FastAPI :8001)
 * NOT the Layer-Business backend (:5001)
 */
class CitizenReportServiceClass {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: `${CITIZEN_API_URL}/api/v1`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Submit a new citizen report to EXTERNAL API
     * @param submission - Report submission data
     * @returns Promise with report ID and status
     */
    async submitReport(submission: CitizenReportSubmission): Promise<{
        status: 'accepted' | 'rejected';
        message: string;
        reportId: string;
        processingStatus: string;
    }> {
        try {
            const response = await this.client.post('/citizen-reports', {
                userId: submission.userId,
                reportType: submission.reportType,
                description: submission.description,
                latitude: submission.latitude,
                longitude: submission.longitude,
                imageUrl: submission.imageUrl,
                timestamp: submission.timestamp
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.message || 'Failed to submit report');
            }
            throw error;
        }
    }

    /**
     * Query citizen reports from Stellio Context Broker via External API
     * @param filters - Filter parameters
     * @returns Promise with array of citizen reports
     */
    async queryReports(filters: CitizenReportFilters = {}): Promise<CitizenReport[]> {
        try {
            // Query Stellio directly for CitizenObservation entities
            const stellioUrl = import.meta.env.VITE_STELLIO_URL || 'http://localhost:8080';
            const params: any = {
                type: 'CitizenObservation',
                limit: 1000
            };

            // Build NGSI-LD query filters
            const qParts: string[] = [];
            if (filters.reportType) qParts.push(`category=="${filters.reportType}"`);
            if (filters.aiVerified !== undefined) qParts.push(`aiVerified==${filters.aiVerified}`);
            if (filters.minConfidence !== undefined) qParts.push(`aiConfidence>=${filters.minConfidence}`);
            if (qParts.length > 0) params.q = qParts.join(';');

            const response = await axios.get(`${stellioUrl}/ngsi-ld/v1/entities`, { params });

            // Transform NGSI-LD entities to CitizenReport format
            return (response.data || []).map((entity: any) => ({
                id: entity.id.split(':').pop(),
                reportId: entity.id.split(':').pop(),
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
            }));
        } catch (error) {
            console.error('Failed to query citizen reports from Stellio:', error);
            return [];
        }
    }

    /**
     * Get a specific report by ID from Stellio
     * @param reportId - Report UUID
     * @returns Promise with citizen report or null
     */
    async getReportById(reportId: string): Promise<CitizenReport | null> {
        try {
            const stellioUrl = import.meta.env.VITE_STELLIO_URL || 'http://localhost:8080';
            const entityId = `urn:ngsi-ld:CitizenObservation:${reportId}`;
            const response = await axios.get(`${stellioUrl}/ngsi-ld/v1/entities/${entityId}`);

            const entity = response.data;
            return {
                id: reportId,
                reportId: reportId,
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
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get citizen report statistics from Stellio
     * @returns Promise with report statistics
     */
    async getStats(): Promise<CitizenReportStats> {
        try {
            const reports = await this.queryReports();

            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const recentReports = reports.filter(r => new Date(r.dateObserved) > last24h);
            const verifiedReports = reports.filter(r => r.aiVerified);

            const byType = reports.reduce((acc, r) => {
                acc[r.reportType] = (acc[r.reportType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const byStatus = reports.reduce((acc, r) => {
                acc[r.status] = (acc[r.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const avgConfidence = verifiedReports.length > 0
                ? verifiedReports.reduce((sum, r) => sum + r.aiConfidence, 0) / verifiedReports.length
                : 0;

            return {
                total: reports.length,
                byType: byType as Record<ReportType, number>,
                byStatus: byStatus as Record<ReportStatus, number>,
                verified: verifiedReports.length,
                unverified: reports.length - verifiedReports.length,
                avgConfidence: avgConfidence,
                last24Hours: recentReports.length
            };
        } catch (error) {
            console.error('Failed to calculate statistics:', error);
            return {
                total: 0,
                byType: { traffic_jam: 0, accident: 0, flood: 0, road_damage: 0, other: 0 },
                byStatus: { pending_verification: 0, verified: 0, rejected: 0 },
                verified: 0,
                unverified: 0,
                avgConfidence: 0,
                last24Hours: 0
            };
        }
    }

    /**
     * Upload image to cloud storage
     * In production, this should upload to S3, Azure Blob, or Cloudinary
     * For demo purposes, converts to base64 data URL
     * @param file - Image file to upload
     * @returns Promise with public URL (data URL for demo)
     */
    async uploadImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                // In production, replace with actual cloud upload:
                // const formData = new FormData();
                // formData.append('file', file);
                // const response = await axios.post('https://your-storage/upload', formData);
                // resolve(response.data.url);
                resolve(dataUrl);
            };
            reader.onerror = () => {
                reject(new Error('Failed to read image file'));
            };
            reader.readAsDataURL(file);
        });
    }
}

export const citizenReportService = new CitizenReportServiceClass();
