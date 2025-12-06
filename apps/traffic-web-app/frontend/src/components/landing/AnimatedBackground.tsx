/**
 * Animated Background - Canvas Particle System
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/landing/AnimatedBackground
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Canvas-based animated background component rendering floating particles with gentle
 * motion. Used across multiple landing page sections to create visual interest and
 * modern aesthetic. Optimized for performance with requestAnimationFrame.
 * 
 * Core features:
 * - HTML5 Canvas particle system
 * - 80 floating particles with random speeds
 * - Multi-color palette (blue, indigo, purple, pink)
 * - Opacity variations for depth effect
 * - Responsive canvas sizing
 * - Smooth 60fps animations
 * 
 * @dependencies
 * - react@18.2.0 - useEffect, useRef hooks for canvas lifecycle
 * 
 * @example
 * ```tsx
 * <AnimatedBackground />
 * ```
 */
import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
}

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle colors - soft and modern
        const colors = [
            'rgba(59, 130, 246, 0.4)',   // blue
            'rgba(139, 92, 246, 0.4)',   // purple
            'rgba(236, 72, 153, 0.4)',   // pink
            'rgba(6, 182, 212, 0.4)',    // cyan
            'rgba(168, 85, 247, 0.4)',   // violet
        ];

        // Create particles
        const particles: Particle[] = [];
        const particleCount = 60;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        // Animation
        let animationFrameId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, 'rgba(248, 250, 252, 0.5)');
            gradient.addColorStop(0.5, 'rgba(241, 245, 249, 0.3)');
            gradient.addColorStop(1, 'rgba(248, 250, 252, 0.5)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach((particle, index) => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around screen
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                const particleGradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size
                );
                particleGradient.addColorStop(0, particle.color);
                particleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = particleGradient;
                ctx.fill();

                // Draw connections
                particles.forEach((otherParticle, otherIndex) => {
                    if (index === otherIndex) return;

                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        const opacity = (1 - distance / 150) * 0.15;
                        ctx.strokeStyle = `rgba(100, 116, 139, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'normal' }}
        />
    );
}
