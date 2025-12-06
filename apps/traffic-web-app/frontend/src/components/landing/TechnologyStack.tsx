/**
 * Technology Stack - System Components Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/landing/TechnologyStack
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-28
 * @modified 2025-11-28
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Technology stack section displaying all major technologies used in the Digital Twin
 * system. Organized into 6 categories (Context Broker, Graph Database, Triple Store,
 * AI/ML, Backend, Frontend) with version numbers and descriptions for each component.
 * 
 * Core features:
 * - 6 technology categories with color-coded icons
 * - Version-specific component listings (Stellio v2.26.1, Neo4j v5.23, etc.)
 * - Animated card reveals on scroll
 * - Animated background particles
 * - Technology descriptions and use cases
 * 
 * @dependencies
 * - react@18.2.0 - Component rendering
 * - framer-motion@10.16.1 - Scroll-triggered animations
 * - lucide-react@0.263.1 - Category icons (Server, Database, Network, Brain, Cloud, Boxes)
 * 
 * @example
 * ```tsx
 * <TechnologyStack />
 * ```
 */
import { motion } from 'framer-motion';
import { Server, Database, Network, Brain, Cloud, Boxes } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';

const technologies = [
    {
        category: 'Context Broker',
        icon: Server,
        items: [
            { name: 'Stellio', version: 'v2.26.1', description: 'NGSI-LD Context Broker với temporal queries', color: 'blue' },
            { name: 'PostgreSQL', version: 'v14', description: 'Backend storage cho Stellio', color: 'indigo' },
        ],
        gradient: 'from-blue-500 to-indigo-500',
    },
    {
        category: 'Semantic Web',
        icon: Network,
        items: [
            { name: 'Apache Jena Fuseki', version: 'Latest', description: 'RDF triplestore với SPARQL endpoint', color: 'purple' },
            { name: 'SOSA/SSN', version: 'W3C', description: 'Ontology cho sensor networks', color: 'violet' },
        ],
        gradient: 'from-purple-500 to-violet-500',
    },
    {
        category: 'Graph Database',
        icon: Boxes,
        items: [
            { name: 'Neo4j', version: 'v5.13', description: 'Graph DB cho relationship mapping', color: 'cyan' },
            { name: 'Cypher', version: 'Latest', description: 'Graph query language', color: 'teal' },
        ],
        gradient: 'from-cyan-500 to-teal-500',
    },
    {
        category: 'AI/ML Stack',
        icon: Brain,
        items: [
            { name: 'OpenAI GPT-4o', version: 'Vision+Text', description: 'Multimodal AI analysis', color: 'green' },
            { name: 'YOLOX', version: 'Latest', description: 'Computer vision object detection', color: 'emerald' },
        ],
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        category: 'Message Queue',
        icon: Cloud,
        items: [
            { name: 'Apache Kafka', version: 'Latest', description: 'Distributed event streaming', color: 'orange' },
            { name: 'Redis', version: 'v7', description: 'In-memory caching layer', color: 'red' },
        ],
        gradient: 'from-orange-500 to-red-500',
    },
    {
        category: 'Data Layer',
        icon: Database,
        items: [
            { name: 'NGSI-LD', version: 'Standard', description: 'Context information model', color: 'pink' },
            { name: 'Linked Data', version: '5-Star', description: 'LOD best practices', color: 'rose' },
        ],
        gradient: 'from-pink-500 to-rose-500',
    },
];

const colorClasses = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    violet: 'bg-violet-500',
    cyan: 'bg-cyan-500',
    teal: 'bg-teal-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
};

export default function TechnologyStack() {
    return (
        <section id="technology" className="relative py-32 bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 overflow-hidden">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Mesh Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tl from-cyan-100/30 via-transparent to-teal-100/30" />

            {/* Animated Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />

            {/* Blob Background */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
                <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
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
                            Công nghệ tiên tiến
                        </span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        Được xây dựng trên nền tảng công nghệ hàng đầu thế giới,
                        đảm bảo hiệu suất, khả năng mở rộng và tuân thủ chuẩn quốc tế
                    </p>
                </motion.div>

                {/* Technology Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {technologies.map((tech, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group"
                        >
                            {/* Card */}
                            <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300 overflow-hidden">
                                {/* Gradient Background on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${tech.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                {/* Header */}
                                <div className="relative flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${tech.gradient} shadow-md`}>
                                        <tech.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {tech.category}
                                    </h3>
                                </div>

                                {/* Technology Items */}
                                <div className="relative space-y-4">
                                    {tech.items.map((item, i) => (
                                        <div key={i} className="group/item">
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${colorClasses[item.color as keyof typeof colorClasses]}`} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                                                            {item.name}
                                                        </h4>
                                                        <span className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 rounded">
                                                            {item.version}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Architecture Diagram CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-20 p-8 bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl shadow-2xl"
                >
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-white mb-4">
                            Kiến trúc Microservices
                        </h3>
                        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                            6 Docker services được orchestrate với Docker Compose:
                            Stellio, PostgreSQL, Fuseki, Neo4j, Redis, Kafka + Zookeeper
                        </p>
                        <button className="px-8 py-4 bg-white text-slate-900 rounded-full font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                            Xem sơ đồ kiến trúc
                        </button>
                    </div>
                </motion.div>
            </div>

            <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </section>
    );
}
