/**
 * @file test-traffic-maestro-google-search.js
 * @module apps/traffic-web-app/backend/tests/integration/test-traffic-maestro-google-search
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Test Google Custom Search integration in TrafficMaestroAgent -
 * Tests the searchHCMCEvents() method.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

require('dotenv').config();

// First compile TypeScript
const { execSync } = require('child_process');
console.log('📦 Compiling TypeScript...\n');
try {
    execSync('npx tsc', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
}

const { TrafficMaestroAgent } = require('./dist/agents/TrafficMaestroAgent');

console.log('═══════════════════════════════════════════════════════');
console.log('🎯 TRAFFIC MAESTRO AGENT - GOOGLE CUSTOM SEARCH TEST');
console.log('═══════════════════════════════════════════════════════\n');

async function testTrafficMaestroGoogleSearch() {
    try {
        // Check credentials
        const hasSearchEngineId = !!process.env.GOOGLE_SEARCH_ENGINE_ID;
        const hasSearchApiKey = !!process.env.GOOGLE_SEARCH_API_KEY;
        const hasCalendarApiKey = !!process.env.GOOGLE_CALENDAR_API_KEY;
        const hasTicketmasterKey = !!process.env.TICKETMASTER_API_KEY;

        console.log('📋 Configuration Check:');
        console.log(`   GOOGLE_SEARCH_ENGINE_ID: ${hasSearchEngineId ? '✅ Found' : '❌ Missing'}`);
        console.log(`   GOOGLE_SEARCH_API_KEY: ${hasSearchApiKey ? '✅ Found' : '❌ Missing'}`);
        console.log(`   GOOGLE_CALENDAR_API_KEY: ${hasCalendarApiKey ? '✅ Found' : '❌ Missing'}`);
        console.log(`   TICKETMASTER_API_KEY: ${hasTicketmasterKey ? '✅ Found' : '❌ Missing'}`);
        console.log();

        if (!hasSearchEngineId || !hasSearchApiKey) {
            console.error('❌ Google Custom Search credentials missing!');
            console.error('   Please configure in .env file:\n');
            console.error('   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id');
            console.error('   GOOGLE_SEARCH_API_KEY=your_api_key\n');
            return;
        }

        // Initialize Traffic Maestro Agent
        console.log('🚀 Initializing Traffic Maestro Agent...\n');
        const agent = new TrafficMaestroAgent();

        // Monitor events (this will call all enabled sources)
        console.log('🔍 Monitoring events from all sources...\n');
        const eventMappings = await agent.monitorExternalEvents();

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 EVENT MONITORING RESULTS');
        console.log('═══════════════════════════════════════════════════════\n');

        if (!eventMappings || eventMappings.length === 0) {
            console.log('⚠️  No events found or mappings empty');
            return;
        }

        // Extract all events from mappings
        const allEvents = eventMappings.map(m => m.event);

        // Count events by source
        const eventsBySource = {
            'ticketmaster': 0,
            'google-calendar': 0,
            'google-search': 0,
            'other': 0
        };

        allEvents.forEach(event => {
            if (eventsBySource[event.source] !== undefined) {
                eventsBySource[event.source]++;
            } else {
                eventsBySource['other']++;
            }
        });

        console.log(`Total events found: ${allEvents.length}\n`);
        console.log('Events by source:');
        console.log(`   Ticketmaster: ${eventsBySource['ticketmaster']}`);
        console.log(`   Google Calendar: ${eventsBySource['google-calendar']}`);
        console.log(`   Google Custom Search: ${eventsBySource['google-search']} ⭐`);
        console.log(`   Other: ${eventsBySource['other']}`);
        console.log();

        // Show Google Custom Search events in detail
        const googleSearchEvents = allEvents.filter(e => e.source === 'google-search');

        if (googleSearchEvents.length > 0) {
            console.log('✅ GOOGLE CUSTOM SEARCH EVENTS FOUND:\n');
            googleSearchEvents.forEach((event, index) => {
                console.log(`${index + 1}. ${event.name}`);
                console.log(`   Category: ${event.category}`);
                console.log(`   Expected Attendees: ${event.expectedAttendees.toLocaleString()}`);
                console.log(`   Start Time: ${new Date(event.startTime).toLocaleString()}`);
                console.log(`   Venue: ${event.venue.name}`);
                console.log(`   Address: ${event.venue.address}`);
                console.log();
            });
        } else {
            console.log('⚠️  No events found from Google Custom Search');
            console.log('   Possible reasons:');
            console.log('   • API rate limiting (try again later)');
            console.log('   • Search Engine not configured for HCMC event sites');
            console.log('   • No events matching quality criteria (score >= 2)');
            console.log();
        }

        // Show event-camera mappings
        console.log('═══════════════════════════════════════════════════════');
        console.log('📍 EVENT-CAMERA MAPPINGS');
        console.log('═══════════════════════════════════════════════════════\n');

        const googleSearchMappings = eventMappings.filter(
            m => m.event.source === 'google-search'
        );

        if (googleSearchMappings.length > 0) {
            console.log(`Found ${googleSearchMappings.length} mappings for Google Custom Search events:\n`);
            googleSearchMappings.forEach((mapping, index) => {
                console.log(`${index + 1}. ${mapping.event.name}`);
                console.log(`   Affected cameras: ${mapping.affectedCameras.length}`);
                if (mapping.affectedCameras.length > 0) {
                    mapping.affectedCameras.slice(0, 3).forEach(({ camera, distance }) => {
                        console.log(`   • ${camera.location.street} (${(distance / 1000).toFixed(2)}km)`);
                    });
                    if (mapping.affectedCameras.length > 3) {
                        console.log(`   ... and ${mapping.affectedCameras.length - 3} more`);
                    }
                }
                console.log();
            });
        } else {
            console.log('⚠️  No camera mappings for Google Custom Search events');
            console.log('   Events may be outside configured search radius');
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ TEST COMPLETED SUCCESSFULLY');
        console.log('═══════════════════════════════════════════════════════\n');

        // Summary
        console.log('📈 SUMMARY:');
        console.log(`   Total events monitored: ${allEvents.length}`);
        console.log(`   Google Custom Search events: ${eventsBySource['google-search']}`);
        console.log(`   Event-camera mappings: ${eventMappings.length}`);
        console.log(); if (eventsBySource['google-search'] > 0) {
            console.log('✅ Google Custom Search integration WORKING!');
            console.log('   Successfully finding real HCMC events from web search');
        } else {
            console.log('⚠️  Google Custom Search returned no events');
            console.log('   Check API configuration and search engine setup');
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testTrafficMaestroGoogleSearch();
