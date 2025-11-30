/**
 * @module apps/traffic-web-app/backend/src/config/configLoader
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Configuration Loader and Validator for 100% config-driven architecture.
 * Loads YAML configuration files and provides type-safe access to entity
 * definitions, eliminating hardcoded domain logic from code.
 * 
 * Core Capabilities:
 * - YAML configuration file loading and parsing
 * - Entity type definitions (Camera, Vehicle, Accident, AirQualityObserved, etc.)
 * - Field mapping with NGSI-LD paths and alternative paths
 * - Type transformations and validations
 * - Computed field definitions with expressions
 * - Join resolution for merging related entities
 * - Filter application rules
 * - Default value handling
 * 
 * Configuration Structure:
 * - entities: Map of entity type to EntityConfig
 * - EntityConfig: type, fields, computations, joins, filters
 * - FieldConfig: ngsiPath, type, required, enum, default, unit, validate
 * - ComputationConfig: field, expression, description
 * 
 * Benefits:
 * - Zero code changes for new entity types
 * - Runtime configuration updates
 * - Type-safe configuration access
 * - Validation at load time
 * 
 * @dependencies
 * - js-yaml@^4.1: YAML parsing
 * - fs: File system operations
 * - path: Path resolution
 * 
 * @example
 * ```typescript
 * import { configLoader } from './configLoader';
 * 
 * // Get entity configuration
 * const cameraConfig = configLoader.getEntityConfig('Camera');
 * 
 * // Get field configuration
 * const locationField = configLoader.getFieldConfig('Camera', 'location');
 * 
 * // Get all entity types
 * const types = configLoader.getEntityTypes();
 * ```
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Configuration Loader and Validator
 * 
 * Loads YAML configuration and provides type-safe access to entity definitions.
 * This enables 100% config-driven architecture - no hardcoded domain logic in code.
 */

export interface FieldConfig {
  ngsiPath?: string;
  alternativePaths?: string[];
  type: string;
  required: boolean;
  enum?: string[];
  default?: any;
  unit?: string;
  validate?: string;
  transform?: string;
  fallback?: string;
  dependsOn?: string[];
  computation?: string;
  itemType?: string;
}

export interface FilterConfig {
  name: string;
  field?: string;
  fields?: string[];
  operator: string;
  enum?: string[];
  default?: any;
  max?: number;
  unit?: string;
  validate?: string;
  value?: any;
  targetField?: string;
}

export interface JoinConfig {
  entity: string;
  localField: string;
  foreignField: string;
  mergeFields: string[];
}

export interface ComputationRule {
  condition?: string;
  result?: any;
}

export interface ComputationConfig {
  type: string;
  rules?: ComputationRule[];
  map?: Record<string, any>;
  method?: string;
  parameters?: Record<string, any>;
}

export interface SortingConfig {
  default: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface EntityConfig {
  entityType: string;
  endpoint: string;
  description: string;
  fields: Record<string, FieldConfig>;
  filters?: FilterConfig[];
  joins?: JoinConfig[];
  computations?: Record<string, ComputationConfig>;
  sorting?: SortingConfig;
}

export interface AnalyticsConfig {
  endpoint: string;
  description: string;
  sourceEntity: string;
  filters?: FilterConfig[];
  aggregation?: {
    method: string;
    field?: string;
    clusterCount?: number;
    algorithm?: string;
    buckets?: string[];
    countField?: string;
    dimensions?: string[];
    groupBy?: string;
    computeFields?: Record<string, string>;
  };
  transformation: string;
  timeRange?: string;
  categorization?: {
    field: string;
    categories: Record<string, { range: number[]; color: string }>;
  };
}

export interface TransformationConfig {
  description: string;
  input: string;
  output: string;
  format?: string;
  logic?: string;
  algorithm?: string;
}

export interface ValidationRuleConfig {
  description: string;
  parameters?: string[];
  rules?: Record<string, string>;
}

export interface YamlConfig {
  version: string;
  stellioBaseUrl: string;
  entities: Record<string, EntityConfig>;
  analytics: Record<string, AnalyticsConfig>;
  transformations: Record<string, TransformationConfig>;
  validationRules: Record<string, ValidationRuleConfig>;
}

class ConfigurationLoader {
  private config: YamlConfig | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(__dirname, '../../config/entities.yaml');
  }

  /**
   * Load and validate YAML configuration
   */
  public load(): YamlConfig {
    try {
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(fileContents) as YamlConfig;

      this.validateConfig();
      return this.config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load configuration: ${error.message}`);
      }
      throw new Error('Failed to load configuration: Unknown error');
    }
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(): void {
    if (!this.config) {
      throw new Error('Configuration is null');
    }

    // Validate required top-level keys
    if (!this.config.version) {
      throw new Error('Configuration missing required field: version');
    }

    if (!this.config.stellioBaseUrl) {
      throw new Error('Configuration missing required field: stellioBaseUrl');
    }

    if (!this.config.entities || Object.keys(this.config.entities).length === 0) {
      throw new Error('Configuration missing required field: entities');
    }

    // Validate each entity configuration
    for (const [entityName, entityConfig] of Object.entries(this.config.entities)) {
      this.validateEntityConfig(entityName, entityConfig);
    }

    // Validate analytics configurations
    if (this.config.analytics) {
      for (const [analyticsName, analyticsConfig] of Object.entries(this.config.analytics)) {
        this.validateAnalyticsConfig(analyticsName, analyticsConfig);
      }
    }
  }

  /**
   * Validate entity configuration
   */
  private validateEntityConfig(name: string, config: EntityConfig): void {
    if (!config.entityType) {
      throw new Error(`Entity ${name} missing required field: entityType`);
    }

    if (!config.endpoint) {
      throw new Error(`Entity ${name} missing required field: endpoint`);
    }

    if (!config.fields || Object.keys(config.fields).length === 0) {
      throw new Error(`Entity ${name} missing required field: fields`);
    }

    // Validate fields
    for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
      this.validateFieldConfig(name, fieldName, fieldConfig);
    }

    // Validate filters if present
    if (config.filters) {
      for (const filter of config.filters) {
        this.validateFilterConfig(name, filter);
      }
    }

    // Validate joins if present
    if (config.joins) {
      for (const join of config.joins) {
        this.validateJoinConfig(name, join);
      }
    }
  }

  /**
   * Validate field configuration
   */
  private validateFieldConfig(entityName: string, fieldName: string, config: FieldConfig): void {
    if (!config.type) {
      throw new Error(`Entity ${entityName}, field ${fieldName} missing required field: type`);
    }

    const validTypes = ['string', 'number', 'boolean', 'datetime', 'geopoint', 'array', 'object', 'timeRange', 'computed'];
    if (!validTypes.includes(config.type)) {
      throw new Error(`Entity ${entityName}, field ${fieldName} has invalid type: ${config.type}`);
    }

    // For computed fields, ensure computation is specified
    if (config.type === 'computed' && !config.computation) {
      throw new Error(`Entity ${entityName}, field ${fieldName} is computed but missing computation name`);
    }

    // For array fields, ensure itemType is specified
    if (config.type === 'array' && !config.itemType) {
      throw new Error(`Entity ${entityName}, field ${fieldName} is array but missing itemType`);
    }
  }

  /**
   * Validate filter configuration
   */
  private validateFilterConfig(entityName: string, config: FilterConfig): void {
    if (!config.name) {
      throw new Error(`Entity ${entityName} has filter missing required field: name`);
    }

    if (!config.operator) {
      throw new Error(`Entity ${entityName}, filter ${config.name} missing required field: operator`);
    }

    const validOperators = [
      'equals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual',
      'boundingBox', 'limit', 'pagination', 'timeRange', 'timeInRange', 'selectFields'
    ];

    if (!validOperators.includes(config.operator)) {
      throw new Error(`Entity ${entityName}, filter ${config.name} has invalid operator: ${config.operator}`);
    }
  }

  /**
   * Validate join configuration
   */
  private validateJoinConfig(entityName: string, config: JoinConfig): void {
    if (!config.entity) {
      throw new Error(`Entity ${entityName} has join missing required field: entity`);
    }

    if (!config.localField) {
      throw new Error(`Entity ${entityName} has join missing required field: localField`);
    }

    if (!config.foreignField) {
      throw new Error(`Entity ${entityName} has join missing required field: foreignField`);
    }

    if (!config.mergeFields || config.mergeFields.length === 0) {
      throw new Error(`Entity ${entityName} has join missing required field: mergeFields`);
    }
  }

  /**
   * Validate analytics configuration
   */
  private validateAnalyticsConfig(name: string, config: AnalyticsConfig): void {
    if (!config.endpoint) {
      throw new Error(`Analytics ${name} missing required field: endpoint`);
    }

    if (!config.sourceEntity) {
      throw new Error(`Analytics ${name} missing required field: sourceEntity`);
    }

    if (!config.transformation) {
      throw new Error(`Analytics ${name} missing required field: transformation`);
    }

    // Validate source entity exists
    if (this.config && !this.config.entities[config.sourceEntity]) {
      throw new Error(`Analytics ${name} references non-existent source entity: ${config.sourceEntity}`);
    }
  }

  /**
   * Get entity configuration by name
   */
  public getEntityConfig(entityName: string): EntityConfig | null {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.entities[entityName] || null;
  }

  /**
   * Get entity configuration by endpoint
   */
  public getEntityConfigByEndpoint(endpoint: string): EntityConfig | null {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    for (const entityConfig of Object.values(this.config.entities)) {
      if (entityConfig.endpoint === endpoint) {
        return entityConfig;
      }
    }

    return null;
  }

  /**
   * Get analytics configuration by name
   */
  public getAnalyticsConfig(analyticsName: string): AnalyticsConfig | null {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.analytics?.[analyticsName] || null;
  }

  /**
   * Get analytics configuration by endpoint
   */
  public getAnalyticsConfigByEndpoint(endpoint: string): AnalyticsConfig | null {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    if (!this.config.analytics) {
      return null;
    }

    for (const analyticsConfig of Object.values(this.config.analytics)) {
      if (analyticsConfig.endpoint === endpoint) {
        return analyticsConfig;
      }
    }

    return null;
  }

  /**
   * Get all entity configurations
   */
  public getAllEntityConfigs(): Record<string, EntityConfig> {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.entities;
  }

  /**
   * Get all analytics configurations
   */
  public getAllAnalyticsConfigs(): Record<string, AnalyticsConfig> {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.analytics || {};
  }

  /**
   * Get transformation configuration
   */
  public getTransformationConfig(transformationName: string): TransformationConfig | null {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.transformations?.[transformationName] || null;
  }

  /**
   * Get validation rule configuration
   */
  public getValidationRuleConfig(ruleName: string): ValidationRuleConfig | null {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.validationRules?.[ruleName] || null;
  }

  /**
   * Get Stellio base URL
   */
  public getStellioBaseUrl(): string {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.stellioBaseUrl;
  }

  /**
   * Get configuration version
   */
  public getVersion(): string {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config.version;
  }

  /**
   * Reload configuration from file
   */
  public reload(): YamlConfig {
    this.config = null;
    return this.load();
  }
}

// Export singleton instance
export const configLoader = new ConfigurationLoader();

// Export class for testing
export { ConfigurationLoader };
