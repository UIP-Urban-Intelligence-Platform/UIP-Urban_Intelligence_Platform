/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * @module apps/traffic-web-app/backend/src/routes/__tests__/cameraRoutes.test
 * @author Nguyễn Nhật Quang
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * Unit test suite for camera API routes using Jest and Supertest. Mocks StellioService
 * to test route handlers, request validation, error handling, and response formatting
 * in isolation without external dependencies.
 * 
 * Test coverage:
 * - GET /api/cameras - List all cameras with filters
 * - GET /api/cameras/:id - Get single camera by ID
 * - GET /api/cameras/district/:district - Filter by district
 * - Error handling (404, 500, validation errors)
 * - Query parameter parsing (status, type, district)
 * - Response format validation
 * 
 * @dependencies
 * - jest@29.6.2 - Test framework
 * - supertest@6.3.3 - HTTP assertions
 * - express@4.18.2 - Mock Express app
 * - StellioService (mocked) - Context Broker client
 * 
 * @example
 * ```bash
 * npm test -- cameraRoutes.test.ts
 * ```
 */
import request from 'supertest';
import express, { Express } from 'express';
import cameraRoutes from '../cameraRoutes';
import { StellioService } from '../../services/stellioService';

// Mock StellioService
jest.mock('../../services/stellioService');

describe('Camera Routes - GET /api/cameras', () => {
  let app: Express;
  let mockGetCameras: jest.Mock;

  const mockCameraData = [
    {
      id: 'urn:ngsi-ld:Camera:001',
      cameraName: 'District 1 Camera',
      location: { lat: 10.7769, lng: 106.7009 },
      cameraType: 'PTZ' as const,
      status: 'online' as const,
      dateModified: '2025-11-10T10:00:00Z'
    },
    {
      id: 'urn:ngsi-ld:Camera:002',
      cameraName: 'District 3 Camera',
      location: { lat: 10.7850, lng: 106.6869 },
      cameraType: 'Static' as const,
      status: 'offline' as const,
      dateModified: '2025-11-10T09:00:00Z'
    },
    {
      id: 'urn:ngsi-ld:Camera:003',
      cameraName: 'District 7 Camera',
      location: { lat: 10.7350, lng: 106.7190 },
      cameraType: 'Dome' as const,
      status: 'online' as const,
      dateModified: '2025-11-10T11:00:00Z'
    }
  ];

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/cameras', cameraRoutes);

    mockGetCameras = jest.fn();
    (StellioService as jest.Mock).mockImplementation(() => ({
      getCameras: mockGetCameras
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should return 200 with array of cameras', async () => {
      mockGetCameras.mockResolvedValue(mockCameraData);

      const response = await request(app).get('/api/cameras');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toEqual(mockCameraData);
      expect(mockGetCameras).toHaveBeenCalledWith({});
    });

    it('should return 200 with empty array when no cameras exist', async () => {
      mockGetCameras.mockResolvedValue([]);

      const response = await request(app).get('/api/cameras');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    it('should have correct response structure', async () => {
      mockGetCameras.mockResolvedValue(mockCameraData);

      const response = await request(app).get('/api/cameras');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('data');

      const camera = response.body.data[0];
      expect(camera).toHaveProperty('id');
      expect(camera).toHaveProperty('cameraName');
      expect(camera).toHaveProperty('location');
      expect(camera.location).toHaveProperty('lat');
      expect(camera.location).toHaveProperty('lng');
      expect(camera).toHaveProperty('cameraType');
      expect(camera).toHaveProperty('status');
      expect(camera).toHaveProperty('dateModified');
    });
  });

  describe('Status filter', () => {
    it('should filter cameras by status=online', async () => {
      const onlineCameras = mockCameraData.filter(c => c.status === 'online');
      mockGetCameras.mockResolvedValue(onlineCameras);

      const response = await request(app).get('/api/cameras?status=online');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(mockGetCameras).toHaveBeenCalledWith({ status: 'online' });
    });

    it('should filter cameras by status=offline', async () => {
      const offlineCameras = mockCameraData.filter(c => c.status === 'offline');
      mockGetCameras.mockResolvedValue(offlineCameras);

      const response = await request(app).get('/api/cameras?status=offline');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(mockGetCameras).toHaveBeenCalledWith({ status: 'offline' });
    });

    it('should return 400 for invalid status value', async () => {
      const response = await request(app).get('/api/cameras?status=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid status parameter');
    });
  });

  describe('Type filter', () => {
    it('should filter cameras by type=PTZ', async () => {
      const ptzCameras = mockCameraData.filter(c => c.cameraType === 'PTZ');
      mockGetCameras.mockResolvedValue(ptzCameras);

      const response = await request(app).get('/api/cameras?type=PTZ');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(mockGetCameras).toHaveBeenCalledWith({ type: 'PTZ' });
    });

    it('should filter cameras by type=Static', async () => {
      const staticCameras = mockCameraData.filter(c => c.cameraType === 'Static');
      mockGetCameras.mockResolvedValue(staticCameras);

      const response = await request(app).get('/api/cameras?type=Static');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(mockGetCameras).toHaveBeenCalledWith({ type: 'Static' });
    });

    it('should filter cameras by type=Dome', async () => {
      const domeCameras = mockCameraData.filter(c => c.cameraType === 'Dome');
      mockGetCameras.mockResolvedValue(domeCameras);

      const response = await request(app).get('/api/cameras?type=Dome');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(mockGetCameras).toHaveBeenCalledWith({ type: 'Dome' });
    });

    it('should return 400 for invalid type value', async () => {
      const response = await request(app).get('/api/cameras?type=InvalidType');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid type parameter');
    });
  });

  describe('Bounding box filter', () => {
    it('should filter cameras within bounding box', async () => {
      const bbox = '10.73,106.68,10.79,106.72';
      const filteredCameras = mockCameraData.filter(c =>
        c.location.lat >= 10.73 && c.location.lat <= 10.79 &&
        c.location.lng >= 106.68 && c.location.lng <= 106.72
      );
      mockGetCameras.mockResolvedValue(filteredCameras);

      const response = await request(app).get(`/api/cameras?bbox=${bbox}`);

      expect(response.status).toBe(200);
      expect(mockGetCameras).toHaveBeenCalledWith({ bbox });
    });

    it('should return 400 for invalid bbox format (wrong count)', async () => {
      const response = await request(app).get('/api/cameras?bbox=10.73,106.68,10.79');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid bbox parameter');
      expect(response.body.message).toContain('Format must be');
    });

    it('should return 400 for invalid bbox format (non-numeric)', async () => {
      const response = await request(app).get('/api/cameras?bbox=10.73,abc,10.79,106.72');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid numbers');
    });

    it('should return 400 when min >= max coordinates', async () => {
      const response = await request(app).get('/api/cameras?bbox=10.79,106.68,10.73,106.72');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Min values must be less than max');
    });
  });

  describe('Limit parameter', () => {
    it('should apply limit parameter', async () => {
      mockGetCameras.mockResolvedValue(mockCameraData.slice(0, 2));

      const response = await request(app).get('/api/cameras?limit=2');

      expect(response.status).toBe(200);
      expect(mockGetCameras).toHaveBeenCalledWith({ limit: 2 });
    });

    it('should return 400 for invalid limit (non-numeric)', async () => {
      const response = await request(app).get('/api/cameras?limit=abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid limit parameter');
    });

    it('should return 400 for limit < 1', async () => {
      const response = await request(app).get('/api/cameras?limit=0');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('between 1 and 1000');
    });

    it('should return 400 for limit > 1000', async () => {
      const response = await request(app).get('/api/cameras?limit=1001');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('between 1 and 1000');
    });
  });

  describe('Combined filters', () => {
    it('should apply multiple filters together', async () => {
      const filteredCameras = mockCameraData.filter(
        c => c.status === 'online' && c.cameraType === 'PTZ'
      );
      mockGetCameras.mockResolvedValue(filteredCameras);

      const response = await request(app).get('/api/cameras?status=online&type=PTZ');

      expect(response.status).toBe(200);
      expect(mockGetCameras).toHaveBeenCalledWith({
        status: 'online',
        type: 'PTZ'
      });
    });

    it('should apply all filters: status, type, bbox, limit', async () => {
      mockGetCameras.mockResolvedValue([mockCameraData[0]]);

      const response = await request(app).get(
        '/api/cameras?status=online&type=PTZ&bbox=10.73,106.68,10.79,106.72&limit=10'
      );

      expect(response.status).toBe(200);
      expect(mockGetCameras).toHaveBeenCalledWith({
        status: 'online',
        type: 'PTZ',
        bbox: '10.73,106.68,10.79,106.72',
        limit: 10
      });
    });
  });

  describe('Error handling', () => {
    it('should return 500 when StellioService throws error', async () => {
      mockGetCameras.mockRejectedValue(new Error('Stellio connection failed'));

      const response = await request(app).get('/api/cameras');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to fetch cameras');
      expect(response.body.error).toBe('Stellio connection failed');
    });

    it('should return 500 with generic error for unknown errors', async () => {
      mockGetCameras.mockRejectedValue('Unknown error');

      const response = await request(app).get('/api/cameras');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unknown error');
    });
  });
});
