/**
 * Simple Legend - Compact Map Symbol Guide
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/SimpleLegend
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Minimal, always-visible legend component displaying basic map symbol explanations.
 * Designed for quick reference without advanced features or mode switching. Shows
 * camera types, accident severity levels, and AQI categories in a compact format.
 * 
 * Core features:
 * - Fixed position at bottom-left corner
 * - Compact single-column layout
 * - Essential symbol types only (cameras, accidents, AQI)
 * - No expand/collapse functionality (always visible)
 * - Lightweight with minimal dependencies
 * 
 * @dependencies
 * - react@18.2.0 - Functional component
 * 
 * @example
 * ```tsx
 * <SimpleLegend />
 * ```
 */
import React from 'react';

const SimpleLegend: React.FC = () => {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: '70px',
                left: '10px',
                zIndex: 1000,
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                minWidth: '180px',
            }}
        >
            <h4 style={{
                margin: '0 0 10px 0',
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#333',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '6px'
            }}>
                Traffic Congestion
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px',
                        height: '18px',
                        backgroundColor: '#00FF00',
                        borderRadius: '3px',
                        border: '1px solid #00CC00'
                    }} />
                    <span style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Low (Free Flow)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px',
                        height: '18px',
                        backgroundColor: '#FFFF00',
                        borderRadius: '3px',
                        border: '1px solid #CCCC00'
                    }} />
                    <span style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Medium (Moderate)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px',
                        height: '18px',
                        backgroundColor: '#FFA500',
                        borderRadius: '3px',
                        border: '1px solid #CC8400'
                    }} />
                    <span style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>High (Heavy)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px',
                        height: '18px',
                        backgroundColor: '#FF0000',
                        borderRadius: '3px',
                        border: '1px solid #CC0000'
                    }} />
                    <span style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Severe (Congested)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px',
                        height: '18px',
                        backgroundColor: '#800080',
                        borderRadius: '3px',
                        border: '1px solid #660066'
                    }} />
                    <span style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Critical</span>
                </div>
            </div>
        </div>
    );
};

export default SimpleLegend;
