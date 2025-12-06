/**
 * Centralized Logger - Winston Production Logging
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/utils/logger
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Centralized logging utility using Winston for production-ready logging.
 * Provides structured JSON logging with timestamps, error stack traces,
 * and multiple output transports (console, file).
 * 
 * Features:
 * - Environment-based log levels (debug in dev, info in production)
 * - Separate error log file (logs/error.log)
 * - Combined log file (logs/combined.log)
 * - Colorized console output for development
 * - Structured JSON format for log aggregation
 * - Default service metadata for log identification
 * 
 * @dependencies
 * - winston@^3.11: Logging framework
 * 
 * @example
 * ```typescript
 * import { logger } from './logger';
 * 
 * logger.info('Server started', { port: 5001 });
 * logger.error('Database connection failed', { error: err.message });
 * logger.debug('Processing request', { entityId: 'Camera:001' });
 * ```
 */

import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'hcmc-traffic-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
