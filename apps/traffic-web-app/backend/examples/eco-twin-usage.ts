/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * @module apps/traffic-web-app/backend/examples/eco-twin-usage
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * Eco-Twin Simulator Agent - Comprehensive Usage Examples.
 * Demonstrates how to use the EcoTwinAgent for environmental health
 * monitoring, air quality dispersion simulation, and personalized
 * health advice generation.
 * 
 * Example Scenarios:
 * 1. Basic Air Quality Simulation: Gaussian plume dispersion model
 * 2. Health Advice Generation: Personalized recommendations for vulnerable groups
 * 3. Environmental Forecasting: 1-6 hour AQI predictions
 * 4. Citizen Report Integration: Crowdsourced air quality validation
 * 
 * Core Capabilities:
 * - Gaussian plume model for pollutant dispersion
 * - Wind integration from WeatherObserved entities
 * - Multi-pollutant tracking (PM2.5, PM10, NO2, O3, CO, SO2)
 * - Gemini Pro AI for health advice generation
 * - Multi-language support (Vietnamese/English)
 * - NGSI-LD entity publishing to Stellio
 * 
 * @dependencies
 * - EcoTwinAgent: Environmental health advisor
 * 
 * @usage
 * ```bash
 * # Run all examples
 * npx ts-node examples/eco-twin-usage.ts
 * 
 * # Run specific example
 * npx ts-node examples/eco-twin-usage.ts --example 2
 * ```
 */

import { EcoTwinAgent } from '../src/agents/EcoTwinAgent';
import { logger } from '../src/utils/logger';

/**
 * Eco-Twin Simulator Agent - Usage Examples
 * 
 * Demonstrates how to use the Eco-Twin Agent for environmental health
 * monitoring and personalized air quality advice.
 */

// =====================================================
// EXAMPLE 1: Basic Air Quality Simulation
// =====================================================

async function example1_BasicSimulation() {
    console.log('\n=== Example 1: Basic Air Quality Simulation ===\n');

    const agent = new EcoTwinAgent();

    try {
        // Simulate dispersion for a location in HCMC
        const location = {
            lat: 10.7720,
            lng: 106.6980
        };

        console.log(`Simulating air quality dispersion at District 1, HCMC...`);
        console.log(`Location: ${location.lat}, ${location.lng}\n`);

        const simulation = await agent.simulateDispersion(location);

        console.log(`📊 Simulation Results:`);
        console.log(`   Current AQI: ${simulation.currentAQI}`);
        console.log(`   Predictions: ${simulation.predictions.length} time steps`);
        console.log(`   Peak pollution: AQI ${simulation.peakPollution.aqi} at ${new Date(simulation.peakPollution.timestamp).toLocaleTimeString()}`);
        console.log(`   Best air quality window: ${new Date(simulation.bestWindow.startTime).toLocaleTimeString()} - ${new Date(simulation.bestWindow.endTime).toLocaleTimeString()}`);
        console.log(`   Average AQI in best window: ${simulation.bestWindow.avgAQI.toFixed(1)}\n`);

        // Display prediction timeline
        console.log(`📈 Prediction Timeline:`);
        simulation.predictions.forEach((prediction, index) => {
            if (index % 4 === 0) { // Show hourly updates
                const time = new Date(prediction.timestamp).toLocaleTimeString();
                console.log(`   ${time}: AQI ${prediction.predictedAQI} (${prediction.aqiCategory}) - Confidence ${(prediction.confidence * 100).toFixed(0)}%`);
            }
        });

        console.log('\n');

    } catch (error) {
        logger.error('Example 1 failed:', error);
    }
}

// =====================================================
// EXAMPLE 2: Personalized Advice Generation
// =====================================================

async function example2_PersonalizedAdvice() {
    console.log('\n=== Example 2: Personalized Advice Generation ===\n');

    const agent = new EcoTwinAgent();

    try {
        const location = { lat: 10.7720, lng: 106.6980 };

        // Simulate different user profiles
        const profiles = [
            {
                id: 'user_001',
                age: 28,
                activityType: 'commute',
                transportMode: 'motorbike',
                language: 'vi',
                sensitivityLevel: 'medium',
                healthConditions: []
            },
            {
                id: 'user_002',
                age: 65,
                activityType: 'exercise',
                transportMode: 'walking',
                language: 'vi',
                sensitivityLevel: 'high',
                healthConditions: ['elderly', 'heart_disease']
            },
            {
                id: 'user_003',
                age: 32,
                activityType: 'outdoor_work',
                transportMode: 'bicycle',
                language: 'en',
                sensitivityLevel: 'low',
                healthConditions: []
            }
        ];

        // Simulate different AQI scenarios
        const scenarios = [
            { name: 'Improving air quality', current: 150, predicted: 80 },
            { name: 'Worsening air quality', current: 80, predicted: 150 },
            { name: 'High pollution', current: 180, predicted: 185 },
            { name: 'Good air quality', current: 45, predicted: 40 }
        ];

        for (const scenario of scenarios) {
            console.log(`\n--- Scenario: ${scenario.name} ---`);
            console.log(`Current AQI: ${scenario.current}, Predicted: ${scenario.predicted}\n`);

            for (const profile of profiles) {
                const advice = await agent.generatePersonalizedAdvice(
                    scenario.predicted,
                    scenario.current,
                    location,
                    profile
                );

                console.log(`👤 User: ${profile.id} (${profile.age}y, ${profile.transportMode})`);
                console.log(`   Health: ${profile.healthConditions.length > 0 ? profile.healthConditions.join(', ') : 'Healthy'}`);
                console.log(`   Risk Level: ${advice.riskLevel}`);
                console.log(`   Advice: ${advice.advice}`);
                console.log(`   Recommendations:`);
                advice.recommendations.forEach(rec => {
                    console.log(`     • ${rec}`);
                });
                console.log('');
            }

            console.log('---\n');
        }

    } catch (error) {
        logger.error('Example 2 failed:', error);
    }
}

// =====================================================
// EXAMPLE 3: Complete Workflow (Simulate + Advise + Publish)
// =====================================================

async function example3_CompleteWorkflow() {
    console.log('\n=== Example 3: Complete Workflow ===\n');

    const agent = new EcoTwinAgent();

    try {
        const location = { lat: 10.7720, lng: 106.6980 };

        // Step 1: Simulate dispersion
        console.log('Step 1: Simulating air quality dispersion...');
        const simulation = await agent.simulateDispersion(location);
        console.log(`✅ Simulation complete: ${simulation.predictions.length} predictions generated\n`);

        // Step 2: Generate personalized advice
        console.log('Step 2: Generating personalized advice...');
        const userProfile = {
            id: 'user_demo',
            age: 35,
            activityType: 'commute' as const,
            transportMode: 'motorbike' as const,
            language: 'vi' as const,
            sensitivityLevel: 'medium' as const,
            healthConditions: []
        };

        const nearTermPrediction = simulation.predictions[4]; // 1 hour ahead
        const advice = await agent.generatePersonalizedAdvice(
            nearTermPrediction.predictedAQI,
            simulation.currentAQI,
            location,
            userProfile
        );

        console.log(`✅ Advice generated:`);
        console.log(`   ${advice.advice}\n`);

        // Step 3: Publish to Stellio
        console.log('Step 3: Publishing forecast to Stellio...');
        await agent.publishPrediction(simulation, advice);
        console.log('✅ Forecast published successfully\n');

        // Display summary
        console.log('📋 Workflow Summary:');
        console.log(`   Location: ${location.lat}, ${location.lng}`);
        console.log(`   Current AQI: ${simulation.currentAQI}`);
        console.log(`   Predicted AQI (1h): ${nearTermPrediction.predictedAQI}`);
        console.log(`   Risk Level: ${advice.riskLevel}`);
        console.log(`   Confidence: ${(advice.confidence * 100).toFixed(0)}%`);
        console.log(`   Published: EnvironmentalForecast entity to Stellio\n`);

    } catch (error) {
        logger.error('Example 3 failed:', error);
    }
}

// =====================================================
// EXAMPLE 4: Rain Washout Effect Demonstration
// =====================================================

async function example4_RainWashoutEffect() {
    console.log('\n=== Example 4: Rain Washout Effect ===\n');

    const agent = new EcoTwinAgent();

    try {
        console.log('Demonstrating how rain reduces PM2.5 pollution...\n');

        // This example shows the simulation algorithm in action
        // Actual weather data would come from OpenWeatherMap API

        console.log('Scenario: Heavy pollution (PM2.5: 150 μg/m³)');
        console.log('Weather: Rain starting in 30 minutes (10mm/h)\n');

        const location = { lat: 10.7720, lng: 106.6980 };
        const simulation = await agent.simulateDispersion(location);

        // Find when rain starts having effect
        const significantDrops = simulation.predictions.filter((p, i) => {
            if (i === 0) return false;
            const prevAQI = simulation.predictions[i - 1].predictedAQI;
            const drop = prevAQI - p.predictedAQI;
            return drop > 10 && p.factors.rainWashout > 0;
        });

        if (significantDrops.length > 0) {
            console.log('💧 Rain Washout Effects Detected:');
            significantDrops.forEach(drop => {
                const time = new Date(drop.timestamp).toLocaleTimeString();
                console.log(`   ${time}: AQI dropped to ${drop.predictedAQI}`);
                console.log(`     Rain reduction: ${(drop.factors.rainWashout * 100).toFixed(1)}%`);
                console.log(`     PM2.5: ${drop.predictedPM25.toFixed(1)} μg/m³\n`);
            });
        } else {
            console.log('No significant rain events detected in forecast period.\n');
        }

        // Best time to go outside
        console.log(`✨ Best Air Quality Window:`);
        console.log(`   Time: ${new Date(simulation.bestWindow.startTime).toLocaleTimeString()} - ${new Date(simulation.bestWindow.endTime).toLocaleTimeString()}`);
        console.log(`   Average AQI: ${simulation.bestWindow.avgAQI.toFixed(1)}`);
        console.log(`   Recommendation: Ideal for outdoor activities!\n`);

    } catch (error) {
        logger.error('Example 4 failed:', error);
    }
}

// =====================================================
// EXAMPLE 5: Multi-Location Monitoring
// =====================================================

async function example5_MultiLocationMonitoring() {
    console.log('\n=== Example 5: Multi-Location Monitoring ===\n');

    const agent = new EcoTwinAgent();

    try {
        // Monitor multiple districts in HCMC
        const locations = [
            { name: 'District 1 (Ben Thanh)', lat: 10.7720, lng: 106.6980 },
            { name: 'District 7 (Phu My Hung)', lat: 10.7260, lng: 106.7190 },
            { name: 'Thu Duc City', lat: 10.8500, lng: 106.7700 },
            { name: 'Tan Binh (Airport)', lat: 10.8180, lng: 106.6560 }
        ];

        console.log(`Monitoring ${locations.length} locations in HCMC...\n`);

        const results = [];

        for (const loc of locations) {
            console.log(`📍 ${loc.name}...`);

            const simulation = await agent.simulateDispersion({
                lat: loc.lat,
                lng: loc.lng
            });

            results.push({
                name: loc.name,
                currentAQI: simulation.currentAQI,
                peakAQI: simulation.peakPollution.aqi,
                bestWindowAQI: simulation.bestWindow.avgAQI
            });

            console.log(`   Current: ${simulation.currentAQI}, Peak: ${simulation.peakPollution.aqi}, Best Window: ${simulation.bestWindow.avgAQI.toFixed(1)}\n`);
        }

        // Find cleanest location
        const cleanest = results.reduce((min, loc) =>
            loc.bestWindowAQI < min.bestWindowAQI ? loc : min
        );

        const mostPolluted = results.reduce((max, loc) =>
            loc.peakAQI > max.peakAQI ? loc : max
        );

        console.log('📊 Summary:');
        console.log(`   Cleanest location: ${cleanest.name} (AQI ${cleanest.bestWindowAQI.toFixed(1)})`);
        console.log(`   Most polluted: ${mostPolluted.name} (Peak AQI ${mostPolluted.peakAQI})\n`);

    } catch (error) {
        logger.error('Example 5 failed:', error);
    }
}

// =====================================================
// EXAMPLE 6: Real-Time Monitoring Loop
// =====================================================

async function example6_RealtimeMonitoring() {
    console.log('\n=== Example 6: Real-Time Monitoring Loop ===\n');

    const agent = new EcoTwinAgent();

    try {
        const location = { lat: 10.7720, lng: 106.6980 };
        const userProfile = {
            id: 'realtime_user',
            age: 30,
            activityType: 'commute' as const,
            transportMode: 'motorbike' as const,
            language: 'vi' as const,
            sensitivityLevel: 'medium' as const,
            healthConditions: []
        };

        console.log('Starting real-time monitoring loop...');
        console.log('Updating every 15 minutes (simulated)\n');

        // Simulate 3 monitoring cycles
        for (let cycle = 1; cycle <= 3; cycle++) {
            console.log(`--- Cycle ${cycle} at ${new Date().toLocaleTimeString()} ---\n`);

            // Simulate + Advise + Publish
            const simulation = await agent.simulateDispersion(location);

            const nearTermAQI = simulation.predictions[4].predictedAQI;
            const advice = await agent.generatePersonalizedAdvice(
                nearTermAQI,
                simulation.currentAQI,
                location,
                userProfile
            );

            // Publish to Stellio
            await agent.publishPrediction(simulation, advice);

            console.log(`✅ Cycle ${cycle} Complete:`);
            console.log(`   Current AQI: ${simulation.currentAQI}`);
            console.log(`   Predicted (1h): ${nearTermAQI}`);
            console.log(`   Advice: ${advice.advice.substring(0, 80)}...`);
            console.log(`   Published: EnvironmentalForecast entity\n`);

            // Check for alerts
            if (advice.riskLevel === 'high' || advice.riskLevel === 'very_high') {
                console.log(`🚨 ALERT: ${advice.riskLevel.toUpperCase()} risk level!`);
                console.log(`   Action required: ${advice.recommendations[0]}\n`);
            }

            if (cycle < 3) {
                console.log('Waiting 15 minutes before next update...\n');
                // In production: await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));
            }
        }

        console.log('Real-time monitoring complete\n');

    } catch (error) {
        logger.error('Example 6 failed:', error);
    }
}

// =====================================================
// EXAMPLE 7: Vietnamese vs English Advice
// =====================================================

async function example7_MultilingualAdvice() {
    console.log('\n=== Example 7: Multilingual Advice ===\n');

    const agent = new EcoTwinAgent();

    try {
        const location = { lat: 10.7720, lng: 106.6980 };
        const scenario = { current: 150, predicted: 90 };

        console.log(`Scenario: AQI improving from ${scenario.current} to ${scenario.predicted}`);
        console.log('(Rain is coming, air quality will improve)\n');

        // Vietnamese user
        const vietnameseProfile = {
            id: 'vn_user',
            activityType: 'commute' as const,
            transportMode: 'motorbike' as const,
            language: 'vi' as const,
            sensitivityLevel: 'medium' as const
        };

        const vnAdvice = await agent.generatePersonalizedAdvice(
            scenario.predicted,
            scenario.current,
            location,
            vietnameseProfile
        );

        console.log('🇻🇳 Vietnamese User:');
        console.log(`   ${vnAdvice.advice}\n`);

        // English user
        const englishProfile = {
            id: 'en_user',
            activityType: 'commute' as const,
            transportMode: 'motorbike' as const,
            language: 'en' as const,
            sensitivityLevel: 'medium' as const
        };

        const enAdvice = await agent.generatePersonalizedAdvice(
            scenario.predicted,
            scenario.current,
            location,
            englishProfile
        );

        console.log('🇬🇧 English User:');
        console.log(`   ${enAdvice.advice}\n`);

        console.log('Note: AI adapts tone and cultural references based on language setting!\n');

    } catch (error) {
        logger.error('Example 7 failed:', error);
    }
}

// =====================================================
// RUN ALL EXAMPLES
// =====================================================

async function runAllExamples() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Eco-Twin Simulator Agent - Usage Examples       ║');
    console.log('╚════════════════════════════════════════════════════╝');

    await example1_BasicSimulation();
    await example2_PersonalizedAdvice();
    await example3_CompleteWorkflow();
    await example4_RainWashoutEffect();
    await example5_MultiLocationMonitoring();
    await example6_RealtimeMonitoring();
    await example7_MultilingualAdvice();

    console.log('\n✅ All examples completed\n');
}

// Execute if run directly
if (require.main === module) {
    runAllExamples().catch(error => {
        logger.error('Fatal error running examples:', error);
        process.exit(1);
    });
}

export {
    example1_BasicSimulation,
    example2_PersonalizedAdvice,
    example3_CompleteWorkflow,
    example4_RainWashoutEffect,
    example5_MultiLocationMonitoring,
    example6_RealtimeMonitoring,
    example7_MultilingualAdvice
};
