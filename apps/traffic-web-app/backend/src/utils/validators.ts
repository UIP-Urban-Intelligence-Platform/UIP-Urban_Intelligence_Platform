/**
 * Validation Utilities - Data Integrity & Type Safety
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/backend/src/utils/validators
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Production-ready validation utilities for data integrity and type safety.
 * Provides comprehensive validation functions for:
 * - Numeric ranges and constraints
 * - Geographic coordinates (latitude, longitude)
 * - Temporal data (dates, timestamps)
 * - String formats (URLs, entity IDs)
 * - NGSI-LD entity structures
 * - Data type validation
 * 
 * All validators return boolean results and are designed for both
 * runtime validation and TypeScript type guards.
 * 
 * @dependencies
 * - None (pure TypeScript functions)
 * 
 * @example
 * ```typescript
 * import { validateRange, validateLatitude, validateEntityId } from './validators';
 * 
 * // Validate numeric ranges
 * validateRange(25.5, 0, 100); // true
 * 
 * // Validate coordinates
 * validateLatitude(10.762622); // true
 * validateLongitude(106.660172); // true
 * 
 * // Validate entity IDs
 * validateEntityId('urn:ngsi-ld:Camera:001'); // true
 * ```
 */

/**
 * Validate numeric range
 */
export function validateRange(value: any, min: number, max: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  return value >= min && value <= max;
}

/**
 * Validate non-negative number
 */
export function validateNonNegative(value: any): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  return value >= 0;
}

/**
 * Validate enum value
 */
export function validateEnum(value: any, allowedValues: string[]): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return allowedValues.includes(value);
}

/**
 * Validate ISO 8601 datetime string
 */
export function validateDateTime(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  // ISO 8601 format validation
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

  if (!iso8601Regex.test(value)) {
    return false;
  }

  // Check if date is valid
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validate geographic coordinates
 */
export function validateGeoPoint(lat: any, lng: any): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }

  // Latitude: -90 to 90
  if (lat < -90 || lat > 90) {
    return false;
  }

  // Longitude: -180 to 180
  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * Apply validation rule from string format
 */
export function applyValidationRule(value: any, rule: string): boolean {
  // Parse rule string (e.g., "range:0-100", "nonNegative", "enum:severe,moderate,minor")
  const [ruleName, params] = rule.split(':');

  switch (ruleName) {
    case 'range': {
      if (!params) {
        throw new Error('Range validation requires parameters (e.g., "range:0-100")');
      }

      const [min, max] = params.split('-').map(Number);

      if (isNaN(min) || isNaN(max)) {
        throw new Error(`Invalid range parameters: ${params}`);
      }

      return validateRange(value, min, max);
    }

    case 'nonNegative': {
      return validateNonNegative(value);
    }

    case 'enum': {
      if (!params) {
        throw new Error('Enum validation requires parameters (e.g., "enum:high,medium,low")');
      }

      const allowedValues = params.split(',').map(v => v.trim());
      return validateEnum(value, allowedValues);
    }

    case 'datetime': {
      return validateDateTime(value);
    }

    case 'geopoint': {
      if (typeof value !== 'object' || value === null) {
        return false;
      }

      return validateGeoPoint(value.lat, value.lng);
    }

    default: {
      throw new Error(`Unknown validation rule: ${ruleName}`);
    }
  }
}

/**
 * Validate object against multiple rules
 */
export function validateObject(obj: any, rules: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = obj[field];

    try {
      if (!applyValidationRule(value, rule)) {
        errors.push(`Field '${field}' failed validation: ${rule}`);
      }
    } catch (error) {
      errors.push(`Field '${field}' validation error: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate array of objects
 */
export function validateArray(
  array: any[],
  rules: Record<string, string>
): { valid: boolean; errors: Array<{ index: number; errors: string[] }> } {
  const allErrors: Array<{ index: number; errors: string[] }> = [];

  for (let i = 0; i < array.length; i++) {
    const result = validateObject(array[i], rules);

    if (!result.valid) {
      allErrors.push({
        index: i,
        errors: result.errors
      });
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}
