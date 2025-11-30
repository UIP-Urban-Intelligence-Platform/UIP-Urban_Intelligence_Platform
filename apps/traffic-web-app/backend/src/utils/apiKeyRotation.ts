/**
 * @module apps/traffic-web-app/backend/src/utils/apiKeyRotation
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * API Key Rotation Manager for resilient external API integrations.
 * Manages multiple API keys with automatic rotation and fallback strategies
 * when keys encounter errors (rate limits, quota exceeded, invalid keys).
 * 
 * Core Features:
 * - Round-robin key rotation for load distribution
 * - Automatic failure detection and blacklisting
 * - Temporary blacklist with auto-recovery after cooldown
 * - Per-key failure tracking and metrics
 * - Configurable failure thresholds and blacklist duration
 * - Thread-safe key management
 * 
 * Supported Use Cases:
 * - Google Gemini AI API (vision and language models)
 * - External traffic APIs (Mapbox, TomTom, Google Maps)
 * - Event APIs (Ticketmaster, Eventbrite)
 * - Weather/AQI APIs with rate limits
 * 
 * @dependencies
 * - None (pure TypeScript with logger)
 * 
 * @example
 * ```typescript
 * import { ApiKeyRotationManager } from './apiKeyRotation';
 * 
 * const manager = new ApiKeyRotationManager([
 *   'key1_google_gemini',
 *   'key2_google_gemini',
 *   'key3_google_gemini'
 * ], { maxFailures: 3, blacklistDuration: 300000 });
 * 
 * const key = manager.getNextKey();
 * try {
 *   await callExternalAPI(key);
 *   manager.reportSuccess(key);
 * } catch (error) {
 *   manager.reportFailure(key, error.message);
 * }
 * ```
 */

import { logger } from './logger';

/**
 * API Key Rotation Manager
 * 
 * Manages multiple API keys with automatic rotation and fallback
 * when a key encounters errors (rate limit, quota exceeded, invalid key, etc.)
 */

interface KeyStatus {
    key: string;
    lastUsed: number;
    failureCount: number;
    lastError?: string;
    isBlacklisted: boolean;
    blacklistedUntil?: number;
}

interface RotationConfig {
    maxFailures: number;           // Max failures before blacklisting (default: 3)
    blacklistDurationMs: number;   // How long to blacklist a key (default: 5 minutes)
    rotationStrategy: 'round-robin' | 'random' | 'least-used';
}

export class APIKeyRotationManager {
    private keys: KeyStatus[] = [];
    private currentIndex: number = 0;
    private config: RotationConfig;
    private provider: string;

    constructor(
        keysString: string,
        provider: string,
        config?: Partial<RotationConfig>
    ) {
        this.provider = provider;
        this.config = {
            maxFailures: config?.maxFailures || 3,
            blacklistDurationMs: config?.blacklistDurationMs || 5 * 60 * 1000, // 5 minutes
            rotationStrategy: config?.rotationStrategy || 'round-robin'
        };

        // Parse comma-separated keys
        const keyArray = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);

        if (keyArray.length === 0) {
            throw new Error(`No valid API keys found for ${provider}`);
        }

        this.keys = keyArray.map(key => ({
            key,
            lastUsed: 0,
            failureCount: 0,
            isBlacklisted: false
        }));

        logger.info(`Initialized ${provider} with ${this.keys.length} API key(s) - Rotation: ${this.config.rotationStrategy}`);
    }

    /**
     * Get the next available API key
     */
    getNextKey(): string {
        // Clean up expired blacklists
        this.cleanupBlacklist();

        // Get available keys
        const availableKeys = this.keys.filter(k => !k.isBlacklisted);

        if (availableKeys.length === 0) {
            logger.error(`All ${this.provider} API keys are blacklisted! Resetting...`);
            // Emergency reset: clear all blacklists
            this.keys.forEach(k => {
                k.isBlacklisted = false;
                k.failureCount = 0;
            });
            return this.keys[0].key;
        }

        let selectedKey: KeyStatus;

        switch (this.config.rotationStrategy) {
            case 'random':
                selectedKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
                break;

            case 'least-used':
                selectedKey = availableKeys.reduce((prev, curr) =>
                    prev.lastUsed < curr.lastUsed ? prev : curr
                );
                break;

            case 'round-robin':
            default:
                // Find next key in round-robin order
                let attempts = 0;
                while (attempts < this.keys.length) {
                    const key = this.keys[this.currentIndex];
                    this.currentIndex = (this.currentIndex + 1) % this.keys.length;

                    if (!key.isBlacklisted) {
                        selectedKey = key;
                        break;
                    }
                    attempts++;
                }

                if (!selectedKey!) {
                    selectedKey = availableKeys[0];
                }
        }

        selectedKey.lastUsed = Date.now();

        logger.debug(`${this.provider}: Using key ${this.maskKey(selectedKey.key)} (Failures: ${selectedKey.failureCount})`);

        return selectedKey.key;
    }

    /**
     * Report a successful API call
     */
    reportSuccess(key: string): void {
        const keyStatus = this.keys.find(k => k.key === key);
        if (keyStatus) {
            // Reset failure count on success
            keyStatus.failureCount = 0;
            keyStatus.lastError = undefined;
            logger.debug(`${this.provider}: Key ${this.maskKey(key)} - Success (failures reset to 0)`);
        }
    }

    /**
     * Report a failed API call
     */
    reportFailure(key: string, error: Error): void {
        const keyStatus = this.keys.find(k => k.key === key);
        if (!keyStatus) return;

        keyStatus.failureCount++;
        keyStatus.lastError = error.message;

        logger.warn(`${this.provider}: Key ${this.maskKey(key)} failed (${keyStatus.failureCount}/${this.config.maxFailures}) - ${error.message}`);

        // Blacklist key if max failures reached
        if (keyStatus.failureCount >= this.config.maxFailures) {
            keyStatus.isBlacklisted = true;
            keyStatus.blacklistedUntil = Date.now() + this.config.blacklistDurationMs;

            logger.error(
                `${this.provider}: Key ${this.maskKey(key)} BLACKLISTED for ${this.config.blacklistDurationMs / 1000}s ` +
                `(Reason: ${keyStatus.lastError})`
            );
        }
    }

    /**
     * Clean up expired blacklists
     */
    private cleanupBlacklist(): void {
        const now = Date.now();
        this.keys.forEach(key => {
            if (key.isBlacklisted && key.blacklistedUntil && now >= key.blacklistedUntil) {
                key.isBlacklisted = false;
                key.failureCount = 0;
                key.lastError = undefined;
                logger.info(`${this.provider}: Key ${this.maskKey(key.key)} restored from blacklist`);
            }
        });
    }

    /**
     * Mask API key for logging (show first 8 and last 4 characters)
     */
    private maskKey(key: string): string {
        if (key.length <= 12) return '***';
        return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    }

    /**
     * Get status of all keys
     */
    getStatus(): Array<{
        key: string;
        failureCount: number;
        isBlacklisted: boolean;
        lastError?: string;
    }> {
        return this.keys.map(k => ({
            key: this.maskKey(k.key),
            failureCount: k.failureCount,
            isBlacklisted: k.isBlacklisted,
            lastError: k.lastError
        }));
    }

    /**
     * Reset all keys (emergency recovery)
     */
    resetAll(): void {
        this.keys.forEach(k => {
            k.isBlacklisted = false;
            k.failureCount = 0;
            k.lastError = undefined;
        });
        logger.warn(`${this.provider}: All keys have been reset`);
    }

    /**
     * Get total number of keys
     */
    getTotalKeys(): number {
        return this.keys.length;
    }

    /**
     * Get number of available keys
     */
    getAvailableKeys(): number {
        this.cleanupBlacklist();
        return this.keys.filter(k => !k.isBlacklisted).length;
    }
}
