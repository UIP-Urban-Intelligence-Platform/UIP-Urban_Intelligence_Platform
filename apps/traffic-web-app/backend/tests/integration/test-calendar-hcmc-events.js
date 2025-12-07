/**
 * @file test-calendar-hcmc-events.js
 * @module apps/traffic-web-app/backend/tests/integration/test-calendar-hcmc-events
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 1.0.0
 * @license MIT
 * @description Test Google Calendar API - Search for HCMC Events.
 * Find all possible public calendars with events in Ho Chi Minh City, Vietnam
 * to enhance TrafficMaestroAgent's event awareness.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

require('dotenv').config();
const axios = require('axios');

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

// Ho Chi Minh City coordinates
const HCMC_LAT = 10.762622;
const HCMC_LNG = 106.660172;

// Time range: Current date + 1 year ahead
const timeMin = new Date().toISOString();
const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

// Comprehensive list of public calendars to test
const CALENDAR_IDS = {
    'Vietnam Holidays (Vietnamese)': 'vi.vietnamese#holiday@group.v.calendar.google.com',
    'Vietnam Holidays (English)': 'en.vietnamese#holiday@group.v.calendar.google.com',

    // Religious holidays (many Vietnamese follow)
    'Christian Holidays': 'en.christian#holiday@group.v.calendar.google.com',
    'Buddhist Holidays': 'en.buddhist#holiday@group.v.calendar.google.com',
    'Islamic Holidays': 'en.islamic#holiday@group.v.calendar.google.com',
    'Hindu Holidays': 'en.hindu#holiday@group.v.calendar.google.com',

    // Neighboring countries (impact tourism/business)
    'China Holidays': 'zh.cn#holiday@group.v.calendar.google.com',
    'Thailand Holidays': 'en.th#holiday@group.v.calendar.google.com',
    'Singapore Holidays': 'en.singapore#holiday@group.v.calendar.google.com',
    'Malaysia Holidays': 'en.malaysia#holiday@group.v.calendar.google.com',
    'Japan Holidays': 'ja.japanese#holiday@group.v.calendar.google.com',
    'South Korea Holidays': 'ko.south_korea#holiday@group.v.calendar.google.com',

    // Major western countries (international tourism)
    'USA Holidays': 'en.usa#holiday@group.v.calendar.google.com',
    'UK Holidays': 'en.uk#holiday@group.v.calendar.google.com',
    'Australia Holidays': 'en.australian#holiday@group.v.calendar.google.com',
    'France Holidays': 'en.french#holiday@group.v.calendar.google.com',
    'Germany Holidays': 'en.german#holiday@group.v.calendar.google.com',

    // Special calendars
    'Moon Phases': 'ht3jlfaac5lfd6263ulfh4tql8@group.calendar.google.com',
    'Week Numbers': 'p#weeknum@group.v.calendar.google.com',
};

async function testCalendar(name, calendarId) {
    try {
        console.log(`\n📅 Testing: ${name}`);
        console.log(`   Calendar ID: ${calendarId}`);

        const response = await axios.get(
            `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
            {
                params: {
                    key: API_KEY,
                    timeMin: timeMin,
                    timeMax: timeMax,
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults: 10
                },
                timeout: 10000
            }
        );

        const events = response.data.items || [];

        if (events.length > 0) {
            console.log(`   ✅ Status: ${response.status} OK`);
            console.log(`   ✅ Events Found: ${events.length}`);

            // Show first 3 events
            console.log(`\n   📋 Sample Events:`);
            events.slice(0, 3).forEach((event, index) => {
                const startDate = event.start?.dateTime || event.start?.date || 'N/A';
                const summary = event.summary || 'Unnamed Event';
                console.log(`      ${index + 1}. ${summary}`);
                console.log(`         Date: ${startDate.split('T')[0]}`);
                if (event.description) {
                    const desc = event.description.substring(0, 80);
                    console.log(`         Description: ${desc}...`);
                }
            });

            return { name, calendarId, count: events.length, events: events.slice(0, 3) };
        } else {
            console.log(`   ⚠️  Status: ${response.status} OK`);
            console.log(`   ⚠️  Events Found: 0`);
            return { name, calendarId, count: 0, events: [] };
        }

    } catch (error) {
        if (error.response) {
            console.log(`   ❌ Status: ${error.response.status} ${error.response.statusText}`);
            console.log(`   ❌ Error: ${error.response.data.error?.message || 'Unknown error'}`);
        } else {
            console.log(`   ❌ Error: ${error.message}`);
        }
        return { name, calendarId, count: 0, events: [], error: error.message };
    }
}

async function main() {
    console.log('\n' + '='.repeat(80));
    console.log('📘 GOOGLE CALENDAR API - HCMC EVENT DISCOVERY TEST');
    console.log('='.repeat(80));

    console.log('\n🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 20)}...` : '❌ NOT FOUND');
    console.log('📍 Target Location: Ho Chi Minh City, Vietnam');
    console.log('📅 Time Range: 1 year (from today)');
    console.log(`⏰ Search Window: ${timeMin.split('T')[0]} to ${timeMax.split('T')[0]}`);
    console.log('\n🔍 Testing', Object.keys(CALENDAR_IDS).length, 'public calendars...\n');

    if (!API_KEY) {
        console.error('❌ Error: GOOGLE_CALENDAR_API_KEY not found in .env file');
        process.exit(1);
    }

    const results = [];

    // Test each calendar
    for (const [name, calendarId] of Object.entries(CALENDAR_IDS)) {
        const result = await testCalendar(name, calendarId);
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 CALENDAR DISCOVERY SUMMARY');
    console.log('='.repeat(80));

    const successfulCalendars = results.filter(r => r.count > 0);
    const totalEvents = results.reduce((sum, r) => sum + r.count, 0);

    console.log(`\n✅ Calendars with Events: ${successfulCalendars.length}/${results.length}`);
    console.log(`📅 Total Events Found: ${totalEvents}`);

    if (successfulCalendars.length > 0) {
        console.log('\n🎯 RECOMMENDED CALENDARS FOR HCMC TRAFFIC MONITORING:\n');

        // Sort by event count
        successfulCalendars.sort((a, b) => b.count - a.count);

        successfulCalendars.forEach((calendar, index) => {
            console.log(`${index + 1}. ${calendar.name}`);
            console.log(`   Events: ${calendar.count}`);
            console.log(`   ID: ${calendar.calendarId}`);
            console.log('');
        });

        console.log('💡 IMPLEMENTATION SUGGESTION:\n');
        console.log('Add these calendar IDs to TrafficMaestroAgent.ts:');
        console.log('```typescript');
        console.log('const calendarIds = [');
        successfulCalendars.slice(0, 5).forEach(cal => {
            console.log(`    '${cal.calendarId}', // ${cal.name} (${cal.count} events)`);
        });
        console.log('];');
        console.log('```');
    } else {
        console.log('\n⚠️  No calendars found with events in the search window.');
        console.log('   This could be due to:');
        console.log('   • API key permissions');
        console.log('   • Calendar availability');
        console.log('   • Time range settings');
    }

    console.log('\n' + '='.repeat(80));
}

main().catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
});
