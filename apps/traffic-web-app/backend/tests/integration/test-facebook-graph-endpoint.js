/**
 * @file test-facebook-graph-endpoint.js
 * @module apps/traffic-web-app/backend/tests/integration/test-facebook-graph-endpoint
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Test Facebook Graph API Integration - Fetches public events in
 * Ho Chi Minh City, Vietnam for traffic monitoring.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

require('dotenv').config();
const axios = require('axios');

const FACEBOOK_API_BASE = 'https://graph.facebook.com/v21.0';
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

async function testFacebookGraphAPI() {
    console.log('\n' + '='.repeat(80));
    console.log('📘 FACEBOOK GRAPH API - EVENT SEARCH TEST');
    console.log('='.repeat(80) + '\n');

    if (!ACCESS_TOKEN) {
        console.error('❌ Error: FACEBOOK_ACCESS_TOKEN not found in .env file');
        console.log('\n💡 Get your access token from:');
        console.log('   https://developers.facebook.com/tools/explorer/');
        return;
    }

    console.log('🔑 Access Token:', ACCESS_TOKEN.substring(0, 20) + '...' + ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 10));
    console.log('📍 Search Location: Ho Chi Minh City, Vietnam (10.762622, 106.660172)');
    console.log('📏 Search Radius: 25km\n');

    try {
        // Test 1: First verify token validity
        console.log('📋 Test 1: Verifying access token...\n');

        const debugResponse = await axios.get(`${FACEBOOK_API_BASE}/debug_token`, {
            params: {
                input_token: ACCESS_TOKEN,
                access_token: ACCESS_TOKEN
            }
        });

        const tokenInfo = debugResponse.data.data;
        console.log('✅ Token Information:');
        console.log(`   App ID: ${tokenInfo.app_id || 'N/A'}`);
        console.log(`   Type: ${tokenInfo.type || 'N/A'}`);
        console.log(`   Valid: ${tokenInfo.is_valid ? 'Yes' : 'No'}`);
        console.log(`   User ID: ${tokenInfo.user_id || 'N/A'}`);

        if (tokenInfo.scopes) {
            console.log(`   Scopes: ${tokenInfo.scopes.join(', ')}`);
        }

        console.log('\n' + '─'.repeat(80) + '\n');

        // Test 2: Get user's own events
        console.log('📋 Test 2: Fetching user\'s events...\n');

        const userEventsResponse = await axios.get(`${FACEBOOK_API_BASE}/me/events`, {
            params: {
                access_token: ACCESS_TOKEN,
                fields: 'id,name,description,start_time,end_time,place,attending_count,interested_count,category',
                limit: 50
            }
        });

        const userEvents = userEventsResponse.data.data || [];
        console.log(`✅ User Events Found: ${userEvents.length}\n`);

        if (userEvents.length > 0) {
            userEvents.slice(0, 5).forEach((event, index) => {
                console.log(`${index + 1}. ${event.name}`);
                console.log(`   Event ID: ${event.id}`);
                console.log(`   Start: ${event.start_time || 'Not specified'}`);
                console.log('');
            });
        }

        console.log('─'.repeat(80) + '\n');

        // Test 3: Search for pages related to events in HCMC
        console.log('📋 Test 3: Searching for event pages in Ho Chi Minh City...\n');

        try {
            const pageSearchResponse = await axios.get(`${FACEBOOK_API_BASE}/search`, {
                params: {
                    access_token: ACCESS_TOKEN,
                    type: 'page',
                    q: 'events Ho Chi Minh City',
                    fields: 'id,name,category,category_list,location',
                    limit: 10
                }
            });

            const pages = pageSearchResponse.data.data || [];
            console.log(`✅ Event Pages Found: ${pages.length}\n`);

            if (pages.length > 0) {
                pages.forEach((page, index) => {
                    console.log(`${index + 1}. ${page.name}`);
                    console.log(`   Page ID: ${page.id}`);
                    console.log(`   Category: ${page.category || 'N/A'}`);
                    if (page.location) {
                        console.log(`   Location: ${page.location.city || ''}, ${page.location.country || ''}`);
                    }
                    console.log('');
                });
            }
        } catch (pageError) {
            console.log('⚠️  Page search not available:', pageError.response?.data?.error?.message || pageError.message);
        }

        console.log('─'.repeat(80) + '\n');

        // Test 4: Alternative - Get user info
        console.log('📋 Test 4: Getting user profile information...\n');

        const meResponse = await axios.get(`${FACEBOOK_API_BASE}/me`, {
            params: {
                access_token: ACCESS_TOKEN,
                fields: 'id,name,email'
            }
        });

        console.log('✅ User Profile:');
        console.log(`   User ID: ${meResponse.data.id}`);
        console.log(`   Name: ${meResponse.data.name}`);
        console.log(`   Email: ${meResponse.data.email || 'Not available'}`);

        console.log('\n' + '='.repeat(80));
        console.log('📊 FACEBOOK GRAPH API ANALYSIS');
        console.log('='.repeat(80) + '\n');

        console.log('✅ API Connection: Working');
        console.log('✅ Token Authentication: Valid');
        console.log(`📋 User Events Accessible: ${userEvents.length}`);
        console.log('\n⚠️  PUBLIC EVENT SEARCH LIMITATION DISCOVERED:\n');
        console.log('   Facebook Graph API has deprecated public event discovery.');
        console.log('   Similar to Eventbrite, you can only access:');
        console.log('   • Events you have created');
        console.log('   • Events you are attending/interested in');
        console.log('   • Events from pages you manage\n');
        console.log('📖 Recommendation:');
        console.log('   • For traffic monitoring, use Google Calendar (holidays)');
        console.log('   • Use Ticketmaster for concert/sports events');
        console.log('   • Facebook API best for your own organized events\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.response?.status, error.response?.statusText);

        if (error.response?.data) {
            console.error('📋 Error Details:', JSON.stringify(error.response.data, null, 2));
        }

        console.log('\n💡 Troubleshooting Tips:');
        console.log('   1. Verify your access token is valid');
        console.log('   2. Check token permissions (user_events, public_profile)');
        console.log('   3. Ensure token has not expired');
        console.log('   4. Try regenerating token from Facebook Graph API Explorer');
        console.log('   5. Note: Facebook may have restrictions on public event search\n');
    }
}

// Run the test
testFacebookGraphAPI().catch(console.error);
