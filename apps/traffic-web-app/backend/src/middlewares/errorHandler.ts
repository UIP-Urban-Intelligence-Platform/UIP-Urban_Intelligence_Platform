/**
 * Error Handler Middleware - Global Error Management
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/middlewares/errorHandler
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Global Express error handling middleware for standardized error responses.
 * Provides custom AppError class and centralized error handling with logging.
 * 
 * Features:
 * - Custom AppError class with statusCode and operational flag
 * - Distinction between operational and programming errors
 * - Structured error logging with stack traces
 * - Client-friendly error responses (no sensitive data leakage)
 * - Environment-aware error details (stack traces in dev only)
 * - HTTP status code mapping
 * 
 * Error Types:
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Resource not found
 * - 500 Internal Server Error: Unexpected server errors
 * 
 * @dependencies
 * - express@^4.18: HTTP framework
 * 
 * @example
 * ```typescript
 * import { AppError, errorHandler } from './errorHandler';
 * 
 * // In route handler
 * if (!entity) {
 *   throw new AppError('Entity not found', 404);
 * }
 * 
 * // In Express app
 * app.use(errorHandler);
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error('Operational error:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack
    });

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  logger.error('Unexpected error:', {
    message: err.message,
    stack: err.stack
  });

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};
