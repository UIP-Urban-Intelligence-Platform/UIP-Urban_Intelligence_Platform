/**
 *  Module: tests.integration.test-agents-realtime
 * Author: Nguyễn Nhật Quang
 * Created: 2025-11-26
 * Version: 1.0.0
 * License: MIT
 * Description:
 * Real-time Test Script for Agents
 * Tests GraphInvestigatorAgent and TrafficMaestroAgent with actual data
 * Usage: node test-agents-realtime.js
 * 
 * To validate agent behavior with real-time data, simulating live scenarios
 * and ensuring accurate responses.
 *
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(color, ...args) {
    console.log(color, ...args, colors.reset);
}

function header(text) {
    console.log('\n' + colors.bright + colors.blue + '='.repeat(60));
    console.log(text);
    console.log('='.repeat(60) + colors.reset + '\n');
}

function success(text) {
    log(colors.green, '✓', text);
}

function error(text) {
    log(colors.red, '✗', text);
}

function info(text) {
    log(colors.cyan, 'ℹ', text);
}

function warning(text) {
    log(colors.yellow, '⚠', text);
}

// =====================================================
// TEST 1: GraphInvestigatorAgent - Incident Investigation
// =====================================================

async function testGraphInvestigator() {
    header('TEST 1: Graph Investigator Agent - Multimodal Incident Analysis');

    try {
        info('Step 1: Fetching recent accidents from Stellio...');

        // Get list of RoadAccident entities
        const accidentsResponse = await axios.get(
            `${API_BASE}/api/stellio/entities`,
            {
                params: {
                    type: 'RoadAccident',
                    limit: 5,
                    options: 'keyValues'
                }
            }
        );

        if (!accidentsResponse.data || accidentsResponse.data.length === 0) {
            warning('No accidents found in Stellio. Creating a test accident...');

            // Create test accident
            const testAccident = {
                id: `urn:ngsi-ld:RoadAccident:TEST_${Date.now()}`,
                type: 'RoadAccident',
                location: {
                    type: 'GeoProperty',
                    value: {
                        type: 'Point',
                        coordinates: [106.6297, 10.8231] // HCMC center
                    }
                },
                accidentType: {
                    type: 'Property',
                    value: 'collision'
                },
                severity: {
                    type: 'Property',
                    value: 'high'
                },
                description: {
                    type: 'Property',
                    value: 'Multi-vehicle collision on highway, possible fire hazard'
                },
                timestamp: {
                    type: 'Property',
                    value: new Date().toISOString()
                },
                resolved: {
                    type: 'Property',
                    value: false
                },
                casualties: {
                    type: 'Property',
                    value: 2
                },
                affectedCamera: {
                    type: 'Property',
                    value: 'urn:ngsi-ld:Camera:001'
                }
            };

            await axios.post(
                `${API_BASE}/api/stellio/entities`,
                testAccident,
                {
                    headers: {
                        'Content-Type': 'application/ld+json'
                    }
                }
            );

            success(`Created test accident: ${testAccident.id}`);

            // Use the test accident
            info('\nStep 2: Investigating the test accident...');

            const investigationResponse = await axios.post(
                `${API_BASE}/api/agents/graph-investigator/investigate`,
                {
                    accidentId: testAccident.id
                }
            );

            displayInvestigationReport(investigationResponse.data);

        } else {
            const accident = accidentsResponse.data[0];
            success(`Found ${accidentsResponse.data.length} accidents in system`);
            info(`Investigating: ${accident.id}`);

            // Investigate the accident
            info('\nStep 2: Running multimodal investigation...');

            const investigationResponse = await axios.post(
                `${API_BASE}/api/agents/graph-investigator/investigate`,
                {
                    accidentId: accident.id
                }
            );

            displayInvestigationReport(investigationResponse.data);
        }

        success('\n✅ Graph Investigator test PASSED');
        return true;

    } catch (err) {
        error('\n❌ Graph Investigator test FAILED');
        console.error(err.response?.data || err.message);
        return false;
    }
}

function displayInvestigationReport(report) {
    console.log('\n' + colors.bright + colors.magenta + '📋 Investigation Report' + colors.reset);
    console.log(colors.cyan + '─'.repeat(60) + colors.reset);

    console.log(colors.bright + '\n🔍 Root Cause:' + colors.reset);
    console.log('  ', report.rootCause);

    console.log(colors.bright + '\n📊 Severity Assessment:' + colors.reset);
    console.log('   Internal:', report.technicalSeverity.internal);
    console.log('   Visual Score:', report.technicalSeverity.visual + '/10');
    console.log('   Combined:', report.technicalSeverity.combined);

    console.log(colors.bright + '\n⚠️  Detected Hazards:' + colors.reset);
    if (report.detectedHazards.length > 0) {
        report.detectedHazards.forEach(hazard => {
            console.log('   •', hazard);
        });
    } else {
        console.log('   • No specific hazards detected');
    }

    console.log(colors.bright + '\n🌍 Real-World Context:' + colors.reset);
    console.log('  ', report.realWorldContext);

    console.log(colors.bright + '\n🚨 Recommendations:' + colors.reset);
    console.log('   Priority:', getPriorityEmoji(report.recommendation.priority), report.recommendation.priority.toUpperCase());
    console.log('   Response Teams:', report.recommendation.responseTeams.join(', '));
    console.log('   ETA:', report.recommendation.estimatedResponseTime);
    if (report.recommendation.specialEquipment.length > 0) {
        console.log('   Equipment:', report.recommendation.specialEquipment.join(', '));
    }

    console.log(colors.bright + '\n📡 Data Sources:' + colors.reset);
    console.log('   Stellio:', report.dataSources.stellio ? '✓' : '✗');
    console.log('   Neo4j:', report.dataSources.neo4j ? '✓' : '✗');
    console.log('   Vision AI:', report.dataSources.vision ? '✓' : '✗');
    console.log('   Web Search:', report.dataSources.search ? '✓' : '✗');

    console.log(colors.bright + '\n📈 Confidence Score:' + colors.reset);
    console.log('   ' + (report.confidence * 100).toFixed(1) + '%');

    console.log(colors.cyan + '─'.repeat(60) + colors.reset);
}

function getPriorityEmoji(priority) {
    const emojis = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
    };
    return emojis[priority] || '⚪';
}

// =====================================================
// TEST 2: TrafficMaestroAgent - Event Monitoring
// =====================================================

async function testTrafficMaestro() {
    header('TEST 2: Traffic Maestro Agent - Event-Based Congestion Prediction');

    try {
        info('Step 1: Monitoring external events (Ticketmaster, Google)...');

        const eventsResponse = await axios.get(
            `${API_BASE}/api/agents/traffic-maestro/events`
        );

        const events = eventsResponse.data.events || [];
        success(`Found ${events.length} upcoming events in HCMC`);

        if (events.length === 0) {
            warning('No events found. This is expected if no major events are scheduled.');
            info('Testing with a hypothetical event location...');

            // Test congestion prediction at a known venue (e.g., Saigon Opera House)
            const testLocation = {
                lat: 10.7769,
                lng: 106.7009
            };

            info('\nStep 2: Predicting congestion at Saigon Opera House area...');

            const testEvent = {
                id: 'test_event_001',
                name: 'Test Concert Event',
                venue: {
                    name: 'Saigon Opera House',
                    location: testLocation,
                    address: '7 Công Trường Lam Sơn, Bến Nghé, District 1, HCMC'
                },
                startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                expectedAttendees: 5000,
                category: 'Music',
                source: 'test'
            };

            const predictionResponse = await axios.post(
                `${API_BASE}/api/agents/traffic-maestro/predict-congestion`,
                {
                    event: testEvent
                }
            );

            displayCongestionPrediction(testEvent, predictionResponse.data);

        } else {
            // Display events
            console.log('\n' + colors.bright + '📅 Upcoming Events:' + colors.reset);
            events.slice(0, 3).forEach((event, index) => {
                console.log(colors.cyan + `\n   ${index + 1}. ${event.name}` + colors.reset);
                console.log(`      Venue: ${event.venue.name}`);
                console.log(`      Time: ${new Date(event.startTime).toLocaleString()}`);
                console.log(`      Attendees: ${event.expectedAttendees.toLocaleString()}`);
                console.log(`      Category: ${event.category}`);
            });

            // Test congestion prediction on first event
            const eventToTest = events[0];
            info(`\nStep 2: Predicting congestion for: ${eventToTest.name}`);

            const predictionResponse = await axios.post(
                `${API_BASE}/api/agents/traffic-maestro/predict-congestion`,
                {
                    event: eventToTest
                }
            );

            displayCongestionPrediction(eventToTest, predictionResponse.data);
        }

        // Test route benchmarking
        info('\nStep 3: Benchmarking routes with external traffic data...');

        const origin = { lat: 10.8231, lng: 106.6297 }; // District 1
        const destination = { lat: 10.7769, lng: 106.7009 }; // Opera House

        const routeResponse = await axios.post(
            `${API_BASE}/api/agents/traffic-maestro/benchmark-route`,
            {
                origin,
                destination
            }
        );

        displayRouteBenchmark(routeResponse.data);

        success('\n✅ Traffic Maestro test PASSED');
        return true;

    } catch (err) {
        error('\n❌ Traffic Maestro test FAILED');
        console.error(err.response?.data || err.message);
        return false;
    }
}

function displayCongestionPrediction(event, prediction) {
    console.log('\n' + colors.bright + colors.yellow + '🚦 Congestion Prediction' + colors.reset);
    console.log(colors.cyan + '─'.repeat(60) + colors.reset);

    console.log(colors.bright + '\n📍 Event:' + colors.reset);
    console.log('   ', event.name);
    console.log('    Location:', event.venue.name);

    console.log(colors.bright + '\n⚠️  Risk Assessment:' + colors.reset);
    console.log('   Score:', prediction.score.toFixed(1) + '/100');
    console.log('   Level:', getRiskEmoji(prediction.riskLevel), prediction.riskLevel.toUpperCase());

    console.log(colors.bright + '\n📊 Contributing Factors:' + colors.reset);
    console.log('   Attendees:', prediction.factors.attendeeCount.toLocaleString());
    console.log('   Time to End:', prediction.factors.timeToEnd > 0
        ? `${prediction.factors.timeToEnd.toFixed(0)} minutes`
        : 'Event ended');
    console.log('   Current Traffic:', prediction.factors.currentCongestion || 'N/A');
    console.log('   Historical Impact:', prediction.factors.historicalImpact + '/10');

    console.log(colors.bright + '\n📷 Affected Cameras:' + colors.reset);
    console.log('   ', prediction.affectedCameras.length, 'cameras in affected area');

    console.log(colors.cyan + '─'.repeat(60) + colors.reset);
}

function getRiskEmoji(riskLevel) {
    const emojis = {
        low: '🟢',
        moderate: '🟡',
        high: '🟠',
        critical: '🔴'
    };
    return emojis[riskLevel] || '⚪';
}

function displayRouteBenchmark(benchmark) {
    console.log('\n' + colors.bright + colors.green + '🗺️  Route Benchmark' + colors.reset);
    console.log(colors.cyan + '─'.repeat(60) + colors.reset);

    console.log(colors.bright + '\n📊 Comparison:' + colors.reset);
    console.log('   Mapbox Duration:', (benchmark.mapboxDuration / 60).toFixed(1), 'minutes');
    console.log('   Internal Duration:', (benchmark.internalDuration / 60).toFixed(1), 'minutes');
    console.log('   Distance:', (benchmark.mapboxDistance / 1000).toFixed(2), 'km');

    console.log(colors.bright + '\n📈 Optimization Gap:' + colors.reset);
    const gap = benchmark.optimizationGap;
    const gapColor = gap > 0 ? colors.red : colors.green;
    console.log('   ' + gapColor + gap.toFixed(1) + '%' + colors.reset);

    console.log(colors.bright + '\n💡 Recommendation:' + colors.reset);
    console.log('   ', benchmark.recommendation);

    console.log(colors.cyan + '─'.repeat(60) + colors.reset);
}

// =====================================================
// MAIN TEST RUNNER
// =====================================================

async function runAllTests() {
    console.log(colors.bright + colors.cyan);
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        🤖 Agent Real-Time Testing Suite                  ║');
    console.log('║                                                           ║');
    console.log('║  Testing: GraphInvestigator + TrafficMaestro             ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    const results = [];

    // Test 1: Graph Investigator
    const test1 = await testGraphInvestigator();
    results.push({ name: 'Graph Investigator', passed: test1 });

    // Test 2: Traffic Maestro
    const test2 = await testTrafficMaestro();
    results.push({ name: 'Traffic Maestro', passed: test2 });

    // Summary
    header('TEST SUMMARY');

    console.log(colors.bright + 'Results:' + colors.reset);
    results.forEach((result, index) => {
        const status = result.passed ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED';
        console.log(`  ${index + 1}. ${result.name}: ${status}${colors.reset}`);
    });

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    console.log('\n' + colors.bright);
    console.log(`Total: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
    console.log(colors.reset);

    // Exit code
    process.exit(passedCount === totalCount ? 0 : 1);
}

// Run tests
runAllTests().catch(err => {
    error('Fatal error:', err.message);
    process.exit(1);
});
