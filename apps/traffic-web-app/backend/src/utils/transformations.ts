/**
 * NGSI-LD Transformation Utilities - Data Processing Pipeline
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/utils/transformations
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Production-ready transformation utilities for NGSI-LD data processing.
 * All transformations are generic and domain-agnostic, working with any entity type.
 * 
 * Core Capabilities:
 * - GeoJSON conversions (Point, LineString, Polygon)
 * - Coordinate transformations and bounding box calculations
 * - NGSI-LD property extraction (Property, GeoProperty, Relationship)
 * - Temporal data formatting (ISO 8601 timestamps)
 * - Data type conversions (string to number, date parsing)
 * - Entity relationship resolution
 * - Array and object deep transformations
 * 
 * Design Principles:
 * - Zero hardcoded domain logic
 * - Pure functions (no side effects)
 * - Type-safe transformations
 * - Null-safe with graceful fallbacks
 * 
 * @dependencies
 * - None (pure TypeScript functions)
 * 
 * @example
 * ```typescript
 * import { extractGeoProperty, transformToGeoJSON, extractProperty } from './transformations';
 * 
 * // Extract NGSI-LD GeoProperty
 * const coords = extractGeoProperty(entity, 'location');
 * 
 * // Transform to GeoJSON Feature
 * const feature = transformToGeoJSON(entity, 'location', 'Camera');
 * 
 * // Extract simple Property value
 * const speed = extractProperty(entity, 'averageSpeed');
 * ```
 */

interface Point {
  lat: number;
  lng: number;
}

interface GeoJsonGeometry {
  type: string;
  coordinates: number[][] | number[][][];
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: Record<string, any>;
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

/**
 * Transform GeoJSON coordinates [lng, lat] to {lat, lng}
 */
export function coordinatesToLatLng(coordinates: [number, number]): { lat: number; lng: number } {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error('Invalid coordinates format');
  }

  return {
    lng: coordinates[0],
    lat: coordinates[1]
  };
}

/**
 * Parse time range string "HH:MM-HH:MM" to {start, end}
 */
export function parseTimeRange(timeRangeStr: string): { start: string; end: string } {
  if (typeof timeRangeStr !== 'string') {
    throw new Error('Time range must be a string');
  }

  const match = timeRangeStr.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time range format: ${timeRangeStr}`);
  }

  return {
    start: match[1],
    end: match[2]
  };
}

/**
 * Calculate convex hull from camera coordinates using Graham Scan algorithm
 */
export function convexHullFromCameras(cameraIds: string[], cameras: any[]): GeoJsonGeometry | null {
  // Get camera coordinates
  const points: Point[] = [];

  for (const cameraId of cameraIds) {
    const camera = cameras.find(c => c.id === cameraId);
    if (camera && camera.location && camera.location.lat && camera.location.lng) {
      points.push({
        lat: camera.location.lat,
        lng: camera.location.lng
      });
    }
  }

  if (points.length < 3) {
    return null;
  }

  // Graham Scan algorithm
  const hull = grahamScan(points);

  if (hull.length < 3) {
    return null;
  }

  // Convert to GeoJSON Polygon format [lng, lat]
  const coordinates = hull.map(p => [p.lng, p.lat]);
  coordinates.push(coordinates[0]); // Close the polygon

  return {
    type: 'Polygon',
    coordinates: [coordinates]
  };
}

/**
 * Graham Scan algorithm for convex hull
 */
function grahamScan(points: Point[]): Point[] {
  if (points.length < 3) {
    return points;
  }

  // Find the bottom-most point (lowest lat, leftmost if tie)
  let bottom = points[0];
  for (const p of points) {
    if (p.lat < bottom.lat || (p.lat === bottom.lat && p.lng < bottom.lng)) {
      bottom = p;
    }
  }

  // Sort points by polar angle with respect to bottom point
  const sorted = points.filter(p => p !== bottom).sort((a, b) => {
    const angleA = Math.atan2(a.lat - bottom.lat, a.lng - bottom.lng);
    const angleB = Math.atan2(b.lat - bottom.lat, b.lng - bottom.lng);

    if (angleA !== angleB) {
      return angleA - angleB;
    }

    // If same angle, sort by distance
    const distA = Math.sqrt(Math.pow(a.lat - bottom.lat, 2) + Math.pow(a.lng - bottom.lng, 2));
    const distB = Math.sqrt(Math.pow(b.lat - bottom.lat, 2) + Math.pow(b.lng - bottom.lng, 2));
    return distA - distB;
  });

  // Build convex hull
  const hull: Point[] = [bottom, sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i];

    // Remove points that make clockwise turn
    while (hull.length >= 2) {
      const top = hull[hull.length - 1];
      const nextToTop = hull[hull.length - 2];

      if (crossProduct(nextToTop, top, p) > 0) {
        break;
      }
      hull.pop();
    }

    hull.push(p);
  }

  return hull;
}

/**
 * Calculate cross product to determine turn direction
 */
function crossProduct(o: Point, a: Point, b: Point): number {
  return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
}

/**
 * Spatial clustering using K-means algorithm
 */
export function spatialClustering(
  data: Array<{ location: Point;[key: string]: any }>,
  clusterCount: number,
  algorithm: string = 'kmeans'
): Array<{ zoneId: number; points: any[]; center: Point; avgHumidity?: number; minHumidity?: number; maxHumidity?: number; dataPointCount: number }> {

  if (algorithm !== 'kmeans') {
    throw new Error(`Unsupported clustering algorithm: ${algorithm}`);
  }

  if (data.length === 0) {
    return [];
  }

  // K-means implementation
  const points = data.map(d => d.location);

  // Initialize centroids randomly
  let centroids: Point[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < Math.min(clusterCount, points.length); i++) {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * points.length);
    } while (usedIndices.has(randomIndex));

    usedIndices.add(randomIndex);
    centroids.push({ ...points[randomIndex] });
  }

  // Iterate until convergence (max 100 iterations)
  let assignments: number[] = [];
  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    // Assign points to nearest centroid
    const newAssignments = points.map(p => {
      let minDist = Infinity;
      let nearestCentroid = 0;

      for (let i = 0; i < centroids.length; i++) {
        const dist = euclideanDistance(p, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          nearestCentroid = i;
        }
      }

      return nearestCentroid;
    });

    // Check for convergence
    if (iterations > 0 && arraysEqual(assignments, newAssignments)) {
      break;
    }

    assignments = newAssignments;

    // Update centroids
    const newCentroids: Point[] = [];

    for (let i = 0; i < centroids.length; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i);

      if (clusterPoints.length === 0) {
        newCentroids.push(centroids[i]);
      } else {
        const avgLat = clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length;
        const avgLng = clusterPoints.reduce((sum, p) => sum + p.lng, 0) / clusterPoints.length;
        newCentroids.push({ lat: avgLat, lng: avgLng });
      }
    }

    centroids = newCentroids;
    iterations++;
  }

  // Build result clusters
  const clusters = centroids.map((center, zoneId) => {
    const clusterData = data.filter((_, idx) => assignments[idx] === zoneId);

    const result: any = {
      zoneId,
      points: clusterData,
      center,
      dataPointCount: clusterData.length
    };

    // Calculate humidity statistics if available
    const humidities = clusterData
      .map(d => d.humidity)
      .filter(h => typeof h === 'number');

    if (humidities.length > 0) {
      result.avgHumidity = humidities.reduce((sum, h) => sum + h, 0) / humidities.length;
      result.minHumidity = Math.min(...humidities);
      result.maxHumidity = Math.max(...humidities);
    }

    return result;
  });

  return clusters.filter(c => c.dataPointCount > 0);
}

/**
 * Calculate Euclidean distance between two points
 */
function euclideanDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2));
}

/**
 * Check if two arrays are equal
 */
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Convert clusters to GeoJSON FeatureCollection
 */
export function zonesToGeoJson(clusters: Array<{ zoneId: number; points: any[]; center: Point; avgHumidity?: number; minHumidity?: number; maxHumidity?: number }>): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = clusters.map(cluster => {
    // Create bounding polygon for cluster
    const hull = convexHullFromCameras(
      cluster.points.map((_, idx) => `point_${idx}`),
      cluster.points.map((p, idx) => ({ id: `point_${idx}`, location: p.location }))
    );

    const geometry: GeoJsonGeometry = hull || {
      type: 'Polygon',
      coordinates: [[[cluster.center.lng, cluster.center.lat]]]
    };

    return {
      type: 'Feature',
      geometry,
      properties: {
        zoneId: cluster.zoneId,
        avgHumidity: cluster.avgHumidity,
        minHumidity: cluster.minHumidity,
        maxHumidity: cluster.maxHumidity,
        dataPointCount: cluster.points.length
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Aggregate data into time buckets
 */
export function timeBuckets(
  data: Array<{ dateDetected: string;[key: string]: any }>,
  buckets: string[],
  timeWindow: number = 30
): { byHour: Record<number, number>; byDayOfWeek: Record<string, number> } {
  const byHour: Record<number, number> = {};
  const byDayOfWeek: Record<string, number> = {};

  // Initialize buckets
  for (let i = 0; i < 24; i++) {
    byHour[i] = 0;
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const day of daysOfWeek) {
    byDayOfWeek[day] = 0;
  }

  // Filter by time window
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

  // Aggregate
  for (const item of data) {
    const date = new Date(item.dateDetected);

    if (date < cutoffDate) {
      continue;
    }

    if (buckets.includes('hour')) {
      const hour = date.getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    }

    if (buckets.includes('dayOfWeek')) {
      const dayOfWeek = daysOfWeek[date.getDay()];
      byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] || 0) + 1;
    }
  }

  return { byHour, byDayOfWeek };
}

/**
 * Convert time buckets to frequency data format
 */
export function frequencyData(aggregated: { byHour: Record<number, number>; byDayOfWeek: Record<string, number> }): {
  hour: number[];
  count: number[];
  dayOfWeek: string[];
  dailyCounts: Record<string, number>;
} {
  const hours = Object.keys(aggregated.byHour).map(Number).sort((a, b) => a - b);
  const counts = hours.map(h => aggregated.byHour[h]);

  const days = Object.keys(aggregated.byDayOfWeek);

  return {
    hour: hours,
    count: counts,
    dayOfWeek: days,
    dailyCounts: aggregated.byDayOfWeek
  };
}

/**
 * Create temporal grid for heatmap
 */
export function temporalGrid(
  data: Array<{ location: Point; timeRange?: { start: string; end: string }; avgVehicleCount?: number;[key: string]: any }>,
  dimensions: string[]
): Array<{ lat: number; lng: number; value: number; hour?: number; patternId?: string }> {
  const grid: Array<{ lat: number; lng: number; value: number; hour?: number; patternId?: string }> = [];

  for (const item of data) {
    if (!item.location) continue;

    const point: any = {
      lat: item.location.lat,
      lng: item.location.lng,
      value: item.avgVehicleCount || 0
    };

    // Add hour dimension if timeRange available
    if (dimensions.includes('hour') && item.timeRange) {
      const [startHour] = item.timeRange.start.split(':').map(Number);
      point.hour = startHour;
    }

    if (item.id) {
      point.patternId = item.id;
    }

    grid.push(point);
  }

  return grid;
}

/**
 * Convert temporal grid to heatmap data
 */
export function heatmapData(grid: Array<{ lat: number; lng: number; value: number; hour?: number; patternId?: string }>): Array<{ lat: number; lng: number; value: number; hour?: number; patternId?: string }> {
  // Already in correct format
  return grid;
}

/**
 * Categorize speed zones
 */
export function categorizeSpeedZones(
  patterns: Array<{ id: string; name: string; avgSpeed: number; affectedCameras: string[];[key: string]: any }>,
  categories: Array<{ name: string; min: number; max: number; color: string }>,
  cameras: any[]
): Array<{ patternId: string; name: string; category: string; avgSpeed: number; color: string; geometry: GeoJsonGeometry | null }> {
  return patterns.map(pattern => {
    // Find matching category
    let category = categories.find(c => pattern.avgSpeed >= c.min && pattern.avgSpeed < c.max);

    if (!category) {
      // Use last category if speed exceeds all ranges
      category = categories[categories.length - 1];
    }

    // Calculate geometry from affected cameras
    const geometry = convexHullFromCameras(pattern.affectedCameras, cameras);

    return {
      patternId: pattern.id,
      name: pattern.name,
      category: category.name,
      avgSpeed: pattern.avgSpeed,
      color: category.color,
      geometry
    };
  });
}

/**
 * Convert speed zones to GeoJSON
 */
export function speedZonesToGeoJson(
  zones: Array<{ patternId: string; name: string; category: string; avgSpeed: number; color: string; geometry: GeoJsonGeometry | null }>
): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = zones
    .filter(zone => zone.geometry)
    .map(zone => ({
      type: 'Feature' as const,
      geometry: zone.geometry!,
      properties: {
        patternId: zone.patternId,
        name: zone.name,
        category: zone.category,
        avgSpeed: zone.avgSpeed,
        color: zone.color
      }
    }));

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Group data by field
 */
export function groupByField(
  data: Array<{ [key: string]: any }>,
  groupField: string
): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const item of data) {
    const key = item[groupField];

    if (!key) continue;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(item);
  }

  return grouped;
}

/**
 * Convert grouped data to district options
 */
export function districtOptions(
  grouped: Record<string, any[]>
): { districts: Array<{ id: string; name: string; cameraCount: number; bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } }> } {
  const districts = Object.entries(grouped).map(([districtId, cameras]) => {
    // Calculate bounds
    const lats = cameras.map(c => c.location?.lat).filter(v => typeof v === 'number');
    const lngs = cameras.map(c => c.location?.lng).filter(v => typeof v === 'number');

    const bounds = {
      minLat: lats.length > 0 ? Math.min(...lats) : 0,
      maxLat: lats.length > 0 ? Math.max(...lats) : 0,
      minLng: lngs.length > 0 ? Math.min(...lngs) : 0,
      maxLng: lngs.length > 0 ? Math.max(...lngs) : 0
    };

    return {
      id: districtId,
      name: districtId,
      cameraCount: cameras.length,
      bounds
    };
  });

  return { districts };
}

/**
 * Filter pollutant fields from weather data
 */
export function pollutantsByLocation(
  entities: Array<{ location: Point; cameraId: string; pm25?: number; pm10?: number; no2?: number; o3?: number; co?: number; so2?: number; dateObserved: string }>
): Array<{ location: Point; cameraId: string; pollutants: { pm25?: number; pm10?: number; no2?: number; o3?: number; co?: number; so2?: number }; dateObserved: string }> {
  return entities.map(entity => ({
    location: entity.location,
    cameraId: entity.cameraId,
    pollutants: {
      pm25: entity.pm25,
      pm10: entity.pm10,
      no2: entity.no2,
      o3: entity.o3,
      co: entity.co,
      so2: entity.so2
    },
    dateObserved: entity.dateObserved
  }));
}

/**
 * Analyze accident hotspots with risk scoring
 * Groups accidents by camera and calculates comprehensive risk metrics
 * 
 * @param accidents - Array of accident entities
 * @param cameras - Array of camera entities for location data
 * @param minThreshold - Minimum number of accidents to qualify as hotspot (default: 3)
 * @returns Array of hotspot analysis with risk scores
 */
export interface AccidentHotspot {
  cameraId: string;
  cameraName: string;
  location: Point;
  accidentCount: number;
  severityBreakdown: {
    severe: number;
    moderate: number;
    minor: number;
  };
  mostCommonType: string;
  timePattern: {
    morning: number;    // 6:00-12:00
    afternoon: number;  // 12:00-18:00
    evening: number;    // 18:00-00:00
    night: number;      // 00:00-6:00
  };
  riskScore: number;  // 0-100
}

export function accidentHotspotAnalysis(
  accidents: Array<{ id: string; affectedCamera?: string; severity: string; accidentType: string; dateDetected: string }>,
  cameras: Array<{ id: string; name: string; location: Point }>,
  minThreshold: number = 3
): AccidentHotspot[] {
  // Group accidents by camera
  const cameraAccidents = new Map<string, typeof accidents>();

  for (const accident of accidents) {
    const cameraId = accident.affectedCamera;

    if (!cameraId) continue;

    if (!cameraAccidents.has(cameraId)) {
      cameraAccidents.set(cameraId, []);
    }

    cameraAccidents.get(cameraId)!.push(accident);
  }

  // Analyze each camera
  const hotspots: AccidentHotspot[] = [];

  for (const [cameraId, cameraAccidentList] of cameraAccidents) {
    // Filter by minimum threshold
    if (cameraAccidentList.length < minThreshold) {
      continue;
    }

    // Find camera info
    const camera = cameras.find(c => c.id === cameraId);
    if (!camera) continue;

    // Calculate severity breakdown
    const severityBreakdown = {
      severe: 0,
      moderate: 0,
      minor: 0
    };

    for (const accident of cameraAccidentList) {
      const severity = accident.severity.toLowerCase();
      if (severity === 'severe') severityBreakdown.severe++;
      else if (severity === 'moderate') severityBreakdown.moderate++;
      else if (severity === 'minor') severityBreakdown.minor++;
    }

    // Find most common accident type
    const typeCounts = new Map<string, number>();
    for (const accident of cameraAccidentList) {
      const count = typeCounts.get(accident.accidentType) || 0;
      typeCounts.set(accident.accidentType, count + 1);
    }

    let mostCommonType = 'unknown';
    let maxCount = 0;
    for (const [type, count] of typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    }

    // Calculate time pattern
    const timePattern = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };

    for (const accident of cameraAccidentList) {
      try {
        const date = new Date(accident.dateDetected);
        const hour = date.getHours();

        if (hour >= 6 && hour < 12) {
          timePattern.morning++;
        } else if (hour >= 12 && hour < 18) {
          timePattern.afternoon++;
        } else if (hour >= 18 && hour < 24) {
          timePattern.evening++;
        } else {
          timePattern.night++;
        }
      } catch (error) {
        // Skip invalid dates
      }
    }

    // Calculate risk score (0-100)
    // Weighted factors:
    // - Total accidents: 40% (normalized to 0-40)
    // - Severe accidents: 35% (weight severity heavily)
    // - Moderate accidents: 15%
    // - Time distribution variance: 10% (more consistent = higher risk)

    const totalAccidents = cameraAccidentList.length;
    const accidentScore = Math.min((totalAccidents / 20) * 40, 40); // Cap at 40

    const severityScore = (severityBreakdown.severe * 35) / Math.max(totalAccidents, 1) +
      (severityBreakdown.moderate * 15) / Math.max(totalAccidents, 1);

    // Time distribution variance (lower variance = more consistent = higher risk)
    const timeValues = Object.values(timePattern);
    const avgTime = timeValues.reduce((a, b) => a + b, 0) / timeValues.length;
    const variance = timeValues.reduce((sum, val) => sum + Math.pow(val - avgTime, 2), 0) / timeValues.length;
    const timeScore = variance < 1 ? 10 : Math.max(10 - (variance / totalAccidents) * 10, 0);

    const riskScore = Math.round(accidentScore + severityScore + timeScore);

    hotspots.push({
      cameraId,
      cameraName: camera.name,
      location: camera.location,
      accidentCount: totalAccidents,
      severityBreakdown,
      mostCommonType,
      timePattern,
      riskScore: Math.min(riskScore, 100) // Cap at 100
    });
  }

  // Sort by risk score descending
  hotspots.sort((a, b) => b.riskScore - a.riskScore);

  return hotspots;
}

/**
 * Correlate accidents with traffic patterns
 * Identifies which traffic patterns are associated with accidents
 * 
 * @param accidents - Array of accident entities
 * @param patterns - Array of traffic pattern entities
 * @returns Correlation analysis with insights
 */
export interface AccidentPatternCorrelation {
  totalAccidents: number;
  accidentsWithPatterns: number;
  correlationRate: number;
  byPattern: Array<{
    patternId: string;
    patternType: string;
    congestionLevel: string;
    accidentCount: number;
    avgSeverity: string;
    severityBreakdown: {
      severe: number;
      moderate: number;
      minor: number;
    };
  }>;
  byCongestion: {
    high: number;
    medium: number;
    low: number;
  };
  avgVehicleCount: number;
  insights: string;
}

export function accidentPatternCorrelation(
  accidents: Array<{
    id: string;
    affectedCamera?: string;
    severity: string;
    accidentType: string;
    dateDetected: string;
  }>,
  patterns: Array<{
    id: string;
    name: string;
    patternType: string;
    timeRange: string;
    daysOfWeek: string[];
    avgVehicleCount: number;
    congestionLevel: string;
    affectedCameras: string[];
  }>
): AccidentPatternCorrelation {
  let accidentsWithPatterns = 0;
  const patternAccidents = new Map<string, typeof accidents>();
  const congestionAccidents = {
    high: 0,
    medium: 0,
    low: 0
  };
  let totalVehicleCount = 0;
  let vehicleCountSamples = 0;

  // Match each accident with patterns
  for (const accident of accidents) {
    const accidentDate = new Date(accident.dateDetected);
    const accidentHour = accidentDate.getHours();
    const accidentMinutes = accidentDate.getMinutes();
    const accidentTime = `${String(accidentHour).padStart(2, '0')}:${String(accidentMinutes).padStart(2, '0')}`;
    const accidentDayOfWeek = accidentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    let matchedAnyPattern = false;

    for (const pattern of patterns) {
      // Check if camera matches
      const cameraMatch = accident.affectedCamera &&
        pattern.affectedCameras.includes(accident.affectedCamera);

      if (!cameraMatch) continue;

      // Check if day of week matches
      const dayMatch = pattern.daysOfWeek.map(d => d.toLowerCase()).includes(accidentDayOfWeek);

      if (!dayMatch) continue;

      // Check if time within pattern timeRange
      const timeMatch = isTimeInRange(accidentTime, pattern.timeRange);

      if (!timeMatch) continue;

      // All conditions matched - this is a correlated accident
      matchedAnyPattern = true;

      // Track accidents by pattern
      if (!patternAccidents.has(pattern.id)) {
        patternAccidents.set(pattern.id, []);
      }
      patternAccidents.get(pattern.id)!.push(accident);

      // Track by congestion level
      const congestion = pattern.congestionLevel.toLowerCase();
      if (congestion === 'high') congestionAccidents.high++;
      else if (congestion === 'medium') congestionAccidents.medium++;
      else if (congestion === 'low') congestionAccidents.low++;

      // Track vehicle count
      totalVehicleCount += pattern.avgVehicleCount;
      vehicleCountSamples++;
    }

    if (matchedAnyPattern) {
      accidentsWithPatterns++;
    }
  }

  // Calculate correlation rate
  const correlationRate = accidents.length > 0
    ? Math.round((accidentsWithPatterns / accidents.length) * 100)
    : 0;

  // Analyze each pattern
  const byPattern: AccidentPatternCorrelation['byPattern'] = [];

  for (const [patternId, accidentList] of patternAccidents) {
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) continue;

    // Calculate severity breakdown
    const severityBreakdown = {
      severe: 0,
      moderate: 0,
      minor: 0
    };

    for (const accident of accidentList) {
      const severity = accident.severity.toLowerCase();
      if (severity === 'severe') severityBreakdown.severe++;
      else if (severity === 'moderate') severityBreakdown.moderate++;
      else if (severity === 'minor') severityBreakdown.minor++;
    }

    // Determine average severity
    let avgSeverity = 'minor';
    if (severityBreakdown.severe > accidentList.length / 2) {
      avgSeverity = 'severe';
    } else if (severityBreakdown.moderate > accidentList.length / 3) {
      avgSeverity = 'moderate';
    }

    byPattern.push({
      patternId: pattern.id,
      patternType: pattern.patternType,
      congestionLevel: pattern.congestionLevel,
      accidentCount: accidentList.length,
      avgSeverity,
      severityBreakdown
    });
  }

  // Sort by accident count descending
  byPattern.sort((a, b) => b.accidentCount - a.accidentCount);

  // Calculate average vehicle count
  const avgVehicleCount = vehicleCountSamples > 0
    ? Math.round(totalVehicleCount / vehicleCountSamples)
    : 0;

  // Generate insights
  const insights = generateCorrelationInsights(
    accidents.length,
    accidentsWithPatterns,
    correlationRate,
    congestionAccidents,
    byPattern
  );

  return {
    totalAccidents: accidents.length,
    accidentsWithPatterns,
    correlationRate,
    byPattern,
    byCongestion: congestionAccidents,
    avgVehicleCount,
    insights
  };
}

/**
 * Check if time is within time range
 */
function isTimeInRange(time: string, timeRange: string): boolean {
  try {
    const [start, end] = timeRange.split('-').map(t => t.trim());
    const timeMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    if (endMinutes < startMinutes) {
      // Range crosses midnight
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
    } else {
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Generate insights from correlation analysis
 */
function generateCorrelationInsights(
  _totalAccidents: number,
  _accidentsWithPatterns: number,
  correlationRate: number,
  byCongestion: { high: number; medium: number; low: number },
  byPattern: Array<{ patternType: string; congestionLevel: string; avgSeverity: string; accidentCount: number }>
): string {
  const insights: string[] = [];

  // Overall correlation insight
  if (correlationRate >= 70) {
    insights.push(`${correlationRate}% of accidents correlate with known traffic patterns, indicating strong predictability.`);
  } else if (correlationRate >= 40) {
    insights.push(`${correlationRate}% of accidents correlate with traffic patterns, suggesting moderate predictability.`);
  } else {
    insights.push(`Only ${correlationRate}% of accidents correlate with patterns, indicating many accidents occur outside typical patterns.`);
  }

  // Congestion insight
  const totalCongestionAccidents = byCongestion.high + byCongestion.medium + byCongestion.low;
  if (totalCongestionAccidents > 0) {
    const highCongestionPct = Math.round((byCongestion.high / totalCongestionAccidents) * 100);
    if (highCongestionPct >= 50) {
      insights.push(`${highCongestionPct}% of correlated accidents occur during high congestion periods.`);
    }
  }

  // Pattern type insight
  if (byPattern.length > 0) {
    const topPattern = byPattern[0];
    insights.push(`Most accidents (${topPattern.accidentCount}) occur during ${topPattern.patternType} patterns with ${topPattern.congestionLevel} congestion.`);

    // Severity insight
    const severePatterns = byPattern.filter(p => p.avgSeverity === 'severe');
    if (severePatterns.length > 0) {
      insights.push(`Severe accidents are most common during ${severePatterns[0].patternType} periods.`);
    }
  }

  return insights.join(' ');
}

