/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * @module apps/traffic-web-app/backend/examples/traffic-maestro-usage
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * Traffic Maestro Agent - Comprehensive Usage Examples.
 * Demonstrates how to use the TrafficMaestroAgent for predictive
 * traffic management based on external events (concerts, sports, conferences).
 * 
 * Example Scenarios:
 * 1. Monitor Events and Predict Congestion: External event detection
 * 2. Generate Action Plans: Preemptive traffic control recommendations
 * 3. Timeline Visualization: Event timeline with impact heatmaps
 * 4. Real-time Traffic Benchmarking: Compare with Mapbox/Google/TomTom
 * 
 * Core Capabilities:
 * - External event monitoring (Ticketmaster, Eventbrite, Facebook Events)
 * - Predictive congestion analysis with attendance estimation
 * - Historical pattern matching for impact prediction
 * - External traffic API benchmarking (Mapbox, Google Maps, TomTom)
 * - Green wave optimization for traffic signals
 * - Detour recommendations with alternative routes
 * 
 * @dependencies
 * - TrafficMaestroAgent: Predictive event orchestrator
 * 
 * @usage
 * ```bash
 * # Run all examples
 * npx ts-node examples/traffic-maestro-usage.ts
 * 
 * # Run specific example
 * npx ts-node examples/traffic-maestro-usage.ts --example 1
 * ```
 */

import { TrafficMaestroAgent } from '../src/agents/TrafficMaestroAgent';
import { logger } from '../src/utils/logger';

/**
 * Traffic Maestro Agent - Usage Examples
 * 
 * Demonstrates how to use the Traffic Maestro Agent for predictive
 * traffic control based on external events.
 */

// =====================================================
// EXAMPLE 1: Monitor Events and Predict Congestion
// =====================================================

async function example1_MonitorAndPredict() {
    console.log('\n=== Example 1: Monitor Events and Predict Congestion ===\n');

    const agent = new TrafficMaestroAgent();

    try {
        // Step 1: Monitor external events
        console.log('Step 1: Fetching external events...');
        const eventMappings = await agent.monitorExternalEvents();

        console.log(`Found ${eventMappings.length} events with traffic impact\n`);

        // Step 2: Predict congestion for each event
        for (const mapping of eventMappings) {
            const { event, affectedCameras } = mapping;

            console.log(`Event: ${event.name}`);
            console.log(`Venue: ${event.venue.name}`);
            console.log(`Attendees: ${event.expectedAttendees}`);
            console.log(`Affected cameras: ${affectedCameras.length}\n`);

            // Predict congestion
            const riskScore = await agent.predictCongestion(event);

            console.log(`Risk Score: ${riskScore.score.toFixed(1)}/100 (${riskScore.riskLevel})`);
            console.log(`Factors:`);
            console.log(`  - Attendees: ${riskScore.factors.attendeeCount}`);
            console.log(`  - Time to end: ${riskScore.factors.timeToEnd.toFixed(0)} minutes`);
            console.log(`  - Current congestion: ${riskScore.factors.currentCongestion}`);
            console.log(`  - Historical impact: ${riskScore.factors.historicalImpact}/10\n`);

            // Step 3: Generate action plan if risk is high
            if (riskScore.score >= 40) {
                const actionPlan = await agent.generateActionPlan(riskScore.score, mapping);

                console.log('📋 Action Plan:');
                console.log(`  Action: ${actionPlan.action}`);
                console.log(`  Priority: ${actionPlan.priority}`);
                console.log(`  Reason: ${actionPlan.reason}`);
                console.log(`  Impact: ${actionPlan.predictedImpact}`);
                console.log(`  Execution: ${new Date(actionPlan.executionTime).toLocaleString()}`);
                console.log(`  Target cameras: ${actionPlan.targetCameras.length}`);
                console.log(`  Cost estimate: ${actionPlan.estimatedCost}/100\n`);
            }

            console.log('---\n');
        }

    } catch (error) {
        logger.error('Example 1 failed:', error);
    }
}

// =====================================================
// EXAMPLE 2: Benchmark Internal Routing vs Mapbox
// =====================================================

async function example2_BenchmarkRouting() {
    console.log('\n=== Example 2: Benchmark Internal Routing vs Mapbox ===\n');

    const agent = new TrafficMaestroAgent();

    try {
        // Define test routes in HCMC
        const routes = [
            {
                name: 'Ben Thanh Market → Tan Son Nhat Airport',
                origin: { lat: 10.7720, lng: 106.6980 },
                destination: { lat: 10.8180, lng: 106.6560 }
            },
            {
                name: 'District 1 → Thu Duc City',
                origin: { lat: 10.7760, lng: 106.7000 },
                destination: { lat: 10.8500, lng: 106.7700 }
            },
            {
                name: 'Saigon River Tunnel → Landmark 81',
                origin: { lat: 10.7880, lng: 106.7050 },
                destination: { lat: 10.7940, lng: 106.7220 }
            }
        ];

        console.log('Benchmarking routes against Mapbox Traffic API...\n');

        for (const route of routes) {
            console.log(`Route: ${route.name}`);

            const comparison = await agent.benchmarkRoutes(route.origin, route.destination);

            console.log(`Mapbox:    ${(comparison.mapboxDuration / 60).toFixed(1)} min (${(comparison.mapboxDistance / 1000).toFixed(2)} km)`);
            console.log(`Internal:  ${(comparison.internalDuration / 60).toFixed(1)} min`);
            console.log(`Gap:       ${comparison.optimizationGap.toFixed(1)}%`);
            console.log(`Status:    ${comparison.recommendation}\n`);

            // Highlight significant discrepancies
            if (Math.abs(comparison.optimizationGap) > 15) {
                console.log('⚠️  WARNING: Significant routing discrepancy detected!');
                console.log('   Recommendation: Update internal speed profiles or investigate data quality.\n');
            }

            console.log('---\n');
        }

    } catch (error) {
        logger.error('Example 2 failed:', error);
    }
}

// =====================================================
// EXAMPLE 3: Custom Configuration (Different Domain)
// =====================================================

async function example3_CustomDomain() {
    console.log('\n=== Example 3: Custom Domain Configuration ===\n');

    // Create custom config for shopping district monitoring
    const customConfigPath = './config/agents/traffic-maestro-shopping.yaml';

    try {
        const agent = new TrafficMaestroAgent(customConfigPath);

        console.log('Loaded custom configuration for shopping district monitoring');
        console.log('Domain: Retail Events (sales, grand openings, festivals)\n');

        // Monitor shopping events
        const eventMappings = await agent.monitorExternalEvents();

        console.log(`Found ${eventMappings.length} shopping events\n`);

        for (const mapping of eventMappings) {
            const { event } = mapping;
            console.log(`Event: ${event.name}`);
            console.log(`Category: ${event.category}`);
            console.log(`Location: ${event.venue.name}\n`);
        }

    } catch (error) {
        logger.warn('Custom config not found, using default configuration');
        logger.error('Example 3 failed:', error);
    }
}

// =====================================================
// EXAMPLE 4: Real-Time Event Monitoring Loop
// =====================================================

async function example4_RealtimeMonitoring() {
    console.log('\n=== Example 4: Real-Time Event Monitoring ===\n');

    const agent = new TrafficMaestroAgent();

    try {
        console.log('Starting real-time event monitoring loop...');
        console.log('Checking every 5 minutes for new events\n');

        // Simulate monitoring loop (run 3 iterations for demo)
        for (let i = 0; i < 3; i++) {
            console.log(`--- Check #${i + 1} at ${new Date().toLocaleTimeString()} ---\n`);

            const eventMappings = await agent.monitorExternalEvents();

            if (eventMappings.length === 0) {
                console.log('No high-impact events found in next 3 hours\n');
            } else {
                // Process each event
                for (const mapping of eventMappings) {
                    const riskScore = await agent.predictCongestion(mapping.event);

                    if (riskScore.score >= 60) {
                        console.log(`🚨 HIGH RISK EVENT DETECTED:`);
                        console.log(`   ${mapping.event.name}`);
                        console.log(`   Risk: ${riskScore.score.toFixed(1)}/100 (${riskScore.riskLevel})`);

                        const actionPlan = await agent.generateActionPlan(riskScore.score, mapping);
                        console.log(`   Action: ${actionPlan.action}\n`);
                    }
                }
            }

            // Wait 5 minutes (300,000 ms) before next check
            // For demo, we just simulate with a message
            if (i < 2) {
                console.log('Waiting 5 minutes before next check...\n');
                // In production: await new Promise(resolve => setTimeout(resolve, 300000));
            }
        }

        console.log('Real-time monitoring complete\n');

    } catch (error) {
        logger.error('Example 4 failed:', error);
    }
}

// =====================================================
// EXAMPLE 5: Integration with WebSocket Service
// =====================================================

async function example5_WebSocketIntegration() {
    console.log('\n=== Example 5: WebSocket Integration ===\n');

    const agent = new TrafficMaestroAgent();

    try {
        console.log('Simulating WebSocket broadcast of traffic predictions...\n');

        // Monitor events
        const eventMappings = await agent.monitorExternalEvents();

        // Generate predictions for all events
        const predictions = [];

        for (const mapping of eventMappings) {
            const riskScore = await agent.predictCongestion(mapping.event);
            const actionPlan = await agent.generateActionPlan(riskScore.score, mapping);

            predictions.push({
                event: {
                    id: mapping.event.id,
                    name: mapping.event.name,
                    venue: mapping.event.venue.name,
                    attendees: mapping.event.expectedAttendees
                },
                risk: {
                    score: riskScore.score,
                    level: riskScore.riskLevel
                },
                action: {
                    type: actionPlan.action,
                    priority: actionPlan.priority,
                    executionTime: actionPlan.executionTime
                },
                affectedAreas: mapping.affectedCameras.map(({ camera, distance }) => ({
                    cameraId: camera.id,
                    cameraName: camera.cameraName,
                    distanceMeters: distance
                }))
            });
        }

        // Simulate WebSocket broadcast
        console.log('Broadcasting to WebSocket channel: traffic.maestro.predictions\n');
        console.log(JSON.stringify({
            type: 'TRAFFIC_MAESTRO_UPDATE',
            timestamp: new Date().toISOString(),
            predictions: predictions
        }, null, 2));

        console.log('\n📡 WebSocket broadcast complete\n');

    } catch (error) {
        logger.error('Example 5 failed:', error);
    }
}

// =====================================================
// EXAMPLE 6: Batch Processing Historical Events
// =====================================================

async function example6_BatchProcessing() {
    console.log('\n=== Example 6: Batch Processing Historical Events ===\n');

    const agent = new TrafficMaestroAgent();

    try {
        // Simulate historical event data
        const historicalEvents = [
            {
                id: 'evt_001',
                name: 'Vietnam vs Thailand - World Cup Qualifier',
                venue: {
                    name: 'My Dinh Stadium',
                    location: { lat: 10.7860, lng: 106.6960 },
                    address: 'District 10, HCMC'
                },
                startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
                endTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
                expectedAttendees: 15000,
                category: 'Sports',
                source: 'ticketmaster' as const
            },
            {
                id: 'evt_002',
                name: 'Sơn Tùng M-TP Concert',
                venue: {
                    name: 'Phu Tho Stadium',
                    location: { lat: 10.7720, lng: 106.6650 },
                    address: 'District 11, HCMC'
                },
                startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // in 1 hour
                endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // in 4 hours
                expectedAttendees: 8000,
                category: 'Music',
                source: 'ticketmaster' as const
            }
        ];

        console.log(`Processing ${historicalEvents.length} historical events...\n`);

        const results = [];

        for (const event of historicalEvents) {
            console.log(`Processing: ${event.name}`);

            const riskScore = await agent.predictCongestion(event);

            results.push({
                eventName: event.name,
                actualScore: riskScore.score,
                predictedLevel: riskScore.riskLevel,
                attendees: event.expectedAttendees
            });

            console.log(`  Risk score: ${riskScore.score.toFixed(1)}/100 (${riskScore.riskLevel})\n`);
        }

        // Summary statistics
        const avgScore = results.reduce((sum, r) => sum + r.actualScore, 0) / results.length;
        const criticalEvents = results.filter(r => r.predictedLevel === 'critical').length;
        const highEvents = results.filter(r => r.predictedLevel === 'high').length;

        console.log('📊 Batch Processing Summary:');
        console.log(`   Events processed: ${results.length}`);
        console.log(`   Average risk score: ${avgScore.toFixed(1)}/100`);
        console.log(`   Critical events: ${criticalEvents}`);
        console.log(`   High risk events: ${highEvents}\n`);

    } catch (error) {
        logger.error('Example 6 failed:', error);
    }
}

// =====================================================
// RUN ALL EXAMPLES
// =====================================================

async function runAllExamples() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Traffic Maestro Agent - Usage Examples          ║');
    console.log('╚════════════════════════════════════════════════════╝');

    // Run examples sequentially
    await example1_MonitorAndPredict();
    await example2_BenchmarkRouting();
    await example3_CustomDomain();
    await example4_RealtimeMonitoring();
    await example5_WebSocketIntegration();
    await example6_BatchProcessing();

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
    example1_MonitorAndPredict,
    example2_BenchmarkRouting,
    example3_CustomDomain,
    example4_RealtimeMonitoring,
    example5_WebSocketIntegration,
    example6_BatchProcessing
};
