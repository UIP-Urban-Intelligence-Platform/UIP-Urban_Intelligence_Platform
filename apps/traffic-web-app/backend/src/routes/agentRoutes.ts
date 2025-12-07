/**
 * AI Agent Routes - Intelligent Agent Interaction Endpoints
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/routes/agentRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for interacting with AI agents: EcoTwin health advisor,
 * GraphInvestigator incident analyzer, and TrafficMaestro predictive orchestrator.
 * 
 * Endpoints:
 * - POST /api/agents/eco-twin/advice: Get personalized health advice
 * - POST /api/agents/eco-twin/forecast: Generate environmental forecasts
 * - POST /api/agents/graph-investigator/analyze: Analyze traffic incidents
 * - POST /api/agents/traffic-maestro/predict: Predict event impacts
 * 
 * Agent Capabilities:
 * - EcoTwin: Environmental health advisor with AQI dispersion
 * - GraphInvestigator: Multimodal incident analysis (GraphRAG + CV + Search)
 * - TrafficMaestro: Predictive congestion orchestrator
 */

import { Router, Request, Response } from 'express';
import { EcoTwinAgent } from '../agents/EcoTwinAgent';
import { logger } from '../utils/logger';

const router = Router();

// Initialize EcoTwinAgent (singleton pattern)
let ecoTwinAgent: EcoTwinAgent | null = null;

const getEcoTwinAgent = (): EcoTwinAgent => {
    if (!ecoTwinAgent) {
        try {
            ecoTwinAgent = new EcoTwinAgent();
            logger.info('EcoTwinAgent initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize EcoTwinAgent:', error);
            throw error;
        }
    }
    return ecoTwinAgent;
};

// =====================================================
// INTERFACES
// =====================================================

interface ChatRequest {
    message: string;
    location: {
        lat: number;
        lng: number;
    };
    userProfile?: {
        id?: string;
        age?: number;
        healthConditions?: string[];
        activityType?: string;
        transportMode?: string;
        language?: string;
        sensitivityLevel?: string;
    };
}

interface DispersionRequest {
    location: {
        lat: number;
        lng: number;
    };
}

interface ForecastRequest {
    location: {
        lat: number;
        lng: number;
    };
    userProfile?: {
        id?: string;
        age?: number;
        healthConditions?: string[];
        activityType?: string;
        transportMode?: string;
        language?: string;
        sensitivityLevel?: string;
    };
    publish?: boolean;
}

// =====================================================
// ROUTE: POST /api/agents/eco-twin/chat
// =====================================================

/**
 * Chat endpoint for Health Advisor
 * 
 * Generates personalized environmental health advice based on:
 * - Current air quality at location
 * - Weather forecast
 * - User health profile
 * - Transport mode
 * 
 * Request Body:
 * {
 *   message: string,
 *   location: { lat: number, lng: number },
 *   userProfile?: {
 *     id?: string,
 *     age?: number,
 *     healthConditions?: string[],
 *     activityType?: string,
 *     transportMode?: string,
 *     language?: string,
 *     sensitivityLevel?: string
 *   }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     message: string (AI-generated advice),
 *     aqi: number,
 *     aqiCategory: string,
 *     predictedAQI: number,
 *     riskLevel: string,
 *     recommendations: string[],
 *     predictions: AQIPrediction[],
 *     confidence: number,
 *     timestamp: string
 *   }
 * }
 */
router.post('/eco-twin/chat', async (req: Request, res: Response) => {
    try {
        const { message, location, userProfile } = req.body as ChatRequest;

        // Validation
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Invalid location. Required: { lat: number, lng: number }'
            });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid message. Required: non-empty string'
            });
        }

        logger.info(`💬 Chat request at location [${location.lat}, ${location.lng}]: "${message}"`);

        const agent = getEcoTwinAgent();

        // Step 1: Simulate air quality dispersion
        const simulation = await agent.simulateDispersion({
            lat: location.lat,
            lng: location.lng
        });

        // Step 2: Generate personalized advice
        const currentAQI = simulation.currentAQI;
        const predictedAQI = simulation.predictions.length > 0
            ? simulation.predictions[0].predictedAQI
            : currentAQI;

        const advice = await agent.generatePersonalizedAdvice(
            predictedAQI,
            currentAQI,
            { lat: location.lat, lng: location.lng },
            userProfile || {
                language: 'vi',
                sensitivityLevel: 'medium',
                transportMode: 'motorbike'
            }
        );

        // Build response
        const responseData = {
            message: advice.advice,
            aqi: currentAQI,
            aqiCategory: simulation.predictions.length > 0
                ? simulation.predictions[0].aqiCategory
                : 'Unknown',
            predictedAQI: predictedAQI,
            riskLevel: advice.riskLevel,
            recommendations: advice.recommendations,
            predictions: simulation.predictions.slice(0, 8), // Next 2 hours (15min intervals)
            bestWindow: simulation.bestWindow,
            peakPollution: simulation.peakPollution,
            confidence: advice.confidence,
            timestamp: advice.timestamp
        };

        logger.info(`✅ Chat response generated: AQI ${currentAQI} → ${predictedAQI}, risk: ${advice.riskLevel}`);

        return res.json({
            success: true,
            data: responseData
        });

    } catch (error: any) {
        logger.error('Error in /eco-twin/chat:', error);

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate advice',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// =====================================================
// ROUTE: POST /api/agents/eco-twin/dispersion
// =====================================================

/**
 * Get air quality dispersion simulation
 * 
 * Predicts how pollutants will disperse over next few hours based on:
 * - Current air quality
 * - Weather forecast (wind, rain)
 * - Dispersion model
 * 
 * Request Body:
 * {
 *   location: { lat: number, lng: number }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     location: { lat: number, lng: number },
 *     currentAQI: number,
 *     predictions: AQIPrediction[],
 *     peakPollution: { timestamp: string, aqi: number },
 *     bestWindow: { startTime: string, endTime: string, avgAQI: number }
 *   }
 * }
 */
router.post('/eco-twin/dispersion', async (req: Request, res: Response) => {
    try {
        const { location } = req.body as DispersionRequest;

        // Validation
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Invalid location. Required: { lat: number, lng: number }'
            });
        }

        logger.info(`🌫️ Dispersion simulation request at [${location.lat}, ${location.lng}]`);

        const agent = getEcoTwinAgent();
        const simulation = await agent.simulateDispersion({
            lat: location.lat,
            lng: location.lng
        });

        logger.info(`✅ Dispersion simulation completed: ${simulation.predictions.length} predictions`);

        return res.json({
            success: true,
            data: simulation
        });

    } catch (error: any) {
        logger.error('Error in /eco-twin/dispersion:', error);

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to simulate dispersion',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// =====================================================
// ROUTE: POST /api/agents/eco-twin/forecast
// =====================================================

/**
 * Generate and optionally publish environmental forecast
 * 
 * Combines dispersion simulation + personalized advice, then
 * optionally publishes to Stellio for real-time visualization.
 * 
 * Request Body:
 * {
 *   location: { lat: number, lng: number },
 *   userProfile?: UserProfile,
 *   publish?: boolean (default: false)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     forecast: {
 *       currentConditions: {...},
 *       predictions: [...],
 *       personalizedAdvice: {...}
 *     },
 *     published: boolean,
 *     stellioEntityId?: string
 *   }
 * }
 */
router.post('/eco-twin/forecast', async (req: Request, res: Response) => {
    try {
        const { location, userProfile, publish = false } = req.body as ForecastRequest;

        // Validation
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Invalid location. Required: { lat: number, lng: number }'
            });
        }

        logger.info(`📡 Forecast request at [${location.lat}, ${location.lng}], publish=${publish}`);

        const agent = getEcoTwinAgent();

        // Step 1: Simulate dispersion
        const simulation = await agent.simulateDispersion({
            lat: location.lat,
            lng: location.lng
        });

        // Step 2: Generate personalized advice
        const currentAQI = simulation.currentAQI;
        const predictedAQI = simulation.predictions.length > 0
            ? simulation.predictions[0].predictedAQI
            : currentAQI;

        const advice = await agent.generatePersonalizedAdvice(
            predictedAQI,
            currentAQI,
            { lat: location.lat, lng: location.lng },
            userProfile || {
                language: 'vi',
                sensitivityLevel: 'medium',
                transportMode: 'motorbike'
            }
        );

        // Build forecast object
        const forecastData = {
            currentConditions: {
                aqi: currentAQI,
                location: location,
                timestamp: new Date().toISOString()
            },
            predictions: simulation.predictions,
            bestWindow: simulation.bestWindow,
            peakPollution: simulation.peakPollution,
            personalizedAdvice: advice
        };

        // Step 3: Optionally publish to Stellio
        let publishedEntityId: string | undefined;
        if (publish) {
            try {
                await agent.publishPrediction(simulation, advice);
                publishedEntityId = `urn:ngsi-ld:EnvironmentalForecast:${Date.now()}`;
                logger.info(`✅ Forecast published to Stellio: ${publishedEntityId}`);
            } catch (publishError: any) {
                logger.warn('Failed to publish to Stellio:', publishError.message);
                // Continue with response even if publish fails
            }
        }

        logger.info(`✅ Forecast generated successfully`);

        return res.json({
            success: true,
            data: {
                forecast: forecastData,
                published: publish && !!publishedEntityId,
                stellioEntityId: publishedEntityId
            }
        });

    } catch (error: any) {
        logger.error('Error in /eco-twin/forecast:', error);

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate forecast',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// =====================================================
// ROUTE: GET /api/agents/eco-twin/health
// =====================================================

/**
 * Health check endpoint for EcoTwinAgent
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     status: 'healthy',
 *     timestamp: string,
 *     dependencies: {
 *       stellio: boolean,
 *       weatherApi: boolean,
 *       geminiApi: boolean
 *     }
 *   }
 * }
 */
router.get('/eco-twin/health', async (_req: Request, res: Response) => {
    try {
        const agent = getEcoTwinAgent();

        // Check dependencies (basic check - could be enhanced)
        const dependencies = {
            stellio: !!process.env.STELLIO_URL,
            weatherApi: !!process.env.OPENWEATHER_API_KEY || !!process.env.OPENWEATHERMAP_API_KEY,
            geminiApi: !!process.env.GEMINI_API_KEY
        };

        const allHealthy = Object.values(dependencies).every(v => v === true);

        res.json({
            success: true,
            data: {
                status: allHealthy ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                dependencies,
                message: allHealthy
                    ? 'EcoTwinAgent is ready'
                    : 'Some dependencies are missing. Check environment variables.'
            }
        });

    } catch (error: any) {
        logger.error('Error in /eco-twin/health:', error);

        res.status(503).json({
            success: false,
            error: 'EcoTwinAgent is not available',
            details: error.message
        });
    }
});

export default router;
