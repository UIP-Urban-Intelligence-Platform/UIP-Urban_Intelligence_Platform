/**
 * Multi-Agent Routes - Coordinated AI Agent System API
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
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
import { observationSyncService } from '../services/observationSyncService';
import { logger } from '../utils/logger';

const router = Router();

// Singleton instances
let graphInvestigator: GraphInvestigatorAgent | null = null;
let trafficMaestro: TrafficMaestroAgent | null = null;

// =====================================================
// PREDICTIVE TIMELINE CACHE (MIT License compatible)
// =====================================================
interface PredictiveTimelineCache {
    data: any;
    timestamp: number;
    isLoading: boolean;
}

let predictiveTimelineCache: PredictiveTimelineCache = {
    data: null,
    timestamp: 0,
    isLoading: false
};

// Cache duration: 2 minutes (120000ms) - refresh data periodically
const CACHE_DURATION_MS = 2 * 60 * 1000;

// Background refresh function
const refreshPredictiveCache = async () => {
    if (predictiveTimelineCache.isLoading) {
        logger.info('⏳ Cache refresh already in progress...');
        return;
    }

    predictiveTimelineCache.isLoading = true;
    logger.info('🔄 Refreshing predictive timeline cache in background...');

    try {
        // Ensure observations are synced to Stellio first
        const stellioAvailable = await observationSyncService.checkStellioConnection();
        if (stellioAvailable) {
            await observationSyncService.syncObservationsToStellion();
        }

        const agent = getTrafficMaestro();
        const trafficAnalysis = await agent.analyzeAllCamerasTraffic();

        // Build cache data
        const predictions = trafficAnalysis.predictions.map((p: any) => ({
            timestamp: p.timestamp,
            currentCongestion: trafficAnalysis.overallCongestion,
            predictedCongestion: p.congestionLevel,
            confidence: p.confidence,
            trend: p.trend,
            contributingCameras: trafficAnalysis.hotspots.map((h: any) => h.cameraId),
            factors: {
                baselineTraffic: trafficAnalysis.overallCongestion,
                rushHourImpact: p.congestionLevel - trafficAnalysis.overallCongestion,
                activeHotspots: trafficAnalysis.hotspots.length,
                camerasAnalyzed: trafficAnalysis.cameras.filter((c: any) => c.trafficPattern !== null).length
            }
        }));

        const hotspotEvents = trafficAnalysis.hotspots.map((hotspot: any, index: number) => ({
            id: `hotspot-${index + 1}`,
            type: 'traffic_hotspot',
            name: `🔥 Kẹt xe: ${hotspot.cameraName}`,
            venue: hotspot.cameraName,
            cameraId: hotspot.cameraId, 
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 2 * 3600000).toISOString(),
            estimatedAttendees: hotspot.vehicleCount,
            impactRadius: 500,
            location: hotspot.location,
            riskScore: hotspot.congestionScore,
            averageSpeed: hotspot.averageSpeed,
            vehicleCount: hotspot.vehicleCount,
            observedAt: hotspot.observedAt, // Add timestamp when hotspot was detected
            isSimulated: hotspot.isSimulated ?? false // REAL data now
        }));

        // Fetch external events from APIs (Ticketmaster, Google Calendar, etc.)
        let externalEvents: any[] = [];
        try {
            const eventMappings = await agent.monitorExternalEvents();

            // HCMC center coordinates
            const HCMC_CENTER = { lat: 10.7769, lng: 106.7009 };
            const MAX_DISTANCE_KM = 200; // Only include events within 200km of HCMC

            // Helper function to calculate distance between two coordinates (Haversine formula)
            const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
                const R = 6371; // Earth's radius in km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLng = (lng2 - lng1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            // Filter events to only include those near HCMC (Vietnam)
            const vietnamEvents = eventMappings.filter((mapping: any) => {
                const eventLat = mapping.event.venue?.location?.lat || 0;
                const eventLng = mapping.event.venue?.location?.lng || 0;
                const distance = calculateDistance(HCMC_CENTER.lat, HCMC_CENTER.lng, eventLat, eventLng);

                // Keep events within 200km of HCMC or events from google-calendar (Vietnam holidays)
                const isNearHCMC = distance <= MAX_DISTANCE_KM;
                const isVietnamHoliday = mapping.event.source === 'google-calendar';

                return isNearHCMC || isVietnamHoliday;
            });

            logger.info(`📅 Filtered to ${vietnamEvents.length} Vietnam-related events (from ${eventMappings.length} total)`);

            externalEvents = vietnamEvents.slice(0, 10).map((mapping: any) => ({
                id: mapping.event.id || `event-${Date.now()}-${Math.random()}`,
                type: mapping.event.category || 'external_event',
                name: `🎉 ${mapping.event.name}`,
                venue: mapping.event.venue?.name || mapping.event.venue?.address || 'Địa điểm sự kiện',
                startTime: mapping.event.startTime,
                endTime: mapping.event.endTime,
                estimatedAttendees: mapping.event.expectedAttendees || 1000,
                impactRadius: calculateImpactRadius(mapping.event.expectedAttendees || 1000),
                location: mapping.event.venue?.location || { lat: 10.7769, lng: 106.7009 },
                riskScore: mapping.surgeRisk?.score || 50,
                source: 'external_api'
            }));
            logger.info(`📅 Final external events: ${externalEvents.length}`);
        } catch (eventError) {
            logger.warn('Could not fetch external events:', eventError);
        }

        // Combine hotspots + external events
        const allEvents = [...hotspotEvents, ...externalEvents];

        const actions = generateRecommendedActions(trafficAnalysis.overallCongestion);

        predictiveTimelineCache = {
            data: {
                predictions,
                events: allEvents,
                actions,
                routes: [],
                metadata: {
                    generatedAt: new Date().toISOString(),
                    camerasAnalyzed: trafficAnalysis.cameras.length,
                    hotspotsDetected: trafficAnalysis.hotspots.length,
                    externalEventsFound: externalEvents.length,
                    overallCongestion: trafficAnalysis.overallCongestion,
                    dataSource: 'real-time-cameras + external-apis',
                    cached: true,
                    cacheExpiresAt: new Date(Date.now() + CACHE_DURATION_MS).toISOString()
                }
            },
            timestamp: Date.now(),
            isLoading: false
        };

        logger.info(`✅ Cache refreshed: ${trafficAnalysis.cameras.length} cameras, ${trafficAnalysis.hotspots.length} hotspots, ${externalEvents.length} external events`);
    } catch (error) {
        logger.error('❌ Failed to refresh cache:', error);
        predictiveTimelineCache.isLoading = false;
    }
};

// Start background refresh every 2 minutes
setInterval(() => {
    refreshPredictiveCache();
}, CACHE_DURATION_MS);

// Helper: Get default predictions when cache is loading
const getDefaultPredictions = () => {
    const now = new Date();
    const predictions = [];
    for (let i = 0; i < 6; i++) {
        const futureTime = new Date(now.getTime() + i * 3600000);
        predictions.push({
            timestamp: futureTime.toISOString(),
            currentCongestion: 30,
            predictedCongestion: 30 + Math.random() * 20,
            confidence: 0.5,
            trend: 'stable',
            contributingCameras: [],
            factors: {
                baselineTraffic: 30,
                rushHourImpact: 0,
                activeHotspots: 0,
                camerasAnalyzed: 0
            }
        });
    }
    return predictions;
};

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

/**
 * GET /api/agents/traffic-maestro/predictive-timeline
 * 
 * Get comprehensive data for PredictiveTimeline component
 * Uses CACHE for fast response, refreshes in background every 2 minutes
 * 
 * Query params:
 * - forceRefresh=true: Skip cache and fetch fresh data
 * 
 * @returns {Object} Timeline data with predictions, hotspots, and actions
 * 
 * @license MIT - 100% compatible
 */
router.get('/traffic-maestro/predictive-timeline', async (req: Request, res: Response) => {
    try {
        const forceRefresh = req.query.forceRefresh === 'true';
        const now = Date.now();
        const cacheAge = now - predictiveTimelineCache.timestamp;
        const isCacheValid = predictiveTimelineCache.data && cacheAge < CACHE_DURATION_MS;

        // Helper function to check if cache is from a different day (auto-invalidate old day cache)
        const isCacheFromDifferentDay = (): boolean => {
            if (!predictiveTimelineCache.data) return false;
            const cachedDate = new Date(predictiveTimelineCache.timestamp).toDateString();
            const currentDate = new Date().toDateString();
            return cachedDate !== currentDate;
        };

        // Auto-clear cache when day changes
        if (isCacheFromDifferentDay()) {
            logger.info('🔄 Cache from different day detected, clearing old cache...');
            predictiveTimelineCache.data = null;
            predictiveTimelineCache.timestamp = 0;
        }

        // Helper function to update timestamps in cached data to current time
        const updateCachedDataTimestamps = (cachedData: any) => {
            const currentTime = new Date();
            const updatedEvents = cachedData.events?.map((event: any) => {
                if (event.type === 'traffic_hotspot') {
                    // Update hotspot timestamps to current time
                    return {
                        ...event,
                        startTime: currentTime.toISOString(),
                        endTime: new Date(currentTime.getTime() + 2 * 3600000).toISOString(),
                    };
                }
                return event;
            }) || [];

            return {
                ...cachedData,
                events: updatedEvents,
                metadata: {
                    ...cachedData.metadata,
                    generatedAt: currentTime.toISOString(),
                }
            };
        };

        // Return cached data immediately if valid and NOT force refresh
        if (isCacheValid && !forceRefresh) {
            logger.info(`⚡ Returning cached predictive timeline (age: ${Math.round(cacheAge / 1000)}s)`);
            const updatedData = updateCachedDataTimestamps(predictiveTimelineCache.data);
            return res.json({
                success: true,
                data: updatedData,
                cached: true,
                cacheAge: Math.round(cacheAge / 1000)
            });
        }

        // If cache is loading and NOT force refresh, return stale data or loading state
        if (predictiveTimelineCache.isLoading && !forceRefresh) {
            if (predictiveTimelineCache.data) {
                logger.info('⏳ Cache refresh in progress, returning stale data');
                const updatedData = updateCachedDataTimestamps(predictiveTimelineCache.data);
                return res.json({
                    success: true,
                    data: updatedData,
                    cached: true,
                    stale: true
                });
            }
            return res.json({
                success: true,
                data: {
                    predictions: getDefaultPredictions(),
                    events: [],
                    actions: generateRecommendedActions(30),
                    metadata: { loading: true }
                },
                loading: true
            });
        }

        // Force refresh OR no cache - fetch new data synchronously
        logger.info(`📊 Fetching fresh predictive timeline (forceRefresh: ${forceRefresh})...`);

        // Clear old cache when force refresh
        if (forceRefresh) {
            predictiveTimelineCache.data = null;
            predictiveTimelineCache.timestamp = 0;
        }

        // Fetch data synchronously (wait for result)
        const agent = getTrafficMaestro();
        const trafficAnalysis = await agent.analyzeAllCamerasTraffic();

        logger.info(`📷 Analyzed ${trafficAnalysis.cameras.length} cameras, overall congestion: ${trafficAnalysis.overallCongestion}%`);

        const predictions = trafficAnalysis.predictions.map((p: any) => ({
            timestamp: p.timestamp,
            currentCongestion: trafficAnalysis.overallCongestion,
            predictedCongestion: p.congestionLevel,
            confidence: p.confidence,
            trend: p.trend,
            contributingCameras: trafficAnalysis.hotspots.map((h: any) => h.cameraId),
            factors: {
                baselineTraffic: trafficAnalysis.overallCongestion,
                rushHourImpact: p.congestionLevel - trafficAnalysis.overallCongestion,
                activeHotspots: trafficAnalysis.hotspots.length,
                camerasAnalyzed: trafficAnalysis.cameras.filter((c: any) => c.trafficPattern !== null).length
            }
        }));

        const hotspotEvents = trafficAnalysis.hotspots.map((hotspot: any, index: number) => ({
            id: `hotspot-${index + 1}`,
            type: 'traffic_hotspot',
            name: `🔥 Kẹt xe: ${hotspot.cameraName}`,
            venue: hotspot.cameraName,
            startTime: hotspot.observedAt || new Date().toISOString(), // Use actual observation timestamp
            endTime: new Date(Date.now() + 2 * 3600000).toISOString(),
            observedAt: hotspot.observedAt || new Date().toISOString(), // Timestamp when data was pushed to Stellio
            estimatedAttendees: hotspot.vehicleCount,
            impactRadius: 500,
            location: hotspot.location,
            riskScore: hotspot.congestionScore,
            averageSpeed: hotspot.averageSpeed,
            vehicleCount: hotspot.vehicleCount,
            isSimulated: hotspot.isSimulated ?? false // REAL data now
        }));

        // Fetch external events from APIs - FILTER FOR VIETNAM ONLY
        let externalEvents: any[] = [];
        try {
            const eventMappings = await agent.monitorExternalEvents();

            // HCMC center coordinates
            const HCMC_CENTER = { lat: 10.7769, lng: 106.7009 };
            const MAX_DISTANCE_KM = 200; // Only include events within 200km of HCMC

            // Helper function to calculate distance (Haversine formula)
            const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
                const R = 6371;
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLng = (lng2 - lng1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            // Filter: only keep events near HCMC or Vietnam holidays from Google Calendar
            const vietnamEvents = eventMappings.filter((mapping: any) => {
                const eventLat = mapping.event.venue?.location?.lat || 0;
                const eventLng = mapping.event.venue?.location?.lng || 0;
                const distance = calcDistance(HCMC_CENTER.lat, HCMC_CENTER.lng, eventLat, eventLng);

                const isNearHCMC = distance <= MAX_DISTANCE_KM;
                const isVietnamHoliday = mapping.event.source === 'google-calendar';

                return isNearHCMC || isVietnamHoliday;
            });

            logger.info(`📅 Filtered to ${vietnamEvents.length} Vietnam events (from ${eventMappings.length} total)`);

            externalEvents = vietnamEvents.slice(0, 10).map((mapping: any) => ({
                id: mapping.event.id || `event-${Date.now()}-${Math.random()}`,
                type: mapping.event.category || 'external_event',
                name: `🎉 ${mapping.event.name}`,
                venue: mapping.event.venue?.name || mapping.event.venue?.address || 'Địa điểm sự kiện',
                startTime: mapping.event.startTime,
                endTime: mapping.event.endTime,
                estimatedAttendees: mapping.event.expectedAttendees || 1000,
                impactRadius: calculateImpactRadius(mapping.event.expectedAttendees || 1000),
                location: mapping.event.venue?.location || { lat: 10.7769, lng: 106.7009 },
                riskScore: mapping.surgeRisk?.score || 50,
                source: 'external_api'
            }));
            logger.info(`📅 Final external events: ${externalEvents.length}`);
        } catch (eventError) {
            logger.warn('Could not fetch external events:', eventError);
        }

        // Combine hotspots + external events
        const allEvents = [...hotspotEvents, ...externalEvents];

        const actions = generateRecommendedActions(trafficAnalysis.overallCongestion);

        const responseData = {
            predictions,
            events: allEvents,
            actions,
            routes: [],
            metadata: {
                generatedAt: new Date().toISOString(),
                camerasAnalyzed: trafficAnalysis.cameras.length,
                hotspotsDetected: trafficAnalysis.hotspots.length,
                externalEventsFound: externalEvents.length,
                overallCongestion: trafficAnalysis.overallCongestion,
                dataSource: 'real-time-cameras + external-apis',
                cached: false
            }
        };

        // Update cache
        predictiveTimelineCache = {
            data: responseData,
            timestamp: Date.now(),
            isLoading: false
        };

        logger.info(`✅ Fresh timeline generated: ${predictions.length} predictions, ${hotspotEvents.length} hotspots, ${externalEvents.length} external events`);

        return res.json({
            success: true,
            data: responseData,
            cached: false
        });

    } catch (error: any) {
        logger.error('Error fetching predictive timeline:', error);

        // Return cached data on error if available
        if (predictiveTimelineCache.data) {
            logger.info('⚠️ Error occurred, returning cached data');
            return res.json({
                success: true,
                data: predictiveTimelineCache.data,
                cached: true,
                error: true
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to fetch predictive timeline',
            details: error.message || 'Unknown error'
        });
    }
});

// Helper function to map event category to timeline type
function mapEventCategory(category: string): string {
    const categoryMap: Record<string, string> = {
        'concert': 'concert',
        'music': 'concert',
        'sports': 'sports',
        'football': 'sports',
        'soccer': 'sports',
        'conference': 'conference',
        'business': 'conference',
        'festival': 'festival',
        'cultural': 'festival',
        'exhibition': 'exhibition',
        'community': 'community'
    };
    return categoryMap[category?.toLowerCase()] || 'other';
}

// Helper function to calculate impact radius based on attendees
function calculateImpactRadius(attendees: number): number {
    if (!attendees || attendees < 1000) return 500;
    if (attendees < 5000) return 1000;
    if (attendees < 10000) return 1500;
    if (attendees < 20000) return 2000;
    return 3000;
}

// Helper function to generate recommended actions
function generateRecommendedActions(riskScore: number): any[] {
    const actions = [];

    if (riskScore >= 30) {
        actions.push({
            id: '1',
            type: 'green_wave',
            label: 'Kích hoạt Sóng Xanh',
            description: 'Tối ưu hóa đèn tín hiệu giao thông để giảm tắc nghẽn',
            targetArea: 'Khu vực ảnh hưởng',
            estimatedImpact: `Giảm ${Math.round(riskScore * 0.2)}% tắc nghẽn`,
            requiredRiskLevel: 30,
            icon: '🚦',
            status: riskScore >= 30 ? 'available' : 'locked'
        });
    }

    if (riskScore >= 50) {
        actions.push({
            id: '2',
            type: 'alert',
            label: 'Gửi Cảnh báo Công chúng',
            description: 'Thông báo cho người dân về tình trạng giao thông dự kiến',
            targetArea: 'Toàn thành phố',
            estimatedImpact: 'Tăng nhận thức 40%',
            requiredRiskLevel: 50,
            icon: '📢',
            status: riskScore >= 50 ? 'available' : 'locked'
        });
    }

    if (riskScore >= 70) {
        actions.push({
            id: '3',
            type: 'detour',
            label: 'Đề xuất Tuyến Đường Thay Thế',
            description: 'Hướng dẫn lái xe đi đường vòng để tránh kẹt xe',
            targetArea: 'Các tuyến chính',
            estimatedImpact: `Giảm ${Math.round(riskScore * 0.3)}% lưu lượng`,
            requiredRiskLevel: 70,
            icon: '🔀',
            status: riskScore >= 70 ? 'available' : 'locked'
        });
    }

    // Always include at least one action
    if (actions.length === 0) {
        actions.push({
            id: '0',
            type: 'monitor',
            label: 'Giám sát Thường xuyên',
            description: 'Tiếp tục theo dõi tình hình giao thông',
            targetArea: 'Toàn thành phố',
            estimatedImpact: 'Phát hiện sớm vấn đề',
            requiredRiskLevel: 0,
            icon: '👁️',
            status: 'active'
        });
    }

    return actions;
}

export default router;
