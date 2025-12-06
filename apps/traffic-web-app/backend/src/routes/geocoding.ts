/**
 * Geocoding Routes - Address/Coordinate Conversion & Reverse Geocoding
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/routes/geocoding
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * REST API endpoints for geocoding (address to coordinates) and reverse geocoding
 * (coordinates to address) using Nominatim OpenStreetMap service.
 * 
 * Endpoints:
 * - GET /api/geocoding/forward: Convert address to coordinates
 * - GET /api/geocoding/reverse: Convert coordinates to address
 * - GET /api/geocoding/search: Search for locations by name
 * - GET /api/geocoding/districts: Get all districts in Ho Chi Minh City
 * 
 * Features:
 * - Nominatim API integration with rate limiting
 * - 1-hour caching for performance
 * - Vietnamese address support
 * - Bounding box filtering for HCMC
 * - Connection pooling for reliability
 * 
 * Response Format:
 * - lat/lon: WGS84 coordinates
 * - display_name: Full formatted address
 * - address: Structured address components (road, district, city)
 * - boundingbox: Geographic bounds [south, north, west, east]
 */

import express, { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import http from 'http';
import https from 'https';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache for geocoding results

// Create HTTP agent for external API calls (Nominatim)
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 5,
  maxFreeSockets: 2,
  timeout: 10000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 5,
  maxFreeSockets: 2,
  timeout: 10000
});

const geocodingClient: AxiosInstance = axios.create({
  timeout: 10000,
  httpAgent: httpAgent,
  httpsAgent: httpsAgent,
  headers: {
    'User-Agent': 'HCMC-Traffic-System/1.0'
  }
});

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
  type: string;
  boundingbox: [string, string, string, string];
  displayName: string;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// =====================================================
// CONFIGURATION
// =====================================================

const NOMINATIM_API_URL = process.env.NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org';
const HCMC_VIEWBOX = {
  left: 106.5,  // min longitude
  bottom: 10.6, // min latitude
  right: 106.9, // max longitude
  top: 11.0     // max latitude
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validate coordinates are within HCMC bounds
 */
function isWithinHCMC(lat: number, lng: number): boolean {
  return lat >= HCMC_VIEWBOX.bottom &&
    lat <= HCMC_VIEWBOX.top &&
    lng >= HCMC_VIEWBOX.left &&
    lng <= HCMC_VIEWBOX.right;
}

/**
 * Format Nominatim result to our GeocodingResult interface
 */
function formatGeocodingResult(result: NominatimResult): GeocodingResult {
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);

  // Build a concise address from components
  let address = '';
  if (result.address) {
    const parts: string[] = [];
    if (result.address.road) parts.push(result.address.road);
    if (result.address.suburb) parts.push(result.address.suburb);
    if (result.address.city_district) parts.push(result.address.city_district);
    address = parts.join(', ') || result.display_name;
  } else {
    address = result.display_name;
  }

  return {
    address,
    lat,
    lng,
    type: result.type,
    boundingbox: result.boundingbox,
    displayName: result.display_name
  };
}

/**
 * Search addresses using Nominatim OSM API
 */
async function searchNominatim(query: string, limit: number = 5): Promise<GeocodingResult[]> {
  try {
    const cacheKey = `geocode:${query}:${limit}`;
    const cached = cache.get<GeocodingResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${NOMINATIM_API_URL}/search`;
    const params = {
      q: query,
      format: 'json',
      addressdetails: 1,
      limit: limit * 2, // Request more to filter by bounds
      viewbox: `${HCMC_VIEWBOX.left},${HCMC_VIEWBOX.top},${HCMC_VIEWBOX.right},${HCMC_VIEWBOX.bottom}`,
      bounded: 1, // Restrict results to viewbox
      'accept-language': 'vi,en',
      countrycodes: 'vn'
    };

    const response = await geocodingClient.get<NominatimResult[]>(url, {
      params
    });

    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response from Nominatim API');
    }

    // Filter results to only those within HCMC bounds and format
    const results = response.data
      .filter(result => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        return isWithinHCMC(lat, lng);
      })
      .map(formatGeocodingResult)
      .slice(0, limit); // Take top N after filtering

    cache.set(cacheKey, results);
    return results;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Geocoding service rate limit exceeded. Please try again later.');
      }
      throw new Error(`Geocoding service error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const cacheKey = `reverse:${lat}:${lng}`;
    const cached = cache.get<GeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!isWithinHCMC(lat, lng)) {
      throw new Error('Coordinates are outside Ho Chi Minh City bounds');
    }

    const url = `${NOMINATIM_API_URL}/reverse`;
    const params = {
      lat,
      lon: lng,
      format: 'json',
      addressdetails: 1,
      'accept-language': 'vi,en',
      zoom: 18
    };

    const response = await geocodingClient.get<NominatimResult>(url, {
      params
    });

    if (!response.data) {
      return null;
    }

    const result = formatGeocodingResult(response.data);
    cache.set(cacheKey, result);
    return result;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Geocoding service rate limit exceeded. Please try again later.');
      }
      throw new Error(`Reverse geocoding error: ${error.message}`);
    }
    throw error;
  }
}

// =====================================================
// GEOCODING ENDPOINTS
// =====================================================

/**
 * POST /api/geocoding/search
 * Search for addresses and return coordinates
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: query string is required'
      });
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long'
      });
    }

    // Search using Nominatim
    const results = await searchNominatim(trimmedQuery, 5);

    return res.json({
      success: true,
      data: results,
      metadata: {
        query: trimmedQuery,
        resultCount: results.length,
        cacheHit: cache.has(`geocode:${trimmedQuery}:5`)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error searching addresses:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to search addresses',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

/**
 * GET /api/geocoding/search?q=query
 * Autocomplete endpoint for address search
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: q parameter is required'
      });
    }

    const trimmedQuery = q.trim();

    if (trimmedQuery.length < 2) {
      return res.json({
        success: true,
        data: [],
        metadata: {
          query: trimmedQuery,
          resultCount: 0,
          message: 'Query too short - minimum 2 characters'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Search using Nominatim
    const results = await searchNominatim(trimmedQuery, 5);

    return res.json({
      success: true,
      data: results,
      metadata: {
        query: trimmedQuery,
        resultCount: results.length,
        cacheHit: cache.has(`geocode:${trimmedQuery}:5`)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in autocomplete:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to autocomplete addresses',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

/**
 * POST /api/geocoding/reverse
 * Reverse geocode coordinates to address
 */
router.post('/reverse', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: lat and lng must be numbers'
      });
    }

    if (!isWithinHCMC(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates are outside Ho Chi Minh City bounds'
      });
    }

    const result = await reverseGeocode(lat, lng);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No address found for the given coordinates'
      });
    }

    return res.json({
      success: true,
      data: result,
      metadata: {
        coordinates: { lat, lng },
        cacheHit: cache.has(`reverse:${lat}:${lng}`)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reverse geocode',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

/**
 * GET /api/geocoding/reverse?lat=10.8&lng=106.6
 * Reverse geocode via query params
 */
router.get('/reverse', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: lat and lng must be valid numbers'
      });
    }

    if (!isWithinHCMC(latNum, lngNum)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates are outside Ho Chi Minh City bounds'
      });
    }

    const result = await reverseGeocode(latNum, lngNum);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No address found for the given coordinates'
      });
    }

    return res.json({
      success: true,
      data: result,
      metadata: {
        coordinates: { lat: latNum, lng: lngNum },
        cacheHit: cache.has(`reverse:${latNum}:${lngNum}`)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reverse geocode',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

/**
 * DELETE /api/geocoding/cache
 * Clear geocoding cache
 */
router.delete('/cache', (_req: Request, res: Response) => {
  cache.flushAll();
  res.json({
    success: true,
    message: 'Geocoding cache cleared',
    timestamp: new Date().toISOString()
  });
});

export default router;
