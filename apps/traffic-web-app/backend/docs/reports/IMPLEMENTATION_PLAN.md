# Implementation Plan: Config-Driven Architecture for Accidents & Patterns

## Status: IN PROGRESS

## Completed:
✅ YAML configuration file (`config/entities.yaml`) - Complete entity definitions
✅ Configuration loader (`src/config/configLoader.ts`) - Full validation and type safety
✅ Package.json updated with `js-yaml` dependency
✅ Type definitions updated in `src/types/index.ts`

## Remaining Work:

### 1. Generic NGSI-LD Service (HIGH PRIORITY)
**File**: `src/services/genericNgsiService.ts`
**Status**: NOT STARTED
**Requirements**:
- Generic entity fetcher that reads from YAML config
- Field extraction using ngsiPath from config
- Alternative path resolution
- Type transformation (coordinatesToLatLng, parseTimeRange, etc.)
- Computed field calculation (aqiLevel, aqiColorCode, patternGeometry)
- Join resolution (camera location merging)
- Filter application based on config
- Sorting based on config
- NO hardcoded domain logic - 100% config-driven

### 2. Accidents Route Handler
**File**: `src/routes/accidentRoutes.ts`
**Status**: NOT STARTED
**Requirements**:
- GET /api/accidents
- GET /api/accidents/:id
- Query params: hours, severity, cameraId, limit, page
- Call generic service with 'RoadAccident' entity name
- Apply pagination
- Sort by dateDetected DESC
- Return: {success, count, totalPages, currentPage, data}

### 3. Traffic Patterns Route Handler
**File**: `src/routes/patternRoutes.ts`
**Status**: NOT STARTED
**Requirements**:
- GET /api/patterns
- GET /api/patterns/:id
- Query params: congestion, type, currentTime, limit
- Call generic service with 'TrafficPattern' entity name
- Calculate convex hull geometry from affected cameras
- Filter by current time (check timeRange and daysOfWeek)
- Return: {success, count, data with GeoJSON geometry}

### 4. Analytics Routes
**File**: `src/routes/analyticsRoutes.ts`
**Status**: NOT STARTED
**Requirements**:
- GET /api/airquality/pollutants?pollutant=pm10,no2,o3
- GET /api/weather/humidity-zones
- GET /api/analytics/accident-frequency
- GET /api/patterns/vehicle-heatmap
- GET /api/patterns/speed-zones
- GET /api/cameras/districts-ui
- Each route reads config from analytics section
- Applies aggregation/transformation logic
- Returns formatted data for visualization

### 5. Transformation Functions
**File**: `src/utils/transformations.ts`
**Status**: NOT STARTED
**Requirements**:
- coordinatesToLatLng(coords: number[]): {lat, lng}
- parseTimeRange(str: string): {start, end}
- convexHullFromCameras(cameraIds: string[], cameras: Camera[]): GeoJSON Polygon
- spatialClustering(data: any[], clusterCount: number): clusters
- timeBuckets(data: any[], buckets: string[]): aggregated data
- temporalGrid(data: any[], dimensions: string[]): grid data
- All transformation functions from YAML config

### 6. Validation Functions
**File**: `src/utils/validators.ts`
**Status**: NOT STARTED
**Requirements**:
- validateRange(value: number, min: number, max: number): boolean
- validateNonNegative(value: number): boolean
- validateEnum(value: any, allowedValues: any[]): boolean
- validateDateTime(value: string): boolean
- validateGeoPoint(lat: number, lng: number): boolean
- Apply validation rules from YAML config

### 7. Server Registration
**File**: `src/server.ts`
**Status**: NEEDS UPDATE
**Requirements**:
- Import accidentRoutes, patternRoutes, analyticsRoutes
- Register: app.use('/api/accidents', accidentRoutes)
- Register: app.use('/api/patterns', patternRoutes)
- Register: app.use('/api', analyticsRoutes)
- Load YAML config on startup
- Validate config and log errors

### 8. Test Files
**Files**: 
- `test-accident-endpoint.js`
- `test-pattern-endpoint.js`  
- `test-analytics-endpoints.js`
**Status**: NOT STARTED
**Requirements**:
- Comprehensive test coverage for all new endpoints
- Test all query parameters
- Test pagination
- Test GeoJSON geometry
- Test time-based filtering
- Test aggregation logic

### 9. Documentation
**Files**:
- `ACCIDENTS_API.md`
- `PATTERNS_API.md`
- `ANALYTICS_API.md`
**Status**: NOT STARTED
**Requirements**:
- Complete API documentation
- Request/response examples
- Query parameter details
- Error responses
- Integration examples

## Architecture Summary:

```
Request → Route Handler → Generic NGSI Service → YAML Config
                ↓                    ↓
         Read entity config   Extract fields using ngsiPath
                ↓                    ↓
         Apply filters       Transform data types
                ↓                    ↓
         Apply sorting      Calculate computed fields
                ↓                    ↓
         Format response    Resolve joins
                ↓                    ↓
         Return JSON        Return formatted data
```

## Key Design Principles:

1. **100% Config-Driven**: All domain logic in YAML, not code
2. **Generic Service**: Single service handles ALL entity types
3. **No Hardcoding**: Entity types, fields, filters all from config
4. **Type Safety**: Full TypeScript support with validation
5. **Extensibility**: Add new domains by editing YAML only
6. **Production Ready**: Complete error handling, validation, logging

## Next Steps:

1. Install js-yaml: `npm install` (add js-yaml and @types/js-yaml)
2. Create `genericNgsiService.ts` (MOST CRITICAL)
3. Create route handlers (accidents, patterns, analytics)
4. Create transformation/validation utilities
5. Update server.ts
6. Create test files
7. Create documentation

## Estimated Remaining Work:
- Generic Service: 600+ lines
- Route Handlers: 400+ lines (3 files)
- Utilities: 300+ lines (2 files)
- Tests: 800+ lines (3 files)
- Documentation: 1000+ lines (3 files)
**Total**: ~3100+ lines of production-ready code

## Critical Path:
1. genericNgsiService.ts (BLOCKS everything else)
2. Route handlers (depend on service)
3. Utilities (support service)
4. Tests (validate implementation)
5. Documentation (complete delivery)
