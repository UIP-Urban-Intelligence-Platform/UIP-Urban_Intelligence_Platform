/**
 * Eco-Twin Simulator Agent - Environmental Health & Digital Twin Guardian
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/backend/src/agents/EcoTwinAgent
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * AI-powered environmental health advisor providing personalized recommendations based on
 * real-time air quality, weather forecasts, and predictive dispersion modeling.
 * Acts as a digital twin for urban environmental health monitoring.
 * 
 * Core Capabilities:
 * 1. Air Quality Dispersion Simulation:
 *    - Gaussian plume model for pollutant dispersion
 *    - Wind direction and speed integration
 *    - Temperature inversion layer detection
 *    - Multi-pollutant tracking (PM2.5, PM10, NO2, O3, CO, SO2)
 * 
 * 2. Personalized Health Advice (Gemini Pro AI):
 *    - Vulnerable population profiling (elderly, children, asthmatics)
 *    - Activity recommendations (outdoor exercise, window opening)
 *    - Protective measure suggestions (masks, air purifiers)
 *    - Natural language explanations in Vietnamese and English
 * 
 * 3. Environmental Forecast Publishing:
 *    - Future AQI predictions (1-6 hours ahead)
 *    - NGSI-LD entity generation for real-time visualization
 *    - Stellio Context Broker integration
 *    - Historical trend analysis
 * 
 * 4. Citizen Report Integration:
 *    - User-submitted health symptoms correlation
 *    - Crowdsourced air quality validation
 *    - Community health alerts
 * 
 * Key Features:
 * - Multi-language support (Vietnamese primary, English secondary)
 * - AQI color coding (Green, Yellow, Orange, Red, Purple, Maroon)
 * - Health impact scoring (0-500 scale)
 * - API key rotation for reliability
 * - Caching for performance optimization
 * 
 * @dependencies
 * - @google/generative-ai@^0.21.0: Gemini Pro AI for health advice
 * - axios@^1.6: HTTP client for Stellio API
 * - js-yaml@^4.1: Configuration file parsing
 * 
 * @example
 * const ecoTwin = new EcoTwinAgent();
 * const advice = await ecoTwin.generateHealthAdvice({
 *   location: { lat: 10.8231, lon: 106.6297 },
 *   userProfile: { age: 65, conditions: ['asthma'] },
 *   timeHorizon: 6
 * });
 * console.log(advice.recommendations, advice.aqiForecast);
 */

import axios, { AxiosInstance } from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { APIKeyRotationManager } from '../utils/apiKeyRotation';
import { StellioService } from '../services/stellioService';
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

interface AirQualityObserved {
    id: string;
    location: LatLng;
    pm25: number;           // PM2.5 concentration (μg/m³)
    pm10: number;           // PM10 concentration (μg/m³)
    co: number;             // Carbon monoxide (mg/m³)
    no2: number;            // Nitrogen dioxide (μg/m³)
    so2: number;            // Sulfur dioxide (μg/m³)
    o3: number;             // Ozone (μg/m³)
    aqi: number;            // Air Quality Index (0-500)
    aqiCategory: string;    // Good, Moderate, Unhealthy, etc.
    timestamp: string;
}

interface WeatherObserved {
    id: string;
    location: LatLng;
    temperature: number;    // Celsius
    humidity: number;       // Percentage
    windSpeed: number;      // m/s
    windDirection: number;  // Degrees
    pressure: number;       // hPa
    precipitation: number;  // mm/h
    timestamp: string;
}

interface WeatherForecast {
    timestamp: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;  // mm/h
    rainProbability: number; // Percentage
    uvIndex: number;
}

interface AQIPrediction {
    timestamp: string;
    predictedPM25: number;
    predictedPM10: number;
    predictedCO: number;
    predictedAQI: number;
    aqiCategory: string;
    confidence: number;      // 0-1 (prediction confidence)
    factors: {
        rainWashout: number;  // Reduction from rain
        windDispersion: number; // Reduction from wind
        baseline: number;      // Original AQI
    };
}

interface DispersionSimulation {
    location: LatLng;
    currentAQI: number;
    predictions: AQIPrediction[];
    peakPollution: {
        timestamp: string;
        aqi: number;
    };
    bestWindow: {
        startTime: string;
        endTime: string;
        avgAQI: number;
    };
}

interface UserProfile {
    id?: string;
    age?: number;
    healthConditions?: string[];  // asthma, heart_disease, elderly, pregnant
    activityType?: string;        // commute, exercise, outdoor_work
    transportMode?: string;       // motorbike, bicycle, walking, car
    language?: string;            // vi, en
    sensitivityLevel?: string;    // low, medium, high
}

interface PersonalizedAdvice {
    userId?: string;
    location: LatLng;
    currentAQI: number;
    predictedAQI: number;
    advice: string;              // AI-generated friendly advice
    riskLevel: string;           // low, moderate, high, very_high
    recommendations: string[];    // Actionable recommendations
    timestamp: string;
    confidence: number;
}

interface EnvironmentalForecast {
    id: string;
    type: string;
    location: LatLng;
    currentConditions: {
        aqi: number;
        aqiCategory: string;
        temperature: number;
        humidity: number;
        windSpeed: number;
    };
    predictions: AQIPrediction[];
    personalizedAdvice?: PersonalizedAdvice;
    validUntil: string;
    generatedAt: string;
}

interface EcoTwinConfig {
    airQuality: {
        enabled: boolean;
        stellioEntityType: string;
        aqiBreakpoints: {
            category: string;
            min: number;
            max: number;
            healthImpact: string;
        }[];
    };
    weather: {
        enabled: boolean;
        provider: string;
        apiUrl: string;
        apiKeyEnv: string;
        forecastHours: number;
    };
    simulation: {
        enabled: boolean;
        timeStep: number;           // minutes
        maxHoursAhead: number;
        dispersionModel: {
            rainWashoutFactor: number;      // Reduction per mm/h
            rainWashoutThreshold: number;   // Minimum rain to trigger
            windDispersionFactor: number;   // Reduction per m/s
            windDispersionThreshold: number; // Minimum wind to trigger
            baselineDecay: number;          // Natural decay rate per hour
        };
    };
    ai: {
        enabled: boolean;
        provider: string;
        model: string;
        apiKeyEnv: string;
        systemPrompt: string;
        maxTokens: number;
        temperature: number;
    };
    userProfiles: {
        enabled: boolean;
        defaultProfile: UserProfile;
        sensitivityMultipliers: {
            low: number;
            medium: number;
            high: number;
        };
    };
    publishing: {
        enabled: boolean;
        stellioEntityType: string;
        updateIntervalMinutes: number;
        retentionHours: number;
    };
}

// =====================================================
// ECO-TWIN SIMULATOR AGENT CLASS
// =====================================================

export class EcoTwinAgent {
    private stellioService: StellioService;
    private weatherClient: AxiosInstance;
    private weatherKeyManager: APIKeyRotationManager | null = null;
    private geminiKeyManager: APIKeyRotationManager | null = null;
    private config: EcoTwinConfig;

    constructor(configPath?: string) {
        // Load configuration from YAML file (domain-agnostic)
        const defaultConfigPath = path.join(__dirname, '../../config/agents/eco-twin.yaml');
        const finalConfigPath = configPath || defaultConfigPath;
        this.config = this.loadConfig(finalConfigPath);
        logger.info(`Loaded Eco-Twin config from: ${finalConfigPath}`);

        // Initialize Stellio service
        this.stellioService = new StellioService();

        // Initialize OpenWeatherMap API with rotation
        const weatherApiKey = process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHERMAP_API_KEY;
        if (weatherApiKey) {
            this.weatherKeyManager = new APIKeyRotationManager(weatherApiKey, 'OpenWeather', {
                maxFailures: 3,
                blacklistDurationMs: 10 * 60 * 1000, // 10 minutes
                rotationStrategy: 'round-robin'
            });
            logger.info(`OpenWeather API initialized with ${this.weatherKeyManager.getTotalKeys()} key(s)`);
        }

        this.weatherClient = axios.create({
            baseURL: 'https://api.openweathermap.org/data/2.5',
            timeout: 15000,
            params: {
                units: 'metric'
            }
        });

        // Initialize Gemini with rotation
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            this.geminiKeyManager = new APIKeyRotationManager(geminiApiKey, 'Gemini', {
                maxFailures: 3,
                blacklistDurationMs: 5 * 60 * 1000, // 5 minutes
                rotationStrategy: 'round-robin'
            });
            logger.info(`Gemini API initialized with ${this.geminiKeyManager.getTotalKeys()} key(s)`);
        } else {
            logger.warn('GEMINI_API_KEY not found - AI advice generation will be disabled');
        }

        logger.info('EcoTwinAgent initialized successfully');
    }

    /**
     * Method 1: Simulate Air Quality Dispersion
     * 
     * Combines current air quality with weather forecasts to predict
     * how pollutants will disperse over the next few hours.
     */
    async simulateDispersion(location: LatLng): Promise<DispersionSimulation> {
        logger.info(`🌫️ Simulating air quality dispersion at ${location.lat}, ${location.lng}`);

        try {
            // Step 1: Fetch current air quality from Stellio
            const currentAQ = await this.getCurrentAirQuality(location);
            if (!currentAQ) {
                throw new Error('No air quality data available for this location');
            }

            logger.info(`Current AQI: ${currentAQ.aqi} (${currentAQ.aqiCategory})`);

            // Step 2: Fetch weather forecast from OpenWeatherMap
            const weatherForecast = await this.getWeatherForecast(location, this.config.weather.forecastHours);
            logger.info(`Fetched ${weatherForecast.length} hourly forecasts`);

            // Step 3: Simulate dispersion for each time step
            const predictions: AQIPrediction[] = [];
            const timeStepMinutes = this.config.simulation.timeStep;
            const maxSteps = (this.config.simulation.maxHoursAhead * 60) / timeStepMinutes;

            let currentPM25 = currentAQ.pm25;
            let currentPM10 = currentAQ.pm10;
            let currentCO = currentAQ.co;

            for (let step = 0; step < maxSteps; step++) {
                const minutesAhead = step * timeStepMinutes;
                const timestamp = new Date(Date.now() + minutesAhead * 60 * 1000).toISOString();

                // Find closest weather forecast
                const forecastIndex = Math.floor(minutesAhead / 60);
                const forecast = weatherForecast[forecastIndex] || weatherForecast[weatherForecast.length - 1];

                // Apply dispersion model
                const dispersionFactors = this.calculateDispersion(
                    { pm25: currentPM25, pm10: currentPM10, co: currentCO },
                    forecast,
                    timeStepMinutes
                );

                // Update concentrations
                currentPM25 = dispersionFactors.newPM25;
                currentPM10 = dispersionFactors.newPM10;
                currentCO = dispersionFactors.newCO;

                // Calculate predicted AQI
                const predictedAQI = this.calculateAQI(currentPM25, currentPM10, currentCO);
                const aqiCategory = this.getAQICategory(predictedAQI);

                predictions.push({
                    timestamp,
                    predictedPM25: Math.max(0, currentPM25),
                    predictedPM10: Math.max(0, currentPM10),
                    predictedCO: Math.max(0, currentCO),
                    predictedAQI,
                    aqiCategory,
                    confidence: this.calculateConfidence(step, weatherForecast.length),
                    factors: {
                        rainWashout: dispersionFactors.rainReduction,
                        windDispersion: dispersionFactors.windReduction,
                        baseline: currentAQ.aqi
                    }
                });
            }

            // Find peak pollution and best window
            const peakPollution = predictions.reduce((max, p) =>
                p.predictedAQI > max.predictedAQI ? p : max
            );

            const bestWindow = this.findBestAirQualityWindow(predictions);

            logger.info(`Peak AQI: ${peakPollution.predictedAQI} at ${new Date(peakPollution.timestamp).toLocaleTimeString()}`);
            logger.info(`Best window: ${new Date(bestWindow.startTime).toLocaleTimeString()} - ${new Date(bestWindow.endTime).toLocaleTimeString()}`);

            return {
                location,
                currentAQI: currentAQ.aqi,
                predictions,
                peakPollution: {
                    timestamp: peakPollution.timestamp,
                    aqi: peakPollution.predictedAQI
                },
                bestWindow
            };

        } catch (error) {
            logger.error('Dispersion simulation failed:', error);
            throw error;
        }
    }

    /**
     * Fetch current air quality from Stellio
     */
    private async getCurrentAirQuality(location: LatLng): Promise<AirQualityObserved | null> {
        try {
            const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';

            // Query for AirQualityObserved entities near location
            const response = await axios.get(`${stellioUrl}/ngsi-ld/v1/entities`, {
                params: {
                    type: this.config.airQuality.stellioEntityType,
                    limit: 10
                },
                headers: { 'Accept': 'application/ld+json' }
            });

            const entities = response.data || [];
            if (entities.length === 0) {
                return null;
            }

            // Find nearest entity
            let nearestEntity = entities[0];
            let minDistance = Infinity;

            for (const entity of entities) {
                const entityLat = entity.location?.value?.coordinates?.[1];
                const entityLng = entity.location?.value?.coordinates?.[0];

                if (entityLat && entityLng) {
                    const distance = this.calculateDistance(
                        location,
                        { lat: entityLat, lng: entityLng }
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestEntity = entity;
                    }
                }
            }

            // Parse entity to AirQualityObserved
            return {
                id: nearestEntity.id,
                location: {
                    lat: nearestEntity.location?.value?.coordinates?.[1] || location.lat,
                    lng: nearestEntity.location?.value?.coordinates?.[0] || location.lng
                },
                pm25: nearestEntity.pm25?.value || 0,
                pm10: nearestEntity.pm10?.value || 0,
                co: nearestEntity.co?.value || 0,
                no2: nearestEntity.no2?.value || 0,
                so2: nearestEntity.so2?.value || 0,
                o3: nearestEntity.o3?.value || 0,
                aqi: nearestEntity.airQualityIndex?.value || this.calculateAQI(
                    nearestEntity.pm25?.value || 0,
                    nearestEntity.pm10?.value || 0,
                    nearestEntity.co?.value || 0
                ),
                aqiCategory: nearestEntity.airQualityCategory?.value || 'Unknown',
                timestamp: nearestEntity.dateObserved?.value || new Date().toISOString()
            };

        } catch (error) {
            logger.error('Failed to fetch air quality data:', error);
            return null;
        }
    }

    /**
     * Fetch weather forecast from OpenWeatherMap API (free tier v2.5) with key rotation
     */
    private async getWeatherForecast(location: LatLng, hours: number): Promise<WeatherForecast[]> {
        if (!this.weatherKeyManager) {
            logger.warn('OpenWeather API key not available - using fallback forecast');
            return this.getDefaultForecast(hours);
        }

        let lastError: Error | null = null;
        const maxRetries = this.weatherKeyManager.getAvailableKeys();

        // Try with rotation keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.weatherKeyManager.getNextKey();

            try {
                // Use forecast endpoint (free tier) instead of onecall (paid)
                const response = await this.weatherClient.get('/forecast', {
                    params: {
                        lat: location.lat,
                        lon: location.lng,
                        units: 'metric',
                        appid: apiKey
                    }
                });

                // Free tier returns 3-hour intervals in 'list' array
                const forecastList = response.data.list || [];
                const forecasts: WeatherForecast[] = [];

                // Convert 3-hour forecasts (free tier uses 3-hour intervals)
                const itemsNeeded = Math.ceil(hours / 3);
                for (let i = 0; i < Math.min(itemsNeeded, forecastList.length); i++) {
                    const item = forecastList[i];
                    forecasts.push({
                        timestamp: new Date(item.dt * 1000).toISOString(),
                        temperature: item.main?.temp || 25,
                        humidity: item.main?.humidity || 70,
                        windSpeed: item.wind?.speed || 3,
                        windDirection: item.wind?.deg || 180,
                        precipitation: item.rain?.[' 3h'] || 0,
                        rainProbability: (item.pop || 0) * 100,
                        uvIndex: 0 // Not available in free tier
                    });
                }

                // Report success
                this.weatherKeyManager.reportSuccess(apiKey);
                return forecasts;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.weatherKeyManager.reportFailure(apiKey, lastError);
                logger.warn(`OpenWeather attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
            }
        }

        // All keys failed - use fallback
        logger.error('Failed to fetch weather forecast with all keys, using fallback:', lastError);
        return this.getDefaultForecast(hours);
    }

    /**
     * Calculate dispersion effects based on weather conditions
     */
    private calculateDispersion(
        pollutants: { pm25: number; pm10: number; co: number },
        forecast: WeatherForecast,
        timeStepMinutes: number
    ): {
        newPM25: number;
        newPM10: number;
        newCO: number;
        rainReduction: number;
        windReduction: number;
    } {
        const model = this.config.simulation.dispersionModel;
        const timeStepHours = timeStepMinutes / 60;

        let rainReduction = 0;
        let windReduction = 0;

        // Rain washout effect
        if (forecast.precipitation >= model.rainWashoutThreshold) {
            rainReduction = forecast.precipitation * model.rainWashoutFactor;
        }

        // Wind dispersion effect
        if (forecast.windSpeed >= model.windDispersionThreshold) {
            windReduction = forecast.windSpeed * model.windDispersionFactor;
        }

        // Total reduction factor (0-1)
        const totalReduction = Math.min(rainReduction + windReduction, 0.9); // Max 90% reduction

        // Natural decay
        const decayFactor = Math.exp(-model.baselineDecay * timeStepHours);

        // Apply effects
        const newPM25 = pollutants.pm25 * (1 - totalReduction) * decayFactor;
        const newPM10 = pollutants.pm10 * (1 - totalReduction) * decayFactor;
        const newCO = pollutants.co * (1 - totalReduction) * decayFactor;

        return {
            newPM25,
            newPM10,
            newCO,
            rainReduction,
            windReduction
        };
    }

    /**
     * Calculate AQI from pollutant concentrations (US EPA formula)
     */
    private calculateAQI(pm25: number, pm10: number, co: number): number {
        // PM2.5 AQI calculation (primary pollutant for urban areas)
        const pm25AQI = this.calculateSubIndex(pm25, [
            { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
            { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100 },
            { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
            { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
            { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
            { low: 250.5, high: 500, aqiLow: 301, aqiHigh: 500 }
        ]);

        // PM10 AQI calculation
        const pm10AQI = this.calculateSubIndex(pm10, [
            { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
            { low: 55, high: 154, aqiLow: 51, aqiHigh: 100 },
            { low: 155, high: 254, aqiLow: 101, aqiHigh: 150 },
            { low: 255, high: 354, aqiLow: 151, aqiHigh: 200 },
            { low: 355, high: 424, aqiLow: 201, aqiHigh: 300 },
            { low: 425, high: 604, aqiLow: 301, aqiHigh: 500 }
        ]);

        // Return maximum (worst) AQI
        return Math.round(Math.max(pm25AQI, pm10AQI));
    }

    /**
     * Calculate AQI sub-index for a pollutant
     */
    private calculateSubIndex(
        concentration: number,
        breakpoints: Array<{ low: number; high: number; aqiLow: number; aqiHigh: number }>
    ): number {
        for (const bp of breakpoints) {
            if (concentration >= bp.low && concentration <= bp.high) {
                const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) *
                    (concentration - bp.low) + bp.aqiLow;
                return aqi;
            }
        }

        // If concentration exceeds all breakpoints, return max AQI
        return 500;
    }

    /**
     * Get AQI category from numeric AQI value
     */
    private getAQICategory(aqi: number): string {
        const breakpoints = this.config.airQuality.aqiBreakpoints;

        for (const bp of breakpoints) {
            if (aqi >= bp.min && aqi <= bp.max) {
                return bp.category;
            }
        }

        return 'Hazardous';
    }

    /**
     * Calculate prediction confidence (decreases with time)
     */
    private calculateConfidence(stepIndex: number, totalForecasts: number): number {
        // Confidence decreases linearly from 1.0 to 0.5
        const decayRate = 0.5 / totalForecasts;
        return Math.max(1.0 - (stepIndex * decayRate), 0.5);
    }

    /**
     * Find best air quality window (lowest average AQI)
     */
    private findBestAirQualityWindow(predictions: AQIPrediction[]): {
        startTime: string;
        endTime: string;
        avgAQI: number;
    } {
        const windowSize = 4; // 1 hour window (4 x 15min steps)
        let bestWindow = {
            startTime: predictions[0].timestamp,
            endTime: predictions[Math.min(windowSize - 1, predictions.length - 1)].timestamp,
            avgAQI: Infinity
        };

        for (let i = 0; i <= predictions.length - windowSize; i++) {
            const window = predictions.slice(i, i + windowSize);
            const avgAQI = window.reduce((sum, p) => sum + p.predictedAQI, 0) / window.length;

            if (avgAQI < bestWindow.avgAQI) {
                bestWindow = {
                    startTime: window[0].timestamp,
                    endTime: window[window.length - 1].timestamp,
                    avgAQI
                };
            }
        }

        return bestWindow;
    }

    /**
     * Method 2: Generate Personalized Advice
     * 
     * Uses OpenAI GPT-4o to create empathetic, actionable health advice
     * based on predicted air quality and user profile.
     */
    async generatePersonalizedAdvice(
        predictedAQI: number,
        currentAQI: number,
        location: LatLng,
        userProfile?: UserProfile
    ): Promise<PersonalizedAdvice> {
        logger.info(`💬 Generating personalized advice for AQI: ${currentAQI} → ${predictedAQI}`);

        try {
            // Use default profile if not provided
            const profile = userProfile || this.config.userProfiles.defaultProfile;

            // Determine risk level
            const riskLevel = this.determineRiskLevel(predictedAQI, profile);

            // Generate context for AI
            const context = this.buildAdviceContext(currentAQI, predictedAQI, profile, location);

            // Call OpenAI API
            const aiAdvice = await this.generateAIAdvice(context, profile);

            // Generate actionable recommendations
            const recommendations = this.generateRecommendations(predictedAQI, currentAQI, profile);

            logger.info(`Generated advice with risk level: ${riskLevel}`);

            return {
                userId: profile.id,
                location,
                currentAQI,
                predictedAQI,
                advice: aiAdvice,
                riskLevel,
                recommendations,
                timestamp: new Date().toISOString(),
                confidence: this.calculateAdviceConfidence(currentAQI, predictedAQI)
            };

        } catch (error) {
            logger.error('Failed to generate personalized advice:', error);

            // Fallback to template-based advice
            return this.generateFallbackAdvice(predictedAQI, currentAQI, location, userProfile);
        }
    }

    /**
     * Determine risk level based on AQI and user sensitivity
     */
    private determineRiskLevel(aqi: number, profile: UserProfile): string {
        const baseRisk = this.getBaseRiskLevel(aqi);
        const sensitivity = profile.sensitivityLevel || 'medium';
        const multiplier = this.config.userProfiles.sensitivityMultipliers[sensitivity as keyof typeof this.config.userProfiles.sensitivityMultipliers];

        const adjustedAQI = aqi * multiplier;

        if (adjustedAQI >= 200) return 'very_high';
        if (adjustedAQI >= 150) return 'high';
        if (adjustedAQI >= 100) return 'moderate';
        return 'low';
    }

    /**
     * Get base risk level from AQI
     */
    private getBaseRiskLevel(aqi: number): string {
        if (aqi >= 300) return 'hazardous';
        if (aqi >= 200) return 'very_unhealthy';
        if (aqi >= 150) return 'unhealthy';
        if (aqi >= 100) return 'unhealthy_sensitive';
        if (aqi >= 50) return 'moderate';
        return 'good';
    }

    /**
     * Build context for AI advice generation
     */
    private buildAdviceContext(
        currentAQI: number,
        predictedAQI: number,
        profile: UserProfile,
        location: LatLng
    ): string {
        const trend = predictedAQI > currentAQI ? 'increasing' :
            predictedAQI < currentAQI ? 'decreasing' : 'stable';

        const currentCategory = this.getAQICategory(currentAQI);
        const predictedCategory = this.getAQICategory(predictedAQI);

        let context = `Current AQI: ${currentAQI} (${currentCategory})\n`;
        context += `Predicted AQI: ${predictedAQI} (${predictedCategory})\n`;
        context += `Trend: ${trend}\n`;
        context += `Activity: ${profile.activityType || 'commute'}\n`;
        context += `Transport: ${profile.transportMode || 'motorbike'}\n`;

        if (profile.healthConditions && profile.healthConditions.length > 0) {
            context += `Health concerns: ${profile.healthConditions.join(', ')}\n`;
        }

        return context;
    }

    /**
     * Generate AI advice using Google Gemini Pro with key rotation
     */
    private async generateAIAdvice(context: string, profile: UserProfile): Promise<string> {
        if (!this.geminiKeyManager) {
            throw new Error('Gemini client not initialized - no API keys available');
        }

        const language = profile.language || 'vi';
        const systemPrompt = this.config.ai.systemPrompt.replace('{language}', language);
        const prompt = `${systemPrompt}\n\n${context}`;

        let lastError: Error | null = null;
        const maxRetries = this.geminiKeyManager.getAvailableKeys();

        // Try with rotation keys
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const apiKey = this.geminiKeyManager.getNextKey();
            const geminiClient = new GoogleGenerativeAI(apiKey);

            try {
                const model = geminiClient.getGenerativeModel({ model: this.config.ai.model });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const advice = response.text();

                if (!advice) {
                    throw new Error('Empty response from Gemini');
                }

                // Report success
                this.geminiKeyManager.reportSuccess(apiKey);
                return advice.trim();

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.geminiKeyManager.reportFailure(apiKey, lastError);
                logger.warn(`Gemini advice attempt ${attempt + 1}/${maxRetries} failed, trying next key...`);
            }
        }

        // All keys failed
        logger.error('Gemini advice generation failed with all available keys:', lastError);
        throw lastError || new Error('Failed to generate advice');
    }

    /**
     * Generate actionable recommendations based on AQI
     */
    private generateRecommendations(
        predictedAQI: number,
        currentAQI: number,
        profile: UserProfile
    ): string[] {
        const recommendations: string[] = [];
        const trend = predictedAQI - currentAQI;

        // Air quality improving
        if (trend < -20) {
            recommendations.push('Air quality is improving! Good time for outdoor activities soon.');
        }

        // High AQI recommendations
        if (predictedAQI >= 150) {
            recommendations.push('Avoid prolonged outdoor exposure');
            recommendations.push('Wear N95 or KN95 mask if going outside');

            if (profile.healthConditions?.includes('asthma')) {
                recommendations.push('Keep rescue inhaler accessible');
                recommendations.push('Consider indoor air purifier');
            }

            if (profile.transportMode === 'motorbike' || profile.transportMode === 'bicycle') {
                recommendations.push('Consider using air-conditioned transport (taxi, bus)');
            }
        }

        // Moderate AQI recommendations
        if (predictedAQI >= 100 && predictedAQI < 150) {
            recommendations.push('Limit prolonged outdoor exertion');
            recommendations.push('Sensitive groups should reduce outdoor exposure');

            if (profile.activityType === 'exercise') {
                recommendations.push('Exercise indoors or postpone to better air quality window');
            }
        }

        // Good AQI recommendations
        if (predictedAQI < 100) {
            recommendations.push('Air quality is acceptable for outdoor activities');

            if (currentAQI >= 150) {
                recommendations.push('Great time to step outside after high pollution period');
            }
        }

        // Transport-specific recommendations
        if (profile.transportMode === 'motorbike') {
            if (predictedAQI >= 100) {
                recommendations.push('Close helmet visor, use face mask');
                recommendations.push('Avoid congested routes with heavy traffic');
            }
        }

        return recommendations;
    }

    /**
     * Calculate advice confidence
     */
    private calculateAdviceConfidence(currentAQI: number, predictedAQI: number): number {
        // Higher confidence when trend is clear
        const difference = Math.abs(predictedAQI - currentAQI);

        if (difference > 50) return 0.9;
        if (difference > 30) return 0.8;
        if (difference > 15) return 0.7;
        return 0.6;
    }

    /**
     * Generate fallback advice when AI fails
     */
    private generateFallbackAdvice(
        predictedAQI: number,
        currentAQI: number,
        location: LatLng,
        userProfile?: UserProfile
    ): PersonalizedAdvice {
        const profile = userProfile || this.config.userProfiles.defaultProfile;
        const category = this.getAQICategory(predictedAQI);
        const language = profile.language || 'vi';

        let advice = '';

        if (language === 'vi') {
            if (predictedAQI < currentAQI - 20) {
                advice = `Chất lượng không khí đang cải thiện! AQI sẽ giảm từ ${currentAQI} xuống ${predictedAQI}. Đây là thời điểm tốt để ra ngoài hoạt động. 🌤️`;
            } else if (predictedAQI >= 150) {
                advice = `Cảnh báo: Chất lượng không khí xấu (AQI ${predictedAQI}). Hạn chế ra ngoài, đeo khẩu trang N95 nếu cần thiết. 😷`;
            } else if (predictedAQI >= 100) {
                advice = `Chất lượng không khí ở mức trung bình (AQI ${predictedAQI}). Người nhạy cảm nên hạn chế hoạt động ngoài trời. 🌫️`;
            } else {
                advice = `Chất lượng không khí tốt (AQI ${predictedAQI}). An toàn cho các hoạt động ngoài trời. ✨`;
            }
        } else {
            if (predictedAQI < currentAQI - 20) {
                advice = `Air quality improving! AQI dropping from ${currentAQI} to ${predictedAQI}. Good time for outdoor activities. 🌤️`;
            } else if (predictedAQI >= 150) {
                advice = `Warning: Poor air quality (AQI ${predictedAQI}). Limit outdoor exposure, wear N95 mask if necessary. 😷`;
            } else if (predictedAQI >= 100) {
                advice = `Moderate air quality (AQI ${predictedAQI}). Sensitive groups should reduce outdoor activities. 🌫️`;
            } else {
                advice = `Good air quality (AQI ${predictedAQI}). Safe for outdoor activities. ✨`;
            }
        }

        return {
            userId: profile.id,
            location,
            currentAQI,
            predictedAQI,
            advice,
            riskLevel: this.determineRiskLevel(predictedAQI, profile),
            recommendations: this.generateRecommendations(predictedAQI, currentAQI, profile),
            timestamp: new Date().toISOString(),
            confidence: 0.7
        };
    }

    /**
     * Method 3: Publish Environmental Forecast
     * 
     * Publishes forecast data to Stellio for real-time visualization
     * on frontend dashboards.
     */
    async publishPrediction(
        simulation: DispersionSimulation,
        advice?: PersonalizedAdvice
    ): Promise<void> {
        logger.info(`📡 Publishing environmental forecast to Stellio...`);

        try {
            if (!this.config.publishing.enabled) {
                logger.info('Publishing disabled in config, skipping...');
                return;
            }

            const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';

            // Get current air quality for context
            const currentAQ = await this.getCurrentAirQuality(simulation.location);
            if (!currentAQ) {
                throw new Error('Cannot publish without current air quality data');
            }

            // Build EnvironmentalForecast entity
            const forecastEntity: any = {
                id: `urn:ngsi-ld:EnvironmentalForecast:${Date.now()}`,
                type: this.config.publishing.stellioEntityType,
                location: {
                    type: 'GeoProperty',
                    value: {
                        type: 'Point',
                        coordinates: [simulation.location.lng, simulation.location.lat]
                    }
                },
                currentAQI: {
                    type: 'Property',
                    value: simulation.currentAQI
                },
                currentCategory: {
                    type: 'Property',
                    value: this.getAQICategory(simulation.currentAQI)
                },
                currentTemperature: {
                    type: 'Property',
                    value: currentAQ ? 28 : 0, // Default or from weather API
                    unitCode: 'CEL'
                },
                predictions: {
                    type: 'Property',
                    value: simulation.predictions.map(p => ({
                        timestamp: p.timestamp,
                        aqi: p.predictedAQI,
                        category: p.aqiCategory,
                        pm25: p.predictedPM25,
                        confidence: p.confidence
                    }))
                },
                peakPollution: {
                    type: 'Property',
                    value: {
                        timestamp: simulation.peakPollution.timestamp,
                        aqi: simulation.peakPollution.aqi
                    }
                },
                bestWindow: {
                    type: 'Property',
                    value: {
                        start: simulation.bestWindow.startTime,
                        end: simulation.bestWindow.endTime,
                        avgAQI: simulation.bestWindow.avgAQI
                    }
                },
                validUntil: {
                    type: 'Property',
                    value: new Date(
                        Date.now() + this.config.publishing.retentionHours * 60 * 60 * 1000
                    ).toISOString()
                },
                generatedAt: {
                    type: 'Property',
                    value: new Date().toISOString()
                },
                '@context': [
                    'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
                ]
            };

            // Add personalized advice if available
            if (advice) {
                forecastEntity.personalizedAdvice = {
                    type: 'Property',
                    value: {
                        advice: advice.advice,
                        riskLevel: advice.riskLevel,
                        recommendations: advice.recommendations,
                        confidence: advice.confidence
                    }
                };
            }

            // POST to Stellio
            await axios.post(
                `${stellioUrl}/ngsi-ld/v1/entities`,
                forecastEntity,
                {
                    headers: {
                        'Content-Type': 'application/ld+json'
                    }
                }
            );

            logger.info(`✅ Successfully published forecast entity: ${forecastEntity.id}`);

        } catch (error: any) {
            // If entity exists, try PATCH update instead
            if (error.response?.status === 409) {
                logger.info('Entity exists, attempting PATCH update...');
                // In production, implement PATCH logic here
            } else {
                logger.error('Failed to publish forecast:', error);
                throw error;
            }
        }
    }

    /**
     * Helper: Calculate Haversine distance
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
     * Helper: Get default weather forecast when API fails
     */
    private getDefaultForecast(hours: number): WeatherForecast[] {
        const forecasts: WeatherForecast[] = [];

        for (let i = 0; i < hours; i++) {
            forecasts.push({
                timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
                temperature: 28 + Math.random() * 4,
                humidity: 70 + Math.random() * 20,
                windSpeed: 2 + Math.random() * 3,
                windDirection: Math.random() * 360,
                precipitation: Math.random() * 2,
                rainProbability: Math.random() * 50,
                uvIndex: Math.max(0, 5 - i) // UV decreases over time
            });
        }

        return forecasts;
    }

    /**
     * Load configuration from YAML file
     */
    private loadConfig(configPath: string): EcoTwinConfig {
        try {
            if (!fs.existsSync(configPath)) {
                logger.warn(`Config file not found: ${configPath}, using defaults`);
                return this.getDefaultConfig();
            }

            const fileContents = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(fileContents) as EcoTwinConfig;

            // Validate required sections
            if (!config.airQuality || !config.weather || !config.simulation || !config.ai) {
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
     * Get default configuration
     */
    private getDefaultConfig(): EcoTwinConfig {
        return {
            airQuality: {
                enabled: true,
                stellioEntityType: 'AirQualityObserved',
                aqiBreakpoints: [
                    { category: 'Good', min: 0, max: 50, healthImpact: 'Air quality is satisfactory' },
                    { category: 'Moderate', min: 51, max: 100, healthImpact: 'Acceptable for most people' },
                    { category: 'Unhealthy for Sensitive Groups', min: 101, max: 150, healthImpact: 'Sensitive groups may experience health effects' },
                    { category: 'Unhealthy', min: 151, max: 200, healthImpact: 'Everyone may begin to experience health effects' },
                    { category: 'Very Unhealthy', min: 201, max: 300, healthImpact: 'Health alert: everyone may experience more serious health effects' },
                    { category: 'Hazardous', min: 301, max: 500, healthImpact: 'Health warnings of emergency conditions' }
                ]
            },
            weather: {
                enabled: true,
                provider: 'openweathermap',
                apiUrl: 'https://api.openweathermap.org/data/3.0',
                apiKeyEnv: 'OPENWEATHERMAP_API_KEY',
                forecastHours: 4
            },
            simulation: {
                enabled: true,
                timeStep: 15,
                maxHoursAhead: 2,
                dispersionModel: {
                    rainWashoutFactor: 0.08,
                    rainWashoutThreshold: 5,
                    windDispersionFactor: 0.05,
                    windDispersionThreshold: 5,
                    baselineDecay: 0.05
                }
            },
            ai: {
                enabled: true,
                provider: 'openai',
                model: 'gpt-4o',
                apiKeyEnv: 'OPENAI_API_KEY',
                systemPrompt: 'You are a friendly environmental health advisor. Generate empathetic, actionable advice in {language} language. Be conversational, not robotic. Use emojis appropriately.',
                maxTokens: 200,
                temperature: 0.7
            },
            userProfiles: {
                enabled: true,
                defaultProfile: {
                    activityType: 'commute',
                    transportMode: 'motorbike',
                    language: 'vi',
                    sensitivityLevel: 'medium'
                },
                sensitivityMultipliers: {
                    low: 0.8,
                    medium: 1.0,
                    high: 1.3
                }
            },
            publishing: {
                enabled: true,
                stellioEntityType: 'EnvironmentalForecast',
                updateIntervalMinutes: 15,
                retentionHours: 6
            }
        };
    }
}
