/**
 * Multi-Agent Routes - Coordinated AI Agent System API
 * 
 * @module apps/traffic-web-app/backend/src/routes/multiAgentRoutes
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for coordinated multi-agent interactions combining GraphInvestigator
 * and TrafficMaestro for comprehensive incident analysis and predictive orchestration.
 * 
 * Endpoints:
 * - POST /api/multi-agent/full-analysis: Combined GraphRAG + Prediction analysis
 * - POST /api/multi-agent/investigator: GraphInvestigator incident analysis
 * - POST /api/multi-agent/maestro: TrafficMaestro event prediction
 * - POST /api/multi-agent/coordinated: Synchronized agent responses
 * 
 * Agent Coordination:
 * - GraphInvestigatorAgent: Multimodal incident analysis (LOD + CV + Search)
 * - TrafficMaestroAgent: Event-based congestion prediction
 * - Data sharing between agents for enhanced context
 * - Synchronized responses with correlation detection
 */

import { Router, Request, Response } from 'express';
import { GraphInvestigatorAgent } from '../agents/GraphInvestigatorAgent';
import { TrafficMaestroAgent } from '../agents/TrafficMaestroAgent';
import { logger } from '../utils/logger';

const router = Router();

// Singleton instances
let graphInvestigator: GraphInvestigatorAgent | null = null;
let trafficMaestro: TrafficMaestroAgent | null = null;

const getGraphInvestigator = (): GraphInvestigatorAgent => {
    if (!graphInvestigator) {
        graphInvestigator = new GraphInvestigatorAgent();
        logger.info('✅ GraphInvestigatorAgent initialized');
    }
    return graphInvestigator;
};

const getTrafficMaestro = (): TrafficMaestroAgent => {
    if (!trafficMaestro) {
        trafficMaestro = new TrafficMaestroAgent();
        logger.info('✅ TrafficMaestroAgent initialized');
    }
    return trafficMaestro;
};

// =====================================================
// GRAPH INVESTIGATOR ROUTES
// =====================================================

/**
 * POST /api/agents/graph-investigator/investigate
 * 
 * Investigate an incident using multimodal analysis:
 * - Internal context (Stellio + Neo4j)
 * - Visual analysis (Gemini Vision)
 * - External intelligence (Tavily Search)
 * 
 * Request Body:
 * {
 *   accidentId: string  // URN of RoadAccident entity
 * }
 */
router.post('/graph-investigator/investigate', async (req: Request, res: Response) => {
    try {
        const { accidentId } = req.body;

        if (!accidentId || typeof accidentId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid accidentId. Required: string (URN format)'
            });
        }

        logger.info(`🔍 Investigating accident: ${accidentId}`);

        const agent = getGraphInvestigator();
        const report = await agent.investigateIncident(accidentId);

        logger.info(`✅ Investigation complete: ${report.recommendation.priority} priority`);

        return res.json({
            success: true,
            data: report
        });

    } catch (error: any) {
        logger.error('Error in investigation:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to investigate incident',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * POST /api/agents/graph-investigator/analyze-camera
 * 
 * Generate AI-powered analysis for a specific camera using Gemini
 * 
 * Request Body:
 * {
 *   cameraId: string,
 *   cameraName: string,
 *   detections: Array<{ label: string, confidence: number }>,
 *   trafficLevel: string,
 *   aqi: number,
 *   weather: string
 * }
 */
router.post('/graph-investigator/analyze-camera', async (req: Request, res: Response) => {
    try {
        const { cameraId, cameraName, detections, trafficLevel, aqi, weather } = req.body;

        if (!cameraId || !cameraName) {
            return res.status(400).json({
                success: false,
                error: 'cameraId and cameraName are required'
            });
        }

        logger.info(`🎥 Analyzing camera: ${cameraId}`);

        const agent = getGraphInvestigator();

        // Use Gemini to generate analysis
        const analysis = await agent.generateCameraAnalysis({
            cameraId,
            cameraName,
            detections: detections || [],
            trafficLevel: trafficLevel || 'unknown',
            aqi: aqi || 50,
            weather: weather || 'unknown'
        });

        return res.json({
            success: true,
            data: analysis
        });

    } catch (error: any) {
        logger.error('Error analyzing camera:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to analyze camera',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * POST /api/agents/graph-investigator/analyze-camera-with-vision
 * 
 * 🆕 NEW ENDPOINT: Analyze camera with REAL AI Vision + Real LOD Cloud data
 * 
 * Uses:
 * 1. Gemini Vision API for object detection with bounding boxes
 * 2. Real Weather + AQI data from Stellio Context Broker
 * 3. Traffic level calculated from detection count
 * 
 * Request Body:
 * {
 *   cameraId: string,        // e.g., "urn:ngsi-ld:Camera:0"
 *   cameraName: string,      // e.g., "Nguyễn Văn Linh - Nguyễn Hữu Thọ"
 *   imageBase64?: string     // Optional: provide camera image, otherwise uses demo
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     detections: [{ label, confidence, box: {x, y, width, height} }],
 *     trafficLevel: string,
 *     weather: { temperature, humidity, precipitation, description },
 *     aqi: { value, category },
 *     analysis: { summary, severity, confidence, recommendations }
 *   }
 * }
 */
router.post('/graph-investigator/analyze-camera-with-vision', async (req: Request, res: Response) => {
    try {
        const { cameraId, cameraName, imageBase64 } = req.body;

        if (!cameraId || !cameraName) {
            return res.status(400).json({
                success: false,
                error: 'cameraId and cameraName are required'
            });
        }

        logger.info(`🔍 [NEW] Analyzing camera with AI Vision: ${cameraId}`);

        const agent = getGraphInvestigator();

        // STEP 1: Use Gemini Vision to detect objects with bounding boxes
        logger.debug('Step 1: Running Gemini Vision object detection...');
        const visionResult = await agent.analyzeCameraWithVision({
            cameraId,
            imageBase64
        });

        const detections = visionResult.detections;
        logger.info(`✅ Detected ${detections.length} objects via Gemini Vision`);

        // STEP 2: Fetch REAL context data (Weather + AQI) from Stellio LOD Cloud
        logger.debug('Step 2: Fetching real Weather + AQI from Stellio...');
        const contextData = await agent.fetchCameraContextData(cameraId);

        logger.info(`✅ Fetched context: Temp=${contextData.weather.temperature}°C, AQI=${contextData.aqi.value}`);

        // STEP 3: Calculate traffic level from detection count (not mock!)
        const trafficLevel = agent['calculateTrafficLevel'](detections.length);
        logger.info(`✅ Calculated traffic level: ${trafficLevel} (${detections.length} objects)`);

        // STEP 4: Generate AI analysis using Gemini
        logger.debug('Step 4: Generating Gemini analysis...');
        const analysis = await agent.generateCameraAnalysis({
            cameraId,
            cameraName,
            detections: detections.map(d => ({ label: d.label, confidence: d.confidence })),
            trafficLevel,
            aqi: contextData.aqi.value,
            weather: contextData.weather.description
        });

        logger.info(`✅ Analysis complete: Severity=${analysis.severity}, Confidence=${analysis.confidence}`);

        // Return complete data package
        return res.json({
            success: true,
            data: {
                // Real AI detections with bounding boxes
                detections,

                // Calculated traffic level
                trafficLevel,

                // Real weather data from Stellio
                weather: contextData.weather,

                // Real AQI data from Stellio
                aqi: contextData.aqi,

                // AI-generated analysis
                analysis,

                // Metadata
                imageAnalyzed: visionResult.imageAnalyzed,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        logger.error('Error analyzing camera with vision:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to analyze camera with vision',
            details: error.message || 'Unknown error'
        });
    }
});

// =====================================================
// TRAFFIC MAESTRO ROUTES
// =====================================================

/**
 * GET /api/agents/traffic-maestro/events
 * 
 * Monitor external events that could impact traffic:
 * - Ticketmaster events
 * - Google Calendar holidays
 * - Google Custom Search events
 * 
 * Returns events mapped to nearby cameras
 */
router.get('/traffic-maestro/events', async (req: Request, res: Response) => {
    try {
        logger.info('📅 Monitoring external events...');

        const agent = getTrafficMaestro();
        const eventMappings = await agent.monitorExternalEvents();

        const events = eventMappings.map(mapping => ({
            event: mapping.event,
            affectedCamerasCount: mapping.affectedCameras.length,
            nearestCamera: mapping.affectedCameras[0] || null
        }));

        logger.info(`✅ Found ${events.length} events`);

        return res.json({
            success: true,
            data: {
                events: events.map(e => e.event),
                count: events.length,
                mappings: eventMappings
            }
        });

    } catch (error: any) {
        logger.error('Error monitoring events:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to monitor events',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * POST /api/agents/traffic-maestro/predict-congestion
 * 
 * Predict congestion risk for a specific event
 * 
 * Request Body:
 * {
 *   event: {
 *     id: string,
 *     name: string,
 *     venue: {
 *       name: string,
 *       location: { lat: number, lng: number },
 *       address: string
 *     },
 *     startTime: string,
 *     endTime: string,
 *     expectedAttendees: number,
 *     category: string,
 *     source: string
 *   }
 * }
 */
router.post('/traffic-maestro/predict-congestion', async (req: Request, res: Response) => {
    try {
        const { event } = req.body;

        if (!event || !event.venue || !event.venue.location) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event data. Required: event.venue.location'
            });
        }

        logger.info(`📊 Predicting congestion for: ${event.name}`);

        const agent = getTrafficMaestro();
        const prediction = await agent.predictCongestion(event);

        logger.info(`✅ Risk score: ${prediction.score.toFixed(1)}/100 (${prediction.riskLevel})`);

        return res.json({
            success: true,
            data: prediction
        });

    } catch (error: any) {
        logger.error('Error predicting congestion:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to predict congestion',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * POST /api/agents/traffic-maestro/benchmark-route
 * 
 * Benchmark internal routing against Mapbox Traffic API
 * 
 * Request Body:
 * {
 *   origin: { lat: number, lng: number },
 *   destination: { lat: number, lng: number }
 * }
 */
router.post('/traffic-maestro/benchmark-route', async (req: Request, res: Response) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination ||
            typeof origin.lat !== 'number' || typeof origin.lng !== 'number' ||
            typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates. Required: origin and destination with lat/lng'
            });
        }

        logger.info(`🗺️ Benchmarking route: [${origin.lat}, ${origin.lng}] → [${destination.lat}, ${destination.lng}]`);

        const agent = getTrafficMaestro();
        const benchmark = await agent.benchmarkRoutes(origin, destination);

        logger.info(`✅ Optimization gap: ${benchmark.optimizationGap.toFixed(1)}%`);

        return res.json({
            success: true,
            data: benchmark
        });

    } catch (error: any) {
        logger.error('Error benchmarking route:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to benchmark route',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * POST /api/agents/traffic-maestro/action-plan
 * 
 * Generate action plan based on risk score
 * 
 * Request Body:
 * {
 *   riskScore: number,
 *   eventMapping: EventCameraMapping
 * }
 */
router.post('/traffic-maestro/action-plan', async (req: Request, res: Response) => {
    try {
        const { riskScore, eventMapping } = req.body;

        if (typeof riskScore !== 'number' || !eventMapping) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request. Required: riskScore (number) and eventMapping'
            });
        }

        logger.info(`📋 Generating action plan for risk score: ${riskScore}`);

        const agent = getTrafficMaestro();
        const actionPlan = await agent.generateActionPlan(riskScore, eventMapping);

        logger.info(`✅ Action: ${actionPlan.action} (${actionPlan.priority} priority)`);

        return res.json({
            success: true,
            data: actionPlan
        });

    } catch (error: any) {
        logger.error('Error generating action plan:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to generate action plan',
            details: error.message || 'Unknown error'
        });
    }
});

export default router;
