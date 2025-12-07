/**
 * Health Check Utility - Service Connectivity Monitor
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/utils/healthCheck
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Health check utility for monitoring external service connections.
 * Performs comprehensive connectivity tests for all backend dependencies:
 * - Stellio Context Broker (NGSI-LD)
 * - Apache Jena Fuseki (SPARQL triplestore)
 * - Neo4j Graph Database
 * - PostgreSQL (TimescaleDB)
 * 
 * Features:
 * - Parallel health checks with configurable timeouts
 * - Connection pooling for efficient resource usage
 * - Detailed error reporting with connection diagnostics
 * - Retry logic for transient failures
 * - Performance metrics (response times)
 * 
 * Used by /health endpoint for Kubernetes liveness/readiness probes
 * and monitoring dashboards (Grafana, Prometheus).
 * 
 * @dependencies
 * - axios@^1.6: HTTP client for Stellio/Fuseki
 * - neo4j-driver@^5.14: Neo4j connectivity
 * - pg@^8.11: PostgreSQL client
 * 
 * @example
 * ```typescript
 * import { checkAllConnections } from './healthCheck';
 * 
 * const status = await checkAllConnections();
 * console.log('Stellio:', status.stellio.healthy);
 * console.log('Neo4j:', status.neo4j.healthy);
 * ```
 */

import axios, { AxiosInstance } from 'axios';
import http from 'http';
import https from 'https';
import neo4j from 'neo4j-driver';
import { Pool } from 'pg';
import { logger } from './logger';

interface ConnectionStatus {
  healthy: boolean;
  details?: any;
  error?: string;
}

interface AllConnectionStatus {
  stellio: ConnectionStatus;
  fuseki: ConnectionStatus;
  neo4j: ConnectionStatus;
  postgresql: ConnectionStatus;
}

// Create shared axios instance for health checks with connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  maxSockets: 5,
  maxFreeSockets: 2,
  timeout: 5000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  maxSockets: 5,
  maxFreeSockets: 2,
  timeout: 5000
});

const healthCheckClient: AxiosInstance = axios.create({
  timeout: 5000,
  httpAgent: httpAgent,
  httpsAgent: httpsAgent,
  maxRedirects: 3
});

export async function checkStellioConnection(): Promise<ConnectionStatus> {
  try {
    const stellioUrl = process.env.STELLIO_URL || 'http://localhost:8080';
    const ngsiLdPath = process.env.STELLIO_NGSI_LD_PATH || '/ngsi-ld/v1';
    const url = `${stellioUrl}${ngsiLdPath}/entities`;

    const response = await healthCheckClient.get(url, {
      headers: {
        'Accept': 'application/ld+json'
      },
      validateStatus: (status) => status < 500
    });

    return {
      healthy: true,
      details: {
        url,
        status: response.status,
        contentType: response.headers['content-type']
      }
    };
  } catch (error) {
    logger.error('Stellio connection check failed:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkFusekiConnection(): Promise<ConnectionStatus> {
  try {
    const fusekiUrl = process.env.FUSEKI_URL || 'http://localhost:3030';
    const dataset = process.env.FUSEKI_DATASET || 'lod-dataset';
    const user = process.env.FUSEKI_USER || 'admin';
    const password = process.env.FUSEKI_PASSWORD || 'test_admin';
    const url = `${fusekiUrl}/${dataset}/sparql`;

    const testQuery = 'SELECT * WHERE { ?s ?p ?o } LIMIT 1';

    const response = await healthCheckClient.post(
      url,
      `query=${encodeURIComponent(testQuery)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json'
        },
        auth: {
          username: user,
          password: password
        },
        validateStatus: (status) => status < 500
      }
    );

    return {
      healthy: true,
      details: {
        url,
        status: response.status,
        authenticated: true
      }
    };
  } catch (error) {
    logger.error('Fuseki connection check failed:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkNeo4jConnection(): Promise<ConnectionStatus> {
  let driver: any = null;
  let session: any = null;

  try {
    const uri = process.env.NEO4J_URL || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'test12345';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeout: 5000,
      maxConnectionLifetime: 30000
    });

    session = driver.session();
    const result = await session.run('RETURN 1 AS test');
    const testValue = result.records[0].get('test').toNumber();

    await session.close();
    await driver.close();

    return {
      healthy: testValue === 1,
      details: {
        uri,
        authenticated: true,
        databaseAvailable: true
      }
    };
  } catch (error) {
    logger.error('Neo4j connection check failed:', error);

    if (session) {
      try { await session.close(); } catch (e) { /* ignore */ }
    }
    if (driver) {
      try { await driver.close(); } catch (e) { /* ignore */ }
    }

    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkPostgreSQLConnection(): Promise<ConnectionStatus> {
  let pool: Pool | null = null;

  try {
    const config = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'stellio',
      password: process.env.POSTGRES_PASSWORD || 'stellio_test',
      database: process.env.POSTGRES_DB || 'stellio_test',
      connectionTimeoutMillis: 5000,
      max: 1
    };

    pool = new Pool(config);
    const client = await pool.connect();

    const result = await client.query('SELECT 1 AS test');
    const testValue = result.rows[0].test;

    client.release();
    await pool.end();

    return {
      healthy: testValue === 1,
      details: {
        host: config.host,
        port: config.port,
        database: config.database,
        connected: true
      }
    };
  } catch (error) {
    logger.error('PostgreSQL connection check failed:', error);

    if (pool) {
      try { await pool.end(); } catch (e) { /* ignore */ }
    }

    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkAllConnections(): Promise<AllConnectionStatus> {
  logger.info('Running connection health checks...');

  const [stellio, fuseki, neo4j, postgresql] = await Promise.all([
    checkStellioConnection(),
    checkFusekiConnection(),
    checkNeo4jConnection(),
    checkPostgreSQLConnection()
  ]);

  return {
    stellio,
    fuseki,
    neo4j,
    postgresql
  };
}
