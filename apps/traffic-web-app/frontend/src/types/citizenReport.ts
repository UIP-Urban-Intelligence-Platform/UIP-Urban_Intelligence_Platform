/**
 * Citizen Report Types - Crowdsourced Data Interfaces
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/frontend/src/types/citizenReport
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * TypeScript type definitions and interfaces for citizen science crowdsourced reports.
 * Defines data structures for report submissions, filtering, statistics, and status
 * management. Used across CitizenReportService and UI components.
 * 
 * Core types:
 * - ReportType: 5 categories (traffic_jam, accident, flood, road_damage, other)
 * - ReportStatus: 3 states (pending_verification, verified, rejected)
 * - CitizenReport: Full report with metadata, location, weather context
 * - CitizenReportSubmission: Data transfer object for new submissions
 * - CitizenReportFilters: Query parameters for filtering reports
 * - CitizenReportStats: Aggregated statistics by type and status
 * 
 * @dependencies
 * - typescript@5.1.6 - Type system
 * 
 * @example
 * ```typescript
 * const submission: CitizenReportSubmission = {
 *   type: 'accident',
 *   description: 'Minor collision',
 *   location: { latitude: 10.762622, longitude: 106.660172 },
 *   photo: imageFile
 * };
 * ```
 */

export type ReportType = 'traffic_jam' | 'accident' | 'flood' | 'road_damage' | 'other';
export type ReportStatus = 'pending_verification' | 'verified' | 'rejected';

export interface WeatherContext {
    temperature: number;
    condition: string;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection?: string;
}

export interface AirQualityContext {
    aqi: number;
    pm25: number;
    pm10: number;
    no2?: number;
    o3?: number;
    dominantPollutant: string;
}

export interface CitizenReportSubmission {
    userId: string;
    reportType: ReportType;
    description?: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    timestamp?: string;
}

export interface CitizenReport {
    id: string;
    reportId: string;
    userId: string;
    reportType: ReportType;
    description?: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    status: ReportStatus;
    aiVerified: boolean;
    aiConfidence: number;
    weatherContext?: WeatherContext;
    airQualityContext?: AirQualityContext;
    dateObserved: string;
    createdAt: string;
}

export interface CitizenReportStats {
    total: number;
    byType: Record<ReportType, number>;
    byStatus: Record<ReportStatus, number>;
    verified: number;
    unverified: number;
    avgConfidence: number;
    last24Hours: number;
}

export interface CitizenReportFilters {
    reportType?: ReportType;
    status?: ReportStatus;
    aiVerified?: boolean;
    minConfidence?: number;
    hours?: number;
    userId?: string;
}
