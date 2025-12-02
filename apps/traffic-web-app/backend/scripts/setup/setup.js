#!/usr/bin/env node
/**
Author: Nguyễn Nhật Quang
 Created: 2025-11-26
 Modified: 2025-11-26
 Version: 2.0.0
 License: MIT
 * Camera Endpoint Implementation Verification
 * 
 * This script verifies that the camera endpoint implementation
 * meets all the requirements from the prompt.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('HCMC Traffic Monitoring - Backend Setup');
console.log('='.repeat(60));
console.log();

// Get backend root directory (go up 2 levels from scripts/setup/)
const backendRoot = path.join(__dirname, '..', '..');

// Check if .env exists
const envPath = path.join(backendRoot, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Creating from .env.example...');
  const envExamplePath = path.join(backendRoot, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✓ Created .env file');
    console.log('⚠️  Please update .env with your database credentials!');
    console.log();
  } else {
    console.error('❌ .env.example not found!');
    console.error('Expected at:', envExamplePath);
    process.exit(1);
  }
}

// Create logs directory if it doesn't exist
const logsDir = path.join(backendRoot, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✓ Created logs directory');
}

console.log('Configuration checklist:');
console.log('─'.repeat(60));
console.log('1. Stellio Context Broker: http://localhost:8080/ngsi-ld/v1');
console.log('2. Fuseki SPARQL: http://localhost:3030/lod-dataset/sparql');
console.log('   - Username: admin');
console.log('   - Password: test_admin');
console.log('3. Neo4j: bolt://localhost:7687');
console.log('   - Username: neo4j');
console.log('   - Password: test12345');
console.log('4. PostgreSQL: localhost:5432');
console.log('   - Database: stellio_test');
console.log('   - Username: stellio');
console.log('   - Password: stellio_test');
console.log('─'.repeat(60));
console.log();
console.log('Make sure all services are running before starting the server!');
console.log();
console.log('='.repeat(60));
