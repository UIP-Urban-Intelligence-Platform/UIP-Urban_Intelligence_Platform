/**
 * i18n Service - Internationalization Service
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/services/i18nService
 * @author Nguyễn Nhật Quang
 * @created 2025-12-7
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * Provides internationalization support for English and Vietnamese languages.
 */

export type Language = 'en' | 'vi';

export interface Translations {
    // Header
    searchPlaceholder: string;
    version: string;

    // Navigation
    backToHome: string;
    documentation: string;
    dashboard: string;
    app: string;

    // Docs
    introduction: string;
    quickStart: string;
    installation: string;
    systemRequirements: string;
    dockerSetup: string;
    localSetup: string;
    environmentConfig: string;
    architecture: string;
    agentSystem: string;
    frontendComponents: string;
    apiDocumentation: string;
    dataModels: string;
    integration: string;
    testing: string;
    performance: string;
    contributing: string;
    changelog: string;
    license: string;
    licenses: string;

    // UI Elements
    tableOfContents: string;
    previous: string;
    next: string;
    notFound: string;
    notFoundDescription: string;
    backToDocs: string;
    loading: string;
    darkMode: string;
    lightMode: string;
    language: string;

    // Search
    noResults: string;
    searchResults: string;

    // Footer
    editThisPage: string;
    lastUpdated: string;

    // Errors
    documentNotFound: string;
    loadingError: string;
}

const translations: Record<Language, Translations> = {
    en: {
        // Header
        searchPlaceholder: 'Search documentation... (Ctrl+K)',
        version: 'v1.0',

        // Navigation
        backToHome: 'Back to Home',
        documentation: 'Documentation',
        dashboard: 'Dashboard',
        app: 'App',

        // Docs
        introduction: 'Introduction',
        quickStart: 'Quick Start',
        installation: 'Installation',
        systemRequirements: 'System Requirements',
        dockerSetup: 'Docker Setup',
        localSetup: 'Local Setup',
        environmentConfig: 'Environment Config',
        architecture: 'System Architecture',
        agentSystem: 'Agent System',
        frontendComponents: 'Frontend Components',
        apiDocumentation: 'API Documentation',
        dataModels: 'Data Models',
        integration: 'Integration',
        testing: 'Testing',
        performance: 'Performance',
        contributing: 'Contributing',
        changelog: 'Changelog',
        license: 'License',
        licenses: 'Licenses',

        // UI Elements
        tableOfContents: 'Table of Contents',
        previous: 'Previous',
        next: 'Next',
        notFound: 'Page Not Found',
        notFoundDescription: 'The page you are looking for does not exist or has been moved.',
        backToDocs: 'Back to Docs',
        loading: 'Loading...',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        language: 'Language',

        // Search
        noResults: 'No results found',
        searchResults: 'Search Results',

        // Footer
        editThisPage: 'Edit this page',
        lastUpdated: 'Last updated',

        // Errors
        documentNotFound: 'Document not found',
        loadingError: 'Error loading document',
    },
    vi: {
        // Header
        searchPlaceholder: 'Tìm kiếm tài liệu... (Ctrl+K)',
        version: 'v1.0',

        // Navigation
        backToHome: 'Quay lại Trang chủ',
        documentation: 'Tài liệu',
        dashboard: 'Bảng điều khiển',
        app: 'Ứng dụng',

        // Docs
        introduction: 'Giới thiệu',
        quickStart: 'Bắt đầu nhanh',
        installation: 'Cài đặt',
        systemRequirements: 'Yêu cầu hệ thống',
        dockerSetup: 'Cài đặt Docker',
        localSetup: 'Cài đặt Local',
        environmentConfig: 'Cấu hình môi trường',
        architecture: 'Kiến trúc hệ thống',
        agentSystem: 'Hệ thống Agent',
        frontendComponents: 'Thành phần Frontend',
        apiDocumentation: 'Tài liệu API',
        dataModels: 'Mô hình dữ liệu',
        integration: 'Tích hợp',
        testing: 'Kiểm thử',
        performance: 'Hiệu suất',
        contributing: 'Đóng góp',
        changelog: 'Nhật ký thay đổi',
        license: 'Giấy phép',
        licenses: 'Giấy phép',

        // UI Elements
        tableOfContents: 'Mục lục',
        previous: 'Trước',
        next: 'Tiếp theo',
        notFound: 'Không tìm thấy trang',
        notFoundDescription: 'Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.',
        backToDocs: 'Về trang Tài liệu',
        loading: 'Đang tải...',
        darkMode: 'Chế độ tối',
        lightMode: 'Chế độ sáng',
        language: 'Ngôn ngữ',

        // Search
        noResults: 'Không tìm thấy kết quả',
        searchResults: 'Kết quả tìm kiếm',

        // Footer
        editThisPage: 'Chỉnh sửa trang này',
        lastUpdated: 'Cập nhật lần cuối',

        // Errors
        documentNotFound: 'Không tìm thấy tài liệu',
        loadingError: 'Lỗi khi tải tài liệu',
    }
};

// Get initial language from localStorage or default to English
export function getInitialLanguage(): Language {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('docs-language');
        if (stored === 'en' || stored === 'vi') {
            return stored;
        }
    }
    return 'en'; // Default to English
}

// Save language preference
export function saveLanguage(lang: Language): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('docs-language', lang);
    }
}

// Get translations for a specific language
export function getTranslations(lang: Language): Translations {
    return translations[lang];
}

// Get a specific translation
export function t(lang: Language, key: keyof Translations): string {
    return translations[lang][key];
}

// Language display names
export const languageNames: Record<Language, string> = {
    en: 'English',
    vi: 'Tiếng Việt'
};

// Language flags (emoji)
export const languageFlags: Record<Language, string> = {
    en: '🇺🇸',
    vi: '🇻🇳'
};

export default translations;
