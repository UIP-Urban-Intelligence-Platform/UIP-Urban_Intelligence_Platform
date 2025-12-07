/**
 * @file test-eco-twin-api.js
 * @module apps/traffic-web-app/backend/tests/integration/test-eco-twin-api
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Test Script for EcoTwinAgent API Endpoints - Tests chat, dispersion,
 * forecast, and health check endpoints.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

const API_BASE_URL = 'http://localhost:5000';

// Test location (HCMC center)
const TEST_LOCATION = {
    lat: 10.8231,
    lng: 106.6297
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const printSeparator = (title) => {
    console.log('\n' + colors.cyan + '='.repeat(70) + colors.reset);
    console.log(colors.bright + colors.cyan + title + colors.reset);
    console.log(colors.cyan + '='.repeat(70) + colors.reset + '\n');
};

const printSuccess = (message) => {
    console.log(colors.green + '✅ ' + message + colors.reset);
};

const printError = (message) => {
    console.log(colors.red + '❌ ' + message + colors.reset);
};

const printInfo = (message) => {
    console.log(colors.blue + 'ℹ️  ' + message + colors.reset);
};

const printWarning = (message) => {
    console.log(colors.yellow + '⚠️  ' + message + colors.reset);
};

// =====================================================
// TEST 1: Health Check
// =====================================================

async function testHealthCheck() {
    printSeparator('TEST 1: HEALTH CHECK');

    try {
        printInfo('Checking EcoTwinAgent health...');

        const response = await fetch(`${API_BASE_URL}/api/agents/eco-twin/health`);
        const data = await response.json();

        if (data.success && data.data.status === 'healthy') {
            printSuccess('Health check passed');
            console.log(`   Status: ${data.data.status}`);
            console.log(`   Timestamp: ${data.data.timestamp}`);
            console.log('   Dependencies:');
            console.log(`     - Stellio: ${data.data.dependencies.stellio ? '✅' : '❌'}`);
            console.log(`     - Weather API: ${data.data.dependencies.weatherApi ? '✅' : '❌'}`);
            console.log(`     - Gemini API: ${data.data.dependencies.geminiApi ? '✅' : '❌'}`);
            return true;
        } else {
            printWarning(`Health check status: ${data.data.status}`);
            console.log('   Message:', data.data.message);
            return false;
        }

    } catch (error) {
        printError(`Health check failed: ${error.message}`);
        return false;
    }
}

// =====================================================
// TEST 2: Chat Endpoint
// =====================================================

async function testChatEndpoint() {
    printSeparator('TEST 2: CHAT ENDPOINT');

    try {
        printInfo('Sending chat message to EcoTwinAgent...');

        const requestBody = {
            message: 'Hôm nay có nên đi xe máy không?',
            location: TEST_LOCATION,
            userProfile: {
                language: 'vi',
                sensitivityLevel: 'medium',
                transportMode: 'motorbike',
                healthConditions: [],
                activityType: 'commute'
            }
        };

        console.log(`   Location: [${TEST_LOCATION.lat}, ${TEST_LOCATION.lng}]`);
        console.log(`   Message: "${requestBody.message}"`);

        const response = await fetch(`${API_BASE_URL}/api/agents/eco-twin/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.success) {
            printSuccess('Chat endpoint working!');
            console.log('\n   Response:');
            console.log(`   📝 Message: ${data.data.message.substring(0, 150)}...`);
            console.log(`   🌫️ Current AQI: ${data.data.aqi} (${data.data.aqiCategory})`);
            console.log(`   📊 Predicted AQI: ${data.data.predictedAQI}`);
            console.log(`   ⚠️ Risk Level: ${data.data.riskLevel}`);
            console.log(`   💡 Recommendations: ${data.data.recommendations.length} items`);
            console.log(`   🔮 Predictions: ${data.data.predictions.length} time steps`);
            console.log(`   🎯 Confidence: ${(data.data.confidence * 100).toFixed(1)}%`);

            if (data.data.bestWindow) {
                console.log(`   ✨ Best Air Quality Window:`);
                console.log(`      Start: ${new Date(data.data.bestWindow.startTime).toLocaleTimeString()}`);
                console.log(`      End: ${new Date(data.data.bestWindow.endTime).toLocaleTimeString()}`);
                console.log(`      Avg AQI: ${data.data.bestWindow.avgAQI}`);
            }

            return true;
        } else {
            printError(`Chat endpoint failed: ${data.error}`);
            return false;
        }

    } catch (error) {
        printError(`Chat endpoint error: ${error.message}`);
        return false;
    }
}

// =====================================================
// TEST 3: Dispersion Endpoint
// =====================================================

async function testDispersionEndpoint() {
    printSeparator('TEST 3: DISPERSION SIMULATION');

    try {
        printInfo('Simulating air quality dispersion...');

        const requestBody = {
            location: TEST_LOCATION
        };

        console.log(`   Location: [${TEST_LOCATION.lat}, ${TEST_LOCATION.lng}]`);

        const response = await fetch(`${API_BASE_URL}/api/agents/eco-twin/dispersion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.success) {
            printSuccess('Dispersion simulation completed!');
            console.log('\n   Results:');
            console.log(`   📍 Location: [${data.data.location.lat}, ${data.data.location.lng}]`);
            console.log(`   🌫️ Current AQI: ${data.data.currentAQI}`);
            console.log(`   📊 Predictions: ${data.data.predictions.length} time steps`);

            if (data.data.predictions.length > 0) {
                const first = data.data.predictions[0];
                const last = data.data.predictions[data.data.predictions.length - 1];

                console.log(`\n   First Prediction (${new Date(first.timestamp).toLocaleTimeString()}):`);
                console.log(`     AQI: ${first.predictedAQI} (${first.aqiCategory})`);
                console.log(`     PM2.5: ${first.predictedPM25.toFixed(1)} μg/m³`);
                console.log(`     Confidence: ${(first.confidence * 100).toFixed(1)}%`);

                console.log(`\n   Last Prediction (${new Date(last.timestamp).toLocaleTimeString()}):`);
                console.log(`     AQI: ${last.predictedAQI} (${last.aqiCategory})`);
                console.log(`     PM2.5: ${last.predictedPM25.toFixed(1)} μg/m³`);
                console.log(`     Confidence: ${(last.confidence * 100).toFixed(1)}%`);
            }

            if (data.data.peakPollution) {
                console.log(`\n   🔺 Peak Pollution:`);
                console.log(`     Time: ${new Date(data.data.peakPollution.timestamp).toLocaleTimeString()}`);
                console.log(`     AQI: ${data.data.peakPollution.aqi}`);
            }

            return true;
        } else {
            printError(`Dispersion simulation failed: ${data.error}`);
            return false;
        }

    } catch (error) {
        printError(`Dispersion endpoint error: ${error.message}`);
        return false;
    }
}

// =====================================================
// TEST 4: Forecast Endpoint
// =====================================================

async function testForecastEndpoint() {
    printSeparator('TEST 4: ENVIRONMENTAL FORECAST');

    try {
        printInfo('Generating environmental forecast...');

        const requestBody = {
            location: TEST_LOCATION,
            userProfile: {
                language: 'vi',
                sensitivityLevel: 'high',
                transportMode: 'bicycle',
                healthConditions: ['asthma'],
                activityType: 'exercise'
            },
            publish: false // Set to true to publish to Stellio
        };

        console.log(`   Location: [${TEST_LOCATION.lat}, ${TEST_LOCATION.lng}]`);
        console.log(`   User Profile: High sensitivity, bicycle, has asthma`);
        console.log(`   Publish to Stellio: ${requestBody.publish}`);

        const response = await fetch(`${API_BASE_URL}/api/agents/eco-twin/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.success) {
            printSuccess('Forecast generated successfully!');
            console.log('\n   Forecast:');
            console.log(`   🌫️ Current AQI: ${data.data.forecast.currentConditions.aqi}`);
            console.log(`   📊 Predictions: ${data.data.forecast.predictions.length} time steps`);

            if (data.data.forecast.personalizedAdvice) {
                const advice = data.data.forecast.personalizedAdvice;
                console.log(`\n   💡 Personalized Advice:`);
                console.log(`     Risk Level: ${advice.riskLevel}`);
                console.log(`     Confidence: ${(advice.confidence * 100).toFixed(1)}%`);
                console.log(`     Recommendations: ${advice.recommendations.length} items`);

                if (advice.recommendations.length > 0) {
                    console.log(`\n     Top 3 Recommendations:`);
                    advice.recommendations.slice(0, 3).forEach((rec, i) => {
                        console.log(`       ${i + 1}. ${rec}`);
                    });
                }
            }

            if (data.data.forecast.bestWindow) {
                console.log(`\n   ✨ Best Air Quality Window:`);
                console.log(`     Start: ${new Date(data.data.forecast.bestWindow.startTime).toLocaleTimeString()}`);
                console.log(`     End: ${new Date(data.data.forecast.bestWindow.endTime).toLocaleTimeString()}`);
                console.log(`     Avg AQI: ${data.data.forecast.bestWindow.avgAQI}`);
            }

            console.log(`\n   📡 Published to Stellio: ${data.data.published ? 'Yes' : 'No'}`);
            if (data.data.stellioEntityId) {
                console.log(`   🆔 Stellio Entity ID: ${data.data.stellioEntityId}`);
            }

            return true;
        } else {
            printError(`Forecast generation failed: ${data.error}`);
            return false;
        }

    } catch (error) {
        printError(`Forecast endpoint error: ${error.message}`);
        return false;
    }
}

// =====================================================
// MAIN TEST RUNNER
// =====================================================

async function runAllTests() {
    console.log(colors.bright + colors.blue);
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║             EcoTwinAgent API Integration Test Suite                 ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    const results = {
        healthCheck: false,
        chat: false,
        dispersion: false,
        forecast: false
    };

    // Run tests sequentially
    results.healthCheck = await testHealthCheck();
    results.chat = await testChatEndpoint();
    results.dispersion = await testDispersionEndpoint();
    results.forecast = await testForecastEndpoint();

    // Print summary
    printSeparator('TEST SUMMARY');

    const testsPassed = Object.values(results).filter(v => v === true).length;
    const totalTests = Object.keys(results).length;

    console.log(`   Health Check:          ${results.healthCheck ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Chat Endpoint:         ${results.chat ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Dispersion Endpoint:   ${results.dispersion ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Forecast Endpoint:     ${results.forecast ? '✅ PASSED' : '❌ FAILED'}`);

    console.log('\n' + colors.bright);
    if (testsPassed === totalTests) {
        console.log(colors.green + `✅ ALL TESTS PASSED (${testsPassed}/${totalTests})` + colors.reset);
    } else {
        console.log(colors.yellow + `⚠️  SOME TESTS FAILED (${testsPassed}/${totalTests} passed)` + colors.reset);
    }
    console.log(colors.reset);

    // Exit code
    process.exit(testsPassed === totalTests ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    printError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
