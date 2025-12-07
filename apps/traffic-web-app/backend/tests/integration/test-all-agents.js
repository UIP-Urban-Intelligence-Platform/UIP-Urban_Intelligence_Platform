/**
 * @file test-all-agents.js
 * @module apps/traffic-web-app/backend/tests/integration/test-all-agents
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 1.0.0
 * @license MIT
 * @description Comprehensive Test Suite for All Agents - Tests the 3 main agents
 * as real users would interact with them.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

const { execSync } = require('child_process');
const path = require('path');

// Compile TypeScript first
console.log('\n📦 Compiling TypeScript...\n');
try {
    execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Compilation successful\n');
} catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
}

// Load compiled agents
const { GraphInvestigatorAgent } = require('./dist/agents/GraphInvestigatorAgent');
const { EcoTwinAgent } = require('./dist/agents/EcoTwinAgent');
const { TrafficMaestroAgent } = require('./dist/agents/TrafficMaestroAgent');

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function printSeparator(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 ${title}`);
    console.log('='.repeat(60) + '\n');
}

function printSuccess(message) {
    console.log(`✅ ${message}`);
}

function printError(message) {
    console.log(`❌ ${message}`);
}

function printInfo(message) {
    console.log(`ℹ️  ${message}`);
}

// =====================================================
// TEST 1: GRAPH INVESTIGATOR AGENT
// =====================================================

async function testGraphInvestigator() {
    printSeparator('TEST 1: GRAPH INVESTIGATOR AGENT');

    try {
        printInfo('Initializing Graph Investigator Agent...');
        const investigator = new GraphInvestigatorAgent();
        printSuccess('Agent initialized');

        // Test Case 1: Investigate a road accident
        printInfo('\n📋 Test Case: Investigate road accident');
        printInfo('Use Case: Analyze accident with multimodal intelligence (LOD + Vision + News)');

        // Create a sample accident ID (would come from real accident data)
        const accidentId = 'urn:ngsi-ld:RoadAccident:test-accident-001';

        printInfo(`Investigating accident: ${accidentId}`);
        printInfo('Expected workflow:');
        printInfo('  1. Gather internal context from Stellio + Neo4j');
        printInfo('  2. Analyze camera visuals with Google Gemini');
        printInfo('  3. Search external news with Tavily API');
        printInfo('  4. Synthesize investigation report with AI');

        const report = await investigator.investigateIncident(accidentId);

        printSuccess('Investigation completed!');
        console.log('\n📊 INVESTIGATION REPORT:');
        console.log(`   Accident ID: ${report.accidentId}`);
        console.log(`   Root Cause: ${report.rootCause}`);
        console.log(`   Severity - Internal: ${report.technicalSeverity.internal}`);
        console.log(`   Severity - Visual: ${report.technicalSeverity.visual}/10`);
        console.log(`   Severity - Overall: ${report.technicalSeverity.overall}`);
        console.log(`\n   Recommended Response Teams:`);
        report.recommendedResponse.teams.forEach(team => {
            console.log(`   • ${team}`);
        });
        console.log(`   Priority: ${report.recommendedResponse.priority}`);
        console.log(`   Timeline: ${report.recommendedResponse.estimatedResolutionTime}`);

        if (report.contextSources.newsArticles > 0) {
            console.log(`\n   External Intelligence:`);
            console.log(`   • News Articles Found: ${report.contextSources.newsArticles}`);
            console.log(`   • Relevance Score: ${report.contextSources.externalRelevance}/10`);
        }

        if (report.aiSynthesis && report.aiSynthesis.confidence) {
            console.log(`\n   AI Analysis Confidence: ${(report.aiSynthesis.confidence * 100).toFixed(1)}%`);
        }

        await investigator.close();
        printSuccess('\n✅ Graph Investigator Agent: PASSED\n');

        return true;

    } catch (error) {
        printError(`Graph Investigator failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

// =====================================================
// TEST 2: ECO-TWIN AGENT
// =====================================================

async function testEcoTwin() {
    printSeparator('TEST 2: ECO-TWIN AGENT');

    try {
        printInfo('Initializing Eco-Twin Agent...');
        const ecoTwin = new EcoTwinAgent();
        printSuccess('Agent initialized');

        // Test Case 1: Simulate air quality dispersion
        printInfo('\n📋 Test Case: Air Quality Dispersion Simulation');
        printInfo('Use Case: Predict AQI changes based on weather for outdoor activity planning');

        // Sample location in Ho Chi Minh City (District 1)
        const location = {
            lat: 10.7769,
            lng: 106.7009
        };

        printInfo(`Location: ${location.lat}, ${location.lng} (HCMC District 1)`);
        printInfo('Expected workflow:');
        printInfo('  1. Fetch current air quality from Stellio');
        printInfo('  2. Get weather forecast for next 12 hours');
        printInfo('  3. Simulate pollutant dispersion with rain/wind');
        printInfo('  4. Identify best time windows for outdoor activities');

        const simulation = await ecoTwin.simulateDispersion(location);

        printSuccess('Simulation completed!');
        console.log('\n📊 DISPERSION SIMULATION RESULTS:');
        console.log(`   Current AQI: ${simulation.currentAQI}`);
        console.log(`   Predictions: ${simulation.predictions.length} hourly forecasts`);

        console.log(`\n   Peak Pollution:`);
        console.log(`   • Time: ${new Date(simulation.peakPollution.timestamp).toLocaleString()}`);
        console.log(`   • AQI: ${simulation.peakPollution.aqi}`);

        console.log(`\n   Best Window for Outdoor Activities:`);
        console.log(`   • Start: ${new Date(simulation.bestWindow.startTime).toLocaleString()}`);
        console.log(`   • End: ${new Date(simulation.bestWindow.endTime).toLocaleString()}`);
        console.log(`   • Average AQI: ${simulation.bestWindow.avgAQI}`);

        // Show first 3 predictions
        console.log(`\n   Sample Predictions (next 3 hours):`);
        simulation.predictions.slice(0, 3).forEach((pred, idx) => {
            console.log(`   ${idx + 1}. ${new Date(pred.timestamp).toLocaleTimeString()}`);
            console.log(`      AQI: ${pred.predictedAQI} (${pred.aqiCategory})`);
            console.log(`      PM2.5: ${pred.predictedPM25.toFixed(1)} μg/m³`);
            console.log(`      Confidence: ${(pred.confidence * 100).toFixed(0)}%`);
        });

        // Test Case 2: Generate personalized health advice
        printInfo('\n📋 Test Case: Personalized Health Advice');
        printInfo('Use Case: AI-powered recommendations for vulnerable populations');

        const userProfile = {
            age: 65,
            healthConditions: ['asthma', 'heart disease'],
            activityLevel: 'moderate',
            location: location
        };

        printInfo(`User Profile: ${userProfile.age} years old, ${userProfile.healthConditions.join(', ')}`);

        const advice = await ecoTwin.generatePersonalizedAdvice(location, userProfile);

        printSuccess('Advice generated!');
        console.log('\n💡 PERSONALIZED HEALTH ADVICE:');
        console.log(`   ${advice}`);

        printSuccess('\n✅ Eco-Twin Agent: PASSED\n');

        return true;

    } catch (error) {
        printError(`Eco-Twin failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

// =====================================================
// TEST 3: TRAFFIC MAESTRO AGENT
// =====================================================

async function testTrafficMaestro() {
    printSeparator('TEST 3: TRAFFIC MAESTRO AGENT');

    try {
        printInfo('Initializing Traffic Maestro Agent...');
        const maestro = new TrafficMaestroAgent();
        printSuccess('Agent initialized');

        // Test Case 1: Monitor external events
        printInfo('\n📋 Test Case: External Event Monitoring');
        printInfo('Use Case: Discover concerts/festivals that may impact traffic');

        printInfo('Expected workflow:');
        printInfo('  1. Fetch events from Ticketmaster API');
        printInfo('  2. Fetch holidays from Google Calendar');
        printInfo('  3. Search HCMC events with Google Custom Search');
        printInfo('  4. Map events to nearby traffic cameras');

        const eventMappings = await maestro.monitorExternalEvents();

        printSuccess('Event monitoring completed!');
        console.log('\n📊 EVENT MONITORING RESULTS:');
        console.log(`   Total events found: ${eventMappings.length}`);

        // Count by source
        const sourceCount = {};
        eventMappings.forEach(mapping => {
            const source = mapping.event.source;
            sourceCount[source] = (sourceCount[source] || 0) + 1;
        });

        console.log(`\n   Events by source:`);
        Object.keys(sourceCount).forEach(source => {
            console.log(`   • ${source}: ${sourceCount[source]} events`);
        });

        // Show sample events from each source
        const samplesBySource = {};
        eventMappings.forEach(mapping => {
            const source = mapping.event.source;
            if (!samplesBySource[source]) {
                samplesBySource[source] = mapping.event;
            }
        });

        console.log(`\n   Sample Events:`);
        Object.keys(samplesBySource).forEach(source => {
            const event = samplesBySource[source];
            console.log(`\n   [${source}]`);
            console.log(`   • ${event.name}`);
            console.log(`     Venue: ${event.venue.name}`);
            console.log(`     Time: ${new Date(event.startTime).toLocaleString()}`);
            console.log(`     Expected Attendees: ${event.expectedAttendees.toLocaleString()}`);
        });

        // Test Case 2: Predict congestion for large event
        if (eventMappings.length > 0) {
            printInfo('\n📋 Test Case: Congestion Prediction');
            printInfo('Use Case: Calculate surge risk for upcoming event');

            // Find largest event
            const largestEvent = eventMappings
                .map(m => m.event)
                .reduce((max, event) =>
                    event.expectedAttendees > max.expectedAttendees ? event : max
                );

            printInfo(`Analyzing: ${largestEvent.name} (${largestEvent.expectedAttendees} attendees)`);

            const riskScore = await maestro.predictCongestion(largestEvent);

            printSuccess('Risk assessment completed!');
            console.log('\n⚠️  SURGE RISK ANALYSIS:');
            console.log(`   Event: ${largestEvent.name}`);
            console.log(`   Risk Score: ${riskScore.score}/100`);
            console.log(`   Risk Level: ${riskScore.riskLevel.toUpperCase()}`);
            console.log(`\n   Risk Factors:`);
            console.log(`   • Attendee Count: ${riskScore.factors.attendeeCount.toLocaleString()}`);
            console.log(`   • Time to End: ${riskScore.factors.timeToEnd} minutes`);
            console.log(`   • Current Congestion: ${riskScore.factors.currentCongestion}`);
            console.log(`   • Historical Impact: ${riskScore.factors.historicalImpact}/10`);
            console.log(`\n   Affected Cameras: ${riskScore.affectedCameras.length}`);
        }

        // Test Case 3: Benchmark routing
        printInfo('\n📋 Test Case: Route Benchmarking');
        printInfo('Use Case: Compare internal traffic data vs Mapbox real-time routing');

        // Sample route in HCMC (District 1 to District 3)
        const origin = { lat: 10.7769, lng: 106.7009 };
        const destination = { lat: 10.7881, lng: 106.6892 };

        printInfo(`Route: District 1 → District 3`);

        const comparison = await maestro.benchmarkRoutes(origin, destination);

        printSuccess('Benchmark completed!');
        console.log('\n🗺️  ROUTE COMPARISON:');
        console.log(`   Mapbox Duration: ${Math.round(comparison.mapboxDuration / 60)} minutes`);
        console.log(`   Mapbox Distance: ${(comparison.mapboxDistance / 1000).toFixed(2)} km`);
        console.log(`   Internal Duration: ${Math.round(comparison.internalDuration / 60)} minutes`);
        console.log(`   Optimization Gap: ${comparison.optimizationGap.toFixed(1)}%`);
        console.log(`\n   Recommendation: ${comparison.recommendation}`);

        printSuccess('\n✅ Traffic Maestro Agent: PASSED\n');

        return true;

    } catch (error) {
        printError(`Traffic Maestro failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

// =====================================================
// MAIN TEST RUNNER
// =====================================================

async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     COMPREHENSIVE AGENT TEST SUITE                         ║');
    console.log('║     Testing 3 Agents with Real User Scenarios             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const results = {
        graphInvestigator: false,
        ecoTwin: false,
        trafficMaestro: false
    };

    // Run tests sequentially
    results.graphInvestigator = await testGraphInvestigator();
    results.ecoTwin = await testEcoTwin();
    results.trafficMaestro = await testTrafficMaestro();

    // Final summary
    printSeparator('FINAL TEST SUMMARY');

    const allPassed = Object.values(results).every(r => r === true);

    console.log('Test Results:');
    console.log(`   Graph Investigator: ${results.graphInvestigator ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Eco-Twin Agent: ${results.ecoTwin ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Traffic Maestro: ${results.trafficMaestro ? '✅ PASSED' : '❌ FAILED'}`);

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED! All agents functioning correctly.');
    } else {
        console.log('❌ SOME TESTS FAILED. Please review errors above.');
    }
    console.log('='.repeat(60) + '\n');

    process.exit(allPassed ? 0 : 1);
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
});
