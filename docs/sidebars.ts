/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * @module docs/sidebars
 * @description Sidebar configuration for HCMC Traffic Monitoring System documentation
 */

import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
    tutorialSidebar: [
        'intro',
        'quick-start',
        {
            type: 'category',
            label: 'Installation',
            items: [
                'installation/prerequisites',
                'installation/local-setup',
                'installation/docker-setup',
                'installation/environment-config',
            ],
        },
        {
            type: 'category',
            label: 'Architecture',
            link: {
                type: 'doc',
                id: 'architecture/overview',
            },
            items: [
                'architecture/system-design',
                'architecture/data-flow',
                'architecture/tech-stack',
                'architecture/deployment',
            ],
        },
        {
            type: 'category',
            label: 'Python Backend',
            link: {
                type: 'doc',
                id: 'backend/overview',
            },
            items: [
                'backend/orchestrator',
                'backend/main-entry',
                'backend/configuration',
                'backend/logging',
            ],
        },
        {
            type: 'category',
            label: 'Agent System',
            link: {
                type: 'doc',
                id: 'agents/overview',
            },
            items: [
                {
                    type: 'category',
                    label: 'Data Collection',
                    items: [
                        'agents/data-collection/camera-image-fetch',
                        'agents/data-collection/weather-integration',
                        'agents/data-collection/air-quality',
                    ],
                },
                {
                    type: 'category',
                    label: 'Ingestion',
                    items: [
                        'agents/ingestion/citizen-ingestion',
                        'agents/ingestion/real-time-stream',
                    ],
                },
                {
                    type: 'category',
                    label: 'Analytics',
                    items: [
                        'agents/analytics/accident-detection',
                        'agents/analytics/pattern-recognition',
                        'agents/analytics/congestion-analysis',
                    ],
                },
                {
                    type: 'category',
                    label: 'Transformation',
                    items: [
                        'agents/transformation/ngsi-ld-transformer',
                        'agents/transformation/sosa-ssn-mapper',
                    ],
                },
                {
                    type: 'category',
                    label: 'Context Management',
                    items: [
                        'agents/context-management/entity-publisher',
                        'agents/context-management/stellio-state-query',
                        'agents/context-management/temporal-data-manager',
                        'agents/context-management/state-updater',
                    ],
                },
                {
                    type: 'category',
                    label: 'RDF & Linked Data',
                    items: [
                        'agents/rdf/ngsi-ld-to-rdf',
                        'agents/rdf/triplestore-loader',
                        'agents/rdf/lod-linkset-enrichment',
                        'agents/rdf/content-negotiation',
                        'agents/rdf/smart-data-models-validation',
                    ],
                },
                {
                    type: 'category',
                    label: 'Graph Database',
                    items: [
                        'agents/graph/neo4j-sync',
                        'agents/graph/neo4j-query',
                    ],
                },
                {
                    type: 'category',
                    label: 'Integration',
                    items: [
                        'agents/integration/api-gateway',
                        'agents/integration/cache-manager',
                    ],
                },
                {
                    type: 'category',
                    label: 'Monitoring',
                    items: [
                        'agents/monitoring/health-check',
                        'agents/monitoring/performance-monitor',
                        'agents/monitoring/data-quality-validator',
                    ],
                },
                {
                    type: 'category',
                    label: 'State Management',
                    items: [
                        'agents/state/state-manager',
                        'agents/state/accident-state-manager',
                        'agents/state/congestion-state-manager',
                        'agents/state/temporal-state-tracker',
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: 'Frontend (React)',
            link: {
                type: 'doc',
                id: 'frontend/overview',
            },
            items: [
                'frontend/architecture',
                'frontend/setup',
                {
                    type: 'category',
                    label: 'Core Components',
                    items: [
                        'frontend/components/traffic-map',
                        'frontend/components/sidebar',
                        'frontend/components/filter-panel',
                    ],
                },
                {
                    type: 'category',
                    label: 'Map Layers',
                    items: [
                        'frontend/layers/camera-markers',
                        'frontend/layers/accident-markers',
                        'frontend/layers/weather-overlay',
                        'frontend/layers/aqi-heatmap',
                        'frontend/layers/vehicle-heatmap',
                        'frontend/layers/speed-zones',
                        'frontend/layers/pattern-zones',
                    ],
                },
                {
                    type: 'category',
                    label: 'Advanced Features',
                    items: [
                        'frontend/features/analytics-dashboard',
                        'frontend/features/route-planner',
                        'frontend/features/time-machine',
                        'frontend/features/correlation-panel',
                        'frontend/features/citizen-reports',
                    ],
                },
                {
                    type: 'category',
                    label: 'AI Agent UI',
                    items: [
                        'frontend/agents/investigator-panel',
                        'frontend/agents/predictive-timeline',
                        'frontend/agents/health-advisor-chat',
                    ],
                },
                'frontend/state-management',
                'frontend/websocket',
                'frontend/api-integration',
            ],
        },
        {
            type: 'category',
            label: 'Node.js Backend',
            items: [
                'nodejs-backend/server',
                'nodejs-backend/routes',
                'nodejs-backend/services',
                'nodejs-backend/middleware',
            ],
        },
        {
            type: 'category',
            label: 'Data Models',
            items: [
                'data-models/ngsi-ld',
                'data-models/sosa-ssn',
                'data-models/smart-data-models',
                'data-models/rdf-vocabularies',
            ],
        },
        {
            type: 'category',
            label: 'DevOps',
            items: [
                'devops/docker-compose',
                'devops/justrun-automation',
                'devops/ci-cd',
                'devops/monitoring',
            ],
        },
        {
            type: 'category',
            label: 'Testing',
            items: [
                'testing/unit-tests',
                'testing/integration-tests',
                'testing/e2e-tests',
            ],
        },
        {
            type: 'category',
            label: 'Guides',
            items: [
                'guides/adding-new-agent',
                'guides/custom-data-source',
                'guides/frontend-customization',
                'guides/troubleshooting',
            ],
        },
    ],

    apiSidebar: [
        {
            type: 'category',
            label: 'REST API',
            items: [
                'api/overview',
                'api/authentication',
                {
                    type: 'category',
                    label: 'Endpoints',
                    items: [
                        'api/endpoints/cameras',
                        'api/endpoints/accidents',
                        'api/endpoints/weather',
                        'api/endpoints/air-quality',
                        'api/endpoints/traffic-flow',
                        'api/endpoints/citizen-reports',
                        'api/endpoints/analytics',
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: 'WebSocket API',
            items: [
                'api/websocket/connection',
                'api/websocket/events',
                'api/websocket/subscriptions',
            ],
        },
        {
            type: 'category',
            label: 'SPARQL Queries',
            items: [
                'api/sparql/fuseki',
                'api/sparql/examples',
            ],
        },
    ],

    architectureSidebar: [
        'architecture/overview',
        'architecture/system-design',
        'architecture/data-flow',
        'architecture/tech-stack',
        {
            type: 'category',
            label: 'Infrastructure',
            items: [
                'architecture/infrastructure/neo4j',
                'architecture/infrastructure/fuseki',
                'architecture/infrastructure/stellio',
                'architecture/infrastructure/mongodb',
                'architecture/infrastructure/timescaledb',
                'architecture/infrastructure/redis',
                'architecture/infrastructure/kafka',
            ],
        },
        'architecture/deployment',
        'architecture/scalability',
        'architecture/security',
    ],
};

export default sidebars;
