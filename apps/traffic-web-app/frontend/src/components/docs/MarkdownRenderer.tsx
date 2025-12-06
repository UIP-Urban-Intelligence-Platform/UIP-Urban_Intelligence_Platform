/**
 * Markdown Renderer - Documentation Content Renderer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/docs/MarkdownRenderer
 * @author Nguyễn Nhật Quang
 * @created 2025-11-30
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Renders markdown content with syntax highlighting, GFM support, and custom styling.
 * Supports code blocks, tables, images, and other markdown features.
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ExternalLink, Info, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Pre-process content to handle Docusaurus admonitions (:::tip, :::note, etc.)
function preprocessContent(content: string): string {
    // Convert Docusaurus admonitions to blockquotes with markers
    const admonitionRegex = /:::(note|tip|info|caution|warning|danger)(?:\s+(.+?))?\n([\s\S]*?):::/gi;

    return content.replace(admonitionRegex, (_, type, title, body) => {
        const typeUpper = type.toUpperCase();
        const titleText = title || type.charAt(0).toUpperCase() + type.slice(1);
        return `<div class="admonition admonition-${type.toLowerCase()}" data-type="${typeUpper}" data-title="${titleText}">\n\n${body.trim()}\n\n</div>`;
    });
}

// Custom code block component with copy functionality
const CodeBlock: React.FC<{
    language?: string;
    title?: string;
    children: string;
}> = ({ language, title, children }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4">
            {/* Title bar if present */}
            {title && (
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-xl border border-b-0 border-slate-700">
                    <span className="text-sm text-slate-400 font-mono">{title}</span>
                </div>
            )}
            <div className="relative">
                <div className="absolute right-2 top-2 z-10">
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Copy code"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                {language && !title && (
                    <div className="absolute left-4 top-0 -translate-y-1/2 px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 font-mono">
                        {language}
                    </div>
                )}
                <SyntaxHighlighter
                    style={oneDark}
                    language={language || 'text'}
                    PreTag="div"
                    className={`!mt-0 !bg-slate-900 border border-slate-700 ${title ? 'rounded-b-xl rounded-t-none' : 'rounded-xl'}`}
                    customStyle={{
                        padding: '1.5rem',
                        paddingTop: language && !title ? '2rem' : '1.5rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.7',
                        margin: 0,
                    }}
                >
                    {children.trim()}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const components = useMemo(() => ({
        // Code blocks
        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            let language = match ? match[1] : undefined;
            let title: string | undefined;

            // Parse title from meta string (e.g., ```jsx title="src/file.js")
            const metaMatch = className?.match(/title="([^"]+)"/);
            if (metaMatch) {
                title = metaMatch[1];
            }

            if (!inline && (language || String(children).includes('\n'))) {
                return (
                    <CodeBlock language={language} title={title}>
                        {String(children)}
                    </CodeBlock>
                );
            }

            return (
                <code
                    className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded text-sm font-mono"
                    {...props}
                >
                    {children}
                </code>
            );
        },

        // Headings with anchor links
        h1: ({ children, ...props }: any) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return (
                <h1 id={id} className="text-4xl font-bold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700" {...props}>
                    {children}
                </h1>
            );
        },
        h2: ({ children, ...props }: any) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return (
                <h2 id={id} className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4 scroll-mt-20" {...props}>
                    <a href={`#${id}`} className="hover:text-blue-600 transition-colors">
                        {children}
                    </a>
                </h2>
            );
        },
        h3: ({ children, ...props }: any) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return (
                <h3 id={id} className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-3 scroll-mt-20" {...props}>
                    <a href={`#${id}`} className="hover:text-blue-600 transition-colors">
                        {children}
                    </a>
                </h3>
            );
        },
        h4: ({ children, ...props }: any) => (
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2" {...props}>
                {children}
            </h4>
        ),

        // Paragraphs
        p: ({ children, ...props }: any) => (
            <p className="text-slate-600 dark:text-slate-300 leading-7 mb-4" {...props}>
                {children}
            </p>
        ),

        // Links
        a: ({ href, children, ...props }: any) => {
            const isExternal = href?.startsWith('http');
            return (
                <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 inline-flex items-center gap-1"
                    {...props}
                >
                    {children}
                    {isExternal && <ExternalLink className="w-3 h-3" />}
                </a>
            );
        },

        // Lists
        ul: ({ children, ...props }: any) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 dark:text-slate-300 ml-4" {...props}>
                {children}
            </ul>
        ),
        ol: ({ children, ...props }: any) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-600 dark:text-slate-300 ml-4" {...props}>
                {children}
            </ol>
        ),
        li: ({ children, ...props }: any) => (
            <li className="leading-7" {...props}>
                {children}
            </li>
        ),

        // Blockquotes - styled like Docusaurus admonitions
        blockquote: ({ children, ...props }: any) => {
            // Check if it's an admonition
            const text = String(children?.props?.children || '');
            const isNote = text.startsWith('NOTE:') || text.startsWith('📝');
            const isTip = text.startsWith('TIP:') || text.startsWith('💡');
            const isWarning = text.startsWith('WARNING:') || text.startsWith('⚠️');
            const isDanger = text.startsWith('DANGER:') || text.startsWith('🚨');
            const isInfo = text.startsWith('INFO:') || text.startsWith('ℹ️');

            if (isWarning) {
                return (
                    <div className="my-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4" {...props}>
                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-semibold mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Warning</span>
                        </div>
                        <div className="text-yellow-800 dark:text-yellow-200">{children}</div>
                    </div>
                );
            }
            if (isDanger) {
                return (
                    <div className="my-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4" {...props}>
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-2">
                            <XCircle className="w-5 h-5" />
                            <span>Danger</span>
                        </div>
                        <div className="text-red-800 dark:text-red-200">{children}</div>
                    </div>
                );
            }
            if (isTip) {
                return (
                    <div className="my-4 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4" {...props}>
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                            <Lightbulb className="w-5 h-5" />
                            <span>Tip</span>
                        </div>
                        <div className="text-green-800 dark:text-green-200">{children}</div>
                    </div>
                );
            }
            if (isNote || isInfo) {
                return (
                    <div className="my-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4" {...props}>
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2">
                            <Info className="w-5 h-5" />
                            <span>Note</span>
                        </div>
                        <div className="text-blue-800 dark:text-blue-200">{children}</div>
                    </div>
                );
            }

            return (
                <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 pl-4 py-3 my-4 text-slate-700 dark:text-slate-300" {...props}>
                    {children}
                </blockquote>
            );
        },

        // Tables
        table: ({ children, ...props }: any) => (
            <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg" {...props}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ children, ...props }: any) => (
            <thead className="bg-slate-100 dark:bg-slate-800" {...props}>
                {children}
            </thead>
        ),
        th: ({ children, ...props }: any) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200" {...props}>
                {children}
            </th>
        ),
        td: ({ children, ...props }: any) => (
            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700" {...props}>
                {children}
            </td>
        ),

        // Horizontal rule
        hr: ({ ...props }: any) => (
            <hr className="my-8 border-slate-200 dark:border-slate-700" {...props} />
        ),

        // Images - including badges
        img: ({ src, alt, ...props }: any) => {
            // Check if it's a badge (shields.io)
            const isBadge = src?.includes('shields.io') || src?.includes('badge');
            if (isBadge) {
                return (
                    <img
                        src={src}
                        alt={alt || ''}
                        className="inline-block h-5 mx-0.5 align-middle"
                        loading="lazy"
                        {...props}
                    />
                );
            }
            return (
                <img
                    src={src}
                    alt={alt || ''}
                    className="max-w-full h-auto rounded-lg shadow-md my-4 border border-slate-200 dark:border-slate-700"
                    loading="lazy"
                    {...props}
                />
            );
        },

        // Strong/Bold
        strong: ({ children, ...props }: any) => (
            <strong className="font-semibold text-slate-800 dark:text-slate-100" {...props}>
                {children}
            </strong>
        ),

        // Emphasis/Italic
        em: ({ children, ...props }: any) => (
            <em className="italic text-slate-700 dark:text-slate-300" {...props}>
                {children}
            </em>
        ),

        // Pre (for non-highlighted code blocks)
        pre: ({ children, ...props }: any) => (
            <pre className="overflow-x-auto" {...props}>
                {children}
            </pre>
        ),

        // Div - for centered content, custom containers, and admonitions
        div: ({ className, children, ...props }: any) => {
            // Handle Docusaurus-style admonitions
            if (className?.includes('admonition')) {
                const type = props['data-type'] || 'NOTE';
                const title = props['data-title'] || type;

                const styles: Record<string, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
                    NOTE: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: <Info className="w-5 h-5" /> },
                    INFO: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: <Info className="w-5 h-5" /> },
                    TIP: { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', icon: <Lightbulb className="w-5 h-5" /> },
                    CAUTION: { border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', icon: <AlertTriangle className="w-5 h-5" /> },
                    WARNING: { border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', icon: <AlertTriangle className="w-5 h-5" /> },
                    DANGER: { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', icon: <XCircle className="w-5 h-5" /> },
                };

                const style = styles[type] || styles.NOTE;

                return (
                    <div className={`my-4 rounded-lg border-l-4 ${style.border} ${style.bg} p-4`}>
                        <div className={`flex items-center gap-2 ${style.text} font-semibold mb-2`}>
                            {style.icon}
                            <span>{title}</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 [&>p]:mb-0">{children}</div>
                    </div>
                );
            }
            // Handle centered divs
            if (props.align === 'center') {
                return (
                    <div className="text-center my-6" {...props}>
                        {children}
                    </div>
                );
            }
            return <div className={className} {...props}>{children}</div>;
        },
    }), []);

    // Pre-process content to handle Docusaurus admonitions
    const processedContent = useMemo(() => preprocessContent(content), [content]);

    return (
        <article className={`prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:no-underline ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
        </article>
    );
};

export default MarkdownRenderer;
