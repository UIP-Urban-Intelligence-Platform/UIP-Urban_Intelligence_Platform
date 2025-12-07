/**
 * Citizen Report Service - Crowdsourced Report API Client
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
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
import { CitizenReport, CitizenReportSubmission, CitizenReportFilters, CitizenReportStats } from '../types/citizenReport';

// External Citizen Ingestion API (FastAPI :8001) - for submitting new reports
const CITIZEN_API_URL = import.meta.env.VITE_CITIZEN_API_URL || 'http://localhost:8001';

// Backend API URL (Express :5000) - for querying reports (avoids CORS with Stellio)
const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
     * Query citizen reports from Backend API (which proxies to Stellio)
     * @param filters - Filter parameters
     * @returns Promise with array of citizen reports
     */
    async queryReports(filters: CitizenReportFilters = {}): Promise<CitizenReport[]> {
        try {
            // Query via backend to avoid CORS issues with Stellio
            const params: any = {};
            if (filters.reportType) params.reportType = filters.reportType;
            if (filters.aiVerified !== undefined) params.aiVerified = filters.aiVerified;
            if (filters.minConfidence !== undefined) params.minConfidence = filters.minConfidence;

            const response = await axios.get(`${BACKEND_API_URL}/api/citizen-reports`, { params });

            return response.data?.data || [];
        } catch (error) {
            console.error('Failed to query citizen reports:', error);
            return [];
        }
    }

    /**
     * Get a specific report by ID via Backend API
     * @param reportId - Report UUID
     * @returns Promise with citizen report or null
     */
    async getReportById(reportId: string): Promise<CitizenReport | null> {
        try {
            const response = await axios.get(`${BACKEND_API_URL}/api/citizen-reports/${reportId}`);

            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get citizen report statistics via Backend API
     * @returns Promise with report statistics
     */
    async getStats(): Promise<CitizenReportStats> {
        try {
            const response = await axios.get(`${BACKEND_API_URL}/api/citizen-reports/stats`);

            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }

            return {
                total: 0,
                byType: { traffic_jam: 0, accident: 0, flood: 0, road_damage: 0, other: 0 },
                byStatus: { pending_verification: 0, verified: 0, rejected: 0 },
                verified: 0,
                unverified: 0,
                avgConfidence: 0,
                last24Hours: 0
            };
        } catch (error) {
            console.error('Failed to get statistics:', error);
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
     * Compress and resize image for efficient upload
     * @param file - Original image file
     * @param maxWidth - Maximum width (default 800px)
     * @param quality - JPEG quality (0-1, default 0.7)
     * @returns Promise with compressed blob
     */
    private async compressImage(file: File, maxWidth: number = 800, quality: number = 0.7): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Upload image to cloud storage
     * In production, this should upload to S3, Azure Blob, or Cloudinary
     * For demo purposes, converts to base64 data URL with compression
     * @param file - Image file to upload
     * @returns Promise with public URL (data URL for demo)
     */
    async uploadImage(file: File): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                // Compress image to reduce size (max 800px width, 70% quality)
                const compressedBlob = await this.compressImage(file, 800, 0.7);

                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    // In production, replace with actual cloud upload:
                    // const formData = new FormData();
                    // formData.append('file', file);
                    // const response = await axios.post('https://your-storage/upload', formData);
                    // resolve(response.data.url);
                    console.log(`Image compressed: ${file.size} -> ${compressedBlob.size} bytes`);
                    resolve(dataUrl);
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read image file'));
                };
                reader.readAsDataURL(compressedBlob);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export const citizenReportService = new CitizenReportServiceClass();
