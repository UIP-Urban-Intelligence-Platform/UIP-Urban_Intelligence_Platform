/**
 * Docs Page - Documentation Reader Component
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/pages/DocsPage
 * @author Nguyễn Nhật Quang
 * @created 2025-11-30
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Main documentation page component that renders markdown content with sidebar navigation,
 * table of contents, breadcrumbs, and prev/next navigation.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, ChevronLeft, ChevronRight, ArrowLeft, Moon, Sun, Search, Github, BookOpen, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocsSidebar from '../components/docs/DocsSidebar';
import MarkdownRenderer from '../components/docs/MarkdownRenderer';
import DocsTableOfContents from '../components/docs/DocsTableOfContents';
import { loadDocContent, getBreadcrumbs, getPrevNextDocs, DocContent, docsNavigation, hasDocContent } from '../services/docsService';

const DocsPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [docContent, setDocContent] = useState<DocContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ title: string; path: string }>>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('docs-dark-mode') === 'true';
        }
        return false;
    });

    // Get current path - ensure it's clean
    const currentPath = location.pathname;

    // Calculate prev/next based on current path - use useMemo to ensure recalculation
    const { prev, next } = useMemo(() => {
        return getPrevNextDocs(currentPath);
    }, [currentPath]);

    // Get breadcrumbs
    const breadcrumbs = useMemo(() => getBreadcrumbs(currentPath), [currentPath]);

    // Flatten navigation for search - only include docs with actual content
    const flattenNav = useCallback((items: typeof docsNavigation): Array<{ title: string; path: string }> => {
        let result: Array<{ title: string; path: string }> = [];
        items.forEach(item => {
            // Only include items that have actual content in docsMap
            if (hasDocContent(item.path)) {
                result.push({ title: item.title, path: item.path });
            }
            if (item.children) {
                result = result.concat(flattenNav(item.children));
            }
        });
        return result;
    }, []);

    const allDocs = flattenNav(docsNavigation);

    // Search functionality
    useEffect(() => {
        if (searchQuery.length > 1) {
            const query = searchQuery.toLowerCase();
            const results = allDocs.filter(doc =>
                doc.title.toLowerCase().includes(query) ||
                doc.path.toLowerCase().includes(query)
            ).slice(0, 8);
            setSearchResults(results);
            setShowSearch(true);
        } else {
            setSearchResults([]);
            setShowSearch(false);
        }
    }, [searchQuery, allDocs]);

    // Handle search selection
    const handleSearchSelect = (path: string) => {
        navigate(path);
        setSearchQuery('');
        setShowSearch(false);
    };

    // Load document content when path changes
    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            setError(null);

            const content = await loadDocContent(location.pathname);

            if (content) {
                setDocContent(content);
                // Update page title
                document.title = `${content.title} | HCMC Traffic Docs`;
            } else {
                setError('Không tìm thấy tài liệu');
            }

            setLoading(false);
            // Scroll to top on page change
            window.scrollTo(0, 0);
        };

        loadContent();
    }, [location.pathname]);

    // Dark mode toggle
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('docs-dark-mode', String(darkMode));
    }, [darkMode]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Top Navigation - Docusaurus style */}
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95">
                <div className="flex items-center justify-between h-16 px-4 lg:px-6">
                    {/* Left side - Logo and title */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>

                        <Link to="/docs" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <span className="font-bold text-slate-900 dark:text-white">HCMC Traffic</span>
                                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">v1.0</span>
                            </div>
                        </Link>
                    </div>

                    {/* Center - Search */}
                    <div className="flex-1 max-w-md mx-4 hidden md:block relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm tài liệu... (Ctrl+K)"
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                                onFocus={() => searchQuery.length > 1 && setShowSearch(true)}
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex px-1.5 py-0.5 text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 rounded">
                                ⌘K
                            </kbd>
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showSearch && searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                                >
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={result.path}
                                            onClick={() => handleSearchSelect(result.path)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${index !== searchResults.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                                                }`}
                                        >
                                            <BookOpen className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{result.title}</div>
                                                <div className="text-xs text-slate-500">{result.path}</div>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        <a
                            href="https://github.com/your-org/builder-layer-end"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="GitHub"
                        >
                            <Github className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </a>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={darkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-600" />
                            )}
                        </button>

                        <Link
                            to="/"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            App
                        </Link>

                        <Link
                            to="/dashboard"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <DocsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 lg:ml-0">
                    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 overflow-x-auto">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.path}>
                                    {index > 0 && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                                    {index === breadcrumbs.length - 1 ? (
                                        <span className="text-slate-900 dark:text-white font-medium truncate">
                                            {crumb.title}
                                        </span>
                                    ) : (
                                        <Link
                                            to={crumb.path}
                                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                                        >
                                            {crumb.title}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>

                        <div className="flex gap-8">
                            {/* Article Content */}
                            <article className="flex-1 min-w-0">
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-center py-20"
                                        >
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        </motion.div>
                                    ) : error ? (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center py-20"
                                        >
                                            <div className="text-6xl mb-4">📄</div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                                {error}
                                            </h2>
                                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                                Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
                                            </p>
                                            <Link
                                                to="/docs"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                Về trang chủ Docs
                                            </Link>
                                        </motion.div>
                                    ) : docContent ? (
                                        <motion.div
                                            key="content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:p-10"
                                        >
                                            <MarkdownRenderer content={docContent.content} />
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>

                                {/* Prev/Next Navigation */}
                                {!loading && !error && (prev || next) && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-between items-stretch gap-4 mt-8"
                                    >
                                        {prev ? (
                                            <button
                                                onClick={() => navigate(prev.path)}
                                                className="flex-1 flex flex-col items-start p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group cursor-pointer text-left"
                                            >
                                                <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                                    <ChevronLeft className="w-4 h-4" />
                                                    Trước
                                                </span>
                                                <span className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {prev.title}
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="flex-1" />
                                        )}

                                        {next ? (
                                            <button
                                                onClick={() => navigate(next.path)}
                                                className="flex-1 flex flex-col items-end p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group cursor-pointer text-right"
                                            >
                                                <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                                    Tiếp theo
                                                    <ChevronRight className="w-4 h-4" />
                                                </span>
                                                <span className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {next.title}
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="flex-1" />
                                        )}
                                    </motion.div>
                                )}
                            </article>

                            {/* Table of Contents */}
                            {docContent && <DocsTableOfContents content={docContent.content} />}
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 mt-16">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            © 2024 HCMC Traffic Monitoring System. Built with ❤️
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                GitHub
                            </a>
                            <Link to="/docs/guides/contributing" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                Contributing
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DocsPage;
