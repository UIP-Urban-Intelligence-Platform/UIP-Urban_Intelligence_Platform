/**
 * GraphRAG Investigator Agent - Multimodal Incident Analysis with AI
 * 
 * @module apps/traffic-web-app/backend/src/agents/GraphInvestigatorAgent
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * Advanced AI agent combining GraphRAG (Graph Retrieval-Augmented Generation) with multimodal analysis
 * for comprehensive traffic incident investigation. Integrates three intelligence sources:
 * 
 * 1. Internal LOD Data (Stellio + Neo4j):
 *    - Entity relationships and semantic context from knowledge graph
 *    - Real-time traffic patterns, weather, air quality correlations
 *    - Historical incident database with similarity matching
 * 
 * 2. Computer Vision (Google Gemini Flash 2.0):
 *    - Visual hazard detection from camera streams
 *    - Vehicle type identification and damage assessment
 *    - Road condition analysis (wet, icy, debris)
 *    - Multimodal reasoning with text + image inputs
 * 
 * 3. External Intelligence (Tavily Search API):
 *    - Real-world news and social media context
 *    - Weather alerts and road closure information
 *    - Similar incident reports from other sources
 * 
 * Key Capabilities:
 * - Root cause analysis with confidence scoring
 * - Response team recommendations (fire dept, cleanup crew, police, medical)
 * - Impact assessment (severity, affected roads, estimated duration)
 * - Correlation detection between accidents and external factors
 * - Natural language report generation
 * - API key rotation for high availability
 * 
 * @dependencies
 * - @google/generative-ai@^0.21.0: Gemini AI SDK
 * - neo4j-driver@^5.14: Neo4j graph database client
 * - axios@^1.6: HTTP client for Stellio and Tavily APIs
 * - js-yaml@^4.1: Configuration file parsing
 * 
 * @example
 * const agent = new GraphInvestigatorAgent();
 * const analysis = await agent.investigate({
 *   accidentId: 'urn:ngsi-ld:RoadAccident:001',
 *   cameraIds: ['Camera:001', 'Camera:002'],
 *   includeExternalContext: true
 * });
 * console.log(analysis.rootCause, analysis.responseTeams);
 */

import axios, { AxiosInstance } from 'axios';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { APIKeyRotationManager } from '../utils/apiKeyRotation';
import { StellioService } from '../services/stellioService';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface RoadAccident {
    id: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    type: string;
    severity: string;
    description?: string;
    timestamp: string;
    affectedCamera?: string;
    resolved: boolean;
    casualties?: number;
}

interface Camera {
    id: string;
    cameraName: string;
    location: {
        lat: number;
        lng: number;
    };
    streamUrl?: string;
    status: string;
}

interface InternalContext {
    accident: RoadAccident;
    affectedCamera: Camera | null;
    nearbyEntities: NearbyEntity[];
    graphRelationships: string[];
}

interface NearbyEntity {
    id: string;
    type: string;
    name: string;
    distance: number;
    properties: Record<string, any>;
}

interface VisualAnalysis {
    description: string;
    visualSeverity: number; // 0-10 scale
    detectedHazards: string[];
    confidence: number;
    imageAnalyzed: boolean;
}

interface ExternalIntelligence {
    newsArticles: NewsArticle[];
    summary: string;
    relevanceScore: number;
}

interface NewsArticle {
    title: string;
    url: string;
    publishedDate: string;
    snippet: string;
    source: string;
}

interface InvestigationReport {
    accidentId: string;
    timestamp: string;
    rootCause: string;
    technicalSeverity: {
        internal: string;
        visual: number;
        combined: string;
    };
    realWorldContext: string;
    detectedHazards: string[];
    recommendation: {
        responseTeams: string[];
        priority: 'low' | 'medium' | 'high' | 'critical';
        estimatedResponseTime: string;
        specialEquipment: string[];
    };
    dataSources: {
        stellio: boolean;
        neo4j: boolean;
        vision: boolean;
        search: boolean;
    };
    confidence: number;
}

interface AgentConfig {
    vision: {
        enabled: boolean;
        model: string;
        maxTokens: number;
        temperature: number;
        detectionPriorities: Array<{
            hazard: string;
            keywords: string[];
            severityRange: [number, number];
        }>;
        severityScale: Record<string, string>;
        systemPrompt: string;
    };
    search: {
        enabled: boolean;
        depth: string;
        maxResults: number;
        includeDomains: string[];
        queryTemplate: string;
    };
    synthesis: {
        llmModel: string;
        maxTokens: number;
        temperature: number;
        responseTeams: Array<{
            name: string;
            triggers: string[];
        }>;
        priorityRules: Array<{
            condition: string;
            priority: 'low' | 'medium' | 'high' | 'critical';
        }>;
        systemPrompt: string;
    };
    neo4j: {
        nearbyEntityQuery: string;
        relationshipQuery: string;
        maxResults: number;
    };
    ffmpeg: {
        enabled: boolean;
        timeout: number;
        args: string[];
    };
}

// =====================================================
// GRAPH INVESTIGATOR AGENT CLASS
// =====================================================

export class GraphInvestigatorAgent {
    private stellioService: StellioService;
    private neo4jDriver: Driver;
    private geminiKeyManager: APIKeyRotationManager | null = null;
    private tavilyKeyManager: APIKeyRotationManager | null = null;
    private tavilyClient: AxiosInstance;
    private config: AgentConfig;

    constructor(configPath?: string) {
        // Load configuration from YAML file (domain-agnostic)
        const defaultConfigPath = path.join(__dirname, '../../config/agents/graph-investigator.yaml');
        const finalConfigPath = configPath || defaultConfigPath;
        this.config = this.loadConfig(finalConfigPath);
        logger.info(`Loaded agent config from: ${finalConfigPath}`);

        // Initialize Stellio service
        this.stellioService = new StellioService();

        // Initialize Neo4j driver
        const neo4jUrl = process.env.NEO4J_URL || 'bolt://localhost:7687';
        const neo4jUser = process.env.NEO4J_USER || 'neo4j';
        const neo4jPassword = process.env.NEO4J_PASSWORD || 'test12345';

        this.neo4jDriver = neo4j.driver(
            neo4jUrl,
            neo4j.auth.basic(neo4jUser, neo4jPassword),
            {
                connectionTimeout: 10000,
                maxConnectionLifetime: 3600000
            }
        );

        // Initialize Gemini with key rotation (optional - graceful degradation if API key missing)
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            this.geminiKeyManager = new APIKeyRotationManager(geminiApiKey, 'Gemini', {
                maxFailures: 3,
                blacklistDurationMs: 5 * 60 * 1000, // 5 minutes
                rotationStrategy: 'round-robin'
            });
            logger.info(`Google Gemini Flash Vision API initialized with ${this.geminiKeyManager.getTotalKeys()} key(s)`);
        } else {
            logger.warn('GEMINI_API_KEY not found - Visual analysis will be skipped');
        }

        // Initialize Tavily Search API with key rotation (optional - graceful degradation)
        const tavilyApiKey = process.env.TAVILY_API_KEY;
        this.tavilyClient = axios.create({
            baseURL: 'https://api.tavily.com',
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (tavilyApiKey) {
            this.tavilyKeyManager = new APIKeyRotationManager(tavilyApiKey, 'Tavily', {
                maxFailures: 2,
                blacklistDurationMs: 3 * 60 * 1000, // 3 minutes
                rotationStrategy: 'round-robin'
            });
            logger.info(`Tavily Search API initialized with ${this.tavilyKeyManager.getTotalKeys()} key(s)`);
        } else {
            logger.warn('TAVILY_API_KEY not found - External intelligence will be skipped');
        }

        logger.info('GraphInvestigatorAgent initialized successfully');
    }

    /**
     * Main investigation method - coordinates all analysis steps
     * 
     * @param accidentId - URN of the RoadAccident entity (e.g., "urn:ngsi-ld:RoadAccident:001")
     * @returns Complete investigation report with recommendations
     */
    async investigateIncident(accidentId: string): Promise<InvestigationReport> {
        logger.info(`🔍 Starting multimodal investigation for accident: ${accidentId}`);

        try {
            // Step 1: Gather internal context from LOD cloud
            const internalContext = await this.gatherInternalContext(accidentId);

            // Step 2: Analyze visual context from camera stream (if available)
            let visualAnalysis: VisualAnalysis | null = null;
            if (internalContext.affectedCamera?.streamUrl) {
                visualAnalysis = await this.analyzeVisualContext(internalContext.affectedCamera.streamUrl);
            }

            // Step 3: Gather external intelligence from news/social media
            let externalIntel: ExternalIntelligence | null = null;
            if (internalContext.accident.location) {
                externalIntel = await this.gatherExternalIntelligence(
                    internalContext.accident.location,
                    internalContext.accident.timestamp
                );
            }

            // Step 4: Synthesize all sources into comprehensive report
            const report = await this.synthesizeReport(
                internalContext,
                visualAnalysis,
                externalIntel
            );

            logger.info(`✅ Investigation completed for ${accidentId}`);
            return report;

        } catch (error) {
            logger.error(`❌ Investigation failed for ${accidentId}:`, error);
            throw new Error(`Failed to investigate incident: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Step A: Gather Internal Context from Stellio + Neo4j
     * 
     * Fetches:
     * 1. RoadAccident entity from Stellio
     * 2. Affected Camera entity (streamUrl, location)
     * 3. Nearby entities from Neo4j graph (cameras, weather stations, etc.)
     * 4. Graph relationships (AFFECTED_CAMERA, NEAR_BY, etc.)
     */
    private async gatherInternalContext(accidentId: string): Promise<InternalContext> {
        logger.debug(`Gathering internal context for ${accidentId}`);

        // Fetch accident entity from Stellio
        const accident = await this.fetchAccidentFromStellio(accidentId);

        // Fetch affected camera if specified
        let affectedCamera: Camera | null = null;
        if (accident.affectedCamera) {
            affectedCamera = await this.fetchCameraFromStellio(accident.affectedCamera);
        }

        // Query Neo4j for nearby entities and relationships
        const { nearbyEntities, relationships } = await this.queryNeo4jContext(accidentId);

        return {
            accident,
            affectedCamera,
            nearbyEntities,
            graphRelationships: relationships
        };
    }

    /**
     * Fetch RoadAccident entity from Stellio Context Broker
     */
    private async fetchAccidentFromStellio(accidentId: string): Promise<RoadAccident> {
        try {
            const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';
            const response = await axios.get(`${stellioUrl}/ngsi-ld/v1/entities/${accidentId}`, {
                headers: { 'Accept': 'application/ld+json' },
                timeout: 10000
            });

            const entity = response.data;

            // Transform NGSI-LD to flat structure
            return {
                id: entity.id,
                location: {
                    latitude: entity.location?.value?.coordinates?.[1] || 0,
                    longitude: entity.location?.value?.coordinates?.[0] || 0,
                    address: entity.address?.value || 'Unknown location'
                },
                type: entity.accidentType?.value || 'other',
                severity: entity.severity?.value || 'minor',
                description: entity.description?.value || '',
                timestamp: entity.dateDetected?.value || new Date().toISOString(),
                affectedCamera: entity.affectedCamera?.object || undefined,
                resolved: entity.resolved?.value || false,
                casualties: entity.casualties?.value || 0
            };
        } catch (error) {
            logger.error(`Failed to fetch accident from Stellio: ${accidentId}`, error);
            throw new Error(`Accident not found in Stellio: ${accidentId}`);
        }
    }

    /**
     * Fetch Camera entity from Stellio (via StellioService)
     */
    private async fetchCameraFromStellio(cameraId: string): Promise<Camera | null> {
        try {
            const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';
            const response = await axios.get(`${stellioUrl}/ngsi-ld/v1/entities/${cameraId}`, {
                headers: { 'Accept': 'application/ld+json' },
                timeout: 10000
            });

            const entity = response.data;

            return {
                id: entity.id,
                cameraName: entity.cameraName?.value || 'Unknown Camera',
                location: {
                    lat: entity.location?.value?.coordinates?.[1] || 0,
                    lng: entity.location?.value?.coordinates?.[0] || 0
                },
                streamUrl: entity.streamUrl?.value || undefined,
                status: entity.status?.value || 'unknown'
            };
        } catch (error) {
            logger.warn(`Failed to fetch camera from Stellio: ${cameraId}`, error);
            return null;
        }
    }

    /**
     * Query Neo4j for nearby entities and graph relationships
     */
    private async queryNeo4jContext(
        accidentId: string
    ): Promise<{ nearbyEntities: NearbyEntity[]; relationships: string[] }> {
        const session: Session = this.neo4jDriver.session();

        try {
            // Query 1: Find nearby entities via config-driven query
            const nearbyResult = await session.run(
                this.config.neo4j.nearbyEntityQuery,
                { accidentId }
            );

            const nearbyEntities: NearbyEntity[] = nearbyResult.records.map(record => ({
                id: record.get('id') || 'unknown',
                type: record.get('type') || 'unknown',
                name: record.get('name') || 'Unknown',
                distance: record.get('distance') || 0,
                properties: record.get('properties') || {}
            }));

            // Query 2: Get all relationship types via config-driven query
            const relResult = await session.run(
                this.config.neo4j.relationshipQuery,
                { accidentId }
            );

            const relationships: string[] = relResult.records.map(
                record => `${record.get('relType')} -> ${record.get('targetType')}`
            );

            logger.debug(`Found ${nearbyEntities.length} nearby entities and ${relationships.length} relationships`);

            return { nearbyEntities, relationships };

        } catch (error) {
            logger.error('Neo4j query failed:', error);
            return { nearbyEntities: [], relationships: [] };
        } finally {
            await session.close();
        }
    }

    /**
     * Step B: Analyze Visual Context using OpenAI GPT-4o Vision
     * 
     * Captures snapshot from camera stream and analyzes for hazards:
     * - Fire, smoke, flames
     * - Flooding, water accumulation
     * - Fallen trees, debris
     * - Vehicle turnover, collision damage
     * - Road blockage severity
     */
    async analyzeVisualContext(streamUrl: string): Promise<VisualAnalysis> {
        logger.debug(`Analyzing visual context from stream: ${streamUrl}`);

        // If Gemini not configured, return default analysis
        if (!this.geminiKeyManager) {
            logger.warn('Gemini client not available - skipping visual analysis');
            return {
                description: 'Visual analysis unavailable (API key missing)',
                visualSeverity: 0,
                detectedHazards: [],
                confidence: 0,
                imageAnalyzed: false
            };
        }

        let lastError: Error | null = null;
        const maxRetries = this.geminiKeyManager.getAvailableKeys();

        // Try with rotation keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.geminiKeyManager.getNextKey();
            const geminiClient = new GoogleGenerativeAI(apiKey);

            try {
                // Step 1: Capture snapshot from RTSP stream
                const imageBase64 = await this.captureStreamSnapshot(streamUrl);

                // Step 2: Analyze with Gemini Vision (config-driven)
                const model = geminiClient.getGenerativeModel({ model: this.config.vision.model });

                const prompt = `${this.config.vision.systemPrompt}\n\nAnalyze this traffic camera image for hazards and severity. Return JSON only with the following structure: {\"description\": string, \"visualSeverity\": number (0-10), \"detectedHazards\": string[], \"confidence\": number (0-1)}`;

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBase64
                        }
                    }
                ]);

                const response = await result.response;
                const content = response.text();

                // Extract JSON from response (Gemini may wrap in markdown code blocks)
                let jsonContent = content.trim();
                if (jsonContent.startsWith('```json')) {
                    jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
                } else if (jsonContent.startsWith('```')) {
                    jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
                }

                // Parse JSON response
                const analysis = JSON.parse(jsonContent);

                // Report success
                this.geminiKeyManager.reportSuccess(apiKey);

                logger.info(`Visual analysis completed - Severity: ${analysis.visualSeverity}/10, Hazards: ${analysis.detectedHazards?.length || 0}`);

                return {
                    description: analysis.description || 'No description provided',
                    visualSeverity: analysis.visualSeverity || 0,
                    detectedHazards: analysis.detectedHazards || [],
                    confidence: analysis.confidence || 0,
                    imageAnalyzed: true
                };

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.geminiKeyManager.reportFailure(apiKey, lastError);
                logger.warn(`Gemini attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
            }
        }

        // All keys failed
        logger.error('Visual analysis failed with all available keys:', lastError);
        return {
            description: `Visual analysis error: ${lastError?.message || 'Unknown error'}`,
            visualSeverity: 0,
            detectedHazards: [],
            confidence: 0,
            imageAnalyzed: false
        };
    }

    /**
     * Capture snapshot from RTSP camera stream using ffmpeg
     * 
     * Executes: ffmpeg -i <streamUrl> -frames:v 1 -f image2pipe -c:v mjpeg - | base64
     * Returns base64-encoded JPEG image
     */
    private async captureStreamSnapshot(streamUrl: string): Promise<string> {
        if (!this.config.ffmpeg.enabled) {
            logger.warn('ffmpeg disabled in config - using fallback method');
            return await this.captureStreamFallback(streamUrl);
        }

        try {
            logger.debug(`Capturing snapshot from RTSP stream: ${streamUrl}`);

            // Build ffmpeg command from config
            const ffmpegArgs = this.config.ffmpeg.args.join(' ');
            const command = `ffmpeg -i "${streamUrl}" ${ffmpegArgs}`;

            // Execute with timeout
            const { stdout, stderr } = await execAsync(command, {
                encoding: 'buffer',
                timeout: this.config.ffmpeg.timeout,
                maxBuffer: 10 * 1024 * 1024 // 10MB max buffer
            });

            if (stderr && stderr.toString().includes('error')) {
                logger.error(`ffmpeg stderr: ${stderr.toString()}`);
                throw new Error('ffmpeg capture failed');
            }

            // Convert binary output to base64
            const base64Image = stdout.toString('base64');
            logger.info(`Successfully captured ${base64Image.length} bytes from stream`);

            return base64Image;

        } catch (error) {
            logger.error(`Failed to capture stream snapshot: ${error}`);

            // Fallback: try HTTP snapshot endpoint if RTSP fails
            if (streamUrl.startsWith('rtsp://')) {
                const httpUrl = streamUrl.replace('rtsp://', 'http://').replace(':554', ':80') + '/snapshot';
                logger.info(`Trying HTTP snapshot fallback: ${httpUrl}`);
                return await this.captureStreamFallback(httpUrl);
            }

            throw new Error(`Stream capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fallback method: fetch snapshot via HTTP GET (for cameras with HTTP snapshot endpoint)
     */
    private async captureStreamFallback(url: string): Promise<string> {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'GraphInvestigatorAgent/1.0'
                }
            });

            const base64Image = Buffer.from(response.data, 'binary').toString('base64');
            logger.info(`Captured snapshot via HTTP: ${base64Image.length} bytes`);
            return base64Image;

        } catch (error) {
            logger.error(`HTTP snapshot fallback failed: ${error}`);
            throw new Error('All snapshot capture methods failed');
        }
    }

    /**
     * Step C: Gather External Intelligence using Tavily Search API
     * 
     * Searches for real-world context:
     * - News articles about incidents in the area
     * - Social media reports
     * - Weather alerts
     * - Road closure announcements
     */
    async gatherExternalIntelligence(
        location: { latitude: number; longitude: number },
        timestamp: string
    ): Promise<ExternalIntelligence> {
        logger.debug(`Gathering external intelligence for location: ${location.latitude}, ${location.longitude}`);

        // If Tavily not configured, return empty result
        if (!this.tavilyKeyManager) {
            logger.warn('Tavily API key not available - skipping external intelligence');
            return {
                newsArticles: [],
                summary: 'External intelligence unavailable (API key missing)',
                relevanceScore: 0
            };
        }

        let lastError: Error | null = null;
        const maxRetries = this.tavilyKeyManager.getAvailableKeys();

        // Try with rotation keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.tavilyKeyManager.getNextKey();

            try {
                // Format location and date for search query
                const date = new Date(timestamp);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const locationStr = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

                // Build search query from config template
                const query = this.config.search.queryTemplate
                    .replace('{location}', locationStr)
                    .replace('{date}', dateStr);

                // Call Tavily Search API with config parameters
                const response = await this.tavilyClient.post('/search', {
                    api_key: apiKey,
                    query: query,
                    search_depth: this.config.search.depth,
                    max_results: this.config.search.maxResults,
                    include_domains: this.config.search.includeDomains,
                    include_answer: true
                });

                const results = response.data.results || [];
                const answer = response.data.answer || '';

                const newsArticles: NewsArticle[] = results.map((item: any) => ({
                    title: item.title || 'Untitled',
                    url: item.url || '',
                    publishedDate: item.published_date || timestamp,
                    snippet: item.content || '',
                    source: new URL(item.url || 'https://unknown.com').hostname
                }));

                // Report success
                this.tavilyKeyManager.reportSuccess(apiKey);

                logger.info(`Found ${newsArticles.length} relevant news articles`);

                return {
                    newsArticles,
                    summary: answer || 'No external context found',
                    relevanceScore: newsArticles.length > 0 ? 0.8 : 0.2
                };

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.tavilyKeyManager.reportFailure(apiKey, lastError);
                logger.warn(`Tavily attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
            }
        }

        // All keys failed
        logger.error('External intelligence gathering failed with all available keys:', lastError);
        return {
            newsArticles: [],
            summary: `External search error: ${lastError?.message || 'Unknown error'}`,
            relevanceScore: 0
        };
    }

    /**
     * Step D: Synthesize Report - Combine all data sources using LLM
     * 
     * Uses GPT-4 to analyze:
     * 1. Internal technical data (severity, type, affected camera)
     * 2. Visual hazards (fire, flood, debris)
     * 3. External news context (storm, road closure)
     * 
     * Outputs:
     * - Root cause analysis
     * - Recommended response teams
     * - Priority level
     * - Special equipment needed
     */
    private async synthesizeReport(
        internalContext: InternalContext,
        visualAnalysis: VisualAnalysis | null,
        externalIntel: ExternalIntelligence | null
    ): Promise<InvestigationReport> {
        logger.debug('Synthesizing investigation report from all sources');

        try {
            // Prepare data summary for LLM
            const contextSummary = {
                accident: {
                    type: internalContext.accident.type,
                    severity: internalContext.accident.severity,
                    description: internalContext.accident.description,
                    location: internalContext.accident.location,
                    timestamp: internalContext.accident.timestamp
                },
                camera: internalContext.affectedCamera ? {
                    name: internalContext.affectedCamera.cameraName,
                    status: internalContext.affectedCamera.status
                } : null,
                nearbyEntities: internalContext.nearbyEntities.map(e => ({
                    type: e.type,
                    name: e.name,
                    distance: e.distance
                })),
                visualHazards: visualAnalysis?.detectedHazards || [],
                visualSeverity: visualAnalysis?.visualSeverity || 0,
                externalNews: externalIntel?.summary || 'No external context',
                newsArticles: externalIntel?.newsArticles.map(a => a.title) || []
            };

            // Use LLM to synthesize if Gemini available
            let synthesis: any;
            if (this.geminiKeyManager) {
                synthesis = await this.synthesizeWithLLM(contextSummary);
            } else {
                synthesis = this.synthesizeWithRules(contextSummary);
            }

            // Build final report
            const report: InvestigationReport = {
                accidentId: internalContext.accident.id,
                timestamp: new Date().toISOString(),
                rootCause: synthesis.rootCause,
                technicalSeverity: {
                    internal: internalContext.accident.severity,
                    visual: visualAnalysis?.visualSeverity || 0,
                    combined: synthesis.combinedSeverity
                },
                realWorldContext: externalIntel?.summary || 'No external context available',
                detectedHazards: [
                    ...(visualAnalysis?.detectedHazards || []),
                    ...synthesis.additionalHazards
                ],
                recommendation: synthesis.recommendation,
                dataSources: {
                    stellio: true,
                    neo4j: internalContext.nearbyEntities.length > 0,
                    vision: visualAnalysis?.imageAnalyzed || false,
                    search: (externalIntel?.newsArticles.length || 0) > 0
                },
                confidence: this.calculateConfidence(internalContext, visualAnalysis, externalIntel)
            };

            return report;

        } catch (error) {
            logger.error('Report synthesis failed:', error);
            throw error;
        }
    }

    /**
     * Synthesize report using GPT-4 LLM
     */
    private async synthesizeWithLLM(contextSummary: any): Promise<any> {
        if (!this.geminiKeyManager) {
            throw new Error('Gemini client not initialized');
        }

        let lastError: Error | null = null;
        const maxRetries = this.geminiKeyManager.getAvailableKeys();

        // Try with rotation keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.geminiKeyManager.getNextKey();
            const geminiClient = new GoogleGenerativeAI(apiKey);

            try {
                const model = geminiClient.getGenerativeModel({ model: this.config.synthesis.llmModel });

                const prompt = `${this.config.synthesis.systemPrompt}\n\nAnalyze this incident and provide recommendations. Return JSON only.\n\n${JSON.stringify(contextSummary, null, 2)}`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                let content = response.text();

                // Extract JSON from response (Gemini may wrap in markdown code blocks)
                content = content.trim();
                if (content.startsWith('```json')) {
                    content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
                } else if (content.startsWith('```')) {
                    content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
                }

                const parsed = JSON.parse(content);

                // Report success
                this.geminiKeyManager.reportSuccess(apiKey);

                return parsed;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.geminiKeyManager.reportFailure(apiKey, lastError);
                logger.warn(`Gemini synthesis attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
            }
        }

        // All keys failed, throw error
        throw new Error(`Gemini synthesis failed with all keys: ${lastError?.message}`);
    }

    /**
     * Rule-based synthesis (fallback when LLM unavailable)
     */
    private synthesizeWithRules(contextSummary: any): any {
        const hazards = contextSummary.visualHazards || [];
        const severity = contextSummary.accident.severity;
        const visualSeverity = contextSummary.visualSeverity || 0;

        // Determine response teams based on config rules
        const responseTeams: string[] = [];

        for (const team of this.config.synthesis.responseTeams) {
            const shouldInclude = team.triggers.some(trigger => {
                // Check if any hazard matches trigger keyword
                const triggerLower = trigger.toLowerCase();
                const hazardMatch = hazards.some((h: string) => h.toLowerCase().includes(triggerLower));
                const descMatch = contextSummary.accident.description?.toLowerCase().includes(triggerLower);
                return hazardMatch || descMatch;
            });

            if (shouldInclude && !responseTeams.includes(team.name)) {
                responseTeams.push(team.name);
            }
        }

        // Default to Police if no teams matched
        if (responseTeams.length === 0) {
            responseTeams.push('Police');
        }

        // Determine priority using config rules
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';

        for (const rule of this.config.synthesis.priorityRules) {
            try {
                // Evaluate condition (simple eval for config flexibility)
                const conditionMet = this.evaluatePriorityCondition(rule.condition, {
                    visualSeverity,
                    severity,
                    hazards,
                    casualties: contextSummary.accident.casualties || 0
                });

                if (conditionMet) {
                    priority = rule.priority;
                    break; // First matching rule wins
                }
            } catch (err) {
                logger.warn(`Failed to evaluate priority rule: ${rule.condition}`);
            }
        }

        return {
            rootCause: `${contextSummary.accident.type} incident - ${severity} severity. Visual hazards: ${hazards.join(', ') || 'none detected'}. External context: ${contextSummary.externalNews}`,
            combinedSeverity: priority,
            additionalHazards: [],
            recommendation: {
                responseTeams,
                priority,
                estimatedResponseTime: priority === 'critical' ? '3-5 minutes' : priority === 'high' ? '5-10 minutes' : '10-20 minutes',
                specialEquipment: hazards.includes('fire') ? ['Fire extinguisher', 'Water hose'] : []
            }
        };
    }

    /**
     * Calculate overall confidence score (0-1)
     */
    private calculateConfidence(
        internalContext: InternalContext,
        visualAnalysis: VisualAnalysis | null,
        externalIntel: ExternalIntelligence | null
    ): number {
        let confidence = 0.5; // Base confidence

        // Internal data always available (+20%)
        confidence += 0.2;

        // Camera data available (+15%)
        if (internalContext.affectedCamera) {
            confidence += 0.15;
        }

        // Neo4j relationships found (+10%)
        if (internalContext.nearbyEntities.length > 0) {
            confidence += 0.1;
        }

        // Visual analysis successful (+20%)
        if (visualAnalysis?.imageAnalyzed && visualAnalysis.confidence > 0) {
            confidence += 0.2 * visualAnalysis.confidence;
        }

        // External intelligence found (+15%)
        if (externalIntel && externalIntel.newsArticles.length > 0) {
            confidence += 0.15 * externalIntel.relevanceScore;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Load configuration from YAML file
     */
    private loadConfig(configPath: string): AgentConfig {
        try {
            if (!fs.existsSync(configPath)) {
                logger.warn(`Config file not found: ${configPath}, using defaults`);
                return this.getDefaultConfig();
            }

            const fileContents = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(fileContents) as AgentConfig;

            // Validate required fields
            if (!config.vision || !config.search || !config.synthesis) {
                throw new Error('Invalid config structure: missing required sections');
            }

            logger.info('Configuration loaded and validated successfully');
            return config;

        } catch (error) {
            logger.error(`Failed to load config from ${configPath}:`, error);
            logger.info('Falling back to default configuration');
            return this.getDefaultConfig();
        }
    }

    /**
     * Get default configuration (fallback)
     */
    private getDefaultConfig(): AgentConfig {
        return {
            vision: {
                enabled: true,
                model: 'gpt-4o',
                maxTokens: 500,
                temperature: 0.3,
                detectionPriorities: [
                    { hazard: 'fire', keywords: ['fire', 'smoke', 'flames'], severityRange: [9, 10] },
                    { hazard: 'flood', keywords: ['flood', 'water', 'submerged'], severityRange: [7, 9] },
                    { hazard: 'debris', keywords: ['tree', 'debris', 'obstruction'], severityRange: [5, 8] },
                    { hazard: 'collision', keywords: ['collision', 'crash', 'turnover'], severityRange: [6, 9] }
                ],
                severityScale: {
                    '0-2': 'Clear road, no issues',
                    '3-4': 'Minor obstruction, traffic flowing',
                    '5-6': 'Moderate blockage, slow traffic',
                    '7-8': 'Major incident, road partially blocked',
                    '9-10': 'Critical emergency, road completely blocked'
                },
                systemPrompt: `You are a traffic incident analysis expert. Analyze traffic camera images to detect hazards and assess severity.

DETECTION PRIORITIES:
1. Fire/Smoke - Immediate danger (severity 9-10)
2. Flooding - Road impassable (severity 7-9)
3. Fallen trees/debris - Obstruction (severity 5-8)
4. Vehicle turnover - Major accident (severity 6-9)
5. Collision damage - Accident severity (severity 4-8)
6. Road blockage - Traffic impact (severity 3-7)

OUTPUT FORMAT (JSON):
{
  "description": "Detailed scene description",
  "visualSeverity": <0-10>,
  "detectedHazards": ["hazard1", "hazard2"],
  "confidence": <0-1>
}

SEVERITY SCALE:
0-2: Clear road, no issues
3-4: Minor obstruction, traffic flowing
5-6: Moderate blockage, slow traffic
7-8: Major incident, road partially blocked
9-10: Critical emergency, road completely blocked`
            },
            search: {
                enabled: true,
                depth: 'advanced',
                maxResults: 5,
                includeDomains: ['news.google.com', 'twitter.com', 'facebook.com', 'vnexpress.net', 'tuoitre.vn'],
                queryTemplate: 'traffic accident incident "{location}" {date} OR events near "{location}" today OR road closure fire flood tree fall'
            },
            synthesis: {
                llmModel: 'gpt-4o',
                maxTokens: 800,
                temperature: 0.4,
                responseTeams: [
                    { name: 'Police', triggers: ['accident', 'collision', 'traffic'] },
                    { name: 'Fire Department', triggers: ['fire', 'smoke', 'flames', 'hazmat'] },
                    { name: 'Medical/Ambulance', triggers: ['injury', 'casualties', 'medical'] },
                    { name: 'Cleanup Crew', triggers: ['debris', 'tree', 'obstruction'] },
                    { name: 'Flood Response', triggers: ['flood', 'water', 'drainage'] },
                    { name: 'Utility Company', triggers: ['power', 'electric', 'gas', 'utility'] }
                ],
                priorityRules: [
                    { condition: 'visualSeverity >= 9 OR severity === "severe"', priority: 'critical' },
                    { condition: 'visualSeverity >= 7 OR severity === "moderate"', priority: 'high' },
                    { condition: 'visualSeverity >= 5', priority: 'medium' },
                    { condition: 'visualSeverity < 5', priority: 'low' }
                ],
                systemPrompt: `You are an expert incident analyst. Analyze accident data from multiple sources and provide actionable recommendations.

RESPONSE TEAMS:
- Police: Standard accidents, traffic control
- Fire Department: Fire, smoke, hazmat
- Medical/Ambulance: Injuries, casualties
- Cleanup Crew: Debris, fallen trees, non-emergency
- Flood Response: Water accumulation, drainage issues
- Utility Company: Downed power lines, gas leaks

OUTPUT JSON FORMAT:
{
  "rootCause": "Brief analysis combining all sources",
  "combinedSeverity": "low|medium|high|critical",
  "additionalHazards": ["hazard1"],
  "recommendation": {
    "responseTeams": ["team1", "team2"],
    "priority": "low|medium|high|critical",
    "estimatedResponseTime": "5-10 minutes",
    "specialEquipment": ["equipment1"]
  }
}`
            },
            neo4j: {
                nearbyEntityQuery: 'MATCH (a:Accident {id: $accidentId}) OPTIONAL MATCH (a)-[:AFFECTED_CAMERA]->(c:Camera) OPTIONAL MATCH (c)-[r:NEAR_BY]-(nearby) WHERE nearby IS NOT NULL RETURN nearby.id as id, labels(nearby)[0] as type, nearby.name as name, r.distance as distance, properties(nearby) as properties ORDER BY r.distance ASC LIMIT 10',
                relationshipQuery: 'MATCH (a:Accident {id: $accidentId})-[r]->(target) RETURN DISTINCT type(r) as relType, labels(target)[0] as targetType',
                maxResults: 10
            },
            ffmpeg: {
                enabled: true,
                timeout: 30000,
                args: ['-frames:v 1', '-f image2pipe', '-c:v mjpeg', '-']
            }
        };
    }

    /**
     * Evaluate priority condition from config
     */
    private evaluatePriorityCondition(
        condition: string,
        context: { visualSeverity: number; severity: string; hazards: string[]; casualties: number }
    ): boolean {
        try {
            // Replace variables in condition string
            let evaluableCondition = condition
                .replace(/visualSeverity/g, context.visualSeverity.toString())
                .replace(/severity/g, `"${context.severity}"`)
                .replace(/casualties/g, context.casualties.toString());

            // Handle hazards array checks
            if (condition.includes('hazards.includes')) {
                const hazardsStr = JSON.stringify(context.hazards);
                evaluableCondition = evaluableCondition.replace(/hazards/g, hazardsStr);
            }

            // Safe evaluation using Function constructor (limited scope)
            const result = new Function('return ' + evaluableCondition)();
            return Boolean(result);

        } catch (error) {
            logger.error(`Failed to evaluate condition "${condition}":`, error);
            return false;
        }
    }

    /**
     * Generate AI-powered analysis for a camera using Gemini
     */
    async generateCameraAnalysis(params: {
        cameraId: string;
        cameraName: string;
        detections: Array<{ label: string; confidence: number }>;
        trafficLevel: string;
        aqi: number;
        weather: string;
    }): Promise<{
        summary: string;
        severity: 'normal' | 'warning' | 'critical';
        confidence: number;
        recommendations: string[];
    }> {
        const { cameraName, detections, trafficLevel, aqi, weather } = params;

        // If Gemini not available, return default analysis
        if (!this.geminiKeyManager) {
            logger.warn('Gemini not available - using fallback analysis');
            return this.getFallbackAnalysis(params);
        }

        try {
            const apiKey = this.geminiKeyManager.getNextKey();
            const geminiClient = new GoogleGenerativeAI(apiKey);
            const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const detectionSummary = detections.length > 0
                ? detections.map(d => `${d.label} (${(d.confidence * 100).toFixed(0)}%)`).join(', ')
                : 'Không phát hiện đối tượng';

            const prompt = `Bạn là chuyên gia phân tích giao thông thông minh tại TP.HCM, Việt Nam. Phân tích tình hình giao thông tại camera "${cameraName}" với dữ liệu sau:

📊 DỮ LIỆU:
- AI Detection: ${detectionSummary}
- Mức độ giao thông: ${trafficLevel}
- Chỉ số AQI: ${aqi}
- Thời tiết: ${weather}

YÊU CẦU:
1. Tóm tắt tình hình (1-2 câu, bằng tiếng Việt, chuyên nghiệp)
2. Đánh giá mức độ: "normal" (bình thường), "warning" (cảnh báo), hoặc "critical" (nghiêm trọng)
3. Độ tin cậy (0.7-0.95)
4. 3 khuyến nghị cụ thể (mỗi khuyến nghị 5-10 từ)

Trả về JSON format chính xác:
{
  "summary": "string",
  "severity": "normal" | "warning" | "critical",
  "confidence": number,
  "recommendations": ["string", "string", "string"]
}`;

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                logger.info(`✅ Gemini analysis for ${cameraName}: ${analysis.severity}`);
                return analysis;
            }

            throw new Error('Invalid JSON response from Gemini');

        } catch (error: any) {
            logger.error('Gemini analysis failed:', error);
            return this.getFallbackAnalysis(params);
        }
    }

    /**
     * NEW: Analyze camera with Gemini Vision - returns object detections with bounding boxes
     * Uses real camera snapshot (or demo image) for AI vision analysis
     */
    async analyzeCameraWithVision(params: {
        cameraId: string;
        imageBase64?: string;  // Optional: provide base64 image, otherwise fetch from camera
    }): Promise<{
        detections: Array<{
            label: string;
            confidence: number;
            box: { x: number; y: number; width: number; height: number };
        }>;
        imageAnalyzed: boolean;
    }> {
        logger.debug(`Analyzing camera ${params.cameraId} with Gemini Vision`);

        // If Gemini not configured, return empty detections
        if (!this.geminiKeyManager) {
            logger.warn('Gemini Vision not available - returning empty detections');
            return { detections: [], imageAnalyzed: false };
        }

        try {
            // Get image: use provided base64 or fetch from camera
            let imageBase64 = params.imageBase64;

            if (!imageBase64) {
                // Try to get demo image or camera snapshot
                // For demo: use a static traffic image
                logger.info('No image provided - using demo traffic image');
                // TODO: Replace with actual camera snapshot when RTSP streams available
                imageBase64 = await this.getDemoTrafficImage();
            }

            // Call Gemini Vision API for object detection
            const apiKey = this.geminiKeyManager.getNextKey();
            const geminiClient = new GoogleGenerativeAI(apiKey);
            const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `Analyze this traffic camera image and detect all vehicles and pedestrians. For each detected object, provide:
1. Label: Type of object (xe cộ, xe máy, xe tải, xe buýt, người đi bộ)
2. Confidence: 0.0-1.0
3. Bounding box: Normalized coordinates (0-1) as {x, y, width, height} where x,y is top-left corner

Return ONLY valid JSON array format:
[
  {
    "label": "Xe cộ",
    "confidence": 0.92,
    "box": {"x": 0.2, "y": 0.3, "width": 0.15, "height": 0.25}
  }
]

If no objects detected, return empty array: []`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: imageBase64
                    }
                }
            ]);

            const response = result.response.text();
            logger.debug('Gemini Vision raw response:', response.substring(0, 200));

            // Extract JSON array from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const detections = JSON.parse(jsonMatch[0]);
                logger.info(`✅ Gemini Vision detected ${detections.length} objects in camera ${params.cameraId}`);
                return {
                    detections,
                    imageAnalyzed: true
                };
            }

            logger.warn('No valid JSON array in Gemini Vision response');
            return { detections: [], imageAnalyzed: false };

        } catch (error: any) {
            logger.error('Gemini Vision analysis failed:', error.message);
            return { detections: [], imageAnalyzed: false };
        }
    }

    /**
     * Get demo traffic image (base64 encoded)
     * TODO: Replace with actual camera snapshot when RTSP available
     */
    private async getDemoTrafficImage(): Promise<string> {
        // For demo purposes: generate a 1x1 pixel image
        // In production: fetch from camera streamUrl or use sample image
        const demoImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );
        return demoImageBuffer.toString('base64');
    }

    /**
     * NEW: Fetch real context data (Weather + AQI) from Stellio for a camera
     */
    async fetchCameraContextData(cameraId: string): Promise<{
        weather: {
            temperature: number;
            humidity: number;
            precipitation: number;
            description: string;
        };
        aqi: {
            value: number;
            category: string;
        };
    }> {
        logger.debug(`Fetching context data for camera ${cameraId}`);

        try {
            // Fetch Camera entity to verify it exists
            const cameraEntity = await this.stellioService.getCameraById(cameraId);

            if (!cameraEntity) {
                throw new Error(`Camera ${cameraId} not found in Stellio`);
            }

            // Query WeatherObserved entities - StellioService automatically joins with camera via refDevice
            const weatherData = await this.stellioService.getWeatherData({ limit: 100 });

            // Filter weather for this specific camera
            const cameraWeather = weatherData.find(w => w.cameraId === cameraId);

            // Query AirQualityObserved entities
            const aqiData = await this.stellioService.getAirQualityData({ limit: 100 });

            // Filter AQI for this specific camera
            const cameraAqi = aqiData.find(a => a.cameraId === cameraId);

            // Extract weather data (with fallback to defaults)
            const temperature = cameraWeather?.temperature || 28;
            const humidity = cameraWeather?.humidity || 70;
            const precipitation = cameraWeather?.precipitation || 0; let weatherDescription = 'Trời quang';
            if (precipitation > 10) weatherDescription = 'Mưa lớn';
            else if (precipitation > 2) weatherDescription = 'Mưa nhẹ';
            else if (humidity > 80) weatherDescription = 'Ẩm ướt';

            // Extract AQI data (with fallback to default)
            const aqiValue = cameraAqi?.aqi || 50;

            let aqiCategory = 'Tốt';
            if (aqiValue > 200) aqiCategory = 'Rất xấu';
            else if (aqiValue > 150) aqiCategory = 'Xấu';
            else if (aqiValue > 100) aqiCategory = 'Không tốt cho nhóm nhạy cảm';
            else if (aqiValue > 50) aqiCategory = 'Trung bình';

            logger.info(`✅ Fetched context for ${cameraId}: Temp=${temperature}°C, AQI=${aqiValue}`);

            return {
                weather: {
                    temperature,
                    humidity,
                    precipitation,
                    description: weatherDescription
                },
                aqi: {
                    value: aqiValue,
                    category: aqiCategory
                }
            };

        } catch (error: any) {
            logger.error('Failed to fetch camera context data:', error.message);

            // Return default values on error
            return {
                weather: {
                    temperature: 28,
                    humidity: 70,
                    precipitation: 0,
                    description: 'Dữ liệu không khả dụng'
                },
                aqi: {
                    value: 50,
                    category: 'Không rõ'
                }
            };
        }
    }

    /**
     * NEW: Calculate traffic level from detection count
     */
    private calculateTrafficLevel(detectionCount: number): string {
        if (detectionCount > 30) return 'Tắc nghẽn nghiêm trọng';
        if (detectionCount > 20) return 'Tắc nghẽn';
        if (detectionCount > 10) return 'Trung bình';
        return 'Thông thoáng';
    }

    /**
     * Fallback analysis when Gemini is unavailable
     */
    private getFallbackAnalysis(params: {
        cameraName: string;
        detections: Array<{ label: string; confidence: number }>;
        trafficLevel: string;
        aqi: number;
    }): {
        summary: string;
        severity: 'normal' | 'warning' | 'critical';
        confidence: number;
        recommendations: string[];
    } {
        const { cameraName, trafficLevel, aqi } = params;

        let severity: 'normal' | 'warning' | 'critical' = 'normal';
        let summary = `Tình hình giao thông tại ${cameraName}`;

        if (trafficLevel.includes('nghiêm trọng') || aqi > 150) {
            severity = 'critical';
            summary += ' đang rất nghiêm trọng, cần có biện pháp xử lý ngay.';
        } else if (trafficLevel.includes('Tắc nghẽn') || aqi > 100) {
            severity = 'warning';
            summary += ' đang có dấu hiệu tắc nghẽn, cần theo dõi sát.';
        } else {
            summary += ' đang ổn định và thông thoáng.';
        }

        const recommendations = [
            severity === 'critical' ? 'Điều hướng giao thông sang tuyến đường khác' : 'Tiếp tục giám sát định kỳ',
            aqi > 100 ? 'Khuyến cáo hạn chế ra đường vào giờ cao điểm' : 'Chất lượng không khí ở mức chấp nhận được',
            'Cập nhật dữ liệu thời gian thực mỗi 5 phút'
        ];

        return {
            summary,
            severity,
            confidence: 0.75,
            recommendations
        };
    }

    /**
     * Close all connections
     */
    async close(): Promise<void> {
        await this.neo4jDriver.close();
        logger.info('GraphInvestigatorAgent connections closed');
    }
}

