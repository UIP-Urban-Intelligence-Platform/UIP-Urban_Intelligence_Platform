/**
 * @file sidebars.ts
 * @module apps/traffic-web-app/frontend/docs/sidebars
 * @author Nguyễn Nhật Quang <nguyennhatquang522004@gmail.com>
 * @created 2025-11-20
 * @version 1.0.0
 * @license MIT
 * @description Sidebar configuration for Docusaurus documentation site
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 */

import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
    tutorialSidebar: [
        'intro',
        'quick-start',
        {
            type: 'category',
            label: '📦 Installation',
            items: [
                'installation/prerequisites',
                'installation/docker-setup',
                'installation/local-setup',
                'installation/environment-config',
            ],
        },
        {
            type: 'category',
            label: '🏗️ Architecture',
            link: {
                type: 'doc',
                id: 'architecture/overview',
            },
            items: [
                'architecture/overview',
            ],
        },
        {
            type: 'category',
            label: '🤖 Agent System',
            collapsed: false,
            link: {
                type: 'doc',
                id: 'agents/overview',
            },
            items: [
                'agents/overview',
                'agents/complete-agents-reference',
                {
                    type: 'category',
                    label: 'Analytics Agents',
                    items: [
                        'agents/analytics/accident-detection',
                        'agents/analytics/congestion-detection',
                        'agents/analytics/cv-analysis',
                        'agents/analytics/pattern-recognition',
                        'agents/analytics/citizen-report',
                    ],
                },
                {
                    type: 'category',
                    label: 'Data Collection Agents',
                    items: [
                        'agents/data-collection/camera-image-fetch',
                        'agents/data-collection/weather-integration',
                        'agents/data-collection/air-quality',
                        'agents/data-collection/external-data-collector',
                        'agents/data-collection/image-refresh',
                    ],
                },
                {
                    type: 'category',
                    label: 'Transformation Agents',
                    items: [
                        'agents/transformation/ngsi-ld-transformer',
                        'agents/transformation/sosa-ssn-mapper',
                    ],
                },
                {
                    type: 'category',
                    label: 'RDF & Linked Data Agents',
                    items: [
                        'agents/rdf-linked-data/triplestore-loader',
                        'agents/rdf-linked-data/content-negotiation',
                        'agents/rdf-linked-data/lod-linkset-enrichment',
                        'agents/rdf-linked-data/ngsi-ld-to-rdf',
                        'agents/rdf-linked-data/smart-data-models-validation',
                    ],
                },
                {
                    type: 'category',
                    label: 'Context Management Agents',
                    items: [
                        'agents/context-management/entity-publisher',
                        'agents/context-management/state-updater',
                        'agents/context-management/stellio-state-query',
                        'agents/context-management/temporal-data-manager',
                    ],
                },
                {
                    type: 'category',
                    label: 'State Management Agents',
                    items: [
                        'agents/state-management/state-manager',
                        'agents/state-management/accident-state-manager',
                        'agents/state-management/congestion-state-manager',
                        'agents/state-management/temporal-state-tracker',
                    ],
                },
                {
                    type: 'category',
                    label: 'Cache Agents',
                    items: [
                        'agents/cache/cache-manager',
                        'agents/cache/cache-invalidator',
                    ],
                },
                {
                    type: 'category',
                    label: 'Graph Database Agents',
                    items: [
                        'agents/graph-database/neo4j-sync',
                        'agents/graph-database/neo4j-query',
                    ],
                },
                {
                    type: 'category',
                    label: 'Monitoring Agents',
                    items: [
                        'agents/monitoring/health-check',
                        'agents/monitoring/performance-monitor',
                        'agents/monitoring/data-quality-validator',
                    ],
                },
                {
                    type: 'category',
                    label: 'Ingestion Agents',
                    items: [
                        'agents/ingestion/citizen-ingestion',
                    ],
                },
                {
                    type: 'category',
                    label: 'Integration Agents',
                    items: [
                        'agents/integration/api-gateway',
                    ],
                },
                {
                    type: 'category',
                    label: 'Notification Agents',
                    items: [
                        'agents/notification/alert-dispatcher',
                        'agents/notification/email-notification-handler',
                        'agents/notification/incident-report-generator',
                        'agents/notification/subscription-manager',
                        'agents/notification/webhook-notification-handler',
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: '🎨 Frontend Components',
            collapsed: false,
            link: {
                type: 'doc',
                id: 'frontend/overview',
            },
            items: [
                'frontend/overview',
                'frontend/complete-components-reference',
                {
                    type: 'category',
                    label: 'Core Components',
                    items: [
                        'frontend/components/TrafficMap',
                        'frontend/components/AnalyticsDashboard',
                        'frontend/components/CitizenReportForm',
                        'frontend/components/Sidebar',
                        'frontend/components/ErrorBoundary',
                        'frontend/components/NotificationProvider',
                        'frontend/components/ConnectionStatus',
                    ],
                },
                {
                    type: 'category',
                    label: 'Map Components',
                    items: [
                        'frontend/components/AccidentMarkers',
                        'frontend/components/CitizenReportMarkers',
                        'frontend/components/CitizenReportMap',
                        'frontend/components/CitizenReportFilterPanel',
                        'frontend/components/AQIHeatmap',
                        'frontend/components/VehicleHeatmap',
                        'frontend/components/SpeedZones',
                        'frontend/components/PatternZones',
                        'frontend/components/CorrelationLines',
                        'frontend/components/PollutantCircles',
                        'frontend/components/HumidityVisibilityLayer',
                        'frontend/components/WeatherOverlay',
                        'frontend/components/MapLegend',
                        'frontend/components/SimpleLegend',
                        'frontend/components/CircleDrawTool',
                    ],
                },
                {
                    type: 'category',
                    label: 'UI Components',
                    items: [
                        'frontend/components/CameraDetailModal',
                        'frontend/components/FilterPanel',
                        'frontend/components/CorrelationPanel',
                        'frontend/components/HistoricalViewBanner',
                        'frontend/components/TimeMachine',
                        'frontend/components/AccidentFrequencyChart',
                    ],
                },
                {
                    type: 'category',
                    label: 'Route Components',
                    items: [
                        'frontend/components/RoutePlanner',
                        'frontend/components/RouteVisualization',
                    ],
                },
                {
                    type: 'category',
                    label: 'Hooks',
                    items: [
                        'frontend/hooks/useWebSocket',
                    ],
                },
                {
                    type: 'category',
                    label: 'Pages',
                    items: [
                        'frontend/pages/Dashboard',
                        'frontend/pages/DocsPage',
                        'frontend/pages/LandingPage',
                    ],
                },
                {
                    type: 'category',
                    label: 'Services',
                    items: [
                        'frontend/services/api',
                        'frontend/services/citizenReportService',
                        'frontend/services/docsService',
                        'frontend/services/websocket',
                    ],
                },
                {
                    type: 'category',
                    label: 'Store',
                    items: [
                        'frontend/store/trafficStore',
                    ],
                },
                {
                    type: 'category',
                    label: 'Types',
                    items: [
                        'frontend/types/index',
                        'frontend/types/citizenReport',
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: '⚙️ Backend',
            collapsed: false,
            link: {
                type: 'doc',
                id: 'backend/overview',
            },
            items: [
                'backend/overview',
                {
                    type: 'category',
                    label: 'Agents',
                    items: [
                        'backend/agents/EcoTwinAgent',
                        'backend/agents/GraphInvestigatorAgent',
                        'backend/agents/TrafficMaestroAgent',
                    ],
                },
                {
                    type: 'category',
                    label: 'Routes',
                    items: [
                        'backend/routes/routes-overview',
                        'backend/routes/accident-routes',
                        'backend/routes/agent-routes',
                        'backend/routes/air-quality-routes',
                        'backend/routes/analytics-routes',
                        'backend/routes/camera-routes',
                        'backend/routes/correlation-routes',
                        'backend/routes/geocoding-routes',
                        'backend/routes/historical-routes',
                        'backend/routes/multi-agent-routes',
                        'backend/routes/pattern-routes',
                        'backend/routes/routing-routes',
                        'backend/routes/weather-routes',
                    ],
                },
                {
                    type: 'category',
                    label: 'Services',
                    items: [
                        'backend/services/data-aggregator',
                        'backend/services/fuseki-service',
                        'backend/services/generic-ngsi-service',
                        'backend/services/neo4j-service',
                        'backend/services/postgres-service',
                        'backend/services/stellio-service',
                        'backend/services/websocket-service',
                    ],
                },
                {
                    type: 'category',
                    label: 'Config',
                    items: [
                        'backend/config/config-loader',
                    ],
                },
                {
                    type: 'category',
                    label: 'Middlewares',
                    items: [
                        'backend/middlewares/error-handler',
                    ],
                },
                {
                    type: 'category',
                    label: 'Utils',
                    items: [
                        'backend/utils/api-key-rotation',
                        'backend/utils/health-check',
                        'backend/utils/logger',
                        'backend/utils/transformations',
                        'backend/utils/validators',
                    ],
                },
                {
                    type: 'category',
                    label: 'Types',
                    items: [
                        'backend/types/types-index',
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: '📡 API Documentation',
            collapsed: false,
            items: [
                'api/complete-api-reference',
                'api/rest-api',
                'api/websocket',
            ],
        },
        {
            type: 'category',
            label: '📊 Data Models & Standards',
            collapsed: false,
            items: [
                'data-models/complete-standards',
            ],
        },
        {
            type: 'category',
            label: '🚀 DevOps & Deployment',
            collapsed: false,
            items: [
                'devops/complete-devops-guide',
            ],
        },
        {
            type: 'category',
            label: '🧪 Testing & Quality',
            collapsed: false,
            items: [
                'testing/complete-testing-guide',
            ],
        },
        {
            type: 'category',
            label: '📄 Licenses',
            collapsed: true,
            items: [
                'third-party-deps/overview',
                'third-party-deps/dependency-texts',
                'third-party-deps/npm-dependencies',
                'third-party-deps/python-dependencies',
                'third-party-deps/special-notes',
            ],
        },
        {
            type: 'category',
            label: '📖 Guides',
            collapsed: false,
            items: [
                'guides/contributing',
                'guides/development',
                'guides/deployment',
                'guides/troubleshooting',
            ],
        },
        {
            type: 'category',
            label: '📚 Tutorial - Basics',
            items: [
                'tutorial-basics/create-a-page',
                'tutorial-basics/create-a-document',
                'tutorial-basics/create-a-blog-post',
                'tutorial-basics/markdown-features',
                'tutorial-basics/deploy-your-site',
                'tutorial-basics/congratulations',
            ],
        },
        {
            type: 'category',
            label: '📚 Tutorial - Extras',
            items: [
                'tutorial-extras/manage-docs-versions',
                'tutorial-extras/translate-your-site',
            ],
        },
    ],

    // Architecture Sidebar
    architectureSidebar: [
        'architecture/overview',
        'agents/overview',
        'frontend/overview',
        'data-models/complete-standards',
    ],

    // API Sidebar  
    apiSidebar: [
        'api/complete-api-reference',
        'api/rest-api',
        'api/websocket',
    ],
};

export default sidebars;
