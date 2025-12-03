import React, { useState, useEffect, useRef } from 'react';

/**
 * @fileoverview InvestigatorPanel Component - AI Vision Analysis Display
 * @module apps/traffic-web-app/frontend/src/components/agents/InvestigatorPanel
 *
 * @description
 * Displays results from GraphInvestigatorAgent with:
 * - Split view: Camera snapshot (left) vs Analysis (right)
 * - AI Vision: Bounding boxes on image using canvas
 * - External Context: News ticker showing related headlines
 * - Verdict: Summary card merging internal sensor data with external visual/news context
 *
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 *
 * @license
 * SPDX-License-Identifier: MIT
 *
 * This file is part of HCMC Traffic Monitoring System.
 *
 * Licensed under MIT License (see LICENSE).
 *
 * @see {@link https://github.com/your-org/hcmc-traffic|GitHub Repository}
 * @see {@link https://hcmc-traffic.docs.io|Documentation}
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface BoundingBox {
    label: string;
    confidence: number;
    box: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    color: string;
}

interface NewsHeadline {
    id: string;
    title: string;
    source: string;
    timestamp: string;
    relevanceScore: number;
    url: string;
}

interface SensorData {
    type: 'traffic' | 'weather' | 'airquality';
    label: string;
    value: string | number;
    severity: 'normal' | 'warning' | 'critical';
    icon: string;
}

interface VerdictItem {
    category: 'visual' | 'sensor' | 'external' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    severity: 'info' | 'warning' | 'critical';
}

interface InvestigationResult {
    cameraId: string;
    cameraName: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    timestamp: string;
    snapshot: {
        url: string;
        width: number;
        height: number;
    };
    aiDetections: BoundingBox[];
    externalNews: NewsHeadline[];
    sensorData: SensorData[];
    verdict: {
        summary: string;
        confidence: number;
        severity: 'normal' | 'warning' | 'critical';
        items: VerdictItem[];
        recommendations: string[];
    };
}

interface InvestigatorPanelProps {
    investigationResult: InvestigationResult | null;
    onClose?: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    availableCameras?: Array<{ id: string; name: string }>;
    onCameraChange?: (cameraId: string) => void;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export const InvestigatorPanel: React.FC<InvestigatorPanelProps> = ({
    investigationResult,
    onClose,
    onRefresh,
    isLoading = false,
    availableCameras = [],
    onCameraChange
}) => {
    const [selectedDetection, setSelectedDetection] = useState<BoundingBox | null>(null);
    const [showCameraDropdown, setShowCameraDropdown] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // =====================================================
    // CANVAS DRAWING - AI VISION BOUNDING BOXES
    // =====================================================

    const drawBoundingBoxes = () => {
        if (!canvasRef.current || !imageRef.current || !investigationResult) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imageRef.current;

        // Set canvas size to match image natural dimensions
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each bounding box
        investigationResult.aiDetections.forEach((detection) => {
            const { box, label, confidence, color } = detection;

            // Scale box coordinates to canvas size
            const scaleX = canvas.width / investigationResult.snapshot.width;
            const scaleY = canvas.height / investigationResult.snapshot.height;

            const x = box.x * scaleX;
            const y = box.y * scaleY;
            const width = box.width * scaleX;
            const height = box.height * scaleY;

            // Draw rectangle
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // Highlight if selected
            if (selectedDetection?.label === label) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 5;
                ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
            }

            // Draw label background
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.8;
            const labelText = `${label} (${(confidence * 100).toFixed(0)}%)`;
            const metrics = ctx.measureText(labelText);
            const padding = 4;
            ctx.fillRect(x, y - 25, metrics.width + padding * 2, 25);

            // Draw label text
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(labelText, x + padding, y - 8);
        });
    };

    // Redraw when image loads or detections change
    useEffect(() => {
        if (imageRef.current && imageRef.current.complete) {
            drawBoundingBoxes();
        }
    }, [investigationResult, selectedDetection]);

    // =====================================================
    // SEVERITY STYLING
    // =====================================================

    const getSeverityColor = (severity: 'normal' | 'warning' | 'critical' | 'info') => {
        switch (severity) {
            case 'critical':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-gray-900';
            case 'info':
                return 'bg-blue-500 text-white';
            case 'normal':
            default:
                return 'bg-green-500 text-white';
        }
    };

    const getSeverityBorder = (severity: 'normal' | 'warning' | 'critical' | 'info') => {
        switch (severity) {
            case 'critical':
                return 'border-red-500';
            case 'warning':
                return 'border-yellow-500';
            case 'info':
                return 'border-blue-500';
            case 'normal':
            default:
                return 'border-green-500';
        }
    };

    // =====================================================
    // LOADING STATE
    // =====================================================

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-2xl">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                        <p className="text-lg font-semibold text-gray-700">Investigating scene...</p>
                        <p className="text-sm text-gray-500">Analyzing camera feed, fetching external data</p>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // EMPTY STATE
    // =====================================================

    if (!investigationResult) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="text-6xl">🔍</div>
                        <p className="text-lg font-semibold text-gray-700">No investigation data</p>
                        <p className="text-sm text-gray-500 text-center">
                            Select a camera and trigger investigation to see AI vision analysis
                        </p>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN PANEL RENDER
    // =====================================================

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">

                {/* HEADER - COMPACT */}
                <div className={`flex items-center justify-between p-3 border-b-4 ${getSeverityBorder(investigationResult.verdict.severity)}`} style={{ backgroundColor: '#111827', color: 'white' }}>
                    <div className="flex items-center space-x-3">
                        <div className="text-2xl">🔍</div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Phân Tích Camera</h2>
                            <p className="text-xs text-gray-300">
                                {investigationResult.cameraName} • {new Date(investigationResult.timestamp).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Camera Selector Dropdown */}
                        {availableCameras.length > 1 && onCameraChange && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowCameraDropdown(!showCameraDropdown)}
                                    className="px-3 py-1.5 text-sm text-white rounded-lg transition-colors shadow-md hover:opacity-80 flex items-center space-x-1"
                                    style={{ backgroundColor: '#111827' }}
                                    title="Chọn camera khác"
                                >
                                    <span>📷</span>
                                    <span className="text-xs">({availableCameras.length})</span>
                                    <span className="text-xs">{showCameraDropdown ? '▲' : '▼'}</span>
                                </button>
                                {showCameraDropdown && (
                                    <div
                                        className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                                        style={{
                                            zIndex: 10000,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            minWidth: '280px'
                                        }}
                                    >
                                        {availableCameras.map((camera) => (
                                            <button
                                                key={camera.id}
                                                onClick={() => {
                                                    onCameraChange(camera.id);
                                                    setShowCameraDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                                                style={{
                                                    color: '#111827',
                                                    backgroundColor: camera.id === investigationResult.cameraId ? '#f3f4f6' : 'white'
                                                }}
                                            >
                                                <div className="font-medium">{camera.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{camera.id}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="px-3 py-1.5 text-sm text-white rounded-lg transition-colors shadow-md hover:opacity-80"
                                style={{ backgroundColor: '#111827' }}
                                title="Làm mới"
                            >
                                🔄
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-bold"
                                title="Đóng"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* SEVERITY BADGE - SIMPLE */}
                <div className={`py-2 px-4 text-center font-bold ${getSeverityColor(investigationResult.verdict.severity)}`}>
                    {investigationResult.verdict.severity === 'critical' && '🚨 NGHIÊM TRỌNG'}
                    {investigationResult.verdict.severity === 'warning' && '⚠️ CẢNH BÁO'}
                    {investigationResult.verdict.severity === 'normal' && '✅ BÌNH THƯỜNG'}
                    <span className="ml-3 font-normal text-sm">Độ tin cậy: {(investigationResult.verdict.confidence * 100).toFixed(0)}%</span>
                </div>

                {/* MAIN CONTENT - SCROLLABLE SINGLE COLUMN */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="max-w-4xl mx-auto space-y-4">

                        {/* CAMERA SNAPSHOT */}
                        <div className="bg-white rounded-lg shadow-lg p-4" key={investigationResult.cameraId}>
                            <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                                <span>📷</span>
                                <span>Hình Ảnh Camera</span>
                            </h3>
                            <div className="bg-gray-900 rounded-lg overflow-hidden">
                                <div className="relative w-full">
                                    <img
                                        ref={imageRef}
                                        src={investigationResult.snapshot.url}
                                        alt="Camera snapshot"
                                        onLoad={drawBoundingBoxes}
                                        className="w-full h-auto block"
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute top-0 left-0 pointer-events-none"
                                        style={{ position: 'absolute', top: 0, left: 0 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* VERDICT SUMMARY */}
                        <div className={`bg-white rounded-lg shadow-lg p-4 border-l-4 ${getSeverityBorder(investigationResult.verdict.severity)}`}>
                            <h3 className="text-lg font-bold mb-2 flex items-center space-x-2" style={{ color: '#111827' }}>
                                <span>📊</span>
                                <span>Kết Quả Phân Tích</span>
                            </h3>
                            <p className="mb-3 leading-relaxed" style={{ color: '#111827' }}>{investigationResult.verdict.summary}</p>

                            {/* RECOMMENDATIONS */}
                            {investigationResult.verdict.recommendations.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: '#E5E7EB' }}>
                                    <p className="font-semibold mb-2 text-sm" style={{ color: '#111827' }}>💡 Khuyến Nghị:</p>
                                    <ul className="space-y-1">
                                        {investigationResult.verdict.recommendations.map((rec, idx) => (
                                            <li key={idx} className="text-sm flex items-start space-x-2" style={{ color: '#111827' }}>
                                                <span className="flex-shrink-0 mt-0.5">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* AI DETECTIONS */}
                        {investigationResult.aiDetections.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-4">
                                <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                                    <span>🤖</span>
                                    <span>Phát Hiện AI ({investigationResult.aiDetections.length})</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {investigationResult.aiDetections.map((detection, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDetection(detection)}
                                            className={`text-left p-2 rounded-lg border-2 transition-all hover:shadow-md ${selectedDetection?.label === detection.label
                                                ? 'border-yellow-400 bg-yellow-50'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm" style={{ color: '#111827' }}>{detection.label}</span>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: detection.color, color: 'white' }}>
                                                    {(detection.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SENSOR DATA */}
                        {investigationResult.sensorData.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-4">
                                <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                                    <span>📡</span>
                                    <span>Dữ Liệu Cảm Biến</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {investigationResult.sensorData.map((sensor, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border-2 ${sensor.severity === 'critical' ? 'border-red-300 bg-red-50' :
                                            sensor.severity === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                                                'border-green-300 bg-green-50'
                                            }`}>
                                            <div className="text-2xl mb-1">{sensor.icon}</div>
                                            <div className="text-xs font-semibold text-gray-500">{sensor.label}</div>
                                            <div className="text-sm font-bold" style={{ color: '#111827' }}>{sensor.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* EXTERNAL NEWS */}
                        {investigationResult.externalNews.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-4">
                                <h3 className="text-lg font-bold mb-3 flex items-center space-x-2" style={{ color: '#111827' }}>
                                    <span>📰</span>
                                    <span>Tin Tức Liên Quan</span>
                                </h3>
                                <div className="space-y-2">
                                    {investigationResult.externalNews.slice(0, 3).map((news) => (
                                        <a
                                            key={news.id}
                                            href={news.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#111827'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold line-clamp-2" style={{ color: '#111827' }}>{news.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{news.source} • {new Date(news.timestamp).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                <span className="text-xs font-bold ml-2" style={{ color: '#111827' }}>{(news.relevanceScore * 100).toFixed(0)}%</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestigatorPanel;
