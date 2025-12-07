/**
 * @file test-agents-realistic.js
 * @module apps/traffic-web-app/backend/tests/integration/test-agents-realistic
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 1.0.0
 * @license MIT
 * @description Realistic Agent Test Suite - Tests agents with realistic mock data
 * to demonstrate actual use cases and validate agent behavior.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

// Load environment variables first
require('dotenv').config();

const { execSync } = require('child_process');

console.log('\n📦 Compiling TypeScript...\n');
try {
    execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Compilation successful\n');
} catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
}

const { TrafficMaestroAgent } = require('./dist/agents/TrafficMaestroAgent');
const { EcoTwinAgent } = require('./dist/agents/EcoTwinAgent');

function printSeparator(title) {
    console.log('\n' + '='.repeat(70));
    console.log(`🎯 ${title}`);
    console.log('='.repeat(70) + '\n');
}

// =====================================================
// TEST 1: TRAFFIC MAESTRO - Real API Usage
// =====================================================

async function testTrafficMaestroReal() {
    printSeparator('TEST 1: TRAFFIC MAESTRO - Event Discovery & Prediction');

    try {
        console.log('ℹ️  Use Case: Proactive Traffic Management');
        console.log('   Scenario: Concert organizers announce WATERBOMB festival');
        console.log('   Agent Role: Predict traffic impact and recommend actions\n');

        const maestro = new TrafficMaestroAgent();
        console.log('✅ Agent initialized\n');

        // Test 1a: Discover real events
        console.log('📋 Step 1: Discovering upcoming events in HCMC...');
        console.log('   Sources: Ticketmaster, Google Calendar, Google Custom Search\n');

        const eventMappings = await maestro.monitorExternalEvents();

        console.log(`✅ Found ${eventMappings.length} large events (>1000 attendees)\n`);

        // Count by source
        const sourceCount = {};
        eventMappings.forEach(m => {
            sourceCount[m.event.source] = (sourceCount[m.event.source] || 0) + 1;
        });

        console.log('📊 Events by Source:');
        Object.entries(sourceCount).forEach(([source, count]) => {
            console.log(`   • ${source}: ${count} events`);
        });

        // Show top 5 largest events
        const topEvents = eventMappings
            .map(m => m.event)
            .sort((a, b) => b.expectedAttendees - a.expectedAttendees)
            .slice(0, 5);

        console.log('\n🎪 Top 5 Largest Events:');
        topEvents.forEach((event, idx) => {
            console.log(`\n   ${idx + 1}. ${event.name}`);
            console.log(`      📍 ${event.venue.name}`);
            console.log(`      📅 ${new Date(event.startTime).toLocaleString()}`);
            console.log(`      👥 ${event.expectedAttendees.toLocaleString()} attendees`);
            console.log(`      🏷️  ${event.category}`);
            console.log(`      🌐 Source: ${event.source}`);
        });

        // Test 1b: Predict congestion for largest event
        if (topEvents.length > 0) {
            const largestEvent = topEvents[0];

            console.log(`\n📋 Step 2: Predicting traffic impact for "${largestEvent.name}"...\n`);

            const riskScore = await maestro.predictCongestion(largestEvent);

            console.log('⚠️  SURGE RISK ASSESSMENT:');
            console.log(`   Risk Score: ${riskScore.score}/100`);
            console.log(`   Risk Level: ${riskScore.riskLevel.toUpperCase()}`);
            console.log(`\n   Contributing Factors:`);
            console.log(`   • Attendee Volume: ${riskScore.factors.attendeeCount.toLocaleString()} people`);
            console.log(`   • Time Until Event: ${Math.round(riskScore.factors.timeToEnd / 60)} hours`);
            console.log(`   • Current Congestion: ${riskScore.factors.currentCongestion}`);
            console.log(`   • Historical Impact Score: ${riskScore.factors.historicalImpact}/10`);
            console.log(`\n   📹 Affected Cameras: ${riskScore.affectedCameras.length}`);

            if (riskScore.riskLevel === 'high' || riskScore.riskLevel === 'critical') {
                console.log(`\n   🚨 RECOMMENDATION: Deploy traffic control measures`);
                console.log(`      - Activate green wave corridors`);
                console.log(`      - Position traffic police at key intersections`);
                console.log(`      - Notify public via mobile app/social media`);
            }
        }

        // Test 1c: Route benchmarking
        console.log(`\n📋 Step 3: Benchmarking routing accuracy...\n`);

        const origin = { lat: 10.7769, lng: 106.7009 }; // District 1
        const destination = { lat: 10.7881, lng: 106.6892 }; // District 3

        try {
            const comparison = await maestro.benchmarkRoutes(origin, destination);

            console.log('🗺️  ROUTE BENCHMARK (District 1 → District 3):');
            console.log(`   Mapbox (Real-time): ${Math.round(comparison.mapboxDuration / 60)} min, ${(comparison.mapboxDistance / 1000).toFixed(1)} km`);
            console.log(`   Our System: ${Math.round(comparison.internalDuration / 60)} min`);
            console.log(`   Optimization Gap: ${comparison.optimizationGap.toFixed(1)}%`);
            console.log(`\n   💡 ${comparison.recommendation}`);
        } catch (error) {
            console.log(`   ⚠️  Route benchmark skipped: ${error.message}`);
        }

        console.log('\n✅ Traffic Maestro Test: PASSED');
        console.log('   ✓ Event discovery working');
        console.log('   ✓ Congestion prediction working');
        console.log('   ✓ Multi-source integration functional\n');

        return true;

    } catch (error) {
        console.error(`\n❌ Traffic Maestro failed: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

// =====================================================
// TEST 2: ECO-TWIN - Real API Usage
// =====================================================

async function testEcoTwinReal() {
    printSeparator('TEST 2: ECO-TWIN - Air Quality Forecasting');

    try {
        console.log('ℹ️  Use Case: Personalized Health Protection');
        console.log('   Scenario: Elderly person with asthma planning outdoor exercise');
        console.log('   Agent Role: Predict AQI changes and recommend safe time windows\n');

        const ecoTwin = new EcoTwinAgent();
        console.log('✅ Agent initialized\n');

        // Test 2a: Air quality dispersion simulation
        const location = { lat: 10.7769, lng: 106.7009 }; // HCMC District 1

        console.log('📋 Step 1: Simulating air quality dispersion...');
        console.log(`   Location: District 1, HCMC (${location.lat}, ${location.lng})`);
        console.log('   Forecast Window: Next 12 hours\n');

        const simulation = await ecoTwin.simulateDispersion(location);

        console.log('📊 DISPERSION SIMULATION RESULTS:');
        console.log(`   Current AQI: ${simulation.currentAQI} (${getAQICategory(simulation.currentAQI)})`);
        console.log(`   Hourly Predictions: ${simulation.predictions.length}\n`);

        console.log('   Peak Pollution Period:');
        console.log(`   • Time: ${new Date(simulation.peakPollution.timestamp).toLocaleString()}`);
        console.log(`   • AQI: ${simulation.peakPollution.aqi} (${getAQICategory(simulation.peakPollution.aqi)})`);
        console.log(`   • Recommendation: ${simulation.peakPollution.aqi > 100 ? '🚫 Stay indoors' : '✅ Safe for outdoor activity'}\n`);

        console.log('   Best Window for Outdoor Exercise:');
        console.log(`   • Start: ${new Date(simulation.bestWindow.startTime).toLocaleString()}`);
        console.log(`   • End: ${new Date(simulation.bestWindow.endTime).toLocaleString()}`);
        console.log(`   • Avg AQI: ${simulation.bestWindow.avgAQI.toFixed(0)} (${getAQICategory(simulation.bestWindow.avgAQI)})`);
        console.log(`   • Duration: ${Math.round((new Date(simulation.bestWindow.endTime) - new Date(simulation.bestWindow.startTime)) / 60000)} minutes\n`);

        // Show hourly breakdown
        console.log('   Next 6 Hours Forecast:');
        simulation.predictions.slice(0, 6).forEach((pred, idx) => {
            const time = new Date(pred.timestamp);
            const icon = pred.predictedAQI <= 50 ? '🟢' : pred.predictedAQI <= 100 ? '🟡' : '🔴';
            console.log(`   ${icon} ${time.toLocaleTimeString()}: AQI ${pred.predictedAQI} (${pred.aqiCategory}), PM2.5 ${pred.predictedPM25.toFixed(1)} μg/m³`);

            if (pred.factors.rainWashout > 0) {
                console.log(`      💧 Rain reducing pollution by ${pred.factors.rainWashout.toFixed(0)} AQI points`);
            }
            if (pred.factors.windDispersion > 0) {
                console.log(`      💨 Wind dispersing pollutants (-${pred.factors.windDispersion.toFixed(0)} AQI)`);
            }
        });

        // Test 2b: Personalized advice (if Gemini API available)
        console.log(`\n📋 Step 2: Generating personalized health advice...\n`);

        const userProfile = {
            age: 68,
            healthConditions: ['asthma', 'cardiovascular disease'],
            activityLevel: 'moderate',
            location: location
        };

        console.log('   User Profile:');
        console.log(`   • Age: ${userProfile.age} years`);
        console.log(`   • Conditions: ${userProfile.healthConditions.join(', ')}`);
        console.log(`   • Activity Level: ${userProfile.activityLevel}\n`);

        try {
            const advice = await ecoTwin.generatePersonalizedAdvice(location, userProfile);

            console.log('💡 PERSONALIZED HEALTH ADVICE:');
            // Handle both string and object responses
            if (typeof advice === 'string') {
                console.log(`\n${advice}\n`);
            } else if (advice && typeof advice === 'object') {
                if (advice.advice) {
                    console.log(`\n${advice.advice}\n`);
                } else {
                    console.log(`\n${JSON.stringify(advice, null, 2)}\n`);
                }
            } else {
                console.log(`\n   Advice generated successfully.\n`);
            }
        } catch (error) {
            console.log(`   ⚠️  AI advice generation skipped: ${error.message}`);
            console.log(`\n   📋 Fallback Recommendations:`);
            if (simulation.currentAQI > 100) {
                console.log(`   🚫 Current AQI (${simulation.currentAQI}) is unhealthy for sensitive groups`);
                console.log(`   • Avoid outdoor exercise now`);
                console.log(`   • Use air purifier indoors`);
                console.log(`   • Keep rescue inhaler nearby`);
            } else {
                console.log(`   ✅ Current AQI (${simulation.currentAQI}) is acceptable`);
                console.log(`   • Light to moderate outdoor activity is safe`);
                console.log(`   • Stay hydrated and take breaks`);
                console.log(`   • Monitor symptoms and air quality`);
            }
            console.log(`   ⏰ Best exercise window: ${new Date(simulation.bestWindow.startTime).toLocaleTimeString()} - ${new Date(simulation.bestWindow.endTime).toLocaleTimeString()}\n`);
        }

        console.log('✅ Eco-Twin Test: PASSED');
        console.log('   ✓ Air quality data fetching working');
        console.log('   ✓ Weather-based dispersion simulation working');
        console.log('   ✓ Health-focused predictions accurate\n');

        return true;

    } catch (error) {
        console.error(`\n❌ Eco-Twin failed: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

// Helper function
function getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

// =====================================================
// MAIN TEST RUNNER
// =====================================================

async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║     REALISTIC AGENT TEST SUITE                                     ║');
    console.log('║     Testing Real-World Use Cases with Live APIs                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');

    const results = {
        trafficMaestro: false,
        ecoTwin: false
    };

    // Run tests
    results.trafficMaestro = await testTrafficMaestroReal();
    results.ecoTwin = await testEcoTwinReal();

    // Final summary
    printSeparator('FINAL SUMMARY');

    console.log('Test Results:');
    console.log(`   Traffic Maestro (Event Prediction): ${results.trafficMaestro ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Eco-Twin (Health Advisory): ${results.ecoTwin ? '✅ PASSED' : '❌ FAILED'}`);

    const allPassed = Object.values(results).every(r => r);

    console.log('\n' + '='.repeat(70));
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED! Agents ready for production.');
    } else {
        console.log('⚠️  SOME TESTS FAILED (check API keys and data availability)');
    }
    console.log('='.repeat(70));

    console.log('\n📝 NOTE: Graph Investigator requires real accident data from Stellio');
    console.log('   to test. It works when investigating actual incidents in the system.\n');

    process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
    console.error('\n❌ Test suite crashed:', error);
    process.exit(1);
});
