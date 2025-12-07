/**
 * @file test-connections.js
 * @module apps/traffic-web-app/backend/tests/integration/test-connections
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-26
 * @version 2.0.0
 * @license MIT
 * @description Connection Test Script - Tests all data source connections independently.
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

require('dotenv').config();
const axios = require('axios');
const neo4j = require('neo4j-driver');
const { Pool } = require('pg');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testStellioConnection() {
  log('\n📡 Testing Stellio Context Broker...', 'cyan');
  try {
    const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';
    const ngsiLdPath = process.env.STELLIO_NGSI_LD_PATH || '/ngsi-ld/v1';
    const url = `${stellioUrl}${ngsiLdPath}/entities`;

    log(`   URL: ${url}`);

    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'Accept': 'application/ld+json' },
      validateStatus: (status) => status < 500
    });

    log(`   ✓ Status: ${response.status}`, 'green');
    log(`   ✓ Content-Type: ${response.headers['content-type']}`, 'green');
    return true;
  } catch (error) {
    log(`   ✗ Error: ${error.message}`, 'red');
    if (error.code) log(`   ✗ Code: ${error.code}`, 'red');
    return false;
  }
}

async function testFusekiConnection() {
  log('\n📊 Testing Apache Jena Fuseki...', 'cyan');
  try {
    const fusekiUrl = process.env.FUSEKI_URL || 'http://localhost:3030';
    const dataset = process.env.FUSEKI_DATASET || 'lod-dataset';
    const user = process.env.FUSEKI_USER || 'admin';
    const password = process.env.FUSEKI_PASSWORD || 'test_admin';
    const url = `${fusekiUrl}/${dataset}/sparql`;

    log(`   URL: ${url}`);
    log(`   User: ${user}`);

    const testQuery = 'SELECT * WHERE { ?s ?p ?o } LIMIT 1';

    const response = await axios.post(
      url,
      `query=${encodeURIComponent(testQuery)}`,
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json'
        },
        auth: { username: user, password: password },
        validateStatus: (status) => status < 500
      }
    );

    log(`   ✓ Status: ${response.status}`, 'green');
    log(`   ✓ Authentication: Success`, 'green');

    if (response.data && response.data.results) {
      log(`   ✓ Query executed successfully`, 'green');
    }

    return true;
  } catch (error) {
    log(`   ✗ Error: ${error.message}`, 'red');
    if (error.response && error.response.status === 401) {
      log(`   ✗ Authentication failed - check credentials`, 'red');
    }
    if (error.code) log(`   ✗ Code: ${error.code}`, 'red');
    return false;
  }
}

async function testNeo4jConnection() {
  log('\n🔗 Testing Neo4j Database...', 'cyan');
  let driver = null;
  let session = null;

  try {
    const uri = process.env.NEO4J_URL || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'test12345';

    log(`   URI: ${uri}`);
    log(`   User: ${user}`);

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeout: 5000
    });

    session = driver.session();
    const result = await session.run('RETURN 1 AS test');
    const testValue = result.records[0].get('test').toNumber();

    await session.close();
    await driver.close();

    log(`   ✓ Connection: Success`, 'green');
    log(`   ✓ Authentication: Success`, 'green');
    log(`   ✓ Query test: ${testValue === 1 ? 'Passed' : 'Failed'}`, 'green');

    return true;
  } catch (error) {
    log(`   ✗ Error: ${error.message}`, 'red');
    if (error.code === 'ServiceUnavailable') {
      log(`   ✗ Neo4j service is not running`, 'red');
    } else if (error.code === 'Neo.ClientError.Security.Unauthorized') {
      log(`   ✗ Authentication failed - check credentials`, 'red');
    }

    if (session) {
      try { await session.close(); } catch (e) { }
    }
    if (driver) {
      try { await driver.close(); } catch (e) { }
    }

    return false;
  }
}

async function testPostgreSQLConnection() {
  log('\n🐘 Testing PostgreSQL Database...', 'cyan');
  let pool = null;

  try {
    const config = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'stellio_user',
      password: process.env.POSTGRES_PASSWORD || 'stellio_test',
      database: process.env.POSTGRES_DB || 'stellio_search',
      connectionTimeoutMillis: 5000,
      max: 1
    };

    log(`   Host: ${config.host}:${config.port}`);
    log(`   Database: ${config.database}`);
    log(`   User: ${config.user}`);

    pool = new Pool(config);
    const client = await pool.connect();

    const result = await client.query('SELECT version() AS version, current_database() AS database');
    const version = result.rows[0].version;
    const database = result.rows[0].database;

    client.release();
    await pool.end();

    log(`   ✓ Connection: Success`, 'green');
    log(`   ✓ Database: ${database}`, 'green');
    log(`   ✓ Version: ${version.split(',')[0]}`, 'green');

    return true;
  } catch (error) {
    log(`   ✗ Error: ${error.message}`, 'red');

    if (error.code === 'ECONNREFUSED') {
      log(`   ✗ PostgreSQL service is not running`, 'red');
    } else if (error.code === '28P01') {
      log(`   ✗ Authentication failed - check credentials`, 'red');
    } else if (error.code === '3D000') {
      log(`   ✗ Database does not exist`, 'red');
    }

    if (pool) {
      try { await pool.end(); } catch (e) { }
    }

    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('═'.repeat(60), 'cyan');
  log('HCMC Traffic Monitoring - Connection Tests', 'cyan');
  log('═'.repeat(60), 'cyan');

  const results = {
    stellio: await testStellioConnection(),
    fuseki: await testFusekiConnection(),
    neo4j: await testNeo4jConnection(),
    postgresql: await testPostgreSQLConnection()
  };

  log('\n' + '═'.repeat(60), 'cyan');
  log('Summary', 'cyan');
  log('═'.repeat(60), 'cyan');

  const allPassed = Object.values(results).every(r => r === true);

  Object.entries(results).forEach(([service, passed]) => {
    const status = passed ? '✓ PASSED' : '✗ FAILED';
    const color = passed ? 'green' : 'red';
    log(`${service.padEnd(20)}: ${status}`, color);
  });

  log('═'.repeat(60), 'cyan');

  if (allPassed) {
    log('\n🎉 All connections successful! You can start the server.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some connections failed. Please check the errors above.', 'yellow');
    log('Make sure all services are running and credentials are correct.', 'yellow');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
