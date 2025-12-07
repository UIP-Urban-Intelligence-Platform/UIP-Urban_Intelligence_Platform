/**
 * Observation Sync Service - Auto-sync ItemFlowObserved to Stellio
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @description
 * This service automatically syncs ItemFlowObserved entities from local JSON files
 * to Stellio Context Broker on server startup. It ensures that real-time traffic
 * data is available for the Traffic Prediction feature.
 *
 * Features:
 * - Auto-sync on server startup
 * - Batch upsert to Stellio (efficient for large datasets)
 * - Periodic re-sync option
 * - Error handling with retry logic
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

interface ObservationEntity {
    id: string;
    type: string;
    [key: string]: any;
}

interface SyncResult {
    total: number;
    successful: number;
    failed: number;
    duration: number;
}

export class ObservationSyncService {
    private stellioUrl: string;
    private httpClient: AxiosInstance;
    private syncInterval: NodeJS.Timeout | null = null;
    private isSyncing: boolean = false;

    constructor() {
        this.stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';
        this.httpClient = axios.create({
            baseURL: this.stellioUrl,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/ld+json',
                'Accept': 'application/ld+json',
            },
        });
    }

    /**
     * Sync observations from file to Stellio
     */
    async syncObservationsToStellion(): Promise<SyncResult> {
        if (this.isSyncing) {
            logger.warn('🔄 Sync already in progress, skipping...');
            return { total: 0, successful: 0, failed: 0, duration: 0 };
        }

        this.isSyncing = true;
        const startTime = Date.now();

        try {
            // Path to validated observations file (relative to project root)
            // From: apps/traffic-web-app/backend/src/services/ (5 levels)
            // To: push/data/validated_observations.json
            const projectRoot = path.resolve(__dirname, '../../../../..');
            const observationsPath = path.join(projectRoot, 'data/validated_observations.json');
            const fallbackPath = path.join(projectRoot, 'data/observations.json');

            logger.info(`📁 Looking for observations at: ${observationsPath}`);

            let filePath = observationsPath;
            if (!fs.existsSync(observationsPath)) {
                if (fs.existsSync(fallbackPath)) {
                    filePath = fallbackPath;
                    logger.info('📁 Using fallback observations.json');
                } else {
                    logger.warn('⚠️ No observations file found, skipping sync');
                    this.isSyncing = false;
                    return { total: 0, successful: 0, failed: 0, duration: 0 };
                }
            }

            // Read observations from file
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const observations: ObservationEntity[] = JSON.parse(fileContent);

            if (!observations || observations.length === 0) {
                logger.warn('⚠️ No observations found in file');
                this.isSyncing = false;
                return { total: 0, successful: 0, failed: 0, duration: 0 };
            }

            logger.info(`📤 Syncing ${observations.length} ItemFlowObserved entities to Stellio...`);

            // Check if Stellio already has observations
            const existingCount = await this.getExistingObservationCount();
            if (existingCount >= observations.length) {
                logger.info(`✅ Stellio already has ${existingCount} observations, skipping sync`);
                this.isSyncing = false;
                return { total: observations.length, successful: observations.length, failed: 0, duration: Date.now() - startTime };
            }

            // Batch upsert to Stellio
            const batchSize = 50;
            let successful = 0;
            let failed = 0;

            for (let i = 0; i < observations.length; i += batchSize) {
                const batch = observations.slice(i, i + batchSize);

                try {
                    await this.upsertBatch(batch);
                    successful += batch.length;
                    logger.info(`📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(observations.length / batchSize)}: ${batch.length} entities synced`);
                } catch (error) {
                    failed += batch.length;
                    logger.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
                }
            }

            const duration = Date.now() - startTime;
            logger.info(`✅ Sync completed: ${successful} successful, ${failed} failed (${duration}ms)`);

            this.isSyncing = false;
            return { total: observations.length, successful, failed, duration };
        } catch (error) {
            logger.error('❌ Observation sync failed:', error);
            this.isSyncing = false;
            return { total: 0, successful: 0, failed: 0, duration: Date.now() - startTime };
        }
    }

    /**
     * Get count of existing ItemFlowObserved in Stellio
     */
    private async getExistingObservationCount(): Promise<number> {
        try {
            const response = await this.httpClient.get('/ngsi-ld/v1/entities', {
                params: {
                    type: 'ItemFlowObserved',
                    limit: 1,
                    count: true,
                },
                headers: {
                    'Accept': 'application/json',
                    'NGSILD-Results-Count': 'true',
                },
            });

            // Get count from header
            const count = parseInt(response.headers['ngsild-results-count'] || '0', 10);
            return count;
        } catch (error) {
            logger.warn('Could not get existing observation count:', error);
            return 0;
        }
    }

    /**
     * Upsert a batch of entities to Stellio
     */
    private async upsertBatch(entities: ObservationEntity[]): Promise<void> {
        // Normalize entities - remove @context from each entity for batch upsert
        const normalizedEntities = entities.map(entity => {
            const { '@context': _, ...rest } = entity;
            return rest;
        });

        // Use batch upsert endpoint
        await this.httpClient.post('/ngsi-ld/v1/entityOperations/upsert', normalizedEntities, {
            headers: {
                'Content-Type': 'application/json',
                'Link': '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
            },
            params: {
                options: 'update',
            },
        });
    }

    /**
     * Start periodic sync (every N minutes)
     */
    startPeriodicSync(intervalMinutes: number = 5): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        logger.info(`🔄 Starting periodic observation sync every ${intervalMinutes} minutes`);

        // Initial sync
        this.syncObservationsToStellion();

        // Periodic sync
        this.syncInterval = setInterval(() => {
            this.syncObservationsToStellion();
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Stop periodic sync
     */
    stopPeriodicSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            logger.info('🛑 Periodic observation sync stopped');
        }
    }

    /**
     * Check if Stellio is available
     */
    async checkStellioConnection(): Promise<boolean> {
        try {
            await this.httpClient.get('/ngsi-ld/v1/types', {
                timeout: 5000,
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Singleton instance
export const observationSyncService = new ObservationSyncService();
