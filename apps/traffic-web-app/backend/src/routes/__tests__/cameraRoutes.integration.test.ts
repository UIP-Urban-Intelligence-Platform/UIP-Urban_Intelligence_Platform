/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * @module apps/traffic-web-app/backend/src/routes/__tests__/cameraRoutes.integration.test
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * Integration test suite for camera API routes testing against live Stellio Context Broker.
 * Validates end-to-end data flow from API endpoints through StellioService to actual
 * NGSI-LD entities in Stellio. Tests real HTTP interactions and data transformations.
 * 
 * Prerequisites:
 * - Stellio Context Broker running at http://localhost:8080
 * - Backend server running at http://localhost:5000
 * - Test camera entities seeded in Stellio
 * 
 * Test scenarios:
 * - Camera CRUD operations against live Stellio
 * - Query parameter filtering (status, type, district)
 * - Location-based queries (bbox, near)
 * - Response pagination and sorting
 * - Error handling for missing entities
 * - Performance under load (optional)
 * 
 * @dependencies
 * - jest@29.6.2 - Test framework
 * - axios@1.4.0 - HTTP client for API calls
 * - Stellio Context Broker (external) - NGSI-LD storage
 * 
 * @example
 * ```bash
 * npm run test:integration -- cameraRoutes.integration.test.ts
 * ```
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const STELLIO_URL = process.env.STELLIO_URL || 'http://localhost:8080';

describe('Camera Endpoint Integration Tests', () => {
  let api: AxiosInstance;
  let stellio: AxiosInstance;
  const testCameras: string[] = [];

  beforeAll(async () => {
    api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000
    });

    stellio = axios.create({
      baseURL: `${STELLIO_URL}/ngsi-ld/v1`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json'
      }
    });

    // Check if Stellio is available
    try {
      await stellio.get('/entities');
    } catch (error) {
      console.error('Stellio is not available. Skipping integration tests.');
      throw new Error('Stellio unavailable');
    }

    // Create test camera data in Stellio
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  async function setupTestData() {
    const testData = [
      {
        id: 'urn:ngsi-ld:Camera:test001',
        type: 'Camera',
        cameraName: {
          type: 'Property',
          value: 'Test PTZ Camera Online'
        },
        location: {
          type: 'GeoProperty',
          value: {
            type: 'Point',
            coordinates: [106.7009, 10.7769]
          }
        },
        cameraType: {
          type: 'Property',
          value: 'PTZ'
        },
        status: {
          type: 'Property',
          value: 'online'
        },
        dateModified: {
          type: 'Property',
          value: new Date().toISOString()
        },
        '@context': [
          'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
        ]
      },
      {
        id: 'urn:ngsi-ld:Camera:test002',
        type: 'Camera',
        cameraName: {
          type: 'Property',
          value: 'Test Static Camera Offline'
        },
        location: {
          type: 'GeoProperty',
          value: {
            type: 'Point',
            coordinates: [106.6869, 10.7850]
          }
        },
        cameraType: {
          type: 'Property',
          value: 'Static'
        },
        status: {
          type: 'Property',
          value: 'offline'
        },
        dateModified: {
          type: 'Property',
          value: new Date().toISOString()
        },
        '@context': [
          'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
        ]
      },
      {
        id: 'urn:ngsi-ld:Camera:test003',
        type: 'Camera',
        cameraName: {
          type: 'Property',
          value: 'Test Dome Camera Online'
        },
        location: {
          type: 'GeoProperty',
          value: {
            type: 'Point',
            coordinates: [106.7190, 10.7350]
          }
        },
        cameraType: {
          type: 'Property',
          value: 'Dome'
        },
        status: {
          type: 'Property',
          value: 'online'
        },
        dateModified: {
          type: 'Property',
          value: new Date().toISOString()
        },
        '@context': [
          'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
        ]
      }
    ];

    for (const camera of testData) {
      try {
        await stellio.post('/entities', camera);
        testCameras.push(camera.id);
        console.log(`Created test camera: ${camera.id}`);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          // Entity already exists, update it
          await stellio.patch(`/entities/${camera.id}/attrs`, {
            cameraName: camera.cameraName,
            location: camera.location,
            cameraType: camera.cameraType,
            status: camera.status,
            dateModified: camera.dateModified
          });
          testCameras.push(camera.id);
          console.log(`Updated existing test camera: ${camera.id}`);
        } else {
          console.error(`Failed to create test camera ${camera.id}:`, error);
        }
      }
    }
  }

  async function cleanupTestData() {
    for (const cameraId of testCameras) {
      try {
        await stellio.delete(`/entities/${cameraId}`);
        console.log(`Deleted test camera: ${cameraId}`);
      } catch (error) {
        console.error(`Failed to delete test camera ${cameraId}:`, error);
      }
    }
  }

  describe('GET /api/cameras - Basic functionality', () => {
    it('should return cameras with correct structure', async () => {
      const response = await api.get('/api/cameras');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('count');
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.data.length > 0) {
        const camera = response.data.data[0];
        expect(camera).toHaveProperty('id');
        expect(camera).toHaveProperty('cameraName');
        expect(camera).toHaveProperty('location');
        expect(camera.location).toHaveProperty('lat');
        expect(camera.location).toHaveProperty('lng');
        expect(camera).toHaveProperty('cameraType');
        expect(camera).toHaveProperty('status');
        expect(camera).toHaveProperty('dateModified');
      }
    });

    it('should include test cameras in response', async () => {
      const response = await api.get('/api/cameras');
      const cameraIds = response.data.data.map((c: any) => c.id);

      expect(cameraIds).toContain('urn:ngsi-ld:Camera:test001');
      expect(cameraIds).toContain('urn:ngsi-ld:Camera:test002');
      expect(cameraIds).toContain('urn:ngsi-ld:Camera:test003');
    });
  });

  describe('GET /api/cameras - Status filter', () => {
    it('should filter cameras by status=online', async () => {
      const response = await api.get('/api/cameras?status=online');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const cameras = response.data.data;
      const onlineCameras = cameras.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      expect(onlineCameras.length).toBeGreaterThanOrEqual(2);
      onlineCameras.forEach((camera: any) => {
        expect(camera.status).toBe('online');
      });
    });

    it('should filter cameras by status=offline', async () => {
      const response = await api.get('/api/cameras?status=offline');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const cameras = response.data.data;
      const offlineCameras = cameras.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      expect(offlineCameras.length).toBeGreaterThanOrEqual(1);
      offlineCameras.forEach((camera: any) => {
        expect(camera.status).toBe('offline');
      });
    });
  });

  describe('GET /api/cameras - Type filter', () => {
    it('should filter cameras by type=PTZ', async () => {
      const response = await api.get('/api/cameras?type=PTZ');

      expect(response.status).toBe(200);

      const cameras = response.data.data;
      const ptzCameras = cameras.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      expect(ptzCameras.length).toBeGreaterThanOrEqual(1);
      ptzCameras.forEach((camera: any) => {
        expect(camera.cameraType).toBe('PTZ');
      });
    });

    it('should filter cameras by type=Static', async () => {
      const response = await api.get('/api/cameras?type=Static');

      expect(response.status).toBe(200);

      const cameras = response.data.data;
      const staticCameras = cameras.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      expect(staticCameras.length).toBeGreaterThanOrEqual(1);
      staticCameras.forEach((camera: any) => {
        expect(camera.cameraType).toBe('Static');
      });
    });

    it('should filter cameras by type=Dome', async () => {
      const response = await api.get('/api/cameras?type=Dome');

      expect(response.status).toBe(200);

      const cameras = response.data.data;
      const domeCameras = cameras.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      expect(domeCameras.length).toBeGreaterThanOrEqual(1);
      domeCameras.forEach((camera: any) => {
        expect(camera.cameraType).toBe('Dome');
      });
    });
  });

  describe('GET /api/cameras - Bounding box filter', () => {
    it('should filter cameras within bounding box', async () => {
      // Bounding box that includes test001 and test002
      const bbox = '10.73,106.68,10.79,106.72';
      const response = await api.get(`/api/cameras?bbox=${bbox}`);

      expect(response.status).toBe(200);

      const cameras = response.data.data;

      // All returned cameras should be within the bounding box
      cameras.forEach((camera: any) => {
        expect(camera.location.lat).toBeGreaterThanOrEqual(10.73);
        expect(camera.location.lat).toBeLessThanOrEqual(10.79);
        expect(camera.location.lng).toBeGreaterThanOrEqual(106.68);
        expect(camera.location.lng).toBeLessThanOrEqual(106.72);
      });
    });

    it('should return empty array for bbox with no cameras', async () => {
      // Bounding box in a different location
      const bbox = '0.0,0.0,0.1,0.1';
      const response = await api.get(`/api/cameras?bbox=${bbox}`);

      expect(response.status).toBe(200);

      const testCamerasInResult = response.data.data.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      expect(testCamerasInResult.length).toBe(0);
    });
  });

  describe('GET /api/cameras - Combined filters', () => {
    it('should apply multiple filters correctly', async () => {
      const response = await api.get(
        '/api/cameras?status=online&type=PTZ'
      );

      expect(response.status).toBe(200);

      const cameras = response.data.data.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      expect(cameras.length).toBeGreaterThanOrEqual(1);
      cameras.forEach((camera: any) => {
        expect(camera.status).toBe('online');
        expect(camera.cameraType).toBe('PTZ');
      });
    });

    it('should apply status, type, and bbox filters together', async () => {
      const response = await api.get(
        '/api/cameras?status=online&type=Dome&bbox=10.73,106.68,10.79,106.72'
      );

      expect(response.status).toBe(200);

      const cameras = response.data.data.filter((c: any) =>
        c.id.startsWith('urn:ngsi-ld:Camera:test')
      );

      cameras.forEach((camera: any) => {
        expect(camera.status).toBe('online');
        expect(camera.cameraType).toBe('Dome');
        expect(camera.location.lat).toBeGreaterThanOrEqual(10.73);
        expect(camera.location.lat).toBeLessThanOrEqual(10.79);
        expect(camera.location.lng).toBeGreaterThanOrEqual(106.68);
        expect(camera.location.lng).toBeLessThanOrEqual(106.72);
      });
    });
  });

  describe('GET /api/cameras - Limit parameter', () => {
    it('should respect limit parameter', async () => {
      const response = await api.get('/api/cameras?limit=2');

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/cameras - Error handling', () => {
    it('should return 400 for invalid status', async () => {
      try {
        await api.get('/api/cameras?status=invalid');
        fail('Should have thrown error');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(400);
          expect(error.response?.data.success).toBe(false);
          expect(error.response?.data.message).toContain('Invalid status parameter');
        }
      }
    });

    it('should return 400 for invalid type', async () => {
      try {
        await api.get('/api/cameras?type=Invalid');
        fail('Should have thrown error');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(400);
          expect(error.response?.data.success).toBe(false);
          expect(error.response?.data.message).toContain('Invalid type parameter');
        }
      }
    });

    it('should return 400 for invalid bbox format', async () => {
      try {
        await api.get('/api/cameras?bbox=10.73,106.68,10.79');
        fail('Should have thrown error');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(400);
          expect(error.response?.data.success).toBe(false);
          expect(error.response?.data.message).toContain('Invalid bbox parameter');
        }
      }
    });

    it('should return 400 for invalid limit', async () => {
      try {
        await api.get('/api/cameras?limit=9999');
        fail('Should have thrown error');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(400);
          expect(error.response?.data.success).toBe(false);
          expect(error.response?.data.message).toContain('Invalid limit parameter');
        }
      }
    });
  });

  describe('GET /api/cameras - Data transformation', () => {
    it('should correctly transform NGSI-LD to flat structure', async () => {
      const response = await api.get('/api/cameras');

      const testCamera = response.data.data.find(
        (c: any) => c.id === 'urn:ngsi-ld:Camera:test001'
      );

      expect(testCamera).toBeDefined();
      expect(testCamera.cameraName).toBe('Test PTZ Camera Online');
      expect(testCamera.location).toEqual({
        lat: 10.7769,
        lng: 106.7009
      });
      expect(testCamera.cameraType).toBe('PTZ');
      expect(testCamera.status).toBe('online');
      expect(testCamera.dateModified).toBeDefined();
    });

    it('should handle location coordinates correctly (lng, lat order)', async () => {
      const response = await api.get('/api/cameras');

      const testCamera = response.data.data.find(
        (c: any) => c.id === 'urn:ngsi-ld:Camera:test002'
      );

      expect(testCamera).toBeDefined();
      // GeoJSON uses [lng, lat] but output should be {lat, lng}
      expect(testCamera.location.lat).toBe(10.7850);
      expect(testCamera.location.lng).toBe(106.6869);
    });
  });
});

// Run if executed directly
if (require.main === module) {
  console.log('Running integration tests...');
  console.log('Make sure Stellio and backend are running!');
}
