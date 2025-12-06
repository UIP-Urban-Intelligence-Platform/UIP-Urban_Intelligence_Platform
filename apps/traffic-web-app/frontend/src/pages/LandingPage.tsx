/**
 * Landing Page - Marketing & Onboarding Entry Point
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/pages/LandingPage
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Landing page root component orchestrating 6 major sections: Hero, Features, Technology
 * Stack, Data Models Showcase, Live Demo, and Footer. Provides marketing and onboarding
 * experience for new users before entering the main dashboard.
 * 
 * Page structure:
 * 1. Hero section with CTA and navigation
 * 2. Features grid (12 key capabilities)
 * 3. Technology stack showcase
 * 4. NGSI-LD data models demonstration
 * 5. Live metrics simulation
 * 6. Footer with links and newsletter
 * 
 * @dependencies
 * - react@18.2.0 - Component composition
 * - Landing components - Hero, Features, Technology, DataModels, LiveDemo, Footer
 * 
 * @example
 * ```tsx
 * <Route path="/" element={<LandingPage />} />
 * ```
 */
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TechnologyStack from '../components/landing/TechnologyStack';
import DataModelsShowcase from '../components/landing/DataModelsShowcase';
import LiveDemoSection from '../components/landing/LiveDemoSection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-white">
            <HeroSection />
            <FeaturesSection />
            <TechnologyStack />
            <DataModelsShowcase />
            <LiveDemoSection />
            <Footer />
        </main>
    );
}
