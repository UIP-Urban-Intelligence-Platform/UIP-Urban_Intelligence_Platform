/**
 * Docs Sidebar - Documentation Navigation Component
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/docs/DocsSidebar
 * @author Nguyễn Nhật Quang
 * @created 2025-11-30
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Sidebar navigation component for documentation pages with collapsible sections,
 * active state highlighting, and mobile responsive design.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, Book, FileText, Home, X, FolderOpen, Folder } from 'lucide-react';
import { docsNavigation, DocItem, hasDocContent } from '../../services/docsService';
import { motion, AnimatePresence } from 'framer-motion';

interface DocsSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

// Helper function to check if current path is within item's children
const isPathInChildren = (item: DocItem, currentPath: string): boolean => {
    if (item.path === currentPath) return true;
    if (item.children) {
        return item.children.some(child => isPathInChildren(child, currentPath));
    }
    return false;
};

const NavItem: React.FC<{
    item: DocItem;
    level?: number;
    currentPath: string;
}> = ({ item, level = 0, currentPath }) => {
    const isActive = currentPath === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const hasContent = hasDocContent(item.path);

    // Calculate if this item should be expanded based on current path
    const shouldBeExpanded = useMemo(() => {
        if (!hasChildren) return false;
        return isPathInChildren(item, currentPath);
    }, [item, currentPath, hasChildren]);

    const [isExpanded, setIsExpanded] = useState(shouldBeExpanded);

    // Update expansion when path changes
    useEffect(() => {
        if (shouldBeExpanded) {
            setIsExpanded(true);
        }
    }, [shouldBeExpanded]);

    const handleToggle = (e: React.MouseEvent) => {
        if (hasChildren) {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        }
    };

    // For category items without content, render as a button instead of Link
    if (hasChildren && !hasContent) {
        return (
            <div className="w-full">
                <button
                    onClick={handleToggle}
                    className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200
                        ${level > 0 ? 'ml-4' : ''}
                        ${isActive
                            ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                        }
                    `}
                >
                    <span className="transition-transform duration-200">
                        {isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-blue-500" />
                        ) : (
                            <Folder className="w-4 h-4 text-slate-400" />
                        )}
                    </span>
                    <span className="flex-1 truncate text-left font-medium">{item.title}</span>
                    <span className="transition-transform duration-200">
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </span>
                </button>

                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-l-2 border-slate-200 dark:border-slate-700 ml-5 mt-1"
                        >
                            {item.children!.map(child => (
                                <NavItem key={child.id} item={child} level={level + 1} currentPath={currentPath} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Items with content - render as Link
    return (
        <div className="w-full">
            <div className="flex items-center">
                <Link
                    to={item.path}
                    className={`
                        flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200
                        ${level > 0 ? 'ml-4' : ''}
                        ${isActive
                            ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                        }
                    `}
                >
                    {hasChildren ? (
                        <button
                            onClick={handleToggle}
                            className="transition-transform duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    ) : (
                        <FileText className="w-4 h-4 opacity-50" />
                    )}
                    <span className="flex-1 truncate">{item.title}</span>
                </Link>
            </div>

            <AnimatePresence initial={false}>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-l-2 border-slate-200 dark:border-slate-700 ml-5 mt-1"
                    >
                        {item.children!.map(child => (
                            <NavItem key={child.id} item={child} level={level + 1} currentPath={currentPath} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DocsSidebar: React.FC<DocsSidebarProps> = ({ isOpen = false, onClose }) => {
    const location = useLocation();

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 z-50 w-72 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto lg:hidden"
                    >
                        <SidebarContent onClose={onClose} currentPath={location.pathname} />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Always visible */}
            <aside className="hidden lg:block sticky top-16 w-72 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0">
                <SidebarContent currentPath={location.pathname} />
            </aside>
        </>
    );
};

// Separate component for sidebar content to avoid duplication
const SidebarContent: React.FC<{ onClose?: () => void; currentPath: string }> = ({ onClose, currentPath }) => {
    return (
        <>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 z-10">
                <div className="flex items-center justify-between">
                    <Link to="/docs" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <Book className="w-5 h-5 text-blue-600" />
                        <span>Documentation</span>
                    </Link>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Back to App */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <Link
                    to="/"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                    <Home className="w-4 h-4" />
                    <span>Quay lại Trang chủ</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
                {docsNavigation.map(item => (
                    <NavItem key={item.id} item={item} currentPath={currentPath} />
                ))}
            </nav>

            {/* Footer info */}
            <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-500">
                    <p>HCMC Traffic Monitoring</p>
                    <p>Documentation v1.0.0</p>
                </div>
            </div>
        </>
    );
};

export default DocsSidebar;
