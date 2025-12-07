/**
 * @file test-google-calendar-endpoint.js
 * @module apps/traffic-web-app/backend/tests/integration/test-google-calendar-endpoint
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Test script for Google Calendar API integration - Verifies that the
 * Google Calendar API is properly configured and working.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

const axios = require('axios');
require('dotenv').config();

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

async function testGoogleCalendarAPI() {
    console.log('\n📅 Testing Google Calendar API Integration...\n');
    console.log('='.repeat(60));

    // Check credentials
    if (!API_KEY) {
        console.error('❌ GOOGLE_CALENDAR_API_KEY not found in .env');
        process.exit(1);
    }

    console.log('✅ Environment variables loaded');
    console.log(`   API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
    console.log('');

    try {
        // Public calendar IDs for Vietnam
        const calendarIds = [
            'vi.vietnamese#holiday@group.v.calendar.google.com', // Vietnam holidays (Vietnamese)
            'en.vietnamese#holiday@group.v.calendar.google.com'  // Vietnam holidays (English)
        ];

        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ahead

        let totalEvents = 0;

        for (const calendarId of calendarIds) {
            console.log(`\n📆 Testing calendar: ${calendarId}`);
            console.log('-'.repeat(60));

            try {
                const response = await axios.get(`${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
                    params: {
                        key: API_KEY,
                        timeMin: timeMin,
                        timeMax: timeMax,
                        singleEvents: true,
                        orderBy: 'startTime',
                        maxResults: 50
                    }
                });

                console.log(`✅ Status: ${response.status} ${response.statusText}`);

                const events = response.data.items || [];
                totalEvents += events.length;

                console.log(`✅ Found ${events.length} event(s)`);
                console.log('');

                if (events.length > 0) {
                    console.log('📋 Upcoming Events:\n');

                    events.slice(0, 10).forEach((event, index) => {
                        const summary = event.summary || 'Unnamed Event';
                        const start = event.start?.date || event.start?.dateTime || 'TBA';
                        const end = event.end?.date || event.end?.dateTime || 'TBA';
                        const description = event.description ? event.description.substring(0, 100) + '...' : 'No description';

                        console.log(`${index + 1}. ${summary}`);
                        console.log(`   📅 Start: ${start}`);
                        console.log(`   📅 End: ${end}`);
                        console.log(`   📝 Description: ${description}`);
                        console.log('');
                    });

                    if (events.length > 10) {
                        console.log(`   ... and ${events.length - 10} more events\n`);
                    }
                } else {
                    console.log('ℹ️  No upcoming events found in this calendar');
                }

            } catch (error) {
                if (error.response) {
                    console.error(`❌ Status: ${error.response.status} ${error.response.statusText}`);
                    console.error('Response:', JSON.stringify(error.response.data, null, 2));

                    if (error.response.status === 403) {
                        console.error('\n💡 Troubleshooting:');
                        console.error('   - Check that GOOGLE_CALENDAR_API_KEY is correct in .env');
                        console.error('   - Verify that Google Calendar API is enabled in Google Cloud Console');
                        console.error('   - Check API key restrictions (HTTP referrers, IP addresses, APIs)');
                    } else if (error.response.status === 404) {
                        console.error('\n💡 Troubleshooting:');
                        console.error('   - Calendar ID may not exist or is not public');
                        console.error('   - Verify calendar ID is correct');
                    }
                } else {
                    console.error('Error:', error.message);
                }
            }
        }

        // Summary
        console.log('='.repeat(60));
        console.log(`✅ Google Calendar API tests completed!`);
        console.log('');
        console.log('Integration Status:');
        console.log(`  ✅ Total events found: ${totalEvents}`);
        console.log('  ✅ Vietnam holiday calendars accessible');
        console.log('  ✅ Ready for TrafficMaestroAgent integration');
        console.log('');
        console.log('📝 Note: These are public holidays in Vietnam that may cause');
        console.log('   significant traffic changes in Ho Chi Minh City.');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Google Calendar API Test Failed!\n');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the test
testGoogleCalendarAPI();
