/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * @module apps/traffic-web-app/frontend/docs/docusaurus.config
 * @description Docusaurus configuration for UIP documentation site
 */

import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'UIP - Urban Intelligence Platform',
    tagline: 'Real-time Linked Open Data Pipeline for Smart City Traffic Management',
    favicon: 'img/favicon.ico',

    url: 'https://nguyennhatquang522004.github.io',
    baseUrl: '/UIP-Urban_Intelligence_Platform/',

    organizationName: 'NguyenNhatquang522004',
    projectName: 'UIP-Urban_Intelligence_Platform',

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
                    editUrl: 'https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/tree/main/apps/traffic-web-app/frontend/docs/',
                    showLastUpdateTime: false,
                    showLastUpdateAuthor: false,
                },
                blog: {
                    showReadingTime: true,
                    editUrl: 'https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/tree/main/apps/traffic-web-app/frontend/docs/',
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
            title: 'UIP Platform',
            logo: {
                alt: 'UIP Logo',
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
                    href: 'https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform',
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
                            label: 'Agent System',
                            to: '/docs/agents/overview',
                        },
                        {
                            label: 'Frontend React App',
                            to: '/docs/frontend/overview',
                        },
                        {
                            label: 'API Reference',
                            to: '/docs/api/complete-api-reference',
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
                            href: 'https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn). Built with Docusaurus.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            additionalLanguages: ['python', 'typescript', 'yaml', 'bash', 'docker', 'nginx'],
        },
        // Disable Algolia search for now (comment out if not configured)
        // algolia: {
        //     appId: 'YOUR_APP_ID',
        //     apiKey: 'YOUR_SEARCH_API_KEY',
        //     indexName: 'your_index_name',
        //     contextualSearch: true,
        // },
    } satisfies Preset.ThemeConfig,

    // Remove duplicate plugin - api docs are in main docs folder
    // plugins: [
    //     [
    //         '@docusaurus/plugin-content-docs',
    //         {
    //             id: 'api',
    //             path: 'api',
    //             routeBasePath: 'api',
    //             sidebarPath: require.resolve('./sidebarsApi.ts'),
    //         },
    //     ],
    // ],
};

export default config;
