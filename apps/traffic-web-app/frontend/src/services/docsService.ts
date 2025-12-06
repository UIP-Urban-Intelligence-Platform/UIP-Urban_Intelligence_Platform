/**
 * Documentation Service - Markdown Content Loader
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
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
        title: 'Giới thiệu',
        path: '/docs',
        order: 1,
    },
    {
        id: 'quick-start',
        title: 'Bắt đầu nhanh',
        path: '/docs/quick-start',
        order: 2,
    },
    {
        id: 'installation',
        title: 'Cài đặt',
        path: '/docs/installation',
        order: 3,
        children: [
            { id: 'prerequisites', title: 'Yêu cầu hệ thống', path: '/docs/installation/prerequisites' },
        ],
    },
    {
        id: 'architecture',
        title: 'Kiến trúc hệ thống',
        path: '/docs/architecture',
        order: 4,
        children: [
            { id: 'architecture-overview', title: 'Tổng quan', path: '/docs/architecture/overview' },
        ],
    },
    {
        id: 'agents',
        title: 'Hệ thống Agent',
        path: '/docs/agents',
        order: 5,
        children: [
            { id: 'agents-overview', title: 'Tổng quan Agent', path: '/docs/agents/overview' },
            { id: 'agents-reference', title: 'Tham khảo đầy đủ', path: '/docs/agents/complete-agents-reference' },
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
                ]
            },
            {
                id: 'agents-data', title: 'Data Collection', path: '/docs/agents/data-collection',
                children: [
                    { id: 'air-quality', title: 'Air Quality', path: '/docs/agents/data-collection/air-quality' },
                    { id: 'camera-image-fetch', title: 'Camera Image Fetch', path: '/docs/agents/data-collection/camera-image-fetch' },
                    { id: 'weather-integration', title: 'Weather Integration', path: '/docs/agents/data-collection/weather-integration' },
                ]
            },
            {
                id: 'agents-notification', title: 'Notification', path: '/docs/agents/notification',
                children: [
                    { id: 'alert-dispatcher', title: 'Alert Dispatcher', path: '/docs/agents/notification/alert-dispatcher' },
                ]
            },
            {
                id: 'agents-rdf', title: 'RDF & Linked Data', path: '/docs/agents/rdf-linked-data',
                children: [
                    { id: 'triplestore-loader', title: 'Triplestore Loader', path: '/docs/agents/rdf-linked-data/triplestore-loader' },
                ]
            },
            {
                id: 'agents-transformation', title: 'Transformation', path: '/docs/agents/transformation',
                children: [
                    { id: 'ngsi-ld-transformer', title: 'NGSI-LD Transformer', path: '/docs/agents/transformation/ngsi-ld-transformer' },
                    { id: 'sosa-ssn-mapper', title: 'SOSA/SSN Mapper', path: '/docs/agents/transformation/sosa-ssn-mapper' },
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
            { id: 'frontend-overview', title: 'Tổng quan', path: '/docs/frontend/overview' },
            { id: 'components-reference', title: 'Tham khảo Components', path: '/docs/frontend/complete-components-reference' },
            {
                id: 'frontend-components', title: 'Components', path: '/docs/frontend/components',
                children: [
                    { id: 'analytics-dashboard', title: 'Analytics Dashboard', path: '/docs/frontend/components/AnalyticsDashboard' },
                    { id: 'citizen-report-form', title: 'Citizen Report Form', path: '/docs/frontend/components/CitizenReportForm' },
                    { id: 'traffic-map', title: 'Traffic Map', path: '/docs/frontend/components/TrafficMap' },
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
            { id: 'devops-guide', title: 'Hướng dẫn DevOps', path: '/docs/devops/complete-devops-guide' },
        ],
    },
    {
        id: 'testing',
        title: 'Testing',
        path: '/docs/testing',
        order: 10,
        children: [
            { id: 'testing-guide', title: 'Hướng dẫn Testing', path: '/docs/testing/complete-testing-guide' },
        ],
    },
    {
        id: 'guides',
        title: 'Hướng dẫn',
        path: '/docs/guides',
        order: 11,
        children: [
            { id: 'development', title: 'Development', path: '/docs/guides/development' },
            { id: 'deployment', title: 'Deployment', path: '/docs/guides/deployment' },
            { id: 'contributing', title: 'Contributing', path: '/docs/guides/contributing' },
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
];

// Map paths to markdown file imports
const docsMap: Record<string, () => Promise<string>> = {
    // Core docs
    '/docs': () => import('../../docs/docs/intro.md?raw').then(m => m.default),
    '/docs/quick-start': () => import('../../docs/docs/quick-start.md?raw').then(m => m.default),
    '/docs/installation/prerequisites': () => import('../../docs/docs/installation/prerequisites.md?raw').then(m => m.default),
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

    // Agents - Data Collection
    '/docs/agents/data-collection/air-quality': () => import('../../docs/docs/agents/data-collection/air-quality.md?raw').then(m => m.default),
    '/docs/agents/data-collection/camera-image-fetch': () => import('../../docs/docs/agents/data-collection/camera-image-fetch.md?raw').then(m => m.default),
    '/docs/agents/data-collection/weather-integration': () => import('../../docs/docs/agents/data-collection/weather-integration.md?raw').then(m => m.default),

    // Agents - Notification
    '/docs/agents/notification/alert-dispatcher': () => import('../../docs/docs/agents/notification/alert-dispatcher.md?raw').then(m => m.default),

    // Agents - RDF & Linked Data
    '/docs/agents/rdf-linked-data/triplestore-loader': () => import('../../docs/docs/agents/rdf-linked-data/triplestore-loader.md?raw').then(m => m.default),

    // Agents - Transformation
    '/docs/agents/transformation/ngsi-ld-transformer': () => import('../../docs/docs/agents/transformation/ngsi-ld-transformer.md?raw').then(m => m.default),
    '/docs/agents/transformation/sosa-ssn-mapper': () => import('../../docs/docs/agents/transformation/sosa-ssn-mapper.md?raw').then(m => m.default),

    // Frontend
    '/docs/frontend/overview': () => import('../../docs/docs/frontend/overview.md?raw').then(m => m.default),
    '/docs/frontend/complete-components-reference': () => import('../../docs/docs/frontend/complete-components-reference.md?raw').then(m => m.default),
    '/docs/frontend/components/AnalyticsDashboard': () => import('../../docs/docs/frontend/components/AnalyticsDashboard.md?raw').then(m => m.default),
    '/docs/frontend/components/CitizenReportForm': () => import('../../docs/docs/frontend/components/CitizenReportForm.md?raw').then(m => m.default),
    '/docs/frontend/components/TrafficMap': () => import('../../docs/docs/frontend/components/TrafficMap.md?raw').then(m => m.default),

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
