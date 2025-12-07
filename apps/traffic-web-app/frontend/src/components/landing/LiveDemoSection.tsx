/**
 * Live Demo Section - Real-Time Metrics Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/landing/LiveDemoSection
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-28
 * @modified 2025-11-28
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Live demo section with simulated real-time metrics showcasing system capabilities.
 * Displays animated metric cards updating every 2 seconds to demonstrate continuous
 * data processing and monitoring features.
 * 
 * Core features:
 * - 4 animated metric cards (Traffic Flow, Avg Speed, Accidents, AQI)
 * - Auto-updating values every 2 seconds
 * - Color-coded indicators (green/yellow/red by threshold)
 * - Trend icons and percentage changes
 * - Call-to-action button to full dashboard
 * - Animated background particles
 * 
 * @dependencies
 * - react@18.2.0 - State management with useEffect and useState
 * - framer-motion@10.16.1 - Metric card animations
 * - lucide-react@0.263.1 - Activity, TrendingUp, AlertTriangle, Wind icons
 * 
 * @example
 * ```tsx
 * <LiveDemoSection />
 * ```
 */
import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertTriangle, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnimatedBackground from './AnimatedBackground';

// Simulated real-time data
const generateMockData = () => ({
    trafficFlow: Math.floor(Math.random() * 500) + 1000,
    avgSpeed: Math.floor(Math.random() * 20) + 40,
    accidents: Math.floor(Math.random() * 3),
    aqi: Math.floor(Math.random() * 50) + 50,
    congestionLevel: Math.floor(Math.random() * 100),
});

export default function LiveDemoSection() {
    const [data, setData] = useState(generateMockData());
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            setData(generateMockData());
        }, 2000);

        return () => clearInterval(interval);
    }, [isLive]);

    const metrics = [
        {
            icon: Activity,
            label: 'Traffic Flow',
            value: data.trafficFlow,
            unit: 'vehicles/hour',
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-500',
            change: '+12%',
        },
        {
            icon: TrendingUp,
            label: 'Avg Speed',
            value: data.avgSpeed,
            unit: 'km/h',
            color: 'green',
            gradient: 'from-green-500 to-emerald-500',
            change: '+5%',
        },
        {
            icon: AlertTriangle,
            label: 'Active Alerts',
            value: data.accidents,
            unit: 'incidents',
            color: 'orange',
            gradient: 'from-orange-500 to-red-500',
            change: '-2',
        },
        {
            icon: Wind,
            label: 'Air Quality',
            value: data.aqi,
            unit: 'AQI',
            color: 'purple',
            gradient: 'from-purple-500 to-pink-500',
            change: 'Moderate',
        },
    ];

    return (
        <section id="demo" className="relative py-32 bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 overflow-hidden">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Mesh Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/30 via-transparent to-violet-100/30" />

            {/* Animated Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
            <div className="absolute top-20 right-20 w-80 h-80 bg-fuchsia-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2.5s' }} />

            {/* Blob Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
                </div>
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(203, 213, 225, 0.3) 1px, transparent 0)`,
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
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-6">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-green-700">
                            Live Data Stream
                        </span>
                    </div>

                    <h2 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
                            Real-time Monitoring
                        </span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        WebSocket-based live updates with sub-second latency.
                        Data processed by 28 AI agents and updated in real-time
                    </p>
                </motion.div>

                {/* Live Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 overflow-hidden shadow-lg shadow-slate-200/50">
                                {/* Gradient Glow */}
                                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${metric.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />

                                <div className="relative">
                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} mb-4 shadow-lg`}>
                                        <metric.icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Label */}
                                    <div className="text-slate-600 text-sm font-medium mb-2">
                                        {metric.label}
                                    </div>

                                    {/* Value */}
                                    <motion.div
                                        key={metric.value}
                                        initial={{ scale: 1.1, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-4xl font-bold text-slate-900 mb-1"
                                    >
                                        {metric.value}
                                    </motion.div>

                                    {/* Unit & Change */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 text-sm">{metric.unit}</span>
                                        <span className={`text-sm font-semibold ${metric.change.startsWith('+') ? 'text-green-600' :
                                            metric.change.startsWith('-') ? 'text-red-600' :
                                                'text-blue-600'
                                            }`}>
                                            {metric.change}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Congestion Visualization */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Congestion Level</h3>
                            <p className="text-slate-600">Real-time traffic density analysis</p>
                        </div>
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${isLive
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                                : 'bg-slate-100 text-slate-900 border border-slate-300'
                                }`}
                        >
                            {isLive ? '● Live' : '○ Paused'}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.congestionLevel}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${data.congestionLevel < 40
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : data.congestionLevel < 70
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                                }`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-slate-900 font-bold text-sm">
                                {data.congestionLevel}%
                            </span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-slate-600 text-sm">Low (0-40%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="text-slate-600 text-sm">Medium (40-70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-slate-600 text-sm">High (70-100%)</span>
                        </div>
                    </div>
                </motion.div>

                {/* Technology Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex items-center gap-6 px-8 py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                        <span className="text-slate-600">Powered by:</span>
                        <span className="font-semibold text-slate-900">WebSocket (Port 8081)</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-900">Stellio Context Broker</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-900">28 AI Agents</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
