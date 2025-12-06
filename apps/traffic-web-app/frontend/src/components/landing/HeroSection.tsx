/**
 * Hero Section - Landing Page Main Header
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/landing/HeroSection
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Hero section component for landing page featuring animated background, navigation bar,
 * headline text, call-to-action buttons, and key feature highlights. Provides first
 * impression and primary conversion actions for visitors.
 * 
 * Core features:
 * - Responsive navigation bar with mobile menu
 * - Animated headline with gradient text effects
 * - CTA buttons (View Dashboard, Watch Demo, Read Docs)
 * - Feature highlight cards (Stellio, Neo4j, OpenAI)
 * - Animated particle background
 * - Smooth scroll navigation to sections
 * 
 * @dependencies
 * - react@18.2.0 - Component state and hooks
 * - react-router-dom@6.14.2 - Link component for navigation
 * - framer-motion@10.16.1 - Animation and transitions
 * - lucide-react@0.263.1 - Icon components
 * 
 * @example
 * ```tsx
 * <HeroSection />
 * ```
 */
import { motion } from 'framer-motion';
import { ArrowRight, Play, Database, Network, Brain, Menu, X, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import HeroAnimatedBackground from './HeroAnimatedBackground';

export default function HeroSection() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
            {/* Navigation Bar - Creative Soft Design */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute top-0 left-0 right-0 z-30"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/60 border-2 border-slate-200 px-6 py-3">
                        <div className="flex justify-between items-center">
                            {/* Logo - Creative */}
                            <motion.div
                                className="flex items-center gap-3"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="relative">
                                    <div className="w-9 h-9 bg-slate-900 rounded-2xl rotate-6 transition-transform duration-300 hover:rotate-12"></div>
                                    <div className="absolute inset-0 w-9 h-9 bg-slate-800/50 rounded-2xl -rotate-6 blur-sm"></div>
                                </div>
                                <div>
                                    <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">LOD Traffic</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Smart Monitoring</span>
                                </div>
                            </motion.div>

                            {/* Desktop Navigation - Pill Style */}
                            <div className="hidden md:flex items-center bg-slate-50/50 rounded-full px-2 py-2 gap-1">
                                <Link to="/" className="relative px-5 py-2 text-sm text-slate-700 hover:text-slate-900 rounded-full transition-all duration-300 hover:bg-white hover:shadow-sm">
                                    <span className="relative z-10">Trang chủ</span>
                                </Link>
                                <Link to="/docs" className="relative px-5 py-2 text-sm text-slate-700 hover:text-slate-900 rounded-full transition-all duration-300 hover:bg-white hover:shadow-sm flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span className="relative z-10">Tài liệu</span>
                                </Link>
                                <a href="#features" className="relative px-5 py-2 text-sm text-slate-700 hover:text-slate-900 rounded-full transition-all duration-300 hover:bg-white hover:shadow-sm">
                                    <span className="relative z-10">Tính năng</span>
                                </a>
                                <a href="#demo" className="relative px-5 py-2 text-sm text-slate-700 hover:text-slate-900 rounded-full transition-all duration-300 hover:bg-white hover:shadow-sm">
                                    <span className="relative z-10">Demo</span>
                                </a>
                            </div>

                            {/* CTA Button - Soft */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="hidden md:block px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-all duration-300 shadow-lg shadow-slate-900/20"
                            >
                                Liên hệ
                            </motion.button>

                            {/* Mobile Menu Button - Soft */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </motion.button>
                        </div>
                    </div>

                    {/* Mobile Menu - Soft Dropdown */}
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="md:hidden mt-3 mx-4 bg-white backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-300/60 border-2 border-slate-200 overflow-hidden"
                        >
                            <div className="px-4 py-4 space-y-1">
                                <Link to="/" className="block text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 py-3 transition-all">
                                    Trang chủ
                                </Link>
                                <Link to="/docs" className="block text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 py-3 transition-all flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Tài liệu
                                </Link>
                                <a href="#features" className="block text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 py-3 transition-all">
                                    Tính năng
                                </a>
                                <a href="#demo" className="block text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-4 py-3 transition-all">
                                    Demo
                                </a>
                                <div className="pt-2 px-2">
                                    <button className="w-full px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                                        Liên hệ
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.nav>

            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <HeroAnimatedBackground />
            </div>

            {/* Subtle Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/50 z-10" />

            {/* Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mt-16">
                <div className="text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8"
                    >
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span className="text-sm font-medium text-blue-900">
                            Enterprise-Grade Linked Open Data Platform
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
                            Intelligent Traffic
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
                            Monitoring System
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        <span className="font-semibold text-blue-600">NGSI-LD</span>
                        <span className="font-semibold text-orange-600"></span>
                        <span className="font-semibold text-yellow-600"></span>

                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12"
                    >
                        <div className="text-center">
                            <div className="text-4xl font-bold text-slate-900 mb-2">28</div>
                            <div className="text-sm text-slate-600 font-medium">AI Agents</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-slate-900 mb-2">10</div>
                            <div className="text-sm text-slate-600 font-medium">Data Models</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-slate-900 mb-2">5★</div>
                            <div className="text-sm text-slate-600 font-medium">LOD Rating</div>
                        </div>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link to="/dashboard" className="group px-8 py-4 bg-slate-900 text-white rounded-full font-semibold text-lg hover:bg-slate-800 transition-all duration-300 flex items-center gap-2">
                            Khám phá hệ thống
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <a href="#features" className="group px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg border-2 border-slate-200 hover:border-blue-600 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md">
                            <Play className="w-5 h-5" />
                            Xem Demo
                        </a>
                    </motion.div>

                    {/* Technology Icons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex justify-center items-center gap-8 mt-16 pt-16 border-t border-slate-200"
                    >
                        <div className="flex items-center gap-3 text-slate-600">
                            <Database className="w-6 h-6 text-blue-600" />
                            <span className="font-medium">NGSI-LD</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Network className="w-6 h-6 text-orange-600" />
                            <span className="font-medium">Semantic Web</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Brain className="w-6 h-6 text-yellow-600" />
                            <span className="font-medium">AI/ML</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
            >
                <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center p-1">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                    />
                </div>
            </motion.div>
        </section>
    );
}
