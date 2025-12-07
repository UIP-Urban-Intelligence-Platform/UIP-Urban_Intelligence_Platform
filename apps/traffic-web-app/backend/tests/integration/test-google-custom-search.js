/**
 * @file test-google-custom-search.js
 * @module apps/traffic-web-app/backend/tests/integration/test-google-custom-search
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Google Custom Search API Test for HCMC Events - Tests whether Google
 * Custom Search API can effectively find real events in Ho Chi Minh City.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

require('dotenv').config();
const axios = require('axios');

const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 GOOGLE CUSTOM SEARCH API TEST - HCMC EVENTS');
console.log('═══════════════════════════════════════════════════════\n');

// Test queries for finding events in HCMC
const testQueries = [
    'concerts Ho Chi Minh City Vietnam 2025',
    'festivals HCMC upcoming events',
    'live music Saigon this month',
    'sự kiện âm nhạc Hồ Chí Minh',  // Vietnamese: music events HCMC
    'liên hoan hội chợ Sài Gòn',     // Vietnamese: festivals fairs Saigon
];

async function testGoogleCustomSearch() {
    if (!SEARCH_ENGINE_ID || !API_KEY) {
        console.error('❌ Missing credentials:');
        console.error(`   GOOGLE_SEARCH_ENGINE_ID: ${SEARCH_ENGINE_ID ? '✅ Found' : '❌ Missing'}`);
        console.error(`   GOOGLE_SEARCH_API_KEY: ${API_KEY ? '✅ Found' : '❌ Missing'}`);
        process.exit(1);
    }

    console.log('✅ Credentials loaded:');
    console.log(`   Search Engine ID: ${SEARCH_ENGINE_ID}`);
    console.log(`   API Key: ${API_KEY.substring(0, 20)}...`);
    console.log();

    const client = axios.create({
        baseURL: 'https://www.googleapis.com/customsearch/v1',
        timeout: 15000
    });

    let totalResults = 0;
    const allResults = [];

    for (const query of testQueries) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`📍 Query: "${query}"`);
        console.log(`${'─'.repeat(60)}`);

        try {
            const response = await client.get('', {
                params: {
                    key: API_KEY,
                    cx: SEARCH_ENGINE_ID,
                    q: query,
                    num: 10,  // Get 10 results per query
                    dateRestrict: 'd30',  // Last 30 days
                    lr: 'lang_en|lang_vi',  // English or Vietnamese
                }
            });

            const items = response.data.items || [];
            const searchInfo = response.data.searchInformation || {};

            console.log(`\n✅ Search successful:`);
            console.log(`   Total results: ${searchInfo.totalResults || 0}`);
            console.log(`   Search time: ${searchInfo.searchTime || 0}s`);
            console.log(`   Results returned: ${items.length}`);

            if (items.length > 0) {
                console.log(`\n📋 Top results:`);
                items.forEach((item, index) => {
                    console.log(`\n   ${index + 1}. ${item.title}`);
                    console.log(`      URL: ${item.link}`);
                    console.log(`      Snippet: ${item.snippet}`);

                    // Try to extract event-related information
                    const snippet = item.snippet.toLowerCase();
                    const title = item.title.toLowerCase();
                    const combined = `${title} ${snippet}`;

                    const indicators = {
                        // Improved date detection: handles "Nov 7, 2025", "2/11/2025", "November 8", "tháng 11"
                        hasDate: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}|tháng\s*\d{1,2}|\d{1,2}\s*tháng|\d{1,2}\/\d{1,2}\/\d{4}|saturday|sunday|monday|tuesday|wednesday|thursday|friday|thứ\s*[2-7]|chủ nhật/.test(combined),
                        // Improved venue detection: includes Vietnamese venues and common event spaces
                        hasVenue: /stadium|theater|theatre|arena|hall|center|centre|park|club|bar|cafe|nhà hát|sân vận động|trung tâm|hội trường|auditorium|convention|venue|địa điểm|nơi tổ chức|phố đi bộ|quảng trường|square/.test(combined),
                        // Improved event type detection: more event types in English and Vietnamese
                        hasEventType: /concert|festival|show|performance|exhibition|conference|seminar|workshop|event|buổi diễn|lễ hội|triển lãm|hội thảo|biểu diễn|hoà nhạc|âm nhạc|music|live|gala|party|bazaar|fair|expo|championship|tournament|competition|cuộc thi/.test(combined),
                        // Improved price/ticket detection
                        hasPrice: /ticket|price|free|vnd|đồng|vé|giá|admission|entry|cost|fee|miễn phí|mua vé|đặt vé|booking/.test(combined)
                    };

                    const score = Object.values(indicators).filter(Boolean).length;
                    console.log(`      Event indicators: ${score}/4 ` +
                        `(Date: ${indicators.hasDate ? '✓' : '✗'}, ` +
                        `Venue: ${indicators.hasVenue ? '✓' : '✗'}, ` +
                        `Type: ${indicators.hasEventType ? '✓' : '✗'}, ` +
                        `Price: ${indicators.hasPrice ? '✓' : '✗'})`);

                    allResults.push({
                        query,
                        title: item.title,
                        link: item.link,
                        snippet: item.snippet,
                        score,
                        indicators
                    });
                });

                totalResults += items.length;
            } else {
                console.log(`\n⚠️  No results found for this query`);
            }

        } catch (error) {
            if (error.response) {
                console.error(`\n❌ API Error: ${error.response.status} ${error.response.statusText}`);
                console.error(`   Message: ${error.response.data?.error?.message || 'Unknown error'}`);

                if (error.response.status === 403) {
                    console.error('\n   Possible reasons:');
                    console.error('   • API key not enabled for Custom Search API');
                    console.error('   • Search Engine ID is invalid');
                    console.error('   • Daily quota exceeded');
                }
            } else {
                console.error(`\n❌ Request failed: ${error.message}`);
            }
        }

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary and Analysis
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY & ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Total queries tested: ${testQueries.length}`);
    console.log(`Total results found: ${totalResults}`);
    console.log(`Average results per query: ${(totalResults / testQueries.length).toFixed(1)}`);

    // Score distribution
    const highQuality = allResults.filter(r => r.score >= 3).length;
    const mediumQuality = allResults.filter(r => r.score === 2).length;
    const lowQuality = allResults.filter(r => r.score <= 1).length;

    console.log(`\n📈 Result quality distribution:`);
    console.log(`   High quality (3-4 indicators): ${highQuality} (${((highQuality / totalResults) * 100).toFixed(1)}%)`);
    console.log(`   Medium quality (2 indicators): ${mediumQuality} (${((mediumQuality / totalResults) * 100).toFixed(1)}%)`);
    console.log(`   Low quality (0-1 indicators): ${lowQuality} (${((lowQuality / totalResults) * 100).toFixed(1)}%)`);

    // Evaluation
    console.log(`\n🎯 EVALUATION:`);

    if (totalResults === 0) {
        console.log(`   ❌ FAIL: No results found`);
        console.log(`\n   Possible issues:`);
        console.log(`   • Search Engine not configured for HCMC event sites`);
        console.log(`   • No indexed pages matching queries`);
        console.log(`   • API configuration error`);
    } else if (highQuality / totalResults >= 0.5) {
        console.log(`   ✅ GOOD: ${((highQuality / totalResults) * 100).toFixed(0)}% of results have strong event indicators`);
        console.log(`\n   Recommendation: Google Custom Search is viable for HCMC event discovery`);
        console.log(`   • Can extract event information from search results`);
        console.log(`   • Need robust parsing logic for dates, venues, and event types`);
        console.log(`   • Consider combining with other sources for better coverage`);
    } else if (highQuality / totalResults >= 0.3) {
        console.log(`   ⚠️  MODERATE: ${((highQuality / totalResults) * 100).toFixed(0)}% of results have strong event indicators`);
        console.log(`\n   Recommendation: Google Custom Search can work but needs improvements`);
        console.log(`   • Refine Search Engine configuration to focus on event sites`);
        console.log(`   • Add more event-specific websites to search scope`);
        console.log(`   • Consider hybrid approach with other sources`);
    } else {
        console.log(`   ❌ POOR: Only ${((highQuality / totalResults) * 100).toFixed(0)}% of results have strong event indicators`);
        console.log(`\n   Recommendation: Google Custom Search may not be suitable`);
        console.log(`   • Results lack structured event data`);
        console.log(`   • Consider alternatives:`);
        console.log(`     - Vietnamese event platform APIs (Ticketbox.vn, Pops.vn)`);
        console.log(`     - Web scraping specific event sites`);
        console.log(`     - RSS feeds from HCMC venues`);
    }

    // Show top 3 highest quality results
    if (allResults.length > 0) {
        const topResults = allResults
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        console.log(`\n\n📌 Top 3 highest quality results:\n`);
        topResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} (Score: ${result.score}/4)`);
            console.log(`   Query: "${result.query}"`);
            console.log(`   URL: ${result.link}`);
            console.log(`   Snippet: ${result.snippet.substring(0, 150)}...`);
            console.log();
        });
    }

    console.log('═══════════════════════════════════════════════════════\n');
}

// Run the test
testGoogleCustomSearch().catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
});
