/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * @module apps/traffic-web-app/backend/examples/graph-investigator-usage
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * GraphRAG Investigator Agent - Comprehensive Usage Examples.
 * Demonstrates how to use the GraphInvestigatorAgent for multimodal
 * incident analysis combining Linked Open Data, Computer Vision,
 * and external intelligence sources.
 * 
 * Example Scenarios:
 * 1. Basic Investigation: Analyze single accident by ID
 * 2. Batch Investigation: Analyze multiple accidents in parallel
 * 3. Real-time Investigation: Stream investigation results
 * 4. Custom Investigation: Override default intelligence sources
 * 
 * Intelligence Sources:
 * - Internal LOD: Stellio NGSI-LD + Neo4j graph relationships
 * - Computer Vision: Gemini Flash 2.0 for image analysis
 * - External Search: Tavily Search API for news/social context
 * 
 * @dependencies
 * - GraphInvestigatorAgent: Multimodal AI agent
 * 
 * @usage
 * ```bash
 * # Run all examples
 * npx ts-node examples/graph-investigator-usage.ts
 * 
 * # Run specific example
 * npx ts-node examples/graph-investigator-usage.ts --example 1
 * ```
 */

/**
 * GraphRAG Investigator Agent - Usage Examples
 * 
 * This file demonstrates how to use the GraphInvestigatorAgent
 * for multimodal incident analysis.
 */

import { GraphInvestigatorAgent } from '../src/agents/GraphInvestigatorAgent';
import { logger } from '../src/utils/logger';

/**
 * Example 1: Basic Investigation
 * Investigate a traffic accident by ID
 */
async function example1_BasicInvestigation() {
    logger.info('=== Example 1: Basic Investigation ===');

    const agent = new GraphInvestigatorAgent();

    try {
        // Investigate accident with full multimodal analysis
        const report = await agent.investigateIncident('urn:ngsi-ld:RoadAccident:001');

        console.log('\n📋 INVESTIGATION REPORT:\n');
        console.log(`Accident ID: ${report.accidentId}`);
        console.log(`Timestamp: ${report.timestamp}`);
        console.log(`\nRoot Cause: ${report.rootCause}`);
        console.log(`\nTechnical Severity:`);
        console.log(`  - Internal: ${report.technicalSeverity.internal}`);
        console.log(`  - Visual: ${report.technicalSeverity.visual}/10`);
        console.log(`  - Combined: ${report.technicalSeverity.combined}`);
        console.log(`\nDetected Hazards: ${report.detectedHazards.join(', ')}`);
        console.log(`\nRecommendations:`);
        console.log(`  - Response Teams: ${report.recommendation.responseTeams.join(', ')}`);
        console.log(`  - Priority: ${report.recommendation.priority}`);
        console.log(`  - ETA: ${report.recommendation.estimatedResponseTime}`);
        console.log(`  - Special Equipment: ${report.recommendation.specialEquipment.join(', ')}`);
        console.log(`\nData Sources:`);
        console.log(`  - Stellio: ${report.dataSources.stellio ? '✓' : '✗'}`);
        console.log(`  - Neo4j: ${report.dataSources.neo4j ? '✓' : '✗'}`);
        console.log(`  - Vision: ${report.dataSources.vision ? '✓' : '✗'}`);
        console.log(`  - Search: ${report.dataSources.search ? '✓' : '✗'}`);
        console.log(`\nConfidence: ${(report.confidence * 100).toFixed(1)}%`);

    } catch (error) {
        logger.error('Investigation failed:', error);
    } finally {
        await agent.close();
    }
}

/**
 * Example 2: Custom Configuration
 * Use a custom YAML config file for domain-specific analysis
 */
async function example2_CustomConfig() {
    logger.info('=== Example 2: Custom Configuration ===');

    // Load agent with custom config
    const customConfigPath = './config/agents/graph-investigator-custom.yaml';
    const agent = new GraphInvestigatorAgent(customConfigPath);

    try {
        const report = await agent.investigateIncident('urn:ngsi-ld:RoadAccident:002');

        console.log('\n📋 CUSTOM CONFIG REPORT:\n');
        console.log(JSON.stringify(report, null, 2));

    } catch (error) {
        logger.error('Investigation failed:', error);
    } finally {
        await agent.close();
    }
}

/**
 * Example 3: Batch Processing
 * Investigate multiple accidents in sequence
 */
async function example3_BatchProcessing() {
    logger.info('=== Example 3: Batch Processing ===');

    const agent = new GraphInvestigatorAgent();

    const accidentIds = [
        'urn:ngsi-ld:RoadAccident:001',
        'urn:ngsi-ld:RoadAccident:002',
        'urn:ngsi-ld:RoadAccident:003'
    ];

    try {
        const reports = [];

        for (const accidentId of accidentIds) {
            logger.info(`Processing ${accidentId}...`);
            const report = await agent.investigateIncident(accidentId);
            reports.push(report);
        }

        // Summary statistics
        console.log('\n📊 BATCH SUMMARY:\n');
        console.log(`Total Accidents: ${reports.length}`);
        console.log(`Critical: ${reports.filter(r => r.recommendation.priority === 'critical').length}`);
        console.log(`High: ${reports.filter(r => r.recommendation.priority === 'high').length}`);
        console.log(`Medium: ${reports.filter(r => r.recommendation.priority === 'medium').length}`);
        console.log(`Low: ${reports.filter(r => r.recommendation.priority === 'low').length}`);
        console.log(`\nAverage Confidence: ${(reports.reduce((sum, r) => sum + r.confidence, 0) / reports.length * 100).toFixed(1)}%`);

    } catch (error) {
        logger.error('Batch processing failed:', error);
    } finally {
        await agent.close();
    }
}

/**
 * Example 4: Real-time Integration
 * Integrate with WebSocket for real-time accident analysis
 */
async function example4_RealtimeIntegration() {
    logger.info('=== Example 4: Real-time Integration ===');

    const agent = new GraphInvestigatorAgent();

    // Simulated real-time accident stream
    const incomingAccidents = [
        { id: 'urn:ngsi-ld:RoadAccident:101', timestamp: new Date().toISOString() },
        { id: 'urn:ngsi-ld:RoadAccident:102', timestamp: new Date().toISOString() }
    ];

    for (const accident of incomingAccidents) {
        logger.info(`🚨 New accident detected: ${accident.id}`);

        try {
            const report = await agent.investigateIncident(accident.id);

            // Trigger alerts based on priority
            if (report.recommendation.priority === 'critical') {
                console.log(`\n🔴 CRITICAL ALERT: ${accident.id}`);
                console.log(`Response teams: ${report.recommendation.responseTeams.join(', ')}`);
                console.log(`ETA: ${report.recommendation.estimatedResponseTime}`);
                // In production: send SMS, push notification, etc.
            }

        } catch (error) {
            logger.error(`Failed to analyze ${accident.id}:`, error);
        }
    }

    await agent.close();
}

/**
 * Example 5: Domain-Agnostic Usage
 * Demonstrate how the agent works with ANY domain via config
 */
async function example5_DomainAgnostic() {
    logger.info('=== Example 5: Domain-Agnostic Usage ===');

    console.log(`
🌐 DOMAIN-AGNOSTIC ARCHITECTURE DEMO

The GraphInvestigatorAgent is 100% domain-agnostic and config-driven.

Current domain: TRAFFIC MONITORING
- Hazards: fire, flood, debris, collision
- Response teams: Police, Fire Dept, Medical, Cleanup

TO ADD NEW DOMAIN (e.g., Healthcare):
1. Create config/agents/graph-investigator-healthcare.yaml
2. Define hazards: biohazard, contamination, spill
3. Define response teams: Hazmat Team, Safety Team
4. NO CODE CHANGES REQUIRED!

Example config structure:
---
vision:
  detectionPriorities:
    - hazard: "biohazard"
      keywords: ["blood", "contamination", "spill"]
      severityRange: [8, 10]

synthesis:
  responseTeams:
    - name: "Hazmat Team"
      triggers: ["biohazard", "contamination"]
---

Usage:
const agent = new GraphInvestigatorAgent('./config/agents/graph-investigator-healthcare.yaml');
const report = await agent.investigateIncident('urn:ngsi-ld:HealthIncident:001');
    `);
}

/**
 * Main execution
 */
async function main() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   GraphRAG Investigator Agent - Usage Examples            ║
║   Multimodal Incident Analysis with LOD + Vision + Search ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Check environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasTavily = !!process.env.TAVILY_API_KEY;

    console.log('\n📋 Environment Check:');
    console.log(`  OPENAI_API_KEY: ${hasOpenAI ? '✓' : '✗ (Vision analysis will be skipped)'}`);
    console.log(`  TAVILY_API_KEY: ${hasTavily ? '✓' : '✗ (External intelligence will be skipped)'}`);
    console.log(`  NEO4J_URL: ${process.env.NEO4J_URL || 'bolt://localhost:7687'}`);
    console.log(`  STELLIO_URL: ${process.env.STELLIO_URL || 'http://localhost:8080'}`);

    // Run examples
    try {
        // Uncomment to run specific examples:

        // await example1_BasicInvestigation();
        // await example2_CustomConfig();
        // await example3_BatchProcessing();
        // await example4_RealtimeIntegration();
        await example5_DomainAgnostic();

        console.log('\n✅ All examples completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Error running examples:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

export {
    example1_BasicInvestigation,
    example2_CustomConfig,
    example3_BatchProcessing,
    example4_RealtimeIntegration,
    example5_DomainAgnostic
};
