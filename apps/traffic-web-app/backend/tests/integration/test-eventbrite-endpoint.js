/**
 * @file test-eventbrite-endpoint.js
 * @module apps/traffic-web-app/backend/tests/integration/test-eventbrite-endpoint
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Test script for Eventbrite API integration - Verifies that the
 * Eventbrite API is properly configured and working.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

const axios = require('axios');
require('dotenv').config();

const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3';
const PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN;

async function testEventbriteAPI() {
    console.log('\n🎫 Testing Eventbrite API Integration...\n');
    console.log('='.repeat(60));

    // Check credentials
    if (!PRIVATE_TOKEN) {
        console.error('❌ EVENTBRITE_PRIVATE_TOKEN not found in .env');
        process.exit(1);
    }

    console.log('✅ Environment variables loaded');
    console.log(`   Token: ${PRIVATE_TOKEN.substring(0, 10)}...${PRIVATE_TOKEN.substring(PRIVATE_TOKEN.length - 4)}`);
    console.log('');

    try {
        // Test 1: Verify authentication and get user info
        console.log('🔐 Test 1: Verifying authentication...');
        const userResponse = await axios.get(`${EVENTBRITE_API_BASE}/users/me/`, {
            headers: {
                'Authorization': `Bearer ${PRIVATE_TOKEN}`
            }
        });

        console.log(`✅ Authenticated as: ${userResponse.data.name || userResponse.data.email || 'User'}`);
        console.log(`   User ID: ${userResponse.data.id}`);
        console.log('');

        // Test 2: Get user's organizations
        console.log('🏢 Test 2: Getting user organizations...');
        const orgsResponse = await axios.get(`${EVENTBRITE_API_BASE}/users/me/organizations/`, {
            headers: {
                'Authorization': `Bearer ${PRIVATE_TOKEN}`
            }
        });

        const organizations = orgsResponse.data.organizations || [];
        console.log(`✅ Found ${organizations.length} organization(s)`);

        if (organizations.length > 0) {
            console.log('');
            organizations.forEach((org, index) => {
                console.log(`${index + 1}. ${org.name}`);
                console.log(`   ID: ${org.id}`);
            });
        }
        console.log('');

        // Test 3: Get events from all organizations
        console.log('📅 Test 3: Getting events from user organizations...');
        let allEvents = [];

        for (const org of organizations) {
            try {
                const eventsResponse = await axios.get(`${EVENTBRITE_API_BASE}/organizations/${org.id}/events/`, {
                    params: {
                        'expand': 'venue,ticket_availability',
                        'order_by': 'start_asc',
                        'status': 'live'
                    },
                    headers: {
                        'Authorization': `Bearer ${PRIVATE_TOKEN}`
                    }
                });

                const orgEvents = eventsResponse.data.events || [];
                allEvents.push(...orgEvents);
                console.log(`   ✅ ${org.name}: ${orgEvents.length} event(s)`);
            } catch (error) {
                console.log(`   ⚠️  ${org.name}: Error fetching events`);
            }
        }

        console.log('');
        console.log(`✅ Total events found: ${allEvents.length}`);
        console.log('');

        if (allEvents.length > 0) {
            console.log('📋 Sample Events:\n');

            allEvents.slice(0, 5).forEach((event, index) => {
                const name = event.name?.text || 'Unnamed Event';
                const venueName = event.venue?.name || 'TBA';
                const address = event.venue?.address?.localized_address_display || 'Online/TBA';
                const lat = event.venue?.latitude || 'N/A';
                const lng = event.venue?.longitude || 'N/A';
                const startTime = event.start?.local || event.start?.utc || 'TBA';
                const category = event.category?.name || 'Other';
                const capacity = event.capacity || 'Unknown';

                console.log(`${index + 1}. ${name}`);
                console.log(`   📍 Venue: ${venueName}`);
                console.log(`   📫 Address: ${address}`);
                if (lat !== 'N/A') {
                    console.log(`   🗺️  Coordinates: ${lat}, ${lng}`);
                }
                console.log(`   ⏰ Start: ${startTime}`);
                console.log(`   🏷️  Category: ${category}`);
                console.log(`   👥 Capacity: ${capacity}`);
                console.log('');
            });
        } else {
            console.log('ℹ️  No events found');
            console.log('');
            console.log('💡 Note: Eventbrite API only returns events from:');
            console.log('   - Organizations you own/manage');
            console.log('   - Events you have created');
            console.log('');
            console.log('   To track public events in Ho Chi Minh City, you would need to:');
            console.log('   1. Create events in your Eventbrite account, or');
            console.log('   2. Use a different event discovery API (like Ticketmaster)');
        }

        // Summary
        console.log('='.repeat(60));
        console.log('✅ Eventbrite API authentication successful!');
        console.log('');
        console.log('Integration Status:');
        console.log('  ✅ Authentication working');
        console.log(`  ✅ Organizations: ${organizations.length}`);
        console.log(`  ✅ Events accessible: ${allEvents.length}`);
        console.log('');
        console.log('⚠️  Important Limitation:');
        console.log('   Eventbrite API does NOT provide public event search.');
        console.log('   You can only access events from your own organizations.');
        console.log('');
        console.log('💡 Recommendation:');
        console.log('   For traffic monitoring in Ho Chi Minh City, consider:');
        console.log('   - Creating your own events that may cause traffic');
        console.log('   - Using alternative APIs for public event discovery');
        console.log('   - Ticketmaster (already integrated for US events)');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Eventbrite API Test Failed!\n');

        if (error.response) {
            console.error(`Status: ${error.response.status} ${error.response.statusText}`);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 401) {
                console.error('\n💡 Troubleshooting:');
                console.error('   - Check that EVENTBRITE_PRIVATE_TOKEN is correct in .env');
                console.error('   - Verify token has not expired');
                console.error('   - Ensure token has proper permissions');
            } else if (error.response.status === 403) {
                console.error('\n💡 Troubleshooting:');
                console.error('   - Token may not have permission to access this resource');
                console.error('   - Check Eventbrite API permissions in developer console');
            }
        } else if (error.request) {
            console.error('No response received from Eventbrite API');
            console.error('Error:', error.message);
        } else {
            console.error('Error:', error.message);
        }

        process.exit(1);
    }
}

// Run the test
testEventbriteAPI();