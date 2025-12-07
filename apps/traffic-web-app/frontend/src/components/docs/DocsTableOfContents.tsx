/**
 * Docs Table of Contents - Quick Navigation Component
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/docs/DocsTableOfContents
 * @author Nguyễn Nhật Quang
 * @created 2025-11-30
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Table of contents component that extracts headings from markdown content
 * and provides quick navigation with scroll spy functionality.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { List } from 'lucide-react';
import { Language, getTranslations } from '../../services/i18nService';

interface TocItem {
    id: string;
    title: string;
    level: number;
}

interface DocsTableOfContentsProps {
    content: string;
    language?: Language;
}

const DocsTableOfContents: React.FC<DocsTableOfContentsProps> = ({ content, language = 'vi' }) => {
    const [activeId, setActiveId] = useState<string>('');
    const t = getTranslations(language);

    // Extract headings from markdown content
    const headings = useMemo(() => {
        const regex = /^(#{2,4})\s+(.+)$/gm;
        const items: TocItem[] = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            const level = match[1].length;
            const title = match[2].replace(/\*\*/g, '').replace(/`/g, ''); // Remove markdown formatting
            const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

            items.push({ id, title, level });
        }

        return items;
    }, [content]);

    // Scroll spy effect
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-80px 0px -80% 0px',
                threshold: 0,
            }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -80;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <div className="p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-4">
                        <List className="w-4 h-4" />
                        {t.tableOfContents}
                    </h4>
                    <nav className="space-y-1">
                        {headings.map((heading) => (
                            <button
                                key={heading.id}
                                onClick={() => handleClick(heading.id)}
                                className={`
                  block w-full text-left text-sm py-1.5 transition-all duration-200
                  ${heading.level === 2 ? 'pl-0' : ''}
                  ${heading.level === 3 ? 'pl-4' : ''}
                  ${heading.level === 4 ? 'pl-8' : ''}
                  ${activeId === heading.id
                                        ? 'text-blue-600 font-medium border-l-2 border-blue-600 pl-3 -ml-3'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                    }
                `}
                            >
                                {heading.title}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
};

export default DocsTableOfContents;
