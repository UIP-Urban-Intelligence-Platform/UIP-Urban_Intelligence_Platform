/**
 * Hero Animated Background - Enhanced Particle Effects
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/landing/HeroAnimatedBackground
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * Enhanced animated background specifically designed for hero section with more dramatic
 * particle effects including pulsing animations and interconnected lines. Creates striking
 * first impression with dynamic network visualization aesthetic.
 * 
 * Core features:
 * - 100 particles with pulsing size animations
 * - Connection lines between nearby particles
 * - Gradient color scheme (cyan, blue, indigo, purple)
 * - Variable particle speeds and sizes
 * - Distance-based line opacity
 * - Full-screen responsive canvas
 * 
 * @dependencies
 * - react@18.2.0 - useEffect, useRef for canvas management
 * 
 * @example
 * ```tsx
 * <HeroAnimatedBackground />
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
    pulseSpeed: number;
    pulsePhase: number;
}

interface FlowLine {
    x: number;
    y: number;
    length: number;
    speed: number;
    angle: number;
    opacity: number;
    width: number;
    color: string;
}

interface GradientOrb {
    x: number;
    y: number;
    radius: number;
    speedX: number;
    speedY: number;
    color1: string;
    color2: string;
    phase: number;
    phaseSpeed: number;
}

export default function HeroAnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Set canvas size
        const updateCanvasSize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        // Create particles
        const particles: Particle[] = [];
        for (let i = 0; i < 80; i++) {
            const colors = [
                'rgba(148, 163, 184, 0.4)',   // slate-400
                'rgba(203, 213, 225, 0.4)',   // slate-300
                'rgba(226, 232, 240, 0.4)',   // slate-200
                'rgba(241, 245, 249, 0.4)',   // slate-100
                'rgba(156, 163, 175, 0.4)',   // gray-400
            ];
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                color: colors[Math.floor(Math.random() * colors.length)],
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        // Create flow lines
        const flowLines: FlowLine[] = [];
        for (let i = 0; i < 15; i++) {
            const colors = [
                'rgba(148, 163, 184, 0.3)',
                'rgba(203, 213, 225, 0.3)',
                'rgba(226, 232, 240, 0.3)',
            ];
            flowLines.push({
                x: Math.random() * width,
                y: Math.random() * height,
                length: Math.random() * 100 + 50,
                speed: Math.random() * 2 + 1,
                angle: Math.random() * Math.PI * 2,
                opacity: Math.random() * 0.3 + 0.2,
                width: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        // Create gradient orbs
        const orbs: GradientOrb[] = [];
        for (let i = 0; i < 4; i++) {
            const colorPairs = [
                { c1: 'rgba(148, 163, 184, 0.08)', c2: 'rgba(203, 213, 225, 0.08)' },
                { c1: 'rgba(203, 213, 225, 0.08)', c2: 'rgba(226, 232, 240, 0.08)' },
                { c1: 'rgba(156, 163, 175, 0.08)', c2: 'rgba(148, 163, 184, 0.08)' },
            ];
            const pair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
            orbs.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 150 + 100,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                color1: pair.c1,
                color2: pair.c2,
                phase: Math.random() * Math.PI * 2,
                phaseSpeed: Math.random() * 0.01 + 0.005
            });
        }

        let gridPhase = 0;

        // Animation loop
        let animationId: number;
        const animate = () => {
            // Clear canvas with trail effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, width, height);

            // Draw gradient orbs
            orbs.forEach(orb => {
                orb.x += orb.speedX;
                orb.y += orb.speedY;
                orb.phase += orb.phaseSpeed;

                if (orb.x > width + orb.radius) orb.x = -orb.radius;
                if (orb.x < -orb.radius) orb.x = width + orb.radius;
                if (orb.y > height + orb.radius) orb.y = -orb.radius;
                if (orb.y < -orb.radius) orb.y = height + orb.radius;

                const gradient = ctx.createRadialGradient(
                    orb.x, orb.y, 0,
                    orb.x, orb.y, orb.radius * (Math.sin(orb.phase) * 0.2 + 1)
                );
                gradient.addColorStop(0, orb.color1);
                gradient.addColorStop(1, orb.color2);

                ctx.save();
                ctx.filter = 'blur(40px)';
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Draw grid
            const gridSize = 50;
            const waveAmplitude = 30;
            const waveFrequency = 0.005;

            ctx.save();
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.lineWidth = 1;

            for (let x = 0; x < width; x += gridSize) {
                ctx.beginPath();
                for (let y = 0; y < height; y += 2) {
                    const offset = Math.sin(y * waveFrequency + gridPhase + x * 0.01) * waveAmplitude;
                    if (y === 0) {
                        ctx.moveTo(x + offset, y);
                    } else {
                        ctx.lineTo(x + offset, y);
                    }
                }
                ctx.stroke();
            }

            for (let y = 0; y < height; y += gridSize) {
                ctx.beginPath();
                for (let x = 0; x < width; x += 2) {
                    const offset = Math.sin(x * waveFrequency + gridPhase + y * 0.01) * waveAmplitude;
                    if (x === 0) {
                        ctx.moveTo(x, y + offset);
                    } else {
                        ctx.lineTo(x, y + offset);
                    }
                }
                ctx.stroke();
            }

            ctx.restore();
            gridPhase += 0.01;

            // Draw flow lines
            flowLines.forEach(line => {
                line.x += Math.cos(line.angle) * line.speed;
                line.y += Math.sin(line.angle) * line.speed;

                if (line.x > width + 100) line.x = -100;
                if (line.x < -100) line.x = width + 100;
                if (line.y > height + 100) line.y = -100;
                if (line.y < -100) line.y = height + 100;

                ctx.save();
                ctx.globalAlpha = line.opacity;
                ctx.strokeStyle = line.color;
                ctx.lineWidth = line.width;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = line.color;

                ctx.beginPath();
                ctx.moveTo(line.x, line.y);
                ctx.lineTo(
                    line.x + Math.cos(line.angle) * line.length,
                    line.y + Math.sin(line.angle) * line.length
                );
                ctx.stroke();
                ctx.restore();
            });

            // Update and draw particles
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.pulsePhase += particle.pulseSpeed;
                const pulse = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
                particle.opacity = pulse * 0.6;

                if (particle.x > width) particle.x = 0;
                if (particle.x < 0) particle.x = width;
                if (particle.y > height) particle.y = 0;
                if (particle.y < 0) particle.y = height;

                ctx.save();
                ctx.globalAlpha = particle.opacity;
                ctx.fillStyle = particle.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.save();
                        const opacity = (1 - distance / 150) * 0.3;
                        ctx.globalAlpha = opacity;
                        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDuration: '8s' }} />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Top vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60" />
        </div>
    );
}
