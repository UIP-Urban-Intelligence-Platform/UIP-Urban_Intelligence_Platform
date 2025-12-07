/**
 * Traffic Web Application Backend Server - Express API with WebSocket Support
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/backend/src/server
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Main Express server providing REST API and WebSocket real-time updates for traffic monitoring.
 * Integrates with Stellio Context Broker, Neo4j, Fuseki, and PostgreSQL for comprehensive data access.
 * 
 * Key Features:
 * - RESTful API with 12 endpoint groups (cameras, weather, air quality, accidents, analytics, etc.)
 * - WebSocket server for real-time entity updates with change detection
 * - CORS-enabled for frontend integration
 * - Health check endpoint for monitoring
 * - Error handling middleware with structured logging
 * - Data aggregation service for efficient queries
 * - Three AI agents: GraphInvestigator, EcoTwin, TrafficMaestro
 * 
 * @dependencies
 * - express@^4.18: Web framework
 * - ws@^8.14: WebSocket server
 * - cors@^2.8: Cross-origin resource sharing
 * - dotenv@^16.0: Environment configuration
 * 
 * @example
 * npm install
 * npm run dev  // Development mode with nodemon
 * npm start    // Production mode
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { configLoader } from './config/configLoader';
import cameraRoutes from './routes/cameraRoutes';
import weatherRoutes from './routes/weatherRoutes';
import airQualityRoutes from './routes/airQualityRoutes';
import accidentRoutes from './routes/accidentRoutes';
import patternRoutes from './routes/patternRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import historicalRoutes from './routes/historicalRoutes';
import correlationRoutes from './routes/correlationRoutes';
import routingRoutes from './routes/routing';
import geocodingRoutes from './routes/geocoding';
import agentRoutes from './routes/agentRoutes';
import multiAgentRoutes from './routes/multiAgentRoutes';
import citizenRoutes from './routes/citizenRoutes';
import { WebSocketService } from './services/websocketService';
import { DataAggregator } from './services/dataAggregator';
import { checkAllConnections } from './utils/healthCheck';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000; // Express API port (default: 5000)

// Load and validate YAML configuration on startup
try {
  logger.info('Loading YAML configuration...');
  const config = configLoader.load();
  const entityCount = Object.keys(config.entities).length;
  const analyticsCount = Object.keys(config.analytics || {}).length;
  logger.info(`Configuration loaded successfully: version=${config.version}, entities=${entityCount}, analytics=${analyticsCount}`);
} catch (error) {
  logger.error('Failed to load YAML configuration:', error);
  logger.error('Server cannot start without valid configuration. Please fix config/entities.yaml');
  process.exit(1);
}

// CORS configuration - support multiple origins for dev/prod
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map(o => o.trim());

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check with connection status
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const connectionStatus = await checkAllConnections();
    const allHealthy = Object.values(connectionStatus).every(status => status.healthy);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      connections: connectionStatus
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api/cameras', cameraRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/accidents', accidentRoutes);
app.use('/api/patterns', patternRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/historical', historicalRoutes);
app.use('/api/correlations', correlationRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agents', multiAgentRoutes);
app.use('/api/citizen-reports', citizenRoutes);

// Error handling
app.use(errorHandler);

// HTTP Server
const httpServer = createServer(app);

// WebSocket Server - mount on HTTP server (same port)
const wss = new WebSocketServer({ server: httpServer });
const wsService = new WebSocketService(wss);

// Data Aggregator
const dataAggregator = new DataAggregator(wsService);

// Initialize server with connection checks
async function startServer() {
  try {
    logger.info('Starting HCMC Traffic Monitoring Server...');

    // Check all data source connections
    logger.info('Checking data source connections...');
    const connectionStatus = await checkAllConnections();

    // Log connection status
    Object.entries(connectionStatus).forEach(([source, status]) => {
      if (status.healthy) {
        logger.info(`✓ ${source}: Connected`, status.details);
      } else {
        logger.warn(`✗ ${source}: Connection failed`, { error: status.error });
      }
    });

    // Start HTTP server (Express API + WebSocket on same port)
    httpServer.listen(PORT, () => {
      logger.info(`✓ HTTP Server running on port ${PORT}`);
      logger.info(`✓ WebSocket Server running on port ${PORT} (mounted on HTTP server)`);
      logger.info(`✓ CORS enabled for: ${allowedOrigins.join(', ')}`);

      // Start data aggregation
      dataAggregator.start();
      logger.info('✓ Data aggregation service started');

      logger.info('='.repeat(50));
      logger.info('Server initialization complete!');
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  dataAggregator.stop();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    wss.close(() => {
      logger.info('WebSocket server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  dataAggregator.stop();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    wss.close(() => {
      logger.info('WebSocket server closed');
      process.exit(0);
    });
  });
});

export default app;
