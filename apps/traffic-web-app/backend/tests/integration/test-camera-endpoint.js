#!/usr/bin/env node

/**
 * Camera Endpoint Manual Test Script
 * Module: tests.integration.test-camera-endpoint
 * Author: Nguyễn Nhật Quang
 * Created: 2025-11-26
 * Version: 1.0.0
 * License: MIT
 * This script tests the Camera API endpoint with various query parameters
 * Run: node test-camera-endpoint.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function testEndpoint(description, url, expectedStatus = 200) {
  try {
    log(`\n${'='.repeat(60)}`, 'blue');
    log(`Test: ${description}`, 'blue');
    log(`URL: ${url}`, 'blue');
    log('='.repeat(60), 'blue');

    const response = await axios.get(url);
    
    if (response.status === expectedStatus) {
      logSuccess(`Status: ${response.status}`);
      logSuccess(`Success: ${response.data.success}`);
      logInfo(`Count: ${response.data.count}`);
      
      if (response.data.data && response.data.data.length > 0) {
        logInfo(`Sample camera data (first result):`);
        console.log(JSON.stringify(response.data.data[0], null, 2));
        
        // Validate structure
        const camera = response.data.data[0];
        const requiredFields = ['id', 'cameraName', 'location', 'cameraType', 'status', 'dateModified'];
        const missingFields = requiredFields.filter(field => !(field in camera));
        
        if (missingFields.length === 0) {
          logSuccess('All required fields present');
        } else {
          logWarning(`Missing fields: ${missingFields.join(', ')}`);
        }
        
        // Validate location structure
        if (camera.location && typeof camera.location === 'object') {
          if ('lat' in camera.location && 'lng' in camera.location) {
            logSuccess(`Location structure correct: lat=${camera.location.lat}, lng=${camera.location.lng}`);
          } else {
            logWarning('Location missing lat or lng fields');
          }
        }
      } else {
        logWarning('No cameras returned');
      }
      
      return { success: true, data: response.data };
    } else {
      logError(`Unexpected status: ${response.status} (expected ${expectedStatus})`);
      return { success: false };
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === expectedStatus) {
        logSuccess(`Status: ${error.response.status} (expected error)`);
        logInfo(`Error response:`);
        console.log(JSON.stringify(error.response.data, null, 2));
        return { success: true, data: error.response.data };
      } else {
        logError(`Status: ${error.response.status} (expected ${expectedStatus})`);
        logError(`Error: ${error.response.data.message || error.message}`);
        return { success: false };
      }
    } else {
      logError(`Connection failed: ${error.message}`);
      return { success: false };
    }
  }
}

async function runTests() {
  log('\n' + '═'.repeat(60), 'yellow');
  log('Camera Endpoint Test Suite', 'yellow');
  log('═'.repeat(60), 'yellow');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: Basic endpoint
  results.total++;
  const test1 = await testEndpoint(
    'Get all cameras (no filters)',
    `${API_BASE_URL}/api/cameras`
  );
  if (test1.success) results.passed++; else results.failed++;

  // Test 2: Status filter - online
  results.total++;
  const test2 = await testEndpoint(
    'Filter by status=online',
    `${API_BASE_URL}/api/cameras?status=online`
  );
  if (test2.success) results.passed++; else results.failed++;

  // Test 3: Status filter - offline
  results.total++;
  const test3 = await testEndpoint(
    'Filter by status=offline',
    `${API_BASE_URL}/api/cameras?status=offline`
  );
  if (test3.success) results.passed++; else results.failed++;

  // Test 4: Type filter - PTZ
  results.total++;
  const test4 = await testEndpoint(
    'Filter by type=PTZ',
    `${API_BASE_URL}/api/cameras?type=PTZ`
  );
  if (test4.success) results.passed++; else results.failed++;

  // Test 5: Type filter - Static
  results.total++;
  const test5 = await testEndpoint(
    'Filter by type=Static',
    `${API_BASE_URL}/api/cameras?type=Static`
  );
  if (test5.success) results.passed++; else results.failed++;

  // Test 6: Type filter - Dome
  results.total++;
  const test6 = await testEndpoint(
    'Filter by type=Dome',
    `${API_BASE_URL}/api/cameras?type=Dome`
  );
  if (test6.success) results.passed++; else results.failed++;

  // Test 7: Bounding box filter (HCMC District 1 area)
  results.total++;
  const test7 = await testEndpoint(
    'Filter by bounding box (District 1 area)',
    `${API_BASE_URL}/api/cameras?bbox=10.73,106.68,10.79,106.72`
  );
  if (test7.success) results.passed++; else results.failed++;

  // Test 8: Combined filters
  results.total++;
  const test8 = await testEndpoint(
    'Combined filters (status=online, type=PTZ)',
    `${API_BASE_URL}/api/cameras?status=online&type=PTZ`
  );
  if (test8.success) results.passed++; else results.failed++;

  // Test 9: Limit parameter
  results.total++;
  const test9 = await testEndpoint(
    'Limit parameter (limit=5)',
    `${API_BASE_URL}/api/cameras?limit=5`
  );
  if (test9.success) results.passed++; else results.failed++;

  // Test 10: All filters combined
  results.total++;
  const test10 = await testEndpoint(
    'All filters combined',
    `${API_BASE_URL}/api/cameras?status=online&type=PTZ&bbox=10.73,106.68,10.79,106.72&limit=10`
  );
  if (test10.success) results.passed++; else results.failed++;

  // Error handling tests

  // Test 11: Invalid status (should return 400)
  results.total++;
  const test11 = await testEndpoint(
    'Invalid status parameter (should return 400)',
    `${API_BASE_URL}/api/cameras?status=invalid`,
    400
  );
  if (test11.success) results.passed++; else results.failed++;

  // Test 12: Invalid type (should return 400)
  results.total++;
  const test12 = await testEndpoint(
    'Invalid type parameter (should return 400)',
    `${API_BASE_URL}/api/cameras?type=InvalidType`,
    400
  );
  if (test12.success) results.passed++; else results.failed++;

  // Test 13: Invalid bbox format (should return 400)
  results.total++;
  const test13 = await testEndpoint(
    'Invalid bbox format (should return 400)',
    `${API_BASE_URL}/api/cameras?bbox=10.73,106.68,10.79`,
    400
  );
  if (test13.success) results.passed++; else results.failed++;

  // Test 14: Invalid bbox values (should return 400)
  results.total++;
  const test14 = await testEndpoint(
    'Invalid bbox values (should return 400)',
    `${API_BASE_URL}/api/cameras?bbox=10.79,106.68,10.73,106.72`,
    400
  );
  if (test14.success) results.passed++; else results.failed++;

  // Test 15: Invalid limit (should return 400)
  results.total++;
  const test15 = await testEndpoint(
    'Invalid limit parameter (should return 400)',
    `${API_BASE_URL}/api/cameras?limit=9999`,
    400
  );
  if (test15.success) results.passed++; else results.failed++;

  // Summary
  log('\n' + '═'.repeat(60), 'yellow');
  log('Test Summary', 'yellow');
  log('═'.repeat(60), 'yellow');
  log(`Total tests: ${results.total}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed === 0 ? 'green' : 'yellow');
  log('═'.repeat(60), 'yellow');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  log('\nStarting Camera Endpoint Tests...', 'cyan');
  log(`Target: ${API_BASE_URL}\n`, 'cyan');
  
  runTests().catch(error => {
    logError(`\nTest suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testEndpoint, runTests };
