/**
 * Accident Sync Service - Auto-sync Accident entities to Stellio
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @description
 * This service automatically syncs Accident entities from local JSON files
 * to Stellio Context Broker. It ensures that detected accidents from the
 * CV pipeline are visible in the dashboard.
 *
 * Features:
 * - Auto-sync detected accidents to Stellio
 * - Batch upsert with deduplication
 * - Periodic re-sync for real-time updates
 * - Error handling with retry logic
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

interface AccidentEntity {
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

export class AccidentSyncService {
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
     * Sync accidents from file to Stellio
     */
    async syncAccidentsToStellion(): Promise<SyncResult> {
        if (this.isSyncing) {
            logger.warn('🔄 Accident sync already in progress, skipping...');
            return { total: 0, successful: 0, failed: 0, duration: 0 };
        }

        this.isSyncing = true;
        const startTime = Date.now();

        try {
            // Path to accidents file (relative to project root)
            // From: apps/traffic-web-app/backend/src/services/ (5 levels up to push folder)
            const projectRoot = path.resolve(__dirname, '../../../../..');
            const accidentsPath = path.join(projectRoot, 'data/accidents.json');
            const validatedPath = path.join(projectRoot, 'data/validated_accidents.json');

            logger.info(`📁 Looking for accidents at: ${accidentsPath}`);

            let filePath = accidentsPath;
            if (!fs.existsSync(accidentsPath)) {
                if (fs.existsSync(validatedPath)) {
                    filePath = validatedPath;
                    logger.info('📁 Using validated_accidents.json');
                } else {
                    logger.warn('⚠️ No accidents file found, skipping sync');
                    this.isSyncing = false;
                    return { total: 0, successful: 0, failed: 0, duration: 0 };
                }
            }

            // Read accidents from file
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const accidents: AccidentEntity[] = JSON.parse(fileContent);

            if (!accidents || accidents.length === 0) {
                logger.info('ℹ️ No accidents found in file (empty array)');
                this.isSyncing = false;
                return { total: 0, successful: 0, failed: 0, duration: 0 };
            }

            logger.info(`🚨 Syncing ${accidents.length} Accident entities to Stellio...`);

            // Batch upsert to Stellio
            const batchSize = 20;
            let successful = 0;
            let failed = 0;

            for (let i = 0; i < accidents.length; i += batchSize) {
                const batch = accidents.slice(i, i + batchSize);

                try {
                    await this.upsertBatch(batch);
                    successful += batch.length;
                    logger.info(`📦 Accident batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(accidents.length / batchSize)}: ${batch.length} entities synced`);
                } catch (error) {
                    failed += batch.length;
                    logger.error(`❌ Accident batch ${Math.floor(i / batchSize) + 1} failed:`, error);
                }
            }

            const duration = Date.now() - startTime;
            logger.info(`✅ Accident sync completed: ${successful} successful, ${failed} failed (${duration}ms)`);

            this.isSyncing = false;
            return { total: accidents.length, successful, failed, duration };
        } catch (error) {
            logger.error('❌ Accident sync failed:', error);
            this.isSyncing = false;
            return { total: 0, successful: 0, failed: 0, duration: Date.now() - startTime };
        }
    }

    /**
     * Get count of existing Accident entities in Stellio
     */
    async getExistingAccidentCount(): Promise<number> {
        try {
            const response = await this.httpClient.get('/ngsi-ld/v1/entities', {
                params: {
                    type: 'Accident',
                    limit: 1,
                    count: true,
                },
            });

            // Try to get count from header
            const countHeader = response.headers['ngsild-results-count'];
            if (countHeader) {
                return parseInt(countHeader, 10);
            }

            // Fallback: count entities in response
            return Array.isArray(response.data) ? response.data.length : 0;
        } catch (error) {
            logger.warn('Could not get existing accident count:', error);
            return 0;
        }
    }

    /**
     * Upsert batch of entities to Stellio
     */
    private async upsertBatch(entities: AccidentEntity[]): Promise<void> {
        // Use batch upsert endpoint
        try {
            await this.httpClient.post('/ngsi-ld/v1/entityOperations/upsert', entities, {
                params: { options: 'update' },
            });
        } catch (error: any) {
            // If batch fails, try individual upserts
            if (error.response?.status === 400 || error.response?.status === 207) {
                logger.warn('Batch upsert returned partial error, trying individual upserts...');
                for (const entity of entities) {
                    await this.upsertSingleEntity(entity);
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * Upsert single entity (create or update)
     */
    private async upsertSingleEntity(entity: AccidentEntity): Promise<boolean> {
        try {
            // Try to create first
            await this.httpClient.post('/ngsi-ld/v1/entities', entity);
            return true;
        } catch (error: any) {
            if (error.response?.status === 409) {
                // Entity exists, try to update
                try {
                    const entityId = encodeURIComponent(entity.id);
                    // Remove @context and id for PATCH - use type assertion
                    const updatePayload: Record<string, any> = { ...entity };
                    delete updatePayload['@context'];
                    delete updatePayload['id'];
                    delete updatePayload['type'];

                    await this.httpClient.patch(`/ngsi-ld/v1/entities/${entityId}/attrs`, updatePayload);
                    return true;
                } catch (patchError) {
                    logger.debug(`Could not update entity ${entity.id}`);
                    return false;
                }
            }
            logger.debug(`Could not create entity ${entity.id}: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if Stellio is available
     */
    async checkStellioConnection(): Promise<boolean> {
        try {
            await this.httpClient.get('/ngsi-ld/v1/entities?type=Accident&limit=1');
            return true;
        } catch (error) {
            logger.warn('Stellio not available for accident sync');
            return false;
        }
    }

    /**
     * Start periodic sync
     */
    startPeriodicSync(intervalMinutes: number = 2): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Initial sync
        this.syncAccidentsToStellion().catch((err) => {
            logger.error('Initial accident sync failed:', err);
        });

        // Periodic sync
        this.syncInterval = setInterval(() => {
            this.syncAccidentsToStellion().catch((err) => {
                logger.error('Periodic accident sync failed:', err);
            });
        }, intervalMinutes * 60 * 1000);

        logger.info(`🔄 Accident periodic sync started (every ${intervalMinutes} minutes)`);
    }

    /**
     * Stop periodic sync
     */
    stopPeriodicSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            logger.info('🛑 Accident periodic sync stopped');
        }
    }
}

// Singleton instance
let accidentSyncServiceInstance: AccidentSyncService | null = null;

export function getAccidentSyncService(): AccidentSyncService {
    if (!accidentSyncServiceInstance) {
        accidentSyncServiceInstance = new AccidentSyncService();
    }
    return accidentSyncServiceInstance;
}

export default AccidentSyncService;
