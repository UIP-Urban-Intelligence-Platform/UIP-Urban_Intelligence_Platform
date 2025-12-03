/**
 * @module apps/traffic-web-app/frontend/src/components/landing/Footer
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-28
 * @modified 2025-11-28
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Footer component for landing page featuring site navigation, resource links, social media,
 * newsletter signup, and copyright information. Organized into 4 columns (Product, Resources,
 * Documentation, Company) with animated hover effects.
 * 
 * Core features:
 * - 4-column navigation layout
 * - Social media icon links (Github, LinkedIn, Twitter, Email)
 * - Newsletter subscription form
 * - Animated link hover effects
 * - Copyright notice with current year
 * - Responsive design (stacked on mobile)
 * 
 * @dependencies
 * - react@18.2.0 - Functional component
 * - framer-motion@10.16.1 - Link hover animations
 * - lucide-react@0.263.1 - Social and navigation icons
 * 
 * @example
 * ```tsx
 * <Footer />
 * ```
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Github, Linkedin, Twitter, ArrowRight, FileText, BookOpen, Code } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const links = {
        product: [
            { name: 'Features', href: '#features' },
            { name: 'Technology', href: '#technology' },
            { name: 'Data Models', href: '#data-models' },
            { name: 'Live Demo', href: '#live-demo' },
        ],
        resources: [
            { name: 'Documentation', href: '/docs', icon: BookOpen, isInternal: true },
            { name: 'API Reference', href: '/docs/api/complete-api-reference', icon: Code, isInternal: true },
            { name: 'Architecture', href: '/docs/architecture/overview', icon: FileText, isInternal: true },
            { name: 'GitHub', href: 'https://github.com', icon: Github, isInternal: false },
        ],
        company: [
            { name: 'About Us', href: '#' },
            { name: 'Contact', href: '#' },
            { name: 'Privacy Policy', href: '#' },
            { name: 'Terms of Service', href: '#' },
        ],
    };

    const socialLinks = [
        { icon: Github, href: '#', label: 'GitHub' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Mail, href: 'mailto:contact@lodtraffic.com', label: 'Email' },
    ];

    return (
        <footer className="relative bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* CTA Section */}
            <div className="relative border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Sẵn sàng bắt đầu?
                        </h2>
                        <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
                            Khám phá sức mạnh của hệ thống giám sát giao thông thông minh
                            với công nghệ AI và Linked Open Data
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/dashboard" className="group px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2">
                                Trải nghiệm ngay
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/docs" className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white rounded-full font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                                Xem tài liệu
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">L</span>
                            </div>
                            <span className="text-xl font-bold">LOD Traffic</span>
                        </div>
                        <p className="text-blue-200 mb-6 leading-relaxed">
                            Enterprise-grade traffic monitoring system với NGSI-LD,
                            AI agents, và Linked Open Data technology
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-3">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110"
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Product Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h3 className="font-semibold text-lg mb-4">Product</h3>
                        <ul className="space-y-3">
                            {links.product.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                                            {link.name}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Resources */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h3 className="font-semibold text-lg mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {links.resources.map((link, index) => (
                                <li key={index}>
                                    {link.isInternal ? (
                                        <Link
                                            to={link.href}
                                            className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                                        >
                                            <link.icon className="w-4 h-4" />
                                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                                {link.name}
                                            </span>
                                        </Link>
                                    ) : (
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                                        >
                                            <link.icon className="w-4 h-4" />
                                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                                {link.name}
                                            </span>
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Company */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h3 className="font-semibold text-lg mb-4">Company</h3>
                        <ul className="space-y-3">
                            {links.company.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                                            {link.name}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Bottom Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="pt-8 border-t border-white/10"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-blue-300 text-sm">
                            © {currentYear} LOD Traffic System. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-blue-300">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                System Status: Operational
                            </span>
                            <span>Version 3.0.0</span>
                        </div>
                    </div>
                </motion.div>

                {/* Technology Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-8 flex flex-wrap justify-center gap-4"
                >
                    {['NGSI-LD', 'SOSA/SSN', 'Stellio v2.26.1', 'Neo4j v5.13', 'Apache Jena Fuseki', 'GPT-4o', 'YOLOX', '5-Star LOD'].map((tech, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-xs font-medium text-blue-200"
                        >
                            {tech}
                        </span>
                    ))}
                </motion.div>
            </div>
        </footer>
    );
}
