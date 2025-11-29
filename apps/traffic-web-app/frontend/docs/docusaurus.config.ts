import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'HCMC Traffic Monitoring System',
    tagline: 'Real-time Linked Open Data Pipeline for Smart City Traffic Management',
    favicon: 'img/favicon.ico',

    url: 'https://your-domain.com',
    baseUrl: '/',

    organizationName: 'lod-pipeline-team',
    projectName: 'builder-layer-end',

    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',

    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'vi'],
        localeConfigs: {
            en: {
                label: 'English',
            },
            vi: {
                label: 'Tiếng Việt',
            },
        },
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                    editUrl: 'https://github.com/your-org/builder-layer-end/tree/main/',
                    showLastUpdateTime: true,
                    showLastUpdateAuthor: true,
                },
                blog: {
                    showReadingTime: true,
                    editUrl: 'https://github.com/your-org/builder-layer-end/tree/main/',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        image: 'img/docusaurus-social-card.jpg',
        navbar: {
            title: 'HCMC Traffic System',
            logo: {
                alt: 'LOD Pipeline Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'tutorialSidebar',
                    position: 'left',
                    label: 'Documentation',
                },
                {
                    type: 'docSidebar',
                    sidebarId: 'apiSidebar',
                    position: 'left',
                    label: 'API Reference',
                },
                {
                    type: 'docSidebar',
                    sidebarId: 'architectureSidebar',
                    position: 'left',
                    label: 'Architecture',
                },
                { to: '/blog', label: 'Blog', position: 'left' },
                {
                    type: 'localeDropdown',
                    position: 'right',
                },
                {
                    href: 'https://github.com/your-org/builder-layer-end',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Documentation',
                    items: [
                        {
                            label: 'Getting Started',
                            to: '/docs/intro',
                        },
                        {
                            label: 'Quick Start',
                            to: '/docs/quick-start',
                        },
                        {
                            label: 'Architecture',
                            to: '/docs/architecture/overview',
                        },
                    ],
                },
                {
                    title: 'Components',
                    items: [
                        {
                            label: 'Python Orchestrator',
                            to: '/docs/backend/orchestrator',
                        },
                        {
                            label: 'Frontend React App',
                            to: '/docs/frontend/overview',
                        },
                        {
                            label: 'Agent System',
                            to: '/docs/agents/overview',
                        },
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'Blog',
                            to: '/blog',
                        },
                        {
                            label: 'GitHub',
                            href: 'https://github.com/your-org/builder-layer-end',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} LOD Pipeline Team. Built with Docusaurus.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            additionalLanguages: ['python', 'typescript', 'yaml', 'bash', 'docker', 'nginx'],
        },
        algolia: {
            appId: 'YOUR_APP_ID',
            apiKey: 'YOUR_SEARCH_API_KEY',
            indexName: 'your_index_name',
            contextualSearch: true,
        },
    } satisfies Preset.ThemeConfig,

    plugins: [
        [
            '@docusaurus/plugin-content-docs',
            {
                id: 'api',
                path: 'api',
                routeBasePath: 'api',
                sidebarPath: require.resolve('./sidebarsApi.ts'),
            },
        ],
    ],
};

export default config;
