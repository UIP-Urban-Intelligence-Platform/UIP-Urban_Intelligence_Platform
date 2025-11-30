/**
 * Combined Test Runner for All Endpoints
 * 
 * Executes test suites for:
 * - Camera API
 * - Weather API
 * - Air Quality API
 * 
 * Usage: node test-all-endpoints.js
 */

const cameraTests = require('./test-camera-endpoint');
const weatherTests = require('./test-weather-endpoint');
const airQualityTests = require('./test-airquality-endpoint');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBanner(title) {
  const border = '═'.repeat(70);
  console.log(`\n${colors.bold}${colors.cyan}${border}`);
  console.log(`║${' '.repeat(68)}║`);
  console.log(`║  ${title.padEnd(64)}  ║`);
  console.log(`║${' '.repeat(68)}║`);
  console.log(`${border}${colors.reset}\n`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.magenta}▶ ${title}${colors.reset}`);
  console.log(`${colors.magenta}${'─'.repeat(70)}${colors.reset}`);
}

async function runAllTests() {
  const startTime = Date.now();
  
  logBanner('🚀 COMPLETE API TEST SUITE');
  log(`Started: ${new Date().toISOString()}`, 'cyan');
  log(`Backend URL: http://localhost:5000`, 'cyan');
  
  const results = {
    camera: { passed: false, error: null },
    weather: { passed: false, error: null },
    airQuality: { passed: false, error: null }
  };
  
  // Test Camera API
  logSection('📹 Camera API Tests');
  try {
    await cameraTests.runAllTests();
    results.camera.passed = true;
    log('\n✅ Camera API tests completed successfully!', 'green');
  } catch (error) {
    results.camera.error = error.message;
    log(`\n❌ Camera API tests failed: ${error.message}`, 'red');
  }
  
  // Small delay between test suites
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test Weather API
  logSection('🌤️  Weather API Tests');
  try {
    await weatherTests.runAllTests();
    results.weather.passed = true;
    log('\n✅ Weather API tests completed successfully!', 'green');
  } catch (error) {
    results.weather.error = error.message;
    log(`\n❌ Weather API tests failed: ${error.message}`, 'red');
  }
  
  // Small delay between test suites
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test Air Quality API
  logSection('🌫️  Air Quality API Tests');
  try {
    await airQualityTests.runAllTests();
    results.airQuality.passed = true;
    log('\n✅ Air Quality API tests completed successfully!', 'green');
  } catch (error) {
    results.airQuality.error = error.message;
    log(`\n❌ Air Quality API tests failed: ${error.message}`, 'red');
  }
  
  // Calculate duration
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Display summary
  logBanner('📊 TEST SUMMARY');
  
  const totalTests = 3;
  const passedTests = Object.values(results).filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  log('Test Results:', 'bold');
  console.log('');
  
  // Camera API
  if (results.camera.passed) {
    log('  📹 Camera API:        ✅ PASSED', 'green');
  } else {
    log('  📹 Camera API:        ❌ FAILED', 'red');
    if (results.camera.error) {
      log(`     Error: ${results.camera.error}`, 'red');
    }
  }
  
  // Weather API
  if (results.weather.passed) {
    log('  🌤️  Weather API:       ✅ PASSED', 'green');
  } else {
    log('  🌤️  Weather API:       ❌ FAILED', 'red');
    if (results.weather.error) {
      log(`     Error: ${results.weather.error}`, 'red');
    }
  }
  
  // Air Quality API
  if (results.airQuality.passed) {
    log('  🌫️  Air Quality API:   ✅ PASSED', 'green');
  } else {
    log('  🌫️  Air Quality API:   ❌ FAILED', 'red');
    if (results.airQuality.error) {
      log(`     Error: ${results.airQuality.error}`, 'red');
    }
  }
  
  console.log('');
  log(`Total Duration: ${duration}s`, 'cyan');
  console.log('');
  
  // Overall status
  if (passedTests === totalTests) {
    log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`, 'green');
    log('✨ Your API endpoints are working perfectly!', 'green');
  } else if (passedTests > 0) {
    log(`⚠️  PARTIAL SUCCESS (${passedTests}/${totalTests} passed, ${failedTests} failed)`, 'yellow');
    log('Some tests need attention. Check the errors above.', 'yellow');
  } else {
    log(`💥 ALL TESTS FAILED (0/${totalTests})`, 'red');
    log('Please check if the backend server is running and Stellio is accessible.', 'red');
  }
  
  console.log('');
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n💥 Unhandled error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
