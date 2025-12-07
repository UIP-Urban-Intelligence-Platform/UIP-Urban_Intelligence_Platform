/**
 * Features Section - Platform Capabilities Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/landing/FeaturesSection
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Features section component showcasing 12 key capabilities of the Digital Twin Traffic
 * System. Uses animated cards with icons, titles, and descriptions to highlight platform
 * strengths including AI agents, real-time processing, and semantic interoperability.
 * 
 * Core features:
 * - 12 animated feature cards with hover effects
 * - Icon-based visual communication
 * - Staggered entrance animations
 * - Responsive grid layout (4 columns desktop, 2 tablet, 1 mobile)
 * - Categorized features (AI, Data, Integration, Analytics)
 * 
 * @dependencies
 * - react@18.2.0 - Functional component
 * - framer-motion@10.16.1 - Card animations and transitions
 * - lucide-react@0.263.1 - 12+ icon components
 * 
 * @example
 * ```tsx
 * <FeaturesSection />
 * ```
 */
import { motion } from 'framer-motion';
import {
    Cpu,
    Database,
    Eye,
    Zap,
    GitBranch,
    Brain,
    Users,
    TrendingUp,
    Shield,
    Globe,
    Activity,
    Sparkles
} from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';

const features = [
    {
        icon: Brain,
        title: '28 AI Agents',
        description: 'Multi-agent system with 8 categories: Data Collection, Transformation, Analytics, Context Management, RDF/LOD, Notification, Monitoring & Integration',
        gradient: 'from-blue-500 to-cyan-500',
        stats: '8 Categories',
    },
    {
        icon: Database,
        title: '10 Smart Data Models',
        description: 'NGSI-LD compliant models: Camera, Weather, AirQuality, ItemFlow, RoadAccident, TrafficPattern, ObservableProperty, Platform, CitizenObservation, User',
        gradient: 'from-purple-500 to-pink-500',
        stats: 'NGSI-LD',
    },
    {
        icon: Activity,
        title: 'Real-time Monitoring',
        description: 'WebSocket-based real-time updates with Stellio Context Broker, temporal queries, and geo-spatial analysis',
        gradient: 'from-green-500 to-emerald-500',
        stats: 'Sub-second',
    },
    {
        icon: Eye,
        title: 'Computer Vision',
        description: 'YOLOX-powered vehicle detection, accident detection, congestion analysis with AI verification',
        gradient: 'from-orange-500 to-red-500',
        stats: 'YOLOX',
    },
    {
        icon: GitBranch,
        title: 'Linked Open Data',
        description: '5-star LOD compliance with SOSA/SSN ontologies, Apache Jena Fuseki triplestore, and SPARQL endpoint',
        gradient: 'from-indigo-500 to-blue-500',
        stats: '5-Star LOD',
    },
    {
        icon: Sparkles,
        title: 'AI-Powered Analytics',
        description: 'GPT-4o Vision multimodal analysis, GraphRAG investigation, predictive event orchestration, eco-health personalization',
        gradient: 'from-pink-500 to-rose-500',
        stats: 'GPT-4o',
    },
    {
        icon: Users,
        title: 'Citizen Science',
        description: 'FastAPI-based citizen reporting with AI verification, weather/AQ enrichment, and accuracy tracking',
        gradient: 'from-teal-500 to-cyan-500',
        stats: 'Community',
    },
    {
        icon: Globe,
        title: 'Neo4j Graph DB',
        description: 'Graph-based relationship mapping, Cypher queries for pattern detection, and temporal graph analysis',
        gradient: 'from-violet-500 to-purple-500',
        stats: 'Graph DB',
    },
    {
        icon: TrendingUp,
        title: 'Predictive Analytics',
        description: 'Time-series pattern recognition, congestion prediction, event impact analysis with Ticketmaster integration',
        gradient: 'from-amber-500 to-yellow-500',
        stats: 'ML-Powered',
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'Production-grade authentication, role-based access control, encrypted data transmission, audit logging',
        gradient: 'from-red-500 to-pink-500',
        stats: 'Secured',
    },
    {
        icon: Zap,
        title: 'High Performance',
        description: 'Redis caching, Kafka message bus, microservices architecture, horizontal scaling capability',
        gradient: 'from-yellow-500 to-orange-500',
        stats: '<100ms',
    },
    {
        icon: Cpu,
        title: 'Microservices',
        description: 'Docker containerized services: Stellio, PostgreSQL, Fuseki, Neo4j, Redis, Kafka with Docker Compose orchestration',
        gradient: 'from-cyan-500 to-blue-500',
        stats: '6 Services',
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="relative py-32 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Mesh Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/30 via-transparent to-purple-100/30" />

            {/* Animated Glow Effects */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

            {/* Enhanced Pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgb(147 51 234 / 0.15) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
                            Key Features
                        </span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        Built with cutting-edge technology, ensuring high performance,
                        scalability, and international standards compliance
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group relative"
                        >
                            {/* Card */}
                            <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300">
                                {/* Gradient Border on Hover */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                {/* Icon Container */}
                                <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>

                                {/* Badge */}
                                <div className="absolute top-6 right-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${feature.gradient} text-white shadow-md`}>
                                        {feature.stats}
                                    </span>
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-blue-900 transition-all duration-300">
                                    {feature.title}
                                </h3>

                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover Indicator */}
                                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-400 group-hover:text-blue-600 transition-colors duration-300">
                                    <span>Learn more</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-20 text-center"
                >
                    <button className="group px-8 py-4 bg-slate-900 text-white rounded-full font-semibold text-lg hover:bg-slate-800 transition-all duration-300">
                        View Technical Documentation
                        <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
