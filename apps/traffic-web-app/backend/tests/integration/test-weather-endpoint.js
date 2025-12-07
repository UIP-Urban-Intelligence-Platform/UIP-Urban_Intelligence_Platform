/**
 * @file test-weather-endpoint.js
 * @module apps/traffic-web-app/backend/tests/integration/test-weather-endpoint
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Test script for Weather API endpoint - Tests basic data retrieval,
 * camera ID filtering, limit parameter, and error handling.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/weather';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

async function testBasicWeatherRetrieval() {
  logSection('Test 1: Basic Weather Data Retrieval');

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

      logInfo(`Weather observations retrieved: ${count}`);

      if (count > 0) {
        logSuccess(`Data array has ${data.length} observations`);

        // Check first observation structure
        const weather = data[0];
        logInfo('\nFirst weather observation:');
        console.log(JSON.stringify(weather, null, 2));

        // Validate required fields
        const requiredFields = [
          'id', 'cameraId', 'location', 'temperature',
          'humidity', 'precipitation', 'windSpeed',
          'windDirection', 'weatherType', 'dateObserved'
        ];

        const missingFields = requiredFields.filter(field => !weather.hasOwnProperty(field));

        if (missingFields.length === 0) {
          logSuccess('All required fields present');
        } else {
          logError(`Missing fields: ${missingFields.join(', ')}`);
        }

        // Validate location structure
        if (weather.location &&
          typeof weather.location.lat === 'number' &&
          typeof weather.location.lng === 'number') {
          logSuccess(`Location valid: (${weather.location.lat}, ${weather.location.lng})`);
        } else {
          logError('Location structure invalid');
        }

        // Validate numeric fields
        const numericFields = ['temperature', 'humidity', 'windSpeed'];
        const invalidNumeric = numericFields.filter(field =>
          typeof weather[field] !== 'number'
        );

        if (invalidNumeric.length === 0) {
          logSuccess('All numeric fields valid');
        } else {
          logError(`Invalid numeric fields: ${invalidNumeric.join(', ')}`);
        }

      } else {
        logWarning('No weather data returned');
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

async function testCameraIdFilter() {
  logSection('Test 2: Camera ID Filter');

  try {
    // First get all weather data to find a valid camera ID
    const allResponse = await axios.get(BASE_URL);

    if (allResponse.data.count > 0) {
      const firstWeather = allResponse.data.data[0];
      const testCameraId = firstWeather.cameraId;

      logInfo(`Testing with camera ID: ${testCameraId}`);

      // Now test with the filter
      const response = await axios.get(BASE_URL, {
        params: { cameraId: testCameraId }
      });

      if (response.status === 200) {
        logSuccess(`Status: ${response.status} OK`);

        const { count, data } = response.data;
        logInfo(`Filtered observations: ${count}`);

        // Verify all returned observations match the camera ID
        const allMatch = data.every(w => w.cameraId === testCameraId);

        if (allMatch) {
          logSuccess(`All observations match camera ID: ${testCameraId}`);
        } else {
          logError('Some observations don\'t match the requested camera ID');
        }

        if (count > 0) {
          logInfo('\nFiltered observation:');
          console.log(JSON.stringify(data[0], null, 2));
        }

      } else {
        logError(`Unexpected status: ${response.status}`);
      }

    } else {
      logWarning('No weather data available to test filtering');
    }

  } catch (error) {
    logError(`Request failed: ${error.message}`);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

async function testLimitParameter() {
  logSection('Test 3: Limit Parameter');

  const testCases = [
    { limit: 5, shouldSucceed: true },
    { limit: 50, shouldSucceed: true },
    { limit: 1000, shouldSucceed: true },
    { limit: 0, shouldSucceed: false },      // Invalid: below range
    { limit: 1001, shouldSucceed: false },   // Invalid: above range
    { limit: -1, shouldSucceed: false },     // Invalid: negative
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
        if (error.response) {
          console.log('Error:', error.response.data);
        }
      } else {
        logSuccess(`Invalid limit rejected: ${testCase.limit}`);
        if (error.response && error.response.data) {
          logInfo(`Error message: ${error.response.data.message}`);
        }
      }
    }
  }
}

async function testSingleWeatherObservation() {
  logSection('Test 4: Single Weather Observation by ID');

  try {
    // First get all weather data to find a valid ID
    const allResponse = await axios.get(BASE_URL);

    if (allResponse.data.count > 0) {
      const firstWeather = allResponse.data.data[0];
      const testId = firstWeather.id;

      logInfo(`Testing with weather ID: ${testId}`);

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

          logInfo('\nWeather observation:');
          console.log(JSON.stringify(data, null, 2));

        } else {
          logError('Response structure invalid');
        }

      } else {
        logError(`Unexpected status: ${response.status}`);
      }

    } else {
      logWarning('No weather data available to test single observation');
    }

  } catch (error) {
    logError(`Request failed: ${error.message}`);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

async function testInvalidWeatherObservationId() {
  logSection('Test 5: Invalid Weather Observation ID');

  const invalidId = 'urn:ngsi-ld:WeatherObserved:INVALID_999999';

  logInfo(`Testing with invalid ID: ${invalidId}`);

  try {
    const response = await axios.get(`${BASE_URL}/${encodeURIComponent(invalidId)}`);

    logError('Invalid ID was accepted (should have returned 404)');

  } catch (error) {
    if (error.response && error.response.status === 404) {
      logSuccess('Invalid ID correctly rejected with 404');
      logInfo(`Error message: ${error.response.data.message}`);
    } else {
      logError(`Unexpected error: ${error.message}`);
      if (error.response) {
        console.log('Response:', error.response.data);
      }
    }
  }
}

async function testWeatherDataQuality() {
  logSection('Test 6: Weather Data Quality Checks');

  try {
    const response = await axios.get(BASE_URL, { params: { limit: 100 } });

    if (response.data.count > 0) {
      const weatherData = response.data.data;

      logInfo(`Analyzing ${weatherData.length} weather observations...\n`);

      // Check temperature ranges
      const temperatures = weatherData.map(w => w.temperature);
      const minTemp = Math.min(...temperatures);
      const maxTemp = Math.max(...temperatures);

      logInfo(`Temperature range: ${minTemp}°C to ${maxTemp}°C`);

      if (minTemp >= -50 && maxTemp <= 60) {
        logSuccess('Temperature values are within reasonable range');
      } else {
        logWarning('Some temperature values are outside typical range');
      }

      // Check humidity ranges
      const humidities = weatherData.map(w => w.humidity);
      const minHum = Math.min(...humidities);
      const maxHum = Math.max(...humidities);

      logInfo(`Humidity range: ${minHum}% to ${maxHum}%`);

      if (minHum >= 0 && maxHum <= 100) {
        logSuccess('Humidity values are valid (0-100%)');
      } else {
        logWarning('Some humidity values are outside valid range (0-100%)');
      }

      // Check for camera associations
      const withCamera = weatherData.filter(w => w.cameraId && w.cameraId !== 'unknown').length;
      const withoutCamera = weatherData.length - withCamera;

      logInfo(`\nCamera associations:`);
      logInfo(`  With camera: ${withCamera}`);
      logInfo(`  Without camera: ${withoutCamera}`);

      if (withCamera > 0) {
        logSuccess('Some weather observations have camera associations');
      } else {
        logWarning('No weather observations have camera associations');
      }

      // Check weather types
      const weatherTypes = [...new Set(weatherData.map(w => w.weatherType))];
      logInfo(`\nUnique weather types: ${weatherTypes.join(', ')}`);

      // Check wind directions
      const windDirections = [...new Set(weatherData.map(w => w.windDirection))];
      logInfo(`Unique wind directions: ${windDirections.join(', ')}`);

    } else {
      logWarning('No weather data available for quality checks');
    }

  } catch (error) {
    logError(`Request failed: ${error.message}`);
  }
}

async function runAllTests() {
  log('\n🌤️  Weather API Test Suite', 'cyan');
  log(`Target: ${BASE_URL}`, 'cyan');
  log(`Time: ${new Date().toISOString()}\n`, 'cyan');

  const tests = [
    testBasicWeatherRetrieval,
    testCameraIdFilter,
    testLimitParameter,
    testSingleWeatherObservation,
    testInvalidWeatherObservationId,
    testWeatherDataQuality
  ];

  for (const test of tests) {
    await test();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  logSection('Test Suite Complete');
  log('All weather endpoint tests finished!', 'green');
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`\nFatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests };
