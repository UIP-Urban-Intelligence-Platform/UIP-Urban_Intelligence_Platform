/**
 * @file test-airquality-endpoint.js
 * @module apps/traffic-web-app/backend/tests/integration/test-airquality-endpoint
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 1.0.0
 * @license MIT
 * @description Test script for Air Quality API endpoint - Tests basic data retrieval,
 * AQI level filtering, color code validation, and error handling.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/air-quality';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

const AQI_LEVELS = {
  good: { range: [0, 50], color: '#00e400' },
  moderate: { range: [51, 100], color: '#ffff00' },
  unhealthy_sensitive: { range: [101, 150], color: '#ff7e00' },
  unhealthy: { range: [151, 200], color: '#ff0000' },
  very_unhealthy: { range: [201, 300], color: '#8f3f97' },
  hazardous: { range: [301, Infinity], color: '#7e0023' }
};

function validateAQILevel(aqi, level) {
  const levelConfig = AQI_LEVELS[level];
  if (!levelConfig) return false;

  const [min, max] = levelConfig.range;
  return aqi >= min && aqi <= max;
}

async function testBasicAirQualityRetrieval() {
  logSection('Test 1: Basic Air Quality Data Retrieval');

  try {
    const response = await axios.get(BASE_URL);

    if (response.status === 200) {
      logSuccess(`Status: ${response.status} OK`);

      const { success, count, data } = response.data;

      if (success) {
        logSuccess(`Success flag: ${success}`);
      } else {
        logError(`Success flag is false`);
      }

      logInfo(`Air quality observations retrieved: ${count}`);

      if (count > 0) {
        logSuccess(`Data array has ${data.length} observations`);

        // Check first observation structure
        const aq = data[0];
        logInfo('\nFirst air quality observation:');
        console.log(JSON.stringify(aq, null, 2));

        // Validate required fields
        const requiredFields = [
          'id', 'cameraId', 'location', 'aqi', 'pm25', 'pm10',
          'no2', 'o3', 'co', 'so2', 'level', 'colorCode', 'dateObserved'
        ];

        const missingFields = requiredFields.filter(field => !aq.hasOwnProperty(field));

        if (missingFields.length === 0) {
          logSuccess('All required fields present');
        } else {
          logError(`Missing fields: ${missingFields.join(', ')}`);
        }

        // Validate location structure
        if (aq.location &&
          typeof aq.location.lat === 'number' &&
          typeof aq.location.lng === 'number') {
          logSuccess(`Location valid: (${aq.location.lat}, ${aq.location.lng})`);
        } else {
          logError('Location structure invalid');
        }

        // Validate pollutant fields
        const pollutants = ['aqi', 'pm25', 'pm10', 'no2', 'o3', 'co', 'so2'];
        const invalidPollutants = pollutants.filter(field =>
          typeof aq[field] !== 'number'
        );

        if (invalidPollutants.length === 0) {
          logSuccess('All pollutant fields are numeric');
        } else {
          logError(`Invalid pollutant fields: ${invalidPollutants.join(', ')}`);
        }

        // Validate level and color code
        if (Object.keys(AQI_LEVELS).includes(aq.level)) {
          logSuccess(`AQI level is valid: ${aq.level}`);

          // Check if color code matches level
          if (AQI_LEVELS[aq.level].color === aq.colorCode) {
            logSuccess(`Color code matches level: ${aq.colorCode}`);
          } else {
            logError(`Color code mismatch: expected ${AQI_LEVELS[aq.level].color}, got ${aq.colorCode}`);
          }

          // Check if AQI value matches level range
          if (validateAQILevel(aq.aqi, aq.level)) {
            logSuccess(`AQI value ${aq.aqi} matches level ${aq.level}`);
          } else {
            logError(`AQI value ${aq.aqi} doesn't match level ${aq.level}`);
          }
        } else {
          logError(`Invalid AQI level: ${aq.level}`);
        }

      } else {
        logWarning('No air quality data returned');
      }

    } else {
      logError(`Unexpected status: ${response.status}`);
    }

  } catch (error) {
    logError(`Request failed: ${error.message}`);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

async function testLevelFilter() {
  logSection('Test 2: AQI Level Filter');

  const testLevels = [
    'good', 'moderate', 'unhealthy_sensitive',
    'unhealthy', 'very_unhealthy', 'hazardous'
  ];

  for (const level of testLevels) {
    logInfo(`\nTesting level filter: ${level}`);

    try {
      const response = await axios.get(BASE_URL, {
        params: { level }
      });

      if (response.status === 200) {
        const { count, data } = response.data;
        logInfo(`Found ${count} ${level} observations`);

        if (count > 0) {
          // Verify all returned observations match the requested level
          const allMatch = data.every(aq => aq.level === level);

          if (allMatch) {
            logSuccess(`All observations match level: ${level}`);

            // Show AQI range for this level
            const aqiValues = data.map(aq => aq.aqi);
            const minAqi = Math.min(...aqiValues);
            const maxAqi = Math.max(...aqiValues);
            logInfo(`  AQI range: ${minAqi} - ${maxAqi}`);

            // Verify color codes
            const colorMatch = data.every(aq => aq.colorCode === AQI_LEVELS[level].color);
            if (colorMatch) {
              logSuccess(`  Color codes correct: ${AQI_LEVELS[level].color}`);
            } else {
              logError(`  Some color codes incorrect`);
            }
          } else {
            logError('Some observations don\'t match the requested level');
          }
        }

      } else {
        logError(`Unexpected status: ${response.status}`);
      }

    } catch (error) {
      logError(`Request failed: ${error.message}`);
      if (error.response) {
        console.log('Response:', error.response.data);
      }
    }
  }
}

async function testMinAqiFilter() {
  logSection('Test 3: Minimum AQI Filter');

  const testCases = [
    { minAqi: 0, shouldSucceed: true },
    { minAqi: 50, shouldSucceed: true },
    { minAqi: 100, shouldSucceed: true },
    { minAqi: 150, shouldSucceed: true },
    { minAqi: 200, shouldSucceed: true },
    { minAqi: 300, shouldSucceed: true },
    { minAqi: -10, shouldSucceed: false },  // Invalid: negative
  ];

  for (const testCase of testCases) {
    logInfo(`\nTesting minAqi=${testCase.minAqi}`);

    try {
      const response = await axios.get(BASE_URL, {
        params: { minAqi: testCase.minAqi }
      });

      if (testCase.shouldSucceed) {
        logSuccess(`Valid minAqi accepted: ${testCase.minAqi}`);

        const { count, data } = response.data;
        logInfo(`Found ${count} observations with AQI >= ${testCase.minAqi}`);

        if (count > 0) {
          // Verify all returned observations have AQI >= minAqi
          const allValid = data.every(aq => aq.aqi >= testCase.minAqi);

          if (allValid) {
            logSuccess(`All observations have AQI >= ${testCase.minAqi}`);

            const minAqi = Math.min(...data.map(aq => aq.aqi));
            const maxAqi = Math.max(...data.map(aq => aq.aqi));
            logInfo(`  Actual AQI range: ${minAqi} - ${maxAqi}`);
          } else {
            logError(`Some observations have AQI < ${testCase.minAqi}`);
          }
        }
      } else {
        logError(`Invalid minAqi was accepted: ${testCase.minAqi}`);
      }

    } catch (error) {
      if (testCase.shouldSucceed) {
        logError(`Valid minAqi rejected: ${testCase.minAqi}`);
        if (error.response) {
          console.log('Error:', error.response.data);
        }
      } else {
        logSuccess(`Invalid minAqi rejected: ${testCase.minAqi}`);
        if (error.response && error.response.data) {
          logInfo(`Error message: ${error.response.data.message}`);
        }
      }
    }
  }
}

async function testCombinedFilters() {
  logSection('Test 4: Combined Filters');

  const testCases = [
    { level: 'unhealthy', minAqi: 150 },
    { level: 'hazardous', minAqi: 300 },
    { level: 'moderate', minAqi: 50 }
  ];

  for (const testCase of testCases) {
    logInfo(`\nTesting level=${testCase.level} AND minAqi=${testCase.minAqi}`);

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          level: testCase.level,
          minAqi: testCase.minAqi
        }
      });

      if (response.status === 200) {
        const { count, data } = response.data;
        logInfo(`Found ${count} observations matching both filters`);

        if (count > 0) {
          // Verify all observations match both filters
          const levelMatch = data.every(aq => aq.level === testCase.level);
          const aqiMatch = data.every(aq => aq.aqi >= testCase.minAqi);

          if (levelMatch && aqiMatch) {
            logSuccess('All observations match both filters');

            const aqiValues = data.map(aq => aq.aqi);
            logInfo(`  AQI range: ${Math.min(...aqiValues)} - ${Math.max(...aqiValues)}`);
          } else {
            if (!levelMatch) logError('Some observations don\'t match level filter');
            if (!aqiMatch) logError('Some observations don\'t match minAqi filter');
          }
        }

      } else {
        logError(`Unexpected status: ${response.status}`);
      }

    } catch (error) {
      logError(`Request failed: ${error.message}`);
      if (error.response) {
        console.log('Response:', error.response.data);
      }
    }
  }
}

async function testLimitParameter() {
  logSection('Test 5: Limit Parameter');

  const testCases = [
    { limit: 5, shouldSucceed: true },
    { limit: 50, shouldSucceed: true },
    { limit: 1000, shouldSucceed: true },
    { limit: 0, shouldSucceed: false },      // Invalid: below range
    { limit: 1001, shouldSucceed: false },   // Invalid: above range
  ];

  for (const testCase of testCases) {
    logInfo(`\nTesting limit=${testCase.limit}`);

    try {
      const response = await axios.get(BASE_URL, {
        params: { limit: testCase.limit }
      });

      if (testCase.shouldSucceed) {
        logSuccess(`Valid limit accepted: ${testCase.limit}`);

        const { count, data } = response.data;

        if (data.length <= testCase.limit) {
          logSuccess(`Returned ${data.length} observations (≤ ${testCase.limit})`);
        } else {
          logError(`Returned ${data.length} observations (> ${testCase.limit})`);
        }
      } else {
        logError(`Invalid limit was accepted: ${testCase.limit}`);
      }

    } catch (error) {
      if (testCase.shouldSucceed) {
        logError(`Valid limit rejected: ${testCase.limit}`);
      } else {
        logSuccess(`Invalid limit rejected: ${testCase.limit}`);
        if (error.response && error.response.data) {
          logInfo(`Error message: ${error.response.data.message}`);
        }
      }
    }
  }
}

async function testSingleAirQualityObservation() {
  logSection('Test 6: Single Air Quality Observation by ID');

  try {
    // First get all air quality data to find a valid ID
    const allResponse = await axios.get(BASE_URL);

    if (allResponse.data.count > 0) {
      const firstAq = allResponse.data.data[0];
      const testId = firstAq.id;

      logInfo(`Testing with air quality ID: ${testId}`);

      // Now test getting single observation
      const response = await axios.get(`${BASE_URL}/${encodeURIComponent(testId)}`);

      if (response.status === 200) {
        logSuccess(`Status: ${response.status} OK`);

        const { success, data } = response.data;

        if (success && data) {
          logSuccess('Single observation retrieved');

          if (data.id === testId) {
            logSuccess(`ID matches: ${testId}`);
          } else {
            logError(`ID mismatch: expected ${testId}, got ${data.id}`);
          }

          logInfo('\nAir quality observation:');
          console.log(JSON.stringify(data, null, 2));

        } else {
          logError('Response structure invalid');
        }

      } else {
        logError(`Unexpected status: ${response.status}`);
      }

    } else {
      logWarning('No air quality data available to test single observation');
    }

  } catch (error) {
    logError(`Request failed: ${error.message}`);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

async function testAQICalculationAccuracy() {
  logSection('Test 7: AQI Level Calculation Accuracy');

  try {
    const response = await axios.get(BASE_URL, { params: { limit: 100 } });

    if (response.data.count > 0) {
      const aqData = response.data.data;

      logInfo(`Validating AQI calculations for ${aqData.length} observations...\n`);

      let correctCalculations = 0;
      let incorrectCalculations = 0;

      for (const aq of aqData) {
        const isCorrect = validateAQILevel(aq.aqi, aq.level);

        if (isCorrect) {
          correctCalculations++;
        } else {
          incorrectCalculations++;
          logError(`Incorrect: AQI ${aq.aqi} classified as ${aq.level}`);
        }
      }

      logInfo(`Correct calculations: ${correctCalculations}/${aqData.length}`);

      if (incorrectCalculations === 0) {
        logSuccess('All AQI level calculations are correct!');
      } else {
        logError(`${incorrectCalculations} incorrect calculations found`);
      }

      // Show distribution across levels
      const levelCounts = {};
      for (const level of Object.keys(AQI_LEVELS)) {
        levelCounts[level] = aqData.filter(aq => aq.level === level).length;
      }

      logInfo('\nAQI Level Distribution:');
      for (const [level, count] of Object.entries(levelCounts)) {
        const color = AQI_LEVELS[level].color;
        logInfo(`  ${level}: ${count} observations (${color})`);
      }

    } else {
      logWarning('No air quality data available for validation');
    }

  } catch (error) {
    logError(`Request failed: ${error.message}`);
  }
}

async function testDataQuality() {
  logSection('Test 8: Air Quality Data Quality Checks');

  try {
    const response = await axios.get(BASE_URL, { params: { limit: 100 } });

    if (response.data.count > 0) {
      const aqData = response.data.data;

      logInfo(`Analyzing ${aqData.length} air quality observations...\n`);

      // Check AQI ranges
      const aqis = aqData.map(aq => aq.aqi);
      const minAqi = Math.min(...aqis);
      const maxAqi = Math.max(...aqis);

      logInfo(`AQI range: ${minAqi} to ${maxAqi}`);

      if (minAqi >= 0 && maxAqi <= 500) {
        logSuccess('AQI values are within typical range (0-500)');
      } else {
        logWarning('Some AQI values are outside typical range');
      }

      // Check PM2.5 ranges
      const pm25Values = aqData.map(aq => aq.pm25);
      const minPm25 = Math.min(...pm25Values);
      const maxPm25 = Math.max(...pm25Values);

      logInfo(`PM2.5 range: ${minPm25} - ${maxPm25} μg/m³`);

      // Check PM10 ranges
      const pm10Values = aqData.map(aq => aq.pm10);
      const minPm10 = Math.min(...pm10Values);
      const maxPm10 = Math.max(...pm10Values);

      logInfo(`PM10 range: ${minPm10} - ${maxPm10} μg/m³`);

      // Verify PM10 >= PM2.5 (should always be true)
      const pm10GreaterThanPm25 = aqData.every(aq => aq.pm10 >= aq.pm25);

      if (pm10GreaterThanPm25) {
        logSuccess('PM10 values are consistently >= PM2.5 (as expected)');
      } else {
        logWarning('Some PM10 values are less than PM2.5 (unusual)');
      }

      // Check for camera associations
      const withCamera = aqData.filter(aq => aq.cameraId && aq.cameraId !== 'unknown').length;
      const withoutCamera = aqData.length - withCamera;

      logInfo(`\nCamera associations:`);
      logInfo(`  With camera: ${withCamera}`);
      logInfo(`  Without camera: ${withoutCamera}`);

      if (withCamera > 0) {
        logSuccess('Some AQ observations have camera associations');
      } else {
        logWarning('No AQ observations have camera associations');
      }

      // Check pollutant completeness
      const allPollutants = ['aqi', 'pm25', 'pm10', 'no2', 'o3', 'co', 'so2'];
      const completeObservations = aqData.filter(aq =>
        allPollutants.every(p => typeof aq[p] === 'number' && aq[p] >= 0)
      ).length;

      logInfo(`\nPollutant data completeness:`);
      logInfo(`  Complete: ${completeObservations}/${aqData.length}`);

      if (completeObservations === aqData.length) {
        logSuccess('All observations have complete pollutant data');
      } else {
        logWarning(`${aqData.length - completeObservations} observations have missing/invalid pollutant data`);
      }

    } else {
      logWarning('No air quality data available for quality checks');
    }

  } catch (error) {
    logError(`Request failed: ${error.message}`);
  }
}

async function runAllTests() {
  log('\n🌫️  Air Quality API Test Suite', 'cyan');
  log(`Target: ${BASE_URL}`, 'cyan');
  log(`Time: ${new Date().toISOString()}\n`, 'cyan');

  const tests = [
    testBasicAirQualityRetrieval,
    testLevelFilter,
    testMinAqiFilter,
    testCombinedFilters,
    testLimitParameter,
    testSingleAirQualityObservation,
    testAQICalculationAccuracy,
    testDataQuality
  ];

  for (const test of tests) {
    await test();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  logSection('Test Suite Complete');
  log('All air quality endpoint tests finished!', 'green');
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`\nFatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests };
