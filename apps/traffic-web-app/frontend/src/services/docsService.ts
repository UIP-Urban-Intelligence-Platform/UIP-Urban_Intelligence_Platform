/**
 * Documentation Service - Markdown Content Loader
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 * 
 * @module apps/traffic-web-app/frontend/src/services/docsService
 * @author Nguyễn Nhật Quang
 * @created 2025-11-30
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Service for loading and managing documentation content from markdown files.
 * Provides navigation structure and content fetching for the embedded docs system.
 */

export interface DocItem {
    id: string;
    title: string;
    path: string;
    children?: DocItem[];
    order?: number;
}

export interface DocContent {
    title: string;
    content: string;
    frontmatter?: Record<string, unknown>;
}

// Documentation navigation structure
export const docsNavigation: DocItem[] = [
    {
        id: 'intro',
        title: 'Introduction',
        path: '/docs',
        order: 1,
    },
    {
        id: 'quick-start',
        title: 'Quick Start',
        path: '/docs/quick-start',
        order: 2,
    },
    {
        id: 'installation',
        title: 'Installation',
        path: '/docs/installation',
        order: 3,
        children: [
            { id: 'prerequisites', title: 'System Requirements', path: '/docs/installation/prerequisites' },
            { id: 'docker-setup', title: 'Docker Setup', path: '/docs/installation/docker-setup' },
            { id: 'local-setup', title: 'Local Setup', path: '/docs/installation/local-setup' },
            { id: 'environment-config', title: 'Environment Config', path: '/docs/installation/environment-config' },
        ],
    },
    {
        id: 'architecture',
        title: 'System Architecture',
        path: '/docs/architecture',
        order: 4,
        children: [
            { id: 'architecture-overview', title: 'Overview', path: '/docs/architecture/overview' },
        ],
    },
    {
        id: 'agents',
        title: 'Agent System',
        path: '/docs/agents',
        order: 5,
        children: [
            { id: 'agents-overview', title: 'Agent Overview', path: '/docs/agents/overview' },
            { id: 'agents-reference', title: 'Complete Reference', path: '/docs/agents/complete-agents-reference' },
            {
                id: 'agents-analytics', title: 'Analytics Agents', path: '/docs/agents/analytics',
                children: [
                    { id: 'accident-detection', title: 'Accident Detection', path: '/docs/agents/analytics/accident-detection' },
                    { id: 'citizen-report', title: 'Citizen Report', path: '/docs/agents/analytics/citizen-report' },
                    { id: 'congestion-detection', title: 'Congestion Detection', path: '/docs/agents/analytics/congestion-detection' },
                    { id: 'cv-analysis', title: 'CV Analysis', path: '/docs/agents/analytics/cv-analysis' },
                    { id: 'pattern-recognition', title: 'Pattern Recognition', path: '/docs/agents/analytics/pattern-recognition' },
                ]
            },
            {
                id: 'agents-context', title: 'Context Management', path: '/docs/agents/context-management',
                children: [
                    { id: 'entity-publisher', title: 'Entity Publisher', path: '/docs/agents/context-management/entity-publisher' },
                    { id: 'state-updater', title: 'State Updater', path: '/docs/agents/context-management/state-updater' },
                    { id: 'stellio-state-query', title: 'Stellio State Query', path: '/docs/agents/context-management/stellio-state-query' },
                    { id: 'temporal-data-manager', title: 'Temporal Data Manager', path: '/docs/agents/context-management/temporal-data-manager' },
                ]
            },
            {
                id: 'agents-data', title: 'Data Collection', path: '/docs/agents/data-collection',
                children: [
                    { id: 'air-quality', title: 'Air Quality', path: '/docs/agents/data-collection/air-quality' },
                    { id: 'camera-image-fetch', title: 'Camera Image Fetch', path: '/docs/agents/data-collection/camera-image-fetch' },
                    { id: 'weather-integration', title: 'Weather Integration', path: '/docs/agents/data-collection/weather-integration' },
                    { id: 'external-data-collector', title: 'External Data Collector', path: '/docs/agents/data-collection/external-data-collector' },
                    { id: 'image-refresh', title: 'Image Refresh', path: '/docs/agents/data-collection/image-refresh' },
                ]
            },
            {
                id: 'agents-notification', title: 'Notification', path: '/docs/agents/notification',
                children: [
                    { id: 'alert-dispatcher', title: 'Alert Dispatcher', path: '/docs/agents/notification/alert-dispatcher' },
                    { id: 'email-notification-handler', title: 'Email Notification Handler', path: '/docs/agents/notification/email-notification-handler' },
                    { id: 'incident-report-generator', title: 'Incident Report Generator', path: '/docs/agents/notification/incident-report-generator' },
                    { id: 'subscription-manager', title: 'Subscription Manager', path: '/docs/agents/notification/subscription-manager' },
                    { id: 'webhook-notification-handler', title: 'Webhook Notification Handler', path: '/docs/agents/notification/webhook-notification-handler' },
                ]
            },
            {
                id: 'agents-rdf', title: 'RDF & Linked Data', path: '/docs/agents/rdf-linked-data',
                children: [
                    { id: 'triplestore-loader', title: 'Triplestore Loader', path: '/docs/agents/rdf-linked-data/triplestore-loader' },
                    { id: 'content-negotiation', title: 'Content Negotiation', path: '/docs/agents/rdf-linked-data/content-negotiation' },
                    { id: 'lod-linkset-enrichment', title: 'LOD Linkset Enrichment', path: '/docs/agents/rdf-linked-data/lod-linkset-enrichment' },
                    { id: 'ngsi-ld-to-rdf', title: 'NGSI-LD to RDF', path: '/docs/agents/rdf-linked-data/ngsi-ld-to-rdf' },
                    { id: 'smart-data-models-validation', title: 'Smart Data Models Validation', path: '/docs/agents/rdf-linked-data/smart-data-models-validation' },
                ]
            },
            {
                id: 'agents-transformation', title: 'Transformation', path: '/docs/agents/transformation',
                children: [
                    { id: 'ngsi-ld-transformer', title: 'NGSI-LD Transformer', path: '/docs/agents/transformation/ngsi-ld-transformer' },
                    { id: 'sosa-ssn-mapper', title: 'SOSA/SSN Mapper', path: '/docs/agents/transformation/sosa-ssn-mapper' },
                ]
            },
            {
                id: 'agents-state-management', title: 'State Management', path: '/docs/agents/state-management',
                children: [
                    { id: 'state-manager', title: 'State Manager', path: '/docs/agents/state-management/state-manager' },
                    { id: 'accident-state-manager', title: 'Accident State Manager', path: '/docs/agents/state-management/accident-state-manager' },
                    { id: 'congestion-state-manager', title: 'Congestion State Manager', path: '/docs/agents/state-management/congestion-state-manager' },
                    { id: 'temporal-state-tracker', title: 'Temporal State Tracker', path: '/docs/agents/state-management/temporal-state-tracker' },
                ]
            },
            {
                id: 'agents-cache', title: 'Cache', path: '/docs/agents/cache',
                children: [
                    { id: 'cache-manager', title: 'Cache Manager', path: '/docs/agents/cache/cache-manager' },
                    { id: 'cache-invalidator', title: 'Cache Invalidator', path: '/docs/agents/cache/cache-invalidator' },
                ]
            },
            {
                id: 'agents-graph-database', title: 'Graph Database', path: '/docs/agents/graph-database',
                children: [
                    { id: 'neo4j-sync', title: 'Neo4j Sync', path: '/docs/agents/graph-database/neo4j-sync' },
                    { id: 'neo4j-query', title: 'Neo4j Query', path: '/docs/agents/graph-database/neo4j-query' },
                ]
            },
            {
                id: 'agents-monitoring', title: 'Monitoring', path: '/docs/agents/monitoring',
                children: [
                    { id: 'health-check', title: 'Health Check', path: '/docs/agents/monitoring/health-check' },
                    { id: 'performance-monitor', title: 'Performance Monitor', path: '/docs/agents/monitoring/performance-monitor' },
                    { id: 'data-quality-validator', title: 'Data Quality Validator', path: '/docs/agents/monitoring/data-quality-validator' },
                ]
            },
            {
                id: 'agents-ingestion', title: 'Ingestion', path: '/docs/agents/ingestion',
                children: [
                    { id: 'citizen-ingestion', title: 'Citizen Ingestion', path: '/docs/agents/ingestion/citizen-ingestion' },
                ]
            },
            {
                id: 'agents-integration', title: 'Integration', path: '/docs/agents/integration',
                children: [
                    { id: 'api-gateway', title: 'API Gateway', path: '/docs/agents/integration/api-gateway' },
                ]
            },
        ],
    },
    {
        id: 'frontend',
        title: 'Frontend Components',
        path: '/docs/frontend',
        order: 6,
        children: [
            { id: 'frontend-overview', title: 'Overview', path: '/docs/frontend/overview' },
            { id: 'components-reference', title: 'Components Reference', path: '/docs/frontend/complete-components-reference' },
            {
                id: 'frontend-components', title: 'Components', path: '/docs/frontend/components',
                children: [
                    { id: 'analytics-dashboard', title: 'Analytics Dashboard', path: '/docs/frontend/components/AnalyticsDashboard' },
                    { id: 'citizen-report-form', title: 'Citizen Report Form', path: '/docs/frontend/components/CitizenReportForm' },
                    { id: 'traffic-map', title: 'Traffic Map', path: '/docs/frontend/components/TrafficMap' },
                    { id: 'accident-frequency-chart', title: 'Accident Frequency Chart', path: '/docs/frontend/components/AccidentFrequencyChart' },
                    { id: 'accident-markers', title: 'Accident Markers', path: '/docs/frontend/components/AccidentMarkers' },
                    { id: 'aqi-heatmap', title: 'AQI Heatmap', path: '/docs/frontend/components/AQIHeatmap' },
                    { id: 'camera-detail-modal', title: 'Camera Detail Modal', path: '/docs/frontend/components/CameraDetailModal' },
                    { id: 'circle-draw-tool', title: 'Circle Draw Tool', path: '/docs/frontend/components/CircleDrawTool' },
                    { id: 'citizen-report-filter-panel', title: 'Citizen Report Filter Panel', path: '/docs/frontend/components/CitizenReportFilterPanel' },
                    { id: 'citizen-report-map', title: 'Citizen Report Map', path: '/docs/frontend/components/CitizenReportMap' },
                    { id: 'citizen-report-markers', title: 'Citizen Report Markers', path: '/docs/frontend/components/CitizenReportMarkers' },
                    { id: 'connection-status', title: 'Connection Status', path: '/docs/frontend/components/ConnectionStatus' },
                    { id: 'correlation-lines', title: 'Correlation Lines', path: '/docs/frontend/components/CorrelationLines' },
                    { id: 'correlation-panel', title: 'Correlation Panel', path: '/docs/frontend/components/CorrelationPanel' },
                    { id: 'error-boundary', title: 'Error Boundary', path: '/docs/frontend/components/ErrorBoundary' },
                    { id: 'filter-panel', title: 'Filter Panel', path: '/docs/frontend/components/FilterPanel' },
                    { id: 'historical-view-banner', title: 'Historical View Banner', path: '/docs/frontend/components/HistoricalViewBanner' },
                    { id: 'humidity-visibility-layer', title: 'Humidity Visibility Layer', path: '/docs/frontend/components/HumidityVisibilityLayer' },
                    { id: 'map-legend', title: 'Map Legend', path: '/docs/frontend/components/MapLegend' },
                    { id: 'notification-provider', title: 'Notification Provider', path: '/docs/frontend/components/NotificationProvider' },
                    { id: 'pattern-zones', title: 'Pattern Zones', path: '/docs/frontend/components/PatternZones' },
                    { id: 'pollutant-circles', title: 'Pollutant Circles', path: '/docs/frontend/components/PollutantCircles' },
                    { id: 'route-planner', title: 'Route Planner', path: '/docs/frontend/components/RoutePlanner' },
                    { id: 'route-visualization', title: 'Route Visualization', path: '/docs/frontend/components/RouteVisualization' },
                    { id: 'sidebar', title: 'Sidebar', path: '/docs/frontend/components/Sidebar' },
                    { id: 'simple-legend', title: 'Simple Legend', path: '/docs/frontend/components/SimpleLegend' },
                    { id: 'speed-zones', title: 'Speed Zones', path: '/docs/frontend/components/SpeedZones' },
                    { id: 'time-machine', title: 'Time Machine', path: '/docs/frontend/components/TimeMachine' },
                    { id: 'vehicle-heatmap', title: 'Vehicle Heatmap', path: '/docs/frontend/components/VehicleHeatmap' },
                    { id: 'weather-overlay', title: 'Weather Overlay', path: '/docs/frontend/components/WeatherOverlay' },
                ]
            },
            {
                id: 'frontend-hooks', title: 'Hooks', path: '/docs/frontend/hooks',
                children: [
                    { id: 'use-websocket', title: 'useWebSocket', path: '/docs/frontend/hooks/useWebSocket' },
                ]
            },
            {
                id: 'frontend-pages', title: 'Pages', path: '/docs/frontend/pages',
                children: [
                    { id: 'dashboard-page', title: 'Dashboard', path: '/docs/frontend/pages/Dashboard' },
                    { id: 'docs-page', title: 'DocsPage', path: '/docs/frontend/pages/DocsPage' },
                    { id: 'landing-page', title: 'LandingPage', path: '/docs/frontend/pages/LandingPage' },
                ]
            },
            {
                id: 'frontend-services', title: 'Services', path: '/docs/frontend/services',
                children: [
                    { id: 'api-service', title: 'API Service', path: '/docs/frontend/services/api' },
                    { id: 'citizen-report-service', title: 'Citizen Report Service', path: '/docs/frontend/services/citizenReportService' },
                    { id: 'docs-service', title: 'Docs Service', path: '/docs/frontend/services/docsService' },
                    { id: 'websocket-service', title: 'WebSocket Service', path: '/docs/frontend/services/websocket' },
                ]
            },
            {
                id: 'frontend-store', title: 'Store', path: '/docs/frontend/store',
                children: [
                    { id: 'traffic-store', title: 'Traffic Store', path: '/docs/frontend/store/trafficStore' },
                ]
            },
            {
                id: 'frontend-types', title: 'Types', path: '/docs/frontend/types',
                children: [
                    { id: 'citizen-report-types', title: 'Citizen Report Types', path: '/docs/frontend/types/citizenReport' },
                    { id: 'types-index', title: 'Types Index', path: '/docs/frontend/types/index' },
                ]
            },
        ],
    },
    {
        id: 'api',
        title: 'API Documentation',
        path: '/docs/api',
        order: 7,
        children: [
            { id: 'api-reference', title: 'API Reference', path: '/docs/api/complete-api-reference' },
            { id: 'rest-api', title: 'REST API', path: '/docs/api/rest-api' },
            { id: 'websocket', title: 'WebSocket', path: '/docs/api/websocket' },
        ],
    },
    {
        id: 'data-models',
        title: 'Data Models',
        path: '/docs/data-models',
        order: 8,
        children: [
            { id: 'standards', title: 'Standards & Ontologies', path: '/docs/data-models/complete-standards' },
        ],
    },
    {
        id: 'devops',
        title: 'DevOps',
        path: '/docs/devops',
        order: 9,
        children: [
            { id: 'devops-guide', title: 'DevOps Guide', path: '/docs/devops/complete-devops-guide' },
        ],
    },
    {
        id: 'testing',
        title: 'Testing',
        path: '/docs/testing',
        order: 10,
        children: [
            { id: 'testing-guide', title: 'Testing Guide', path: '/docs/testing/complete-testing-guide' },
        ],
    },
    {
        id: 'guides',
        title: 'Guides',
        path: '/docs/guides',
        order: 11,
        children: [
            { id: 'development', title: 'Development', path: '/docs/guides/development' },
            { id: 'deployment', title: 'Deployment', path: '/docs/guides/deployment' },
            { id: 'contributing', title: 'Contributing', path: '/docs/guides/contributing' },
            { id: 'troubleshooting', title: 'Troubleshooting', path: '/docs/guides/troubleshooting' },
        ],
    },
    {
        id: 'tutorial-basics',
        title: 'Tutorial Basics',
        path: '/docs/tutorial-basics',
        order: 12,
        children: [
            { id: 'create-page', title: 'Create a Page', path: '/docs/tutorial-basics/create-a-page' },
            { id: 'create-document', title: 'Create a Document', path: '/docs/tutorial-basics/create-a-document' },
            { id: 'create-blog-post', title: 'Create a Blog Post', path: '/docs/tutorial-basics/create-a-blog-post' },
            { id: 'markdown-features', title: 'Markdown Features', path: '/docs/tutorial-basics/markdown-features' },
            { id: 'deploy-site', title: 'Deploy Your Site', path: '/docs/tutorial-basics/deploy-your-site' },
            { id: 'congratulations', title: 'Congratulations', path: '/docs/tutorial-basics/congratulations' },
        ],
    },
    {
        id: 'tutorial-extras',
        title: 'Tutorial Extras',
        path: '/docs/tutorial-extras',
        order: 13,
        children: [
            { id: 'manage-versions', title: 'Manage Docs Versions', path: '/docs/tutorial-extras/manage-docs-versions' },
            { id: 'translate-site', title: 'Translate Your Site', path: '/docs/tutorial-extras/translate-your-site' },
        ],
    },
    {
        id: 'backend',
        title: 'Backend',
        path: '/docs/backend',
        order: 14,
        children: [
            { id: 'backend-overview', title: 'Overview', path: '/docs/backend/overview' },
            {
                id: 'backend-agents', title: 'Agents', path: '/docs/backend/agents',
                children: [
                    { id: 'eco-twin-agent', title: 'EcoTwin Agent', path: '/docs/backend/agents/EcoTwinAgent' },
                    { id: 'graph-investigator-agent', title: 'Graph Investigator Agent', path: '/docs/backend/agents/GraphInvestigatorAgent' },
                    { id: 'traffic-maestro-agent', title: 'Traffic Maestro Agent', path: '/docs/backend/agents/TrafficMaestroAgent' },
                ]
            },
            {
                id: 'backend-config', title: 'Config', path: '/docs/backend/config',
                children: [
                    { id: 'config-loader', title: 'Config Loader', path: '/docs/backend/config/configLoader' },
                ]
            },
            {
                id: 'backend-middlewares', title: 'Middlewares', path: '/docs/backend/middlewares',
                children: [
                    { id: 'error-handler', title: 'Error Handler', path: '/docs/backend/middlewares/errorHandler' },
                ]
            },
            {
                id: 'backend-routes', title: 'Routes', path: '/docs/backend/routes',
                children: [
                    { id: 'routes-overview', title: 'Overview', path: '/docs/backend/routes/overview' },
                    { id: 'accident-routes', title: 'Accident', path: '/docs/backend/routes/accident' },
                    { id: 'agent-routes', title: 'Agent', path: '/docs/backend/routes/agent' },
                    { id: 'air-quality-routes', title: 'Air Quality', path: '/docs/backend/routes/airQuality' },
                    { id: 'analytics-routes', title: 'Analytics', path: '/docs/backend/routes/analytics' },
                    { id: 'camera-routes', title: 'Camera', path: '/docs/backend/routes/camera' },
                    { id: 'correlation-routes', title: 'Correlation', path: '/docs/backend/routes/correlation' },
                    { id: 'geocoding-routes', title: 'Geocoding', path: '/docs/backend/routes/geocoding' },
                    { id: 'historical-routes', title: 'Historical', path: '/docs/backend/routes/historical' },
                    { id: 'multi-agent-routes', title: 'Multi Agent', path: '/docs/backend/routes/multiAgent' },
                    { id: 'pattern-routes', title: 'Pattern', path: '/docs/backend/routes/pattern' },
                    { id: 'routing-routes', title: 'Routing', path: '/docs/backend/routes/routing' },
                    { id: 'weather-routes', title: 'Weather', path: '/docs/backend/routes/weather' },
                ]
            },
            {
                id: 'backend-services', title: 'Services', path: '/docs/backend/services',
                children: [
                    { id: 'data-aggregator', title: 'Data Aggregator', path: '/docs/backend/services/dataAggregator' },
                    { id: 'fuseki-service', title: 'Fuseki Service', path: '/docs/backend/services/fusekiService' },
                    { id: 'generic-ngsi-service', title: 'Generic NGSI Service', path: '/docs/backend/services/genericNgsiService' },
                    { id: 'neo4j-service', title: 'Neo4j Service', path: '/docs/backend/services/neo4jService' },
                    { id: 'postgres-service', title: 'Postgres Service', path: '/docs/backend/services/postgresService' },
                    { id: 'stellio-service', title: 'Stellio Service', path: '/docs/backend/services/stellioService' },
                    { id: 'websocket-service', title: 'WebSocket Service', path: '/docs/backend/services/websocketService' },
                ]
            },
            {
                id: 'backend-types', title: 'Types', path: '/docs/backend/types',
                children: [
                    { id: 'backend-types-index', title: 'Types Index', path: '/docs/backend/types/index' },
                ]
            },
            {
                id: 'backend-utils', title: 'Utils', path: '/docs/backend/utils',
                children: [
                    { id: 'api-key-rotation', title: 'API Key Rotation', path: '/docs/backend/utils/apiKeyRotation' },
                    { id: 'health-check-util', title: 'Health Check', path: '/docs/backend/utils/healthCheck' },
                    { id: 'logger', title: 'Logger', path: '/docs/backend/utils/logger' },
                    { id: 'transformations', title: 'Transformations', path: '/docs/backend/utils/transformations' },
                    { id: 'validators', title: 'Validators', path: '/docs/backend/utils/validators' },
                ]
            },
        ],
    },
    {
        id: 'licenses',
        title: 'Licenses',
        path: '/docs/licenses',
        order: 15,
        children: [
            { id: 'licenses-overview', title: 'Overview', path: '/docs/licenses/overview' },
            { id: 'license-texts', title: 'License Texts', path: '/docs/licenses/license-texts' },
            { id: 'npm-dependencies', title: 'NPM Dependencies', path: '/docs/licenses/npm-dependencies' },
            { id: 'python-dependencies', title: 'Python Dependencies', path: '/docs/licenses/python-dependencies' },
            { id: 'special-notes', title: 'Special Notes', path: '/docs/licenses/special-notes' },
        ],
    },
];

// Map paths to markdown file imports
const docsMap: Record<string, () => Promise<string>> = {
    // Core docs
    '/docs': () => import('../../docs/docs/intro.md?raw').then(m => m.default),
    '/docs/quick-start': () => import('../../docs/docs/quick-start.md?raw').then(m => m.default),

    // Installation
    '/docs/installation/prerequisites': () => import('../../docs/docs/installation/prerequisites.md?raw').then(m => m.default),
    '/docs/installation/docker-setup': () => import('../../docs/docs/installation/docker-setup.md?raw').then(m => m.default),
    '/docs/installation/local-setup': () => import('../../docs/docs/installation/local-setup.md?raw').then(m => m.default),
    '/docs/installation/environment-config': () => import('../../docs/docs/installation/environment-config.md?raw').then(m => m.default),

    // Architecture
    '/docs/architecture/overview': () => import('../../docs/docs/architecture/overview.md?raw').then(m => m.default),

    // Agents - Overview & Reference
    '/docs/agents/overview': () => import('../../docs/docs/agents/overview.md?raw').then(m => m.default),
    '/docs/agents/complete-agents-reference': () => import('../../docs/docs/agents/complete-agents-reference.md?raw').then(m => m.default),

    // Agents - Analytics
    '/docs/agents/analytics/accident-detection': () => import('../../docs/docs/agents/analytics/accident-detection.md?raw').then(m => m.default),
    '/docs/agents/analytics/citizen-report': () => import('../../docs/docs/agents/analytics/citizen-report.md?raw').then(m => m.default),
    '/docs/agents/analytics/congestion-detection': () => import('../../docs/docs/agents/analytics/congestion-detection.md?raw').then(m => m.default),
    '/docs/agents/analytics/cv-analysis': () => import('../../docs/docs/agents/analytics/cv-analysis.md?raw').then(m => m.default),
    '/docs/agents/analytics/pattern-recognition': () => import('../../docs/docs/agents/analytics/pattern-recognition.md?raw').then(m => m.default),

    // Agents - Context Management
    '/docs/agents/context-management/entity-publisher': () => import('../../docs/docs/agents/context-management/entity-publisher.md?raw').then(m => m.default),
    '/docs/agents/context-management/state-updater': () => import('../../docs/docs/agents/context-management/state-updater.md?raw').then(m => m.default),
    '/docs/agents/context-management/stellio-state-query': () => import('../../docs/docs/agents/context-management/stellio-state-query.md?raw').then(m => m.default),
    '/docs/agents/context-management/temporal-data-manager': () => import('../../docs/docs/agents/context-management/temporal-data-manager.md?raw').then(m => m.default),

    // Agents - Data Collection
    '/docs/agents/data-collection/air-quality': () => import('../../docs/docs/agents/data-collection/air-quality.md?raw').then(m => m.default),
    '/docs/agents/data-collection/camera-image-fetch': () => import('../../docs/docs/agents/data-collection/camera-image-fetch.md?raw').then(m => m.default),
    '/docs/agents/data-collection/weather-integration': () => import('../../docs/docs/agents/data-collection/weather-integration.md?raw').then(m => m.default),
    '/docs/agents/data-collection/external-data-collector': () => import('../../docs/docs/agents/data-collection/external-data-collector.md?raw').then(m => m.default),
    '/docs/agents/data-collection/image-refresh': () => import('../../docs/docs/agents/data-collection/image-refresh.md?raw').then(m => m.default),

    // Agents - Notification
    '/docs/agents/notification/alert-dispatcher': () => import('../../docs/docs/agents/notification/alert-dispatcher.md?raw').then(m => m.default),
    '/docs/agents/notification/email-notification-handler': () => import('../../docs/docs/agents/notification/email-notification-handler.md?raw').then(m => m.default),
    '/docs/agents/notification/incident-report-generator': () => import('../../docs/docs/agents/notification/incident-report-generator.md?raw').then(m => m.default),
    '/docs/agents/notification/subscription-manager': () => import('../../docs/docs/agents/notification/subscription-manager.md?raw').then(m => m.default),
    '/docs/agents/notification/webhook-notification-handler': () => import('../../docs/docs/agents/notification/webhook-notification-handler.md?raw').then(m => m.default),

    // Agents - RDF & Linked Data
    '/docs/agents/rdf-linked-data/triplestore-loader': () => import('../../docs/docs/agents/rdf-linked-data/triplestore-loader.md?raw').then(m => m.default),
    '/docs/agents/rdf-linked-data/content-negotiation': () => import('../../docs/docs/agents/rdf-linked-data/content-negotiation.md?raw').then(m => m.default),
    '/docs/agents/rdf-linked-data/lod-linkset-enrichment': () => import('../../docs/docs/agents/rdf-linked-data/lod-linkset-enrichment.md?raw').then(m => m.default),
    '/docs/agents/rdf-linked-data/ngsi-ld-to-rdf': () => import('../../docs/docs/agents/rdf-linked-data/ngsi-ld-to-rdf.md?raw').then(m => m.default),
    '/docs/agents/rdf-linked-data/smart-data-models-validation': () => import('../../docs/docs/agents/rdf-linked-data/smart-data-models-validation.md?raw').then(m => m.default),

    // Agents - Transformation
    '/docs/agents/transformation/ngsi-ld-transformer': () => import('../../docs/docs/agents/transformation/ngsi-ld-transformer.md?raw').then(m => m.default),
    '/docs/agents/transformation/sosa-ssn-mapper': () => import('../../docs/docs/agents/transformation/sosa-ssn-mapper.md?raw').then(m => m.default),

    // Agents - State Management
    '/docs/agents/state-management/state-manager': () => import('../../docs/docs/agents/state-management/state-manager.md?raw').then(m => m.default),
    '/docs/agents/state-management/accident-state-manager': () => import('../../docs/docs/agents/state-management/accident-state-manager.md?raw').then(m => m.default),
    '/docs/agents/state-management/congestion-state-manager': () => import('../../docs/docs/agents/state-management/congestion-state-manager.md?raw').then(m => m.default),
    '/docs/agents/state-management/temporal-state-tracker': () => import('../../docs/docs/agents/state-management/temporal-state-tracker.md?raw').then(m => m.default),

    // Agents - Cache
    '/docs/agents/cache/cache-manager': () => import('../../docs/docs/agents/cache/cache-manager.md?raw').then(m => m.default),
    '/docs/agents/cache/cache-invalidator': () => import('../../docs/docs/agents/cache/cache-invalidator.md?raw').then(m => m.default),

    // Agents - Graph Database
    '/docs/agents/graph-database/neo4j-sync': () => import('../../docs/docs/agents/graph-database/neo4j-sync.md?raw').then(m => m.default),
    '/docs/agents/graph-database/neo4j-query': () => import('../../docs/docs/agents/graph-database/neo4j-query.md?raw').then(m => m.default),

    // Agents - Monitoring
    '/docs/agents/monitoring/health-check': () => import('../../docs/docs/agents/monitoring/health-check.md?raw').then(m => m.default),
    '/docs/agents/monitoring/performance-monitor': () => import('../../docs/docs/agents/monitoring/performance-monitor.md?raw').then(m => m.default),
    '/docs/agents/monitoring/data-quality-validator': () => import('../../docs/docs/agents/monitoring/data-quality-validator.md?raw').then(m => m.default),

    // Agents - Ingestion
    '/docs/agents/ingestion/citizen-ingestion': () => import('../../docs/docs/agents/ingestion/citizen-ingestion.md?raw').then(m => m.default),

    // Agents - Integration
    '/docs/agents/integration/api-gateway': () => import('../../docs/docs/agents/integration/api-gateway.md?raw').then(m => m.default),

    // Frontend - Overview & Reference
    '/docs/frontend/overview': () => import('../../docs/docs/frontend/overview.md?raw').then(m => m.default),
    '/docs/frontend/complete-components-reference': () => import('../../docs/docs/frontend/complete-components-reference.md?raw').then(m => m.default),

    // Frontend - Components
    '/docs/frontend/components/AnalyticsDashboard': () => import('../../docs/docs/frontend/components/AnalyticsDashboard.md?raw').then(m => m.default),
    '/docs/frontend/components/CitizenReportForm': () => import('../../docs/docs/frontend/components/CitizenReportForm.md?raw').then(m => m.default),
    '/docs/frontend/components/TrafficMap': () => import('../../docs/docs/frontend/components/TrafficMap.md?raw').then(m => m.default),
    '/docs/frontend/components/AccidentFrequencyChart': () => import('../../docs/docs/frontend/components/AccidentFrequencyChart.md?raw').then(m => m.default),
    '/docs/frontend/components/AccidentMarkers': () => import('../../docs/docs/frontend/components/AccidentMarkers.md?raw').then(m => m.default),
    '/docs/frontend/components/AQIHeatmap': () => import('../../docs/docs/frontend/components/AQIHeatmap.md?raw').then(m => m.default),
    '/docs/frontend/components/CameraDetailModal': () => import('../../docs/docs/frontend/components/CameraDetailModal.md?raw').then(m => m.default),
    '/docs/frontend/components/CircleDrawTool': () => import('../../docs/docs/frontend/components/CircleDrawTool.md?raw').then(m => m.default),
    '/docs/frontend/components/CitizenReportFilterPanel': () => import('../../docs/docs/frontend/components/CitizenReportFilterPanel.md?raw').then(m => m.default),
    '/docs/frontend/components/CitizenReportMap': () => import('../../docs/docs/frontend/components/CitizenReportMap.md?raw').then(m => m.default),
    '/docs/frontend/components/CitizenReportMarkers': () => import('../../docs/docs/frontend/components/CitizenReportMarkers.md?raw').then(m => m.default),
    '/docs/frontend/components/ConnectionStatus': () => import('../../docs/docs/frontend/components/ConnectionStatus.md?raw').then(m => m.default),
    '/docs/frontend/components/CorrelationLines': () => import('../../docs/docs/frontend/components/CorrelationLines.md?raw').then(m => m.default),
    '/docs/frontend/components/CorrelationPanel': () => import('../../docs/docs/frontend/components/CorrelationPanel.md?raw').then(m => m.default),
    '/docs/frontend/components/ErrorBoundary': () => import('../../docs/docs/frontend/components/ErrorBoundary.md?raw').then(m => m.default),
    '/docs/frontend/components/FilterPanel': () => import('../../docs/docs/frontend/components/FilterPanel.md?raw').then(m => m.default),
    '/docs/frontend/components/HistoricalViewBanner': () => import('../../docs/docs/frontend/components/HistoricalViewBanner.md?raw').then(m => m.default),
    '/docs/frontend/components/HumidityVisibilityLayer': () => import('../../docs/docs/frontend/components/HumidityVisibilityLayer.md?raw').then(m => m.default),
    '/docs/frontend/components/MapLegend': () => import('../../docs/docs/frontend/components/MapLegend.md?raw').then(m => m.default),
    '/docs/frontend/components/NotificationProvider': () => import('../../docs/docs/frontend/components/NotificationProvider.md?raw').then(m => m.default),
    '/docs/frontend/components/PatternZones': () => import('../../docs/docs/frontend/components/PatternZones.md?raw').then(m => m.default),
    '/docs/frontend/components/PollutantCircles': () => import('../../docs/docs/frontend/components/PollutantCircles.md?raw').then(m => m.default),
    '/docs/frontend/components/RoutePlanner': () => import('../../docs/docs/frontend/components/RoutePlanner.md?raw').then(m => m.default),
    '/docs/frontend/components/RouteVisualization': () => import('../../docs/docs/frontend/components/RouteVisualization.md?raw').then(m => m.default),
    '/docs/frontend/components/Sidebar': () => import('../../docs/docs/frontend/components/Sidebar.md?raw').then(m => m.default),
    '/docs/frontend/components/SimpleLegend': () => import('../../docs/docs/frontend/components/SimpleLegend.md?raw').then(m => m.default),
    '/docs/frontend/components/SpeedZones': () => import('../../docs/docs/frontend/components/SpeedZones.md?raw').then(m => m.default),
    '/docs/frontend/components/TimeMachine': () => import('../../docs/docs/frontend/components/TimeMachine.md?raw').then(m => m.default),
    '/docs/frontend/components/VehicleHeatmap': () => import('../../docs/docs/frontend/components/VehicleHeatmap.md?raw').then(m => m.default),
    '/docs/frontend/components/WeatherOverlay': () => import('../../docs/docs/frontend/components/WeatherOverlay.md?raw').then(m => m.default),

    // Frontend - Hooks
    '/docs/frontend/hooks/useWebSocket': () => import('../../docs/docs/frontend/hooks/useWebSocket.md?raw').then(m => m.default),

    // Frontend - Pages
    '/docs/frontend/pages/Dashboard': () => import('../../docs/docs/frontend/pages/Dashboard.md?raw').then(m => m.default),
    '/docs/frontend/pages/DocsPage': () => import('../../docs/docs/frontend/pages/DocsPage.md?raw').then(m => m.default),
    '/docs/frontend/pages/LandingPage': () => import('../../docs/docs/frontend/pages/LandingPage.md?raw').then(m => m.default),

    // Frontend - Services
    '/docs/frontend/services/api': () => import('../../docs/docs/frontend/services/api.md?raw').then(m => m.default),
    '/docs/frontend/services/citizenReportService': () => import('../../docs/docs/frontend/services/citizenReportService.md?raw').then(m => m.default),
    '/docs/frontend/services/docsService': () => import('../../docs/docs/frontend/services/docsService.md?raw').then(m => m.default),
    '/docs/frontend/services/websocket': () => import('../../docs/docs/frontend/services/websocket.md?raw').then(m => m.default),

    // Frontend - Store
    '/docs/frontend/store/trafficStore': () => import('../../docs/docs/frontend/store/trafficStore.md?raw').then(m => m.default),

    // Frontend - Types
    '/docs/frontend/types/citizenReport': () => import('../../docs/docs/frontend/types/citizenReport.md?raw').then(m => m.default),
    '/docs/frontend/types/index': () => import('../../docs/docs/frontend/types/index.md?raw').then(m => m.default),

    // API
    '/docs/api/complete-api-reference': () => import('../../docs/docs/api/complete-api-reference.md?raw').then(m => m.default),
    '/docs/api/rest-api': () => import('../../docs/docs/api/rest-api.md?raw').then(m => m.default),
    '/docs/api/websocket': () => import('../../docs/docs/api/websocket.md?raw').then(m => m.default),

    // Data Models
    '/docs/data-models/complete-standards': () => import('../../docs/docs/data-models/complete-standards.md?raw').then(m => m.default),

    // DevOps
    '/docs/devops/complete-devops-guide': () => import('../../docs/docs/devops/complete-devops-guide.md?raw').then(m => m.default),

    // Testing
    '/docs/testing/complete-testing-guide': () => import('../../docs/docs/testing/complete-testing-guide.md?raw').then(m => m.default),

    // Guides
    '/docs/guides/development': () => import('../../docs/docs/guides/development.md?raw').then(m => m.default),
    '/docs/guides/deployment': () => import('../../docs/docs/guides/deployment.md?raw').then(m => m.default),
    '/docs/guides/contributing': () => import('../../docs/docs/guides/contributing.md?raw').then(m => m.default),
    '/docs/guides/troubleshooting': () => import('../../docs/docs/guides/troubleshooting.md?raw').then(m => m.default),

    // Tutorial Basics
    '/docs/tutorial-basics/create-a-page': () => import('../../docs/docs/tutorial-basics/create-a-page.md?raw').then(m => m.default),
    '/docs/tutorial-basics/create-a-document': () => import('../../docs/docs/tutorial-basics/create-a-document.md?raw').then(m => m.default),
    '/docs/tutorial-basics/create-a-blog-post': () => import('../../docs/docs/tutorial-basics/create-a-blog-post.md?raw').then(m => m.default),
    '/docs/tutorial-basics/markdown-features': () => import('../../docs/docs/tutorial-basics/markdown-features.mdx?raw').then(m => m.default),
    '/docs/tutorial-basics/deploy-your-site': () => import('../../docs/docs/tutorial-basics/deploy-your-site.md?raw').then(m => m.default),
    '/docs/tutorial-basics/congratulations': () => import('../../docs/docs/tutorial-basics/congratulations.md?raw').then(m => m.default),

    // Tutorial Extras
    '/docs/tutorial-extras/manage-docs-versions': () => import('../../docs/docs/tutorial-extras/manage-docs-versions.md?raw').then(m => m.default),
    '/docs/tutorial-extras/translate-your-site': () => import('../../docs/docs/tutorial-extras/translate-your-site.md?raw').then(m => m.default),

    // Backend - Overview
    '/docs/backend/overview': () => import('../../docs/docs/backend/overview.md?raw').then(m => m.default),

    // Backend - Agents
    '/docs/backend/agents/EcoTwinAgent': () => import('../../docs/docs/backend/agents/EcoTwinAgent.md?raw').then(m => m.default),
    '/docs/backend/agents/GraphInvestigatorAgent': () => import('../../docs/docs/backend/agents/GraphInvestigatorAgent.md?raw').then(m => m.default),
    '/docs/backend/agents/TrafficMaestroAgent': () => import('../../docs/docs/backend/agents/TrafficMaestroAgent.md?raw').then(m => m.default),

    // Backend - Config
    '/docs/backend/config/configLoader': () => import('../../docs/docs/backend/config/configLoader.md?raw').then(m => m.default),

    // Backend - Middlewares
    '/docs/backend/middlewares/errorHandler': () => import('../../docs/docs/backend/middlewares/errorHandler.md?raw').then(m => m.default),

    // Backend - Routes
    '/docs/backend/routes/overview': () => import('../../docs/docs/backend/routes/overview.md?raw').then(m => m.default),
    '/docs/backend/routes/accident': () => import('../../docs/docs/backend/routes/accident.md?raw').then(m => m.default),
    '/docs/backend/routes/agent': () => import('../../docs/docs/backend/routes/agent.md?raw').then(m => m.default),
    '/docs/backend/routes/airQuality': () => import('../../docs/docs/backend/routes/airQuality.md?raw').then(m => m.default),
    '/docs/backend/routes/analytics': () => import('../../docs/docs/backend/routes/analytics.md?raw').then(m => m.default),
    '/docs/backend/routes/camera': () => import('../../docs/docs/backend/routes/camera.md?raw').then(m => m.default),
    '/docs/backend/routes/correlation': () => import('../../docs/docs/backend/routes/correlation.md?raw').then(m => m.default),
    '/docs/backend/routes/geocoding': () => import('../../docs/docs/backend/routes/geocoding.md?raw').then(m => m.default),
    '/docs/backend/routes/historical': () => import('../../docs/docs/backend/routes/historical.md?raw').then(m => m.default),
    '/docs/backend/routes/multiAgent': () => import('../../docs/docs/backend/routes/multiAgent.md?raw').then(m => m.default),
    '/docs/backend/routes/pattern': () => import('../../docs/docs/backend/routes/pattern.md?raw').then(m => m.default),
    '/docs/backend/routes/routing': () => import('../../docs/docs/backend/routes/routing.md?raw').then(m => m.default),
    '/docs/backend/routes/weather': () => import('../../docs/docs/backend/routes/weather.md?raw').then(m => m.default),

    // Backend - Services
    '/docs/backend/services/dataAggregator': () => import('../../docs/docs/backend/services/dataAggregator.md?raw').then(m => m.default),
    '/docs/backend/services/fusekiService': () => import('../../docs/docs/backend/services/fusekiService.md?raw').then(m => m.default),
    '/docs/backend/services/genericNgsiService': () => import('../../docs/docs/backend/services/genericNgsiService.md?raw').then(m => m.default),
    '/docs/backend/services/neo4jService': () => import('../../docs/docs/backend/services/neo4jService.md?raw').then(m => m.default),
    '/docs/backend/services/postgresService': () => import('../../docs/docs/backend/services/postgresService.md?raw').then(m => m.default),
    '/docs/backend/services/stellioService': () => import('../../docs/docs/backend/services/stellioService.md?raw').then(m => m.default),
    '/docs/backend/services/websocketService': () => import('../../docs/docs/backend/services/websocketService.md?raw').then(m => m.default),

    // Backend - Types
    '/docs/backend/types/index': () => import('../../docs/docs/backend/types/index.md?raw').then(m => m.default),

    // Backend - Utils
    '/docs/backend/utils/apiKeyRotation': () => import('../../docs/docs/backend/utils/apiKeyRotation.md?raw').then(m => m.default),
    '/docs/backend/utils/healthCheck': () => import('../../docs/docs/backend/utils/healthCheck.md?raw').then(m => m.default),
    '/docs/backend/utils/logger': () => import('../../docs/docs/backend/utils/logger.md?raw').then(m => m.default),
    '/docs/backend/utils/transformations': () => import('../../docs/docs/backend/utils/transformations.md?raw').then(m => m.default),
    '/docs/backend/utils/validators': () => import('../../docs/docs/backend/utils/validators.md?raw').then(m => m.default),

    // Licenses
    '/docs/licenses/overview': () => import('../../docs/docs/licenses/overview.md?raw').then(m => m.default),
    '/docs/licenses/license-texts': () => import('../../docs/docs/licenses/license-texts.md?raw').then(m => m.default),
    '/docs/licenses/npm-dependencies': () => import('../../docs/docs/licenses/npm-dependencies.md?raw').then(m => m.default),
    '/docs/licenses/python-dependencies': () => import('../../docs/docs/licenses/python-dependencies.md?raw').then(m => m.default),
    '/docs/licenses/special-notes': () => import('../../docs/docs/licenses/special-notes.md?raw').then(m => m.default),
};

/**
 * Parse frontmatter from markdown content
 * Handles various frontmatter formats including those with special characters
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; content: string } {
    // Trim content first to handle any leading whitespace
    const trimmedContent = content.trim();

    // Match frontmatter block - must start at beginning of content
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
    const match = trimmedContent.match(frontmatterRegex);

    if (match) {
        const frontmatterStr = match[1];
        const frontmatter: Record<string, unknown> = {};

        frontmatterStr.split(/\r?\n/).forEach(line => {
            // Skip empty lines
            if (!line.trim()) return;

            // Find the first colon to split key and value
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                if (key) {
                    frontmatter[key] = value;
                }
            }
        });

        return {
            frontmatter,
            content: trimmedContent.replace(frontmatterRegex, '').trim(),
        };
    }

    return { frontmatter: {}, content: trimmedContent };
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string, frontmatter: Record<string, unknown>): string {
    if (frontmatter.title) {
        return String(frontmatter.title);
    }

    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
        return h1Match[1];
    }

    return 'Documentation';
}

/**
 * Load documentation content by path
 */
export async function loadDocContent(path: string): Promise<DocContent | null> {
    const loader = docsMap[path];

    if (!loader) {
        console.warn(`No documentation found for path: ${path}`);
        return null;
    }

    try {
        const rawContent = await loader();
        const { frontmatter, content } = parseFrontmatter(rawContent);
        const title = extractTitle(content, frontmatter);

        return {
            title,
            content,
            frontmatter,
        };
    } catch (error) {
        console.error(`Error loading doc content for ${path}:`, error);
        return null;
    }
}

/**
 * Get breadcrumb trail for a doc path
 */
export function getBreadcrumbs(path: string): { title: string; path: string }[] {
    const breadcrumbs: { title: string; path: string }[] = [
        { title: 'Docs', path: '/docs' },
    ];

    const findInNav = (items: DocItem[], targetPath: string, trail: { title: string; path: string }[] = []): { title: string; path: string }[] | null => {
        for (const item of items) {
            if (item.path === targetPath) {
                return [...trail, { title: item.title, path: item.path }];
            }
            if (item.children) {
                const result = findInNav(item.children, targetPath, [...trail, { title: item.title, path: item.path }]);
                if (result) return result;
            }
        }
        return null;
    };

    const trail = findInNav(docsNavigation, path);
    if (trail && trail.length > 0) {
        return [...breadcrumbs, ...trail.slice(1)]; // Skip first since we already have Docs
    }

    return breadcrumbs;
}

/**
 * Check if a path has actual content (exists in docsMap)
 */
export function hasDocContent(path: string): boolean {
    return path in docsMap;
}

/**
 * Get previous and next doc for navigation
 * Only returns docs that have actual content (exist in docsMap)
 */
export function getPrevNextDocs(currentPath: string): { prev: DocItem | null; next: DocItem | null } {
    const flatDocs: DocItem[] = [];

    const flatten = (items: DocItem[]) => {
        items.forEach(item => {
            // Only include items that have actual content
            if (hasDocContent(item.path)) {
                flatDocs.push(item);
            }
            if (item.children) {
                flatten(item.children);
            }
        });
    };

    flatten(docsNavigation);

    const currentIndex = flatDocs.findIndex(d => d.path === currentPath);

    return {
        prev: currentIndex > 0 ? flatDocs[currentIndex - 1] : null,
        next: currentIndex < flatDocs.length - 1 ? flatDocs[currentIndex + 1] : null,
    };
}
