/**
 * Generic NGSI-LD Service - Config-Driven Entity Architecture
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/services/genericNgsiService
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Generic NGSI-LD Service - 100% config-driven service architecture.
 * Works with ANY entity type defined in YAML configuration files.
 * ZERO hardcoded domain logic - all behavior driven by configuration.
 * 
 * Core Architecture:
 * - Configuration-driven entity fetching from Stellio Context Broker
 * - Dynamic field extraction using ngsiPath mappings
 * - Alternative path resolution for flexible data access
 * - Type transformations (GeoJSON, coordinates, dates, numbers)
 * - Computed field calculation with expression evaluation
 * - Entity join resolution (e.g., merging camera with location)
 * - Filter application (query, geo-query, temporal)
 * - Null-safe property access with graceful fallbacks
 * 
 * Supported Entity Types (via config):
 * - Camera, Vehicle, Accident, AirQualityObserved
 * - WeatherObserved, TrafficFlowObserved, CongestionZone
 * - Any custom entity type defined in YAML
 * 
 * Design Benefits:
 * - Add new entity types without code changes
 * - Modify field mappings via configuration
 * - Consistent API across all entity types
 * - Single source of truth for entity schemas
 * 
 * @dependencies
 * - axios@^1.6: HTTP client for Stellio API
 * - configLoader: YAML configuration loader
 * 
 * @example
 * ```typescript
 * import { GenericNgsiService } from './genericNgsiService';
 * 
 * const service = new GenericNgsiService();
 * 
 * // Fetch any entity type (driven by config)
 * const cameras = await service.getEntities('Camera', { limit: 100 });
 * const accidents = await service.getEntities('Accident', { severity: 'high' });
 * 
 * // Get single entity
 * const camera = await service.getEntity('Camera', 'urn:ngsi-ld:Camera:001');
 * ```
 */

import axios, { AxiosInstance } from 'axios';
import http from 'http';
import https from 'https';
import { configLoader, EntityConfig, FieldConfig, ComputationConfig } from '../config/configLoader';
import { logger } from '../utils/logger';

/**
 * Generic NGSI-LD Service
 * 
 * 100% Config-driven service that works with ANY entity type defined in YAML.
 * NO hardcoded domain logic - all behavior driven by configuration.
 * 
 * Features:
 * - Generic entity fetching from Stellio
 * - Dynamic field extraction using ngsiPath from config
 * - Alternative path resolution
 * - Type transformations (coordinates, dates, etc.)
 * - Computed field calculation
 * - Join resolution (camera location merging)
 * - Filter application
 * - Sorting
 */

export class GenericNgsiService {
  private stellioBaseUrl: string;
  private cameraCache: Map<string, any> = new Map();
  private axiosClient: AxiosInstance;

  constructor() {
    // Load Stellio URL from config
    const config = configLoader.load();
    this.stellioBaseUrl = config.stellioBaseUrl;

    // Create HTTP agent with connection pooling
    const httpAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 60000,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 60000
    });

    const httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 60000,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 60000
    });

    this.axiosClient = axios.create({
      timeout: 60000,
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
      maxRedirects: 5,
      headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json'
      }
    });
  }

  /**
   * Fetch entities of specified type with filters
   */
  public async fetchEntities(entityName: string, queryParams: Record<string, any> = {}): Promise<any[]> {
    const entityConfig = configLoader.getEntityConfig(entityName);

    if (!entityConfig) {
      throw new Error(`Entity configuration not found: ${entityName}`);
    }

    try {
      // Build Stellio query URL with pagination to fetch ALL entities
      // Stellio max limit is 100 per request, so we paginate until no more results
      const stellioPageSize = 100; // Stellio max limit per request
      let allEntities: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const stellioUrl = `${this.stellioBaseUrl}?type=${entityConfig.entityType}&limit=${stellioPageSize}&offset=${offset}`;

        logger.debug(`Fetching ${entityName} entities from Stellio: ${stellioUrl}`);

        const response = await this.axiosClient.get(stellioUrl, {
          headers: {
            'Accept': 'application/ld+json',
            'Link': '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
          }
        });

        let entities = response.data;
        if (!Array.isArray(entities)) {
          entities = entities ? [entities] : [];
        }

        allEntities = allEntities.concat(entities);
        offset += stellioPageSize;
        hasMore = entities.length === stellioPageSize;
      }

      logger.info(`Fetched ${allEntities.length} ${entityName} entities from Stellio (paginated)`);

      // Transform entities
      const transformedEntities = await Promise.all(
        allEntities.map((entity: any) => this.transformEntity(entity, entityConfig))
      );

      // Apply filters from query params
      let filteredEntities = this.applyFilters(transformedEntities, entityConfig, queryParams);

      // Apply sorting
      filteredEntities = this.applySorting(filteredEntities, entityConfig);

      return filteredEntities;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Stellio request failed for ${entityName}: ${error.message}`);
        throw new Error(`Failed to fetch ${entityName} entities from Stellio: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch single entity by ID
   */
  public async fetchEntityById(entityName: string, id: string): Promise<any | null> {
    const entityConfig = configLoader.getEntityConfig(entityName);

    if (!entityConfig) {
      throw new Error(`Entity configuration not found: ${entityName}`);
    }

    try {
      const stellioUrl = `${this.stellioBaseUrl}/${encodeURIComponent(id)}`;

      logger.info(`Fetching ${entityName} entity by ID: ${id}`);

      const response = await this.axiosClient.get(stellioUrl, {
        headers: {
          'Accept': 'application/ld+json',
          'Link': '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
        }
      });

      const entity = response.data;
      return await this.transformEntity(entity, entityConfig);

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      if (axios.isAxiosError(error)) {
        logger.error(`Stellio request failed for ${entityName} ${id}: ${error.message}`);
        throw new Error(`Failed to fetch ${entityName} entity: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Transform NGSI-LD entity to flat structure using config
   */
  private async transformEntity(ngsiEntity: any, entityConfig: EntityConfig): Promise<any> {
    const transformed: any = {};

    // Extract fields using config
    for (const [fieldName, fieldConfig] of Object.entries(entityConfig.fields)) {
      try {
        if (fieldConfig.type === 'computed') {
          // Handle computed fields later after all base fields are extracted
          continue;
        }

        const value = this.extractFieldValue(ngsiEntity, fieldConfig);

        if (value !== null && value !== undefined) {
          transformed[fieldName] = value;
        } else if (fieldConfig.default !== undefined) {
          transformed[fieldName] = fieldConfig.default;
        } else if (fieldConfig.required) {
          logger.warn(`Required field ${fieldName} is missing in entity ${ngsiEntity.id}`);
          transformed[fieldName] = this.getDefaultValueForType(fieldConfig.type);
        }
      } catch (error) {
        logger.error(`Failed to extract field ${fieldName}: ${error}`);
        if (fieldConfig.default !== undefined) {
          transformed[fieldName] = fieldConfig.default;
        } else if (fieldConfig.required) {
          transformed[fieldName] = this.getDefaultValueForType(fieldConfig.type);
        }
      }
    }

    // Handle joins (e.g., camera location)
    if (entityConfig.joins) {
      for (const joinConfig of entityConfig.joins) {
        await this.resolveJoin(transformed, joinConfig);
      }
    }

    // Calculate computed fields
    for (const [fieldName, fieldConfig] of Object.entries(entityConfig.fields)) {
      if (fieldConfig.type === 'computed') {
        transformed[fieldName] = this.calculateComputedField(transformed, fieldConfig, entityConfig);
      }
    }

    return transformed;
  }

  /**
   * Extract field value from NGSI-LD entity using ngsiPath
   */
  private extractFieldValue(ngsiEntity: any, fieldConfig: FieldConfig): any {
    let value: any = null;

    // Try main ngsiPath
    if (fieldConfig.ngsiPath) {
      value = this.getNestedValue(ngsiEntity, fieldConfig.ngsiPath);
    }

    // Try alternative paths if main path fails
    if ((value === null || value === undefined) && fieldConfig.alternativePaths) {
      for (const altPath of fieldConfig.alternativePaths) {
        value = this.getNestedValue(ngsiEntity, altPath);
        if (value !== null && value !== undefined) {
          break;
        }
      }
    }

    // Apply transformation if specified
    if (value !== null && value !== undefined && fieldConfig.transform) {
      value = this.applyTransformation(value, fieldConfig.transform);
    }

    // Validate if validation rule specified
    if (value !== null && value !== undefined && fieldConfig.validate) {
      if (!this.validateValue(value, fieldConfig.validate)) {
        logger.warn(`Validation failed for value: ${value}, rule: ${fieldConfig.validate}`);
        return fieldConfig.default;
      }
    }

    return value;
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }

      // Handle array notation (e.g., coordinates[0])
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key];
        if (Array.isArray(current)) {
          current = current[parseInt(index)];
        } else {
          return null;
        }
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Apply transformation to value
   */
  private applyTransformation(value: any, transformName: string): any {
    switch (transformName) {
      case 'coordinatesToLatLng':
        return this.coordinatesToLatLng(value);

      case 'parseTimeRange':
        return this.parseTimeRange(value);

      case 'toLatLng':
        return this.objectToLatLng(value);

      default:
        logger.warn(`Unknown transformation: ${transformName}`);
        return value;
    }
  }

  /**
   * Transform GeoJSON coordinates [lng, lat] to {lat, lng}
   */
  private coordinatesToLatLng(coordinates: any): { lat: number; lng: number } | null {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    return {
      lng: coordinates[0],
      lat: coordinates[1]
    };
  }

  /**
   * Transform object with latitude/longitude to {latitude, longitude, lat, lng}
   * Supports both {latitude, longitude} and [lng, lat] formats
   */
  private objectToLatLng(value: any): { latitude: number; longitude: number; lat: number; lng: number } | null {
    if (!value) return null;

    // If it's already an object with latitude/longitude
    if (typeof value === 'object' && !Array.isArray(value)) {
      const lat = value.latitude ?? value.lat;
      const lng = value.longitude ?? value.lng;
      if (lat != null && lng != null) {
        return {
          latitude: lat,
          longitude: lng,
          lat: lat,
          lng: lng
        };
      }
    }

    // If it's GeoJSON coordinates [lng, lat]
    if (Array.isArray(value) && value.length >= 2) {
      return {
        latitude: value[1],
        longitude: value[0],
        lat: value[1],
        lng: value[0]
      };
    }

    return null;
  }

  /**
   * Parse time range string "HH:MM-HH:MM" to {start, end}
   */
  private parseTimeRange(timeRangeStr: string): { start: string; end: string } | null {
    if (typeof timeRangeStr !== 'string') {
      return null;
    }

    const match = timeRangeStr.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!match) {
      return null;
    }

    return {
      start: match[1],
      end: match[2]
    };
  }

  /**
   * Validate value against validation rule
   */
  private validateValue(value: any, validationRule: string): boolean {
    // Parse validation rule (e.g., "range:0-100", "nonNegative")
    const [ruleName, params] = validationRule.split(':');

    switch (ruleName) {
      case 'range': {
        if (typeof value !== 'number') return false;
        const [min, max] = params.split('-').map(Number);
        return value >= min && value <= max;
      }

      case 'nonNegative':
        return typeof value === 'number' && value >= 0;

      default:
        return true;
    }
  }

  /**
   * Get default value for field type
   */
  private getDefaultValueForType(type: string): any {
    switch (type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      case 'geopoint':
        return { lat: 0, lng: 0 };
      default:
        return null;
    }
  }

  /**
   * Resolve join (e.g., merge camera location)
   */
  private async resolveJoin(entity: any, joinConfig: any): Promise<void> {
    const foreignId = entity[joinConfig.localField];

    if (!foreignId || foreignId === 'unknown') {
      return;
    }

    try {
      // Check cache first
      let foreignEntity = this.cameraCache.get(foreignId);

      // Fetch if not in cache
      if (!foreignEntity) {
        foreignEntity = await this.fetchEntityById(joinConfig.entity, foreignId);
        if (foreignEntity) {
          this.cameraCache.set(foreignId, foreignEntity);
        }
      }

      // Merge specified fields
      if (foreignEntity) {
        for (const field of joinConfig.mergeFields) {
          if (foreignEntity[field] !== undefined) {
            entity[field] = foreignEntity[field];
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to resolve join for ${foreignId}: ${error}`);
    }
  }

  /**
   * Calculate computed field
   */
  private calculateComputedField(entity: any, fieldConfig: FieldConfig, entityConfig: EntityConfig): any {
    if (!fieldConfig.computation) {
      return null;
    }

    const computationConfig = entityConfig.computations?.[fieldConfig.computation];
    if (!computationConfig) {
      logger.warn(`Computation not found: ${fieldConfig.computation}`);
      return null;
    }

    // Get dependencies
    const dependencies: any = {};
    if (fieldConfig.dependsOn) {
      for (const depField of fieldConfig.dependsOn) {
        dependencies[depField] = entity[depField];
      }
    }

    switch (computationConfig.type) {
      case 'categorical':
        return this.computeCategorical(dependencies, computationConfig);

      case 'mapping':
        return this.computeMapping(dependencies, computationConfig);

      case 'geoJson':
        return this.computeGeoJson(dependencies, computationConfig);

      default:
        logger.warn(`Unknown computation type: ${computationConfig.type}`);
        return null;
    }
  }

  /**
   * Compute categorical value (e.g., AQI level)
   */
  private computeCategorical(dependencies: any, config: ComputationConfig): any {
    if (!config.rules) {
      return null;
    }

    const value = Object.values(dependencies)[0];

    for (const rule of config.rules) {
      if (!rule.condition) continue;

      try {
        // Safely evaluate condition
        if (this.evaluateCondition(value as number, rule.condition)) {
          return rule.result;
        }
      } catch (error) {
        logger.error(`Failed to evaluate condition: ${rule.condition}`);
      }
    }

    return null;
  }

  /**
   * Evaluate condition safely
   */
  private evaluateCondition(value: number, condition: string): boolean {
    // Parse condition string (e.g., "value <= 50")
    const operators = ['<=', '>=', '<', '>', '=='];

    for (const op of operators) {
      if (condition.includes(op)) {
        const parts = condition.split(op).map(p => p.trim());
        const threshold = parseFloat(parts[1]);

        switch (op) {
          case '<=': return value <= threshold;
          case '>=': return value >= threshold;
          case '<': return value < threshold;
          case '>': return value > threshold;
          case '==': return value === threshold;
        }
      }
    }

    return false;
  }

  /**
   * Compute mapped value (e.g., color code)
   */
  private computeMapping(dependencies: any, config: ComputationConfig): any {
    if (!config.map) {
      return null;
    }

    const key = String(Object.values(dependencies)[0]);
    return config.map[key] || null;
  }

  /**
   * Compute GeoJSON geometry (e.g., convex hull from cameras)
   */
  private computeGeoJson(_dependencies: any, _config: ComputationConfig): any {
    // For now, return null - will be computed by analytics service
    // This requires loading all camera locations
    return null;
  }

  /**
   * Apply filters based on query params
   */
  private applyFilters(entities: any[], entityConfig: EntityConfig, queryParams: Record<string, any>): any[] {
    if (!entityConfig.filters) {
      return entities;
    }

    let filtered = [...entities];

    for (const filterConfig of entityConfig.filters) {
      const paramValue = queryParams[filterConfig.name];

      if (paramValue === undefined || paramValue === null) {
        continue;
      }

      switch (filterConfig.operator) {
        case 'equals':
          filtered = filtered.filter(entity => {
            const fieldValue = entity[filterConfig.field!];
            return fieldValue === paramValue;
          });
          break;

        case 'greaterThanOrEqual':
          filtered = filtered.filter(entity => {
            const fieldValue = entity[filterConfig.field!];
            return typeof fieldValue === 'number' && fieldValue >= Number(paramValue);
          });
          break;

        case 'lessThanOrEqual':
          filtered = filtered.filter(entity => {
            const fieldValue = entity[filterConfig.field!];
            return typeof fieldValue === 'number' && fieldValue <= Number(paramValue);
          });
          break;

        case 'boundingBox':
          if (filterConfig.fields && filterConfig.fields.length === 4) {
            const [minLat, maxLat, minLng, maxLng] = filterConfig.fields.map(f => Number(queryParams[f]));

            if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLng) && !isNaN(maxLng)) {
              filtered = filtered.filter(entity => {
                const location = entity[filterConfig.targetField || 'location'];
                if (!location || !location.lat || !location.lng) return false;

                return location.lat >= minLat && location.lat <= maxLat &&
                  location.lng >= minLng && location.lng <= maxLng;
              });
            }
          }
          break;

        case 'timeRange':
          if (filterConfig.field && filterConfig.unit === 'hours') {
            const hours = Number(paramValue);
            if (!isNaN(hours)) {
              const cutoffTime = new Date();
              cutoffTime.setHours(cutoffTime.getHours() - hours);

              filtered = filtered.filter(entity => {
                const dateValue = entity[filterConfig.field!];
                if (!dateValue) return false;

                const entityDate = new Date(dateValue);
                return entityDate >= cutoffTime;
              });
            }
          }
          break;

        case 'timeInRange':
          if (filterConfig.field && paramValue === true) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;
            const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

            filtered = filtered.filter(entity => {
              const timeRange = entity[filterConfig.field!];
              const daysOfWeek = entity.daysOfWeek;

              if (!timeRange || !timeRange.start || !timeRange.end) return false;
              if (!daysOfWeek || !Array.isArray(daysOfWeek)) return false;

              // Check day of week
              if (!daysOfWeek.includes(currentDay)) return false;

              // Check time range
              const [startHour, startMinute] = timeRange.start.split(':').map(Number);
              const [endHour, endMinute] = timeRange.end.split(':').map(Number);
              const startTime = startHour * 60 + startMinute;
              const endTime = endHour * 60 + endMinute;

              return currentTime >= startTime && currentTime <= endTime;
            });
          }
          break;

        case 'limit':
          const limit = Number(paramValue);
          const maxLimit = filterConfig.max || 1000;
          const effectiveLimit = Math.min(Math.max(1, limit), maxLimit);
          filtered = filtered.slice(0, effectiveLimit);
          break;
      }
    }

    return filtered;
  }

  /**
   * Apply sorting based on config
   */
  private applySorting(entities: any[], entityConfig: EntityConfig): any[] {
    if (!entityConfig.sorting?.default) {
      return entities;
    }

    const { field, order } = entityConfig.sorting.default;

    return entities.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === bValue) return 0;

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // For dates stored as strings
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          comparison = aDate.getTime() - bDate.getTime();
        }
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }
}

// Export singleton instance
export const genericNgsiService = new GenericNgsiService();
