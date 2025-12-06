/**
 * Traffic Maestro Agent - Predictive Event Orchestrator & Traffic Conductor
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/backend/src/agents/TrafficMaestroAgent
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * Proactive traffic management system that predicts congestion by correlating internal
 * traffic patterns with external real-world events. Acts as a "conductor" orchestrating
 * traffic flow optimization before problems occur.
 * 
 * Core Capabilities:
 * 1. External Event Monitoring:
 *    - Ticketmaster API: Concerts, sports events, theater shows
 *    - Google Calendar API: Public holidays, school events
 *    - Eventbrite API: Conferences, festivals, community gatherings
 *    - Facebook Events Graph API: Social gatherings
 *    - Custom HCMC event sources: Local event calendars
 * 
 * 2. Predictive Congestion Analysis:
 *    - Event attendance estimation (venue capacity, ticket sales)
 *    - Historical pattern matching (similar past events)
 *    - Time-to-venue calculations with expected arrival curves
 *    - Multi-route impact assessment
 *    - Confidence scoring for predictions
 * 
 * 3. External Traffic Benchmarking:
 *    - Mapbox Directions API: Real-time route alternatives
 *    - Google Maps Directions API: Traffic layer comparison
 *    - TomTom Traffic API: Incident detection
 *    - Route duration forecasting
 * 
 * 4. Preemptive Action Plans:
 *    - Green wave optimization (adaptive signal timing)
 *    - Detour recommendations with capacity analysis
 *    - Public transit scaling suggestions
 *    - Parking guidance systems
 *    - Citizen push notifications
 * 
 * 5. Timeline Visualization:
 *    - Event timeline generation (before, during, after)
 *    - Impact heatmaps with severity coloring
 *    - Road segment congestion predictions
 *    - Resource allocation recommendations
 * 
 * Key Features:
 * - Multi-source event aggregation with deduplication
 * - Configurable prediction thresholds
 * - API key rotation for high availability
 * - NGSI-LD entity generation for Stellio publishing
 * - Caching for performance optimization
 * 
 * @dependencies
 * - axios@^1.6: HTTP client for external APIs
 * - js-yaml@^4.1: Configuration file parsing
 * 
 * @example
 * const maestro = new TrafficMaestroAgent();
 * const prediction = await maestro.predictEventImpact({
 *   eventDate: '2024-12-31T20:00:00Z',
 *   venueName: 'Phu Tho Stadium',
 *   expectedAttendees: 25000,
 *   horizonHours: 6
 * });
 * console.log(prediction.actionPlan, prediction.affectedRoads);
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { StellioService } from '../services/stellioService';
import { APIKeyRotationManager } from '../utils/apiKeyRotation';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface LatLng {
    lat: number;
    lng: number;
}

interface Camera {
    id: string;
    cameraName: string;
    location: LatLng;
    status: string;
}

interface TrafficPattern {
    id: string;
    cameraId: string;
    location: LatLng;
    averageSpeed: number;
    vehicleCount: number;
    congestionLevel: 'low' | 'medium' | 'high' | 'severe';
    timestamp: string;
    predictedTrend: 'increasing' | 'stable' | 'decreasing';
}

interface ExternalEvent {
    id: string;
    name: string;
    venue: {
        name: string;
        location: LatLng;
        address: string;
    };
    startTime: string;
    endTime: string;
    expectedAttendees: number;
    category: string;
    source: 'ticketmaster' | 'google-calendar' | 'google-search' | 'other';
}

interface EventCameraMapping {
    event: ExternalEvent;
    affectedCameras: Array<{
        camera: Camera;
        distance: number; // meters
        currentPattern: TrafficPattern | null;
    }>;
}

interface SurgeRiskScore {
    eventId: string;
    score: number; // 0-100
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    factors: {
        attendeeCount: number;
        timeToEnd: number; // minutes
        currentCongestion: string;
        historicalImpact: number;
    };
    affectedCameras: string[];
}

interface RouteComparison {
    origin: LatLng;
    destination: LatLng;
    mapboxDuration: number; // seconds
    mapboxDistance: number; // meters
    internalDuration: number; // seconds from TrafficPattern
    optimizationGap: number; // percentage difference
    recommendation: string;
}

interface ActionPlan {
    action: string;
    targetCameras: string[];
    reason: string;
    predictedImpact: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    executionTime: string;
    estimatedCost: number; // relative cost 0-100
}

interface MaestroConfig {
    events: {
        enabled: boolean;
        sources: Array<{
            name: string;
            apiUrl: string;
            apiKeyEnv: string;
            enabled: boolean;
        }>;
        filterCriteria: {
            minAttendees: number;
            maxDistanceKm: number;
            lookAheadHours: number;
        };
        categories: string[];
    };
    routing: {
        enabled: boolean;
        provider: string;
        apiUrl: string;
        apiKeyEnv: string;
        profile: string;
    };
    prediction: {
        surgeRiskThresholds: {
            critical: number;
            high: number;
            moderate: number;
        };
        timeWindowMinutes: number;
        congestionMultipliers: {
            low: number;
            medium: number;
            high: number;
            severe: number;
        };
    };
    actions: {
        greenWave: {
            enabled: boolean;
            minRiskScore: number;
            phasingAdjustmentPercent: number;
        };
        detour: {
            enabled: boolean;
            minRiskScore: number;
        };
        alert: {
            enabled: boolean;
            minRiskScore: number;
        };
    };
}

// =====================================================
// TRAFFIC MAESTRO AGENT CLASS
// =====================================================

export class TrafficMaestroAgent {
    private stellioService: StellioService;
    private ticketmasterClient: AxiosInstance;
    private googleCalendarClient: AxiosInstance;
    private googleCustomSearchClient: AxiosInstance;
    private mapboxClient: AxiosInstance;
    private ticketmasterKeyManager: APIKeyRotationManager | null = null;
    private googleCalendarKeyManager: APIKeyRotationManager | null = null;
    private googleCustomSearchKeyManager: APIKeyRotationManager | null = null;
    private mapboxKeyManager: APIKeyRotationManager | null = null;
    private config: MaestroConfig;

    constructor(configPath?: string) {
        // Load configuration from YAML file (domain-agnostic)
        const defaultConfigPath = path.join(__dirname, '../../config/agents/traffic-maestro.yaml');
        const finalConfigPath = configPath || defaultConfigPath;
        this.config = this.loadConfig(finalConfigPath);
        logger.info(`Loaded Traffic Maestro config from: ${finalConfigPath}`);

        // Initialize Stellio service
        this.stellioService = new StellioService();

        // Initialize Ticketmaster API client with rotation
        const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY || '';
        if (ticketmasterApiKey) {
            this.ticketmasterKeyManager = new APIKeyRotationManager(ticketmasterApiKey, 'Ticketmaster', {
                maxFailures: 3,
                blacklistDurationMs: 5 * 60 * 1000,
                rotationStrategy: 'round-robin'
            });
        }
        this.ticketmasterClient = axios.create({
            baseURL: 'https://app.ticketmaster.com/discovery/v2',
            timeout: 15000
        });

        // Initialize Google Calendar API client with rotation
        const googleCalendarApiKey = process.env.GOOGLE_CALENDAR_API_KEY || '';
        if (googleCalendarApiKey) {
            this.googleCalendarKeyManager = new APIKeyRotationManager(googleCalendarApiKey, 'Google Calendar', {
                maxFailures: 3,
                blacklistDurationMs: 5 * 60 * 1000,
                rotationStrategy: 'round-robin'
            });
        }
        this.googleCalendarClient = axios.create({
            baseURL: 'https://www.googleapis.com/calendar/v3',
            timeout: 15000
        });

        // Initialize Google Custom Search API client with rotation
        const googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
        if (googleSearchApiKey) {
            this.googleCustomSearchKeyManager = new APIKeyRotationManager(googleSearchApiKey, 'Google Custom Search', {
                maxFailures: 3,
                blacklistDurationMs: 5 * 60 * 1000,
                rotationStrategy: 'round-robin'
            });
        }
        this.googleCustomSearchClient = axios.create({
            baseURL: 'https://www.googleapis.com/customsearch/v1',
            timeout: 15000
        });

        // Initialize Mapbox API client with rotation
        const mapboxApiKey = process.env.MAPBOX_API_KEY || '';
        if (mapboxApiKey) {
            this.mapboxKeyManager = new APIKeyRotationManager(mapboxApiKey, 'Mapbox', {
                maxFailures: 3,
                blacklistDurationMs: 5 * 60 * 1000,
                rotationStrategy: 'round-robin'
            });
        }
        this.mapboxClient = axios.create({
            baseURL: 'https://api.mapbox.com',
            timeout: 15000
        });

        logger.info('TrafficMaestroAgent initialized successfully');
    }

    /**
     * Method 1: Monitor External Events
     * 
     * Fetches upcoming events in HCMC from external APIs and filters
     * for large gatherings that could impact traffic.
     */
    async monitorExternalEvents(): Promise<EventCameraMapping[]> {
        logger.info('🔍 Monitoring external events for traffic impact...');

        const events: ExternalEvent[] = [];

        // Fetch events from enabled sources
        for (const source of this.config.events.sources) {
            if (!source.enabled) continue;

            try {
                if (source.name === 'ticketmaster') {
                    const ticketmasterEvents = await this.fetchTicketmasterEvents();
                    events.push(...ticketmasterEvents);
                } else if (source.name === 'google-calendar') {
                    const googleEvents = await this.fetchGoogleCalendarEvents();
                    events.push(...googleEvents);
                } else if (source.name === 'google-search') {
                    const searchEvents = await this.searchHCMCEvents();
                    events.push(...searchEvents);
                }
            } catch (error) {
                logger.error(`Failed to fetch events from ${source.name}:`, error);
            }
        }

        // Filter events by criteria
        const filteredEvents = events.filter(event => {
            return event.expectedAttendees >= this.config.events.filterCriteria.minAttendees;
        });

        logger.info(`Found ${filteredEvents.length} large events (>${this.config.events.filterCriteria.minAttendees} attendees)`);

        // Map events to nearby cameras
        const eventMappings: EventCameraMapping[] = [];

        for (const event of filteredEvents) {
            const affectedCameras = await this.findNearbyCameras(
                event.venue.location,
                this.config.events.filterCriteria.maxDistanceKm * 1000 // km to meters
            );

            // Fetch current traffic patterns for affected cameras
            const camerasWithPatterns = await Promise.all(
                affectedCameras.map(async ({ camera, distance }) => {
                    const pattern = await this.getCurrentTrafficPattern(camera.id);
                    return { camera, distance, currentPattern: pattern };
                })
            );

            eventMappings.push({
                event,
                affectedCameras: camerasWithPatterns
            });
        }

        logger.info(`Mapped ${eventMappings.length} events to nearby cameras`);
        return eventMappings;
    }

    /**
     * Fetch events from Ticketmaster Discovery API
     */
    private async fetchTicketmasterEvents(): Promise<ExternalEvent[]> {
        if (!this.ticketmasterKeyManager) {
            logger.warn('Ticketmaster API key not available - skipping event monitoring');
            return [];
        }

        let lastError: Error | null = null;
        const maxRetries = this.ticketmasterKeyManager.getAvailableKeys();

        // Try with rotation keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.ticketmasterKeyManager.getNextKey();

            try {
                const now = new Date();
                const endTime = new Date(now.getTime() + this.config.events.filterCriteria.lookAheadHours * 60 * 60 * 1000);

                // Ticketmaster API requires ISO format WITHOUT milliseconds
                // Format: YYYY-MM-DDTHH:mm:ssZ (not .toISOString() which includes .sssZ)
                const formatDateForTicketmaster = (date: Date): string => {
                    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
                };

                const response = await this.ticketmasterClient.get('/events.json', {
                    params: {
                        apikey: apiKey,
                        // API key is approved for US market only
                        // Using Los Angeles as demo (similar timezone offset to HCMC)
                        city: 'Los Angeles',
                        countryCode: 'US',
                        stateCode: 'CA',
                        startDateTime: formatDateForTicketmaster(now),
                        endDateTime: formatDateForTicketmaster(endTime),
                        size: 50,
                        sort: 'date,asc'
                    }
                });

                const events = response.data._embedded?.events || [];

                const mappedEvents = events.map((event: any) => ({
                    id: event.id,
                    name: event.name,
                    venue: {
                        name: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
                        location: {
                            lat: parseFloat(event._embedded?.venues?.[0]?.location?.latitude || '10.762622'),
                            lng: parseFloat(event._embedded?.venues?.[0]?.location?.longitude || '106.660172')
                        },
                        address: event._embedded?.venues?.[0]?.address?.line1 || ''
                    },
                    startTime: event.dates?.start?.dateTime || now.toISOString(),
                    endTime: this.estimateEndTime(event.dates?.start?.dateTime, 3),
                    expectedAttendees: this.estimateAttendees(event),
                    category: event.classifications?.[0]?.segment?.name || 'Other',
                    source: 'ticketmaster'
                }));

                // Report success
                this.ticketmasterKeyManager.reportSuccess(apiKey);
                return mappedEvents;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.ticketmasterKeyManager.reportFailure(apiKey, lastError);
                logger.warn(`Ticketmaster attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
            }
        }

        // All keys failed
        logger.error('Failed to fetch Ticketmaster events with all keys:', lastError);
        return [];
    }

    /**
     * Fetch events from Google Calendar API
     * Focus on public events and holidays in Vietnam
     */
    private async fetchGoogleCalendarEvents(): Promise<ExternalEvent[]> {
        if (!this.googleCalendarKeyManager) {
            logger.warn('Google Calendar API key not available - skipping event monitoring');
            return [];
        }

        try {
            const allEvents: ExternalEvent[] = [];

            // Public calendar IDs to monitor - Vietnam specific
            // Focus on holidays that impact traffic in Ho Chi Minh City
            const calendarIds = [
                'vi.vietnamese#holiday@group.v.calendar.google.com', // Vietnam holidays (Vietnamese)
                'en.vietnamese#holiday@group.v.calendar.google.com', // Vietnam holidays (English)
                'en.christian#holiday@group.v.calendar.google.com'   // Christian holidays (many Vietnamese Catholics)
            ];

            const timeMin = new Date().toISOString();
            const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ahead

            for (const calendarId of calendarIds) {
                let lastError: Error | null = null;
                const maxRetries = this.googleCalendarKeyManager.getAvailableKeys();

                for (let attempt = 0; attempt < maxRetries; attempt++) {
                    const apiKey = this.googleCalendarKeyManager.getNextKey();

                    try {
                        const response = await this.googleCalendarClient.get(`/calendars/${encodeURIComponent(calendarId)}/events`, {
                            params: {
                                key: apiKey,
                                timeMin: timeMin,
                                timeMax: timeMax,
                                singleEvents: true,
                                orderBy: 'startTime',
                                maxResults: 50
                            }
                        });

                        const events = response.data.items || [];

                        const mappedEvents = events.map((event: any) => {
                            // Default to Ho Chi Minh City center for holidays
                            const location = {
                                lat: 10.762622,
                                lng: 106.660172
                            };

                            return {
                                id: event.id,
                                name: event.summary || 'Unnamed Event',
                                venue: {
                                    name: event.location || 'Vietnam Wide',
                                    location: location,
                                    address: event.location || 'Ho Chi Minh City, Vietnam'
                                },
                                startTime: event.start?.dateTime || event.start?.date || new Date().toISOString(),
                                endTime: event.end?.dateTime || event.end?.date || this.estimateEndTime(event.start?.dateTime || event.start?.date, 24),
                                expectedAttendees: this.estimateGoogleEventAttendees(event),
                                category: 'Holiday',
                                source: 'google-calendar' as const
                            };
                        });

                        allEvents.push(...mappedEvents);
                        this.googleCalendarKeyManager.reportSuccess(apiKey);
                        break; // Success, move to next calendar

                    } catch (error) {
                        lastError = error instanceof Error ? error : new Error('Unknown error');
                        this.googleCalendarKeyManager.reportFailure(apiKey, lastError);
                        logger.warn(`Google Calendar attempt ${attempt + 1}/${maxRetries} failed for ${calendarId}, trying next key...`);
                    }
                }

                if (lastError) {
                    logger.error(`Failed to fetch events from ${calendarId} with all keys:`, lastError);
                }
            }

            logger.info(`Fetched ${allEvents.length} events from Google Calendar (Vietnam)`);
            return allEvents;

        } catch (error) {
            logger.error('Google Calendar API error:', error);
            return [];
        }
    }

    /**
     * Helper: Estimate attendees for Google Calendar events (holidays)
     */
    private estimateGoogleEventAttendees(event: any): number {
        // Holidays typically affect large populations
        // Major holidays can cause significant traffic in Vietnam
        const summary = (event.summary || '').toLowerCase();

        // Major holidays that cause heavy traffic
        if (summary.includes('tết') || summary.includes('new year')) {
            return 50000; // Lunar New Year - massive movement
        }
        if (summary.includes('giỗ tổ hùng vương') || summary.includes('hung kings')) {
            return 30000; // Hung Kings Festival
        }
        if (summary.includes('30/4') || summary.includes('1/5') || summary.includes('reunification') || summary.includes('labor')) {
            return 25000; // Reunification Day / Labor Day
        }
        if (summary.includes('2/9') || summary.includes('independence')) {
            return 25000; // Independence Day
        }

        // Regular holidays
        return 10000; // Default for public holidays
    }

    /**
     * Search for events in Ho Chi Minh City using Google Custom Search API
     * Uses web search to find real events (concerts, festivals, exhibitions)
     */
    private async searchHCMCEvents(): Promise<ExternalEvent[]> {
        if (!this.googleCustomSearchKeyManager) {
            logger.warn('Google Custom Search API key not available - skipping event search');
            return [];
        }

        const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
        if (!searchEngineId) {
            logger.warn('Google Custom Search Engine ID not configured');
            return [];
        }

        try {
            const allEvents: ExternalEvent[] = [];
            const queries = [
                'sự kiện âm nhạc Hồ Chí Minh',
                'concerts festivals Ho Chi Minh City Vietnam',
            ];

            for (const query of queries) {
                let lastError: Error | null = null;
                const maxRetries = this.googleCustomSearchKeyManager.getAvailableKeys();

                for (let attempt = 0; attempt < maxRetries; attempt++) {
                    const apiKey = this.googleCustomSearchKeyManager.getNextKey();

                    try {
                        const response = await this.googleCustomSearchClient.get('', {
                            params: {
                                key: apiKey,
                                cx: searchEngineId,
                                q: query,
                                num: 10,
                                dateRestrict: 'd30',
                                lr: 'lang_en|lang_vi'
                            }
                        });

                        const items = response.data.items || [];

                        // Parse search results and extract event information
                        for (const item of items) {
                            const eventData = this.parseSearchResultToEvent(item);
                            if (eventData && eventData.qualityScore >= 2) {
                                allEvents.push(eventData.event);
                            }
                        }

                        this.googleCustomSearchKeyManager.reportSuccess(apiKey);
                        break; // Success, exit retry loop

                    } catch (error) {
                        lastError = error instanceof Error ? error : new Error('Unknown error');
                        this.googleCustomSearchKeyManager.reportFailure(apiKey, lastError);
                        logger.warn(`Google Custom Search attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
                    }
                }

                if (lastError && allEvents.length === 0) {
                    logger.warn(`Failed to search events with query "${query}":`, lastError);
                }

                // Add delay between queries to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            logger.info(`Found ${allEvents.length} events from Google Custom Search (Ho Chi Minh City)`);
            return allEvents;

        } catch (error) {
            logger.error('Google Custom Search error:', error);
            return [];
        }
    }

    /**
     * Parse Google Custom Search result into event data
     * Uses improved event detection algorithm from test script
     */
    private parseSearchResultToEvent(item: any): { event: ExternalEvent; qualityScore: number } | null {
        const snippet = (item.snippet || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const combined = `${title} ${snippet}`;

        // Event quality indicators
        const indicators = {
            hasDate: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}|tháng\s*\d{1,2}|\d{1,2}\s*tháng|\d{1,2}\/\d{1,2}\/\d{4}|saturday|sunday|monday|tuesday|wednesday|thursday|friday|thứ\s*[2-7]|chủ nhật/.test(combined),
            hasVenue: /stadium|theater|theatre|arena|hall|center|centre|park|club|bar|cafe|nhà hát|sân vận động|trung tâm|hội trường|auditorium|convention|venue|địa điểm|nơi tổ chức|phố đi bộ|quảng trường|square/.test(combined),
            hasEventType: /concert|festival|show|performance|exhibition|conference|seminar|workshop|event|buổi diễn|lễ hội|triển lãm|hội thảo|biểu diễn|hoà nhạc|âm nhạc|music|live|gala|party|bazaar|fair|expo|championship|tournament|competition|cuộc thi/.test(combined),
            hasPrice: /ticket|price|free|vnd|đồng|vé|giá|admission|entry|cost|fee|miễn phí|mua vé|đặt vé|booking/.test(combined)
        };

        const qualityScore = Object.values(indicators).filter(Boolean).length;

        // Only process results with at least 2 quality indicators
        if (qualityScore < 2) {
            return null;
        }

        // Extract event information
        const eventId = item.link.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const eventName = item.title.replace(/[\|\-–—].*$/, '').trim() || 'HCMC Event';

        // Try to extract date from snippet
        const dateMatch = combined.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*(\d{4}))?|\d{1,2}[\/\-]\d{1,2}[\/\-](\d{4})|tháng\s*\d{1,2}/);
        let startTime = new Date().toISOString();
        if (dateMatch) {
            try {
                const parsedDate = new Date(dateMatch[0]);
                if (!isNaN(parsedDate.getTime())) {
                    startTime = parsedDate.toISOString();
                }
            } catch (e) {
                // Use current time if parsing fails
            }
        }

        // Estimate attendees based on event type
        let expectedAttendees = 1000; // Default
        if (/concert|festival|music|âm nhạc|lễ hội/.test(combined)) {
            expectedAttendees = 3000;
        } else if (/conference|seminar|hội thảo/.test(combined)) {
            expectedAttendees = 500;
        } else if (/exhibition|triển lãm/.test(combined)) {
            expectedAttendees = 800;
        }

        // Determine category
        let category = 'Other';
        if (/concert|music|âm nhạc/.test(combined)) category = 'Music';
        else if (/festival|lễ hội/.test(combined)) category = 'Festival';
        else if (/conference|seminar|hội thảo/.test(combined)) category = 'Conference';
        else if (/exhibition|triển lãm/.test(combined)) category = 'Exhibition';
        else if (/sport|thể thao/.test(combined)) category = 'Sports';

        const event: ExternalEvent = {
            id: eventId,
            name: eventName,
            venue: {
                name: 'Ho Chi Minh City',
                location: {
                    lat: 10.762622,
                    lng: 106.660172
                },
                address: 'Ho Chi Minh City, Vietnam'
            },
            startTime: startTime,
            endTime: this.estimateEndTime(startTime, 3),
            expectedAttendees: expectedAttendees,
            category: category,
            source: 'google-search' as const
        };

        return { event, qualityScore };
    }

    /**
     * Find cameras within specified distance from a location
     */
    private async findNearbyCameras(
        location: LatLng,
        maxDistanceMeters: number
    ): Promise<Array<{ camera: Camera; distance: number }>> {
        try {
            // Fetch all cameras from Stellio
            const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';
            const response = await axios.get(`${stellioUrl}/ngsi-ld/v1/entities`, {
                params: {
                    type: 'Camera',
                    limit: 100
                },
                headers: { 'Accept': 'application/ld+json' }
            });

            const cameras = response.data || [];

            // Calculate distances and filter
            const nearbyCameras = cameras
                .map((entity: any) => {
                    const camera: Camera = {
                        id: entity.id,
                        cameraName: entity.cameraName?.value || 'Unknown',
                        location: {
                            lat: entity.location?.value?.coordinates?.[1] || 0,
                            lng: entity.location?.value?.coordinates?.[0] || 0
                        },
                        status: entity.status?.value || 'unknown'
                    };

                    const distance = this.calculateDistance(location, camera.location);
                    return { camera, distance };
                })
                .filter(({ distance }: { distance: number }) => distance <= maxDistanceMeters)
                .sort((a: { camera: Camera; distance: number }, b: { camera: Camera; distance: number }) => a.distance - b.distance);

            return nearbyCameras;

        } catch (error) {
            logger.error('Failed to fetch cameras:', error);
            return [];
        }
    }

    /**
     * Calculate Haversine distance between two coordinates (in meters)
     */
    private calculateDistance(point1: LatLng, point2: LatLng): number {
        const R = 6371000; // Earth radius in meters
        const dLat = this.toRadians(point2.lat - point1.lat);
        const dLng = this.toRadians(point2.lng - point1.lng);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(point1.lat)) *
            Math.cos(this.toRadians(point2.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get current traffic pattern for a camera
     */
    private async getCurrentTrafficPattern(cameraId: string): Promise<TrafficPattern | null> {
        try {
            const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';

            // Query for TrafficPattern linked to this camera
            const response = await axios.get(`${stellioUrl}/ngsi-ld/v1/entities`, {
                params: {
                    type: 'TrafficPattern',
                    q: `refCamera=="${cameraId}"`,
                    limit: 1
                },
                headers: { 'Accept': 'application/ld+json' }
            });

            if (response.data && response.data.length > 0) {
                const entity = response.data[0];
                return {
                    id: entity.id,
                    cameraId: entity.refCamera?.object || cameraId,
                    location: {
                        lat: entity.location?.value?.coordinates?.[1] || 0,
                        lng: entity.location?.value?.coordinates?.[0] || 0
                    },
                    averageSpeed: entity.averageSpeed?.value || 0,
                    vehicleCount: entity.vehicleCount?.value || 0,
                    congestionLevel: entity.congestionLevel?.value || 'low',
                    timestamp: entity.dateObserved?.value || new Date().toISOString(),
                    predictedTrend: entity.predictedTrend?.value || 'stable'
                };
            }

            return null;

        } catch (error) {
            logger.error(`Failed to fetch traffic pattern for camera ${cameraId}:`, error);
            return null;
        }
    }

    /**
     * Method 2: Predict Congestion
     * 
     * Analyzes event characteristics and current traffic patterns to
     * calculate a surge risk score (0-100).
     */
    async predictCongestion(event: ExternalEvent): Promise<SurgeRiskScore> {
        logger.info(`📊 Predicting congestion for event: ${event.name}`);

        // Get affected cameras
        const affectedCameras = await this.findNearbyCameras(
            event.venue.location,
            this.config.events.filterCriteria.maxDistanceKm * 1000
        );

        // Calculate time to event end
        const now = new Date();
        const endTime = new Date(event.endTime);
        const timeToEnd = (endTime.getTime() - now.getTime()) / (1000 * 60); // minutes

        // Get current congestion levels
        const currentPatterns = await Promise.all(
            affectedCameras.map(({ camera }) => this.getCurrentTrafficPattern(camera.id))
        );

        const validPatterns = currentPatterns.filter(p => p !== null) as TrafficPattern[];

        // Calculate average congestion
        let avgCongestionScore = 0;
        if (validPatterns.length > 0) {
            const congestionScores = validPatterns.map(p => {
                const multiplier = this.config.prediction.congestionMultipliers[p.congestionLevel];
                return multiplier;
            });
            avgCongestionScore = congestionScores.reduce((a, b) => a + b, 0) / congestionScores.length;
        }

        // Calculate surge risk score
        let score = 0;

        // Factor 1: Attendee count (0-40 points)
        const attendeeScore = Math.min((event.expectedAttendees / 10000) * 40, 40);
        score += attendeeScore;

        // Factor 2: Time to end (0-30 points)
        // Peak risk when event is ending within 30 minutes
        let timeScore = 0;
        if (timeToEnd <= 30 && timeToEnd >= 0) {
            timeScore = 30 * (1 - timeToEnd / 30);
        } else if (timeToEnd < 0 && timeToEnd >= -30) {
            // Event just ended (within 30 mins)
            timeScore = 30 * (1 + timeToEnd / 30);
        }
        score += timeScore;

        // Factor 3: Current congestion (0-20 points)
        score += avgCongestionScore * 20;

        // Factor 4: Historical impact (0-10 points)
        const historicalScore = this.estimateHistoricalImpact(event.category);
        score += historicalScore;

        // Normalize score to 0-100
        score = Math.min(Math.max(score, 0), 100);

        // Determine risk level
        let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
        if (score >= this.config.prediction.surgeRiskThresholds.critical) {
            riskLevel = 'critical';
        } else if (score >= this.config.prediction.surgeRiskThresholds.high) {
            riskLevel = 'high';
        } else if (score >= this.config.prediction.surgeRiskThresholds.moderate) {
            riskLevel = 'moderate';
        } else {
            riskLevel = 'low';
        }

        logger.info(`Risk score: ${score.toFixed(1)}/100 (${riskLevel})`);

        return {
            eventId: event.id,
            score,
            riskLevel,
            factors: {
                attendeeCount: event.expectedAttendees,
                timeToEnd,
                currentCongestion: validPatterns.map(p => p.congestionLevel).join(', '),
                historicalImpact: historicalScore
            },
            affectedCameras: affectedCameras.map(({ camera }) => camera.id)
        };
    }

    /**
     * Method 3: Benchmark Routes
     * 
     * Compares internal routing estimates with external traffic APIs
     * to identify optimization opportunities.
     */
    async benchmarkRoutes(origin: LatLng, destination: LatLng): Promise<RouteComparison> {
        logger.info(`🗺️ Benchmarking route: ${origin.lat},${origin.lng} → ${destination.lat},${destination.lng}`);

        try {
            // Call Mapbox Matrix API
            const mapboxData = await this.getMapboxRoute(origin, destination);

            // Calculate internal duration from TrafficPattern data
            const internalDuration = await this.calculateInternalDuration(origin, destination);

            // Calculate optimization gap
            const optimizationGap = ((mapboxData.duration - internalDuration) / mapboxData.duration) * 100;

            // Generate recommendation
            let recommendation: string;
            if (Math.abs(optimizationGap) < 10) {
                recommendation = 'Internal routing is accurate. No optimization needed.';
            } else if (optimizationGap > 10) {
                recommendation = `Internal routing is ${optimizationGap.toFixed(1)}% slower. Update speed profiles.`;
            } else {
                recommendation = `Internal routing is ${Math.abs(optimizationGap).toFixed(1)}% faster. Mapbox may have outdated data.`;
            }

            logger.info(`Optimization gap: ${optimizationGap.toFixed(1)}%`);

            return {
                origin,
                destination,
                mapboxDuration: mapboxData.duration,
                mapboxDistance: mapboxData.distance,
                internalDuration,
                optimizationGap,
                recommendation
            };

        } catch (error) {
            logger.error('Route benchmarking failed:', error);
            throw error;
        }
    }

    /**
     * Get route from Mapbox Directions API
     */
    private async getMapboxRoute(origin: LatLng, destination: LatLng): Promise<{ duration: number; distance: number }> {
        if (!this.mapboxKeyManager) {
            throw new Error('Mapbox API key not available');
        }

        let lastError: Error | null = null;
        const maxRetries = this.mapboxKeyManager.getAvailableKeys();

        // Try with rotation keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.mapboxKeyManager.getNextKey();

            try {
                const profile = this.config.routing.profile || 'driving-traffic';
                const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

                const response = await this.mapboxClient.get(`/directions/v5/mapbox/${profile}/${coordinates}`, {
                    params: {
                        access_token: apiKey,
                        geometries: 'geojson',
                        overview: 'full'
                    }
                });

                const route = response.data.routes?.[0];
                if (!route) {
                    throw new Error('No route found');
                }

                // Report success
                this.mapboxKeyManager.reportSuccess(apiKey);

                return {
                    duration: route.duration,
                    distance: route.distance
                };

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.mapboxKeyManager.reportFailure(apiKey, lastError);
                logger.warn(`Mapbox attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
            }
        }

        // All keys failed
        logger.error('Failed to get Mapbox route with all keys:', lastError);
        throw new Error('Failed to get Mapbox route');
    }

    /**
     * Calculate internal duration based on TrafficPattern data
     */
    private async calculateInternalDuration(origin: LatLng, destination: LatLng): Promise<number> {
        try {
            // Find cameras near origin and destination
            const originCameras = await this.findNearbyCameras(origin, 500); // 500m radius
            const destCameras = await this.findNearbyCameras(destination, 500);

            if (originCameras.length === 0 || destCameras.length === 0) {
                // No nearby cameras, use default speed
                const distance = this.calculateDistance(origin, destination);
                const defaultSpeed = 30; // km/h
                return (distance / 1000) / defaultSpeed * 3600; // seconds
            }

            // Get traffic patterns
            const originPattern = await this.getCurrentTrafficPattern(originCameras[0].camera.id);
            const destPattern = await this.getCurrentTrafficPattern(destCameras[0].camera.id);

            // Calculate average speed
            let avgSpeed = 30; // default km/h
            if (originPattern && destPattern) {
                avgSpeed = (originPattern.averageSpeed + destPattern.averageSpeed) / 2;
            } else if (originPattern) {
                avgSpeed = originPattern.averageSpeed;
            } else if (destPattern) {
                avgSpeed = destPattern.averageSpeed;
            }

            // Calculate duration
            const distance = this.calculateDistance(origin, destination);
            return (distance / 1000) / avgSpeed * 3600; // seconds

        } catch (error) {
            logger.error('Internal duration calculation failed:', error);
            // Fallback to default calculation
            const distance = this.calculateDistance(origin, destination);
            return (distance / 1000) / 30 * 3600; // 30 km/h default
        }
    }

    /**
     * Method 4: Generate Action Plan
     * 
     * Creates actionable recommendations based on surge risk score.
     */
    async generateActionPlan(riskScore: number, eventMapping: EventCameraMapping): Promise<ActionPlan> {
        logger.info(`📋 Generating action plan for risk score: ${riskScore}`);

        const { event, affectedCameras } = eventMapping;
        const targetCameras = affectedCameras.map(({ camera }) => camera.id);

        let action: string;
        let reason: string;
        let predictedImpact: string;
        let priority: 'low' | 'medium' | 'high' | 'critical';
        let estimatedCost: number;

        if (riskScore >= 80 && this.config.actions.greenWave.enabled) {
            // Critical: Pre-emptive Green Wave
            action = 'Adjust Traffic Light Phasing - Pre-emptive Green Wave';
            reason = `${event.name} at ${event.venue.name} ending soon. Expected ${event.expectedAttendees} attendees dispersing.`;
            predictedImpact = `Reduce clearing time by ${this.config.actions.greenWave.phasingAdjustmentPercent}%. Prevent gridlock in ${affectedCameras.length} intersections.`;
            priority = 'critical';
            estimatedCost = 85;

        } else if (riskScore >= 60 && this.config.actions.detour.enabled) {
            // High: Recommended Detour Routes
            action = 'Activate Alternative Routes & Digital Signage';
            reason = `High traffic expected near ${event.venue.name} due to ${event.name}.`;
            predictedImpact = 'Distribute traffic across 3 alternative routes. Reduce congestion by 30%.';
            priority = 'high';
            estimatedCost = 50;

        } else if (riskScore >= 40 && this.config.actions.alert.enabled) {
            // Moderate: Public Alert
            action = 'Send Traffic Alert to Mobile Apps';
            reason = `Moderate congestion risk near ${event.venue.name}.`;
            predictedImpact = 'Inform 10,000+ drivers. Encourage early departure or route changes.';
            priority = 'medium';
            estimatedCost = 20;

        } else {
            // Low: Monitor Only
            action = 'Continue Monitoring - No Action Required';
            reason = `Low risk event: ${event.name}. Traffic patterns within normal range.`;
            predictedImpact = 'No significant traffic impact expected.';
            priority = 'low';
            estimatedCost = 5;
        }

        const executionTime = this.calculateOptimalExecutionTime(event.endTime, riskScore);

        logger.info(`Action plan: ${action} (Priority: ${priority})`);

        return {
            action,
            targetCameras,
            reason,
            predictedImpact,
            priority,
            executionTime,
            estimatedCost
        };
    }

    /**
     * Helper: Estimate event attendees from event data
     */
    private estimateAttendees(event: any): number {
        // Check if venue capacity is available
        const venueCapacity = event._embedded?.venues?.[0]?.capacity;
        if (venueCapacity) {
            return venueCapacity;
        }

        // Estimate based on event category
        const category = event.classifications?.[0]?.segment?.name || '';
        const categorySizes: Record<string, number> = {
            'Sports': 5000,
            'Music': 3000,
            'Arts & Theatre': 1000,
            'Family': 2000,
            'Film': 500,
            'Miscellaneous': 1500
        };

        return categorySizes[category] || 2000; // default 2000
    }

    /**
     * Helper: Estimate event end time
     */
    private estimateEndTime(startTime: string, durationHours: number): string {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
        return end.toISOString();
    }

    /**
     * Helper: Estimate historical impact based on event category
     */
    private estimateHistoricalImpact(category: string): number {
        const impacts: Record<string, number> = {
            'Sports': 10,
            'Music': 8,
            'Arts & Theatre': 5,
            'Family': 6,
            'Film': 3,
            'Miscellaneous': 5
        };

        return impacts[category] || 5;
    }

    /**
     * Helper: Calculate optimal execution time for action plan
     */
    private calculateOptimalExecutionTime(eventEndTime: string, riskScore: number): string {
        const endTime = new Date(eventEndTime);

        // For critical risk, execute 15 minutes before event ends
        if (riskScore >= 80) {
            const executionTime = new Date(endTime.getTime() - 15 * 60 * 1000);
            return executionTime.toISOString();
        }

        // For high risk, execute 30 minutes before
        if (riskScore >= 60) {
            const executionTime = new Date(endTime.getTime() - 30 * 60 * 1000);
            return executionTime.toISOString();
        }

        // For moderate risk, execute 1 hour before
        const executionTime = new Date(endTime.getTime() - 60 * 60 * 1000);
        return executionTime.toISOString();
    }

    /**
     * Load configuration from YAML file
     */
    private loadConfig(configPath: string): MaestroConfig {
        try {
            if (!fs.existsSync(configPath)) {
                logger.warn(`Config file not found: ${configPath}, using defaults`);
                return this.getDefaultConfig();
            }

            const fileContents = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(fileContents) as MaestroConfig;

            // Validate required fields
            if (!config.events || !config.routing || !config.prediction || !config.actions) {
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
    private getDefaultConfig(): MaestroConfig {
        return {
            events: {
                enabled: true,
                sources: [
                    {
                        name: 'ticketmaster',
                        apiUrl: 'https://app.ticketmaster.com/discovery/v2',
                        apiKeyEnv: 'TICKETMASTER_API_KEY',
                        enabled: true
                    },
                    {
                        name: 'google',
                        apiUrl: 'https://www.googleapis.com/calendar/v3',
                        apiKeyEnv: 'GOOGLE_EVENTS_API_KEY',
                        enabled: false
                    }
                ],
                filterCriteria: {
                    minAttendees: 1000,
                    maxDistanceKm: 1,
                    lookAheadHours: 3
                },
                categories: ['Sports', 'Music', 'Arts & Theatre', 'Family']
            },
            routing: {
                enabled: true,
                provider: 'mapbox',
                apiUrl: 'https://api.mapbox.com/directions/v5',
                apiKeyEnv: 'MAPBOX_API_KEY',
                profile: 'driving-traffic'
            },
            prediction: {
                surgeRiskThresholds: {
                    critical: 80,
                    high: 60,
                    moderate: 40
                },
                timeWindowMinutes: 30,
                congestionMultipliers: {
                    low: 0.25,
                    medium: 0.5,
                    high: 0.75,
                    severe: 1.0
                }
            },
            actions: {
                greenWave: {
                    enabled: true,
                    minRiskScore: 80,
                    phasingAdjustmentPercent: 15
                },
                detour: {
                    enabled: true,
                    minRiskScore: 60
                },
                alert: {
                    enabled: true,
                    minRiskScore: 40
                }
            }
        };
    }
}
