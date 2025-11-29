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
            ],
        },
        {
            type: 'category',
            label: 'Architecture',
            items: [
                'architecture/overview',
            ],
        },
        {
            type: 'category',
            label: 'Agent System',
            collapsed: false,
            items: [
                'agents/complete-agents-reference',
            ],
        },
        {
            type: 'category',
            label: 'Frontend Components',
            collapsed: false,
            items: [
                'frontend/complete-components-reference',
            ],
        },
        {
            type: 'category',
            label: 'API Documentation',
            collapsed: false,
            items: [
                'api/complete-api-reference',
            ],
        },
        {
            type: 'category',
            label: 'Data Models & Standards',
            collapsed: false,
            items: [
                'data-models/complete-standards',
            ],
        },
        {
            type: 'category',
            label: 'DevOps & Deployment',
            collapsed: false,
            items: [
                'devops/complete-devops-guide',
            ],
        },
        {
            type: 'category',
            label: 'Testing & Quality',
            collapsed: false,
            items: [
                'testing/complete-testing-guide',
            ],
        },
    ],
};

export default sidebars;
