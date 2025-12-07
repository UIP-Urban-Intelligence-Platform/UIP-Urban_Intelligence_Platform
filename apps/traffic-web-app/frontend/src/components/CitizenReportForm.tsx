/**
 * Citizen Report Submission Form - Crowdsourced Report Input
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/CitizenReportForm
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Citizen Report Submission Form - Form for submitting crowdsourced reports.
 * Supports multiple report types, photo uploads, and location capture.
 * 
 * Features:
 * - Multi-step form (type selection, details, location, photo)
 * - Photo upload with preview and compression
 * - Automatic location capture from map
 * - Form validation with error messages
 * - Success/error feedback
 * - Report types: Air Quality, Congestion, Accident, Infrastructure
 * 
 * @dependencies
 * - lucide-react@^0.294: Form icons
 * - citizenReportService: API client for report submission
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { citizenReportService } from '../services/citizenReportService';
import { ReportType } from '../types/citizenReport';

interface CitizenReportFormProps {
    onReportSubmitted?: (reportId: string) => void;
    onClose?: () => void;
    initialLocation?: { lat: number; lng: number };
}

export const CitizenReportForm: React.FC<CitizenReportFormProps> = ({
    onReportSubmitted,
    onClose,
    initialLocation
}) => {
    const [userId, setUserId] = useState('user_' + Math.random().toString(36).substring(7));
    const [reportType, setReportType] = useState<ReportType>('traffic_jam');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState(initialLocation?.lat || 10.791);
    const [longitude, setLongitude] = useState(initialLocation?.lng || 106.691);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [reportId, setReportId] = useState<string | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check geolocation permission status on mount (don't auto-get to avoid loops)
    useEffect(() => {
        const checkPermission = async () => {
            // Check if running on HTTPS or localhost (required for geolocation)
            const isSecureContext = window.isSecureContext ||
                window.location.protocol === 'https:' ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';

            if (!isSecureContext) {
                console.warn('⚠️ Geolocation requires HTTPS or localhost');
                setLocationPermission('denied');
                return;
            }

            if ('permissions' in navigator) {
                try {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
                    console.log('📍 Initial permission state:', result.state);

                    // Listen for permission changes (but don't auto-trigger location)
                    result.onchange = () => {
                        const newState = result.state as 'granted' | 'denied' | 'prompt';
                        setLocationPermission(newState);
                        console.log('🔄 Geolocation permission changed to:', newState);
                    };
                } catch (err) {
                    console.warn('⚠️ Could not query geolocation permission:', err);
                    setLocationPermission('unknown');
                }
            } else {
                setLocationPermission('unknown');
            }
        };

        checkPermission();
    }, []);

    // Update location when initialLocation prop changes (e.g., user clicks on map)
    useEffect(() => {
        if (initialLocation) {
            setLatitude(Number(initialLocation.lat.toFixed(6)));
            setLongitude(Number(initialLocation.lng.toFixed(6)));
            setErrorMessage(''); // Clear error when location is set from map
        }
    }, [initialLocation]);

    const reportTypes: { value: ReportType; label: string; icon: string }[] = [
        { value: 'traffic_jam', label: 'Traffic Jam', icon: '🚦' },
        { value: 'accident', label: 'Accident', icon: '🚨' },
        { value: 'flood', label: 'Flood', icon: '🌊' },
        { value: 'road_damage', label: 'Road Damage', icon: '🕳️' },
        { value: 'other', label: 'Other', icon: '⚠️' }
    ];

    const handleGetCurrentLocation = () => {
        // Check if running on secure context (HTTPS or localhost)
        const isSecureContext = window.isSecureContext ||
            window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (!isSecureContext) {
            setErrorMessage(`📍 GPS requires HTTPS. Please click on the map to select location.`);
            return;
        }

        setIsGettingLocation(true);
        setErrorMessage(''); // Clear previous error

        if ('geolocation' in navigator) {
            console.log('🔍 Attempting to get geolocation...', {
                protocol: window.location.protocol,
                hostname: window.location.hostname,
                isSecureContext: window.isSecureContext,
                currentPermission: locationPermission
            });

            let locationFound = false;
            let watchId: number | null = null;

            // Set a timeout to stop watching after 10 seconds
            const timeoutId = setTimeout(() => {
                if (!locationFound && watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                    setIsGettingLocation(false);
                    setErrorMessage(`📍 Không thể lấy vị trí GPS.

🗺️ Vui lòng click trực tiếp vào bản đồ phía sau form này để chọn vị trí!

💡 Nếu muốn dùng GPS, hãy kiểm tra:
• Windows Settings → Privacy → Location → ON
• Tắt VPN/Privacy extensions
• Mở trang trong Incognito mode`);
                }
            }, 10000);

            // Use watchPosition for better compatibility
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (locationFound) return;
                    locationFound = true;

                    clearTimeout(timeoutId);
                    if (watchId !== null) {
                        navigator.geolocation.clearWatch(watchId);
                    }

                    console.log('✅ Geolocation success:', {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });

                    setLatitude(Number(position.coords.latitude.toFixed(6)));
                    setLongitude(Number(position.coords.longitude.toFixed(6)));
                    setIsGettingLocation(false);
                    setLocationPermission('granted');
                    setErrorMessage(`✅ Đã lấy vị trí GPS (độ chính xác: ${Math.round(position.coords.accuracy)}m)`);

                    // Clear success message after 3 seconds
                    setTimeout(() => setErrorMessage(''), 3000);
                },
                (error) => {
                    if (locationFound) return;
                    locationFound = true;

                    clearTimeout(timeoutId);
                    if (watchId !== null) {
                        navigator.geolocation.clearWatch(watchId);
                    }

                    console.error('❌ Geolocation error:', {
                        code: error.code,
                        message: error.message
                    });

                    setIsGettingLocation(false);

                    // Simple, actionable error message
                    if (error.code === 1) { // PERMISSION_DENIED
                        setLocationPermission('denied');
                    }

                    setErrorMessage(`📍 Không thể lấy vị trí GPS.

🗺️ Vui lòng click trực tiếp vào bản đồ phía sau form này để chọn vị trí!

💡 Nếu muốn dùng GPS, hãy kiểm tra:
• Windows Settings → Privacy → Location → ON
• Tắt VPN/Privacy extensions  
• Mở trang trong Incognito mode`);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000 // Accept cached position up to 5 minutes
                }
            );
        } else {
            setErrorMessage('📍 Browser không hỗ trợ GPS. Vui lòng click vào bản đồ để chọn vị trí.');
            setIsGettingLocation(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setErrorMessage('Image size must be less than 10MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                setErrorMessage('Please select a valid image file');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setErrorMessage('');
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            // Validate inputs
            if (!userId.trim()) {
                throw new Error('User ID is required');
            }

            if (!imageFile) {
                throw new Error('Please select an image');
            }

            if (latitude < -90 || latitude > 90) {
                throw new Error('Latitude must be between -90 and 90');
            }

            if (longitude < -180 || longitude > 180) {
                throw new Error('Longitude must be between -180 and 180');
            }

            // Upload image first
            const imageUrl = await citizenReportService.uploadImage(imageFile);

            // Submit report
            const result = await citizenReportService.submitReport({
                userId: userId.trim(),
                reportType,
                description: description.trim() || undefined,
                latitude,
                longitude,
                imageUrl,
                timestamp: new Date().toISOString()
            });

            if (result.status === 'accepted') {
                setSubmitStatus('success');
                setReportId(result.reportId);
                onReportSubmitted?.(result.reportId);

                // Reset form after 2 seconds
                setTimeout(() => {
                    resetForm();
                }, 2000);
            } else {
                throw new Error(result.message || 'Report was rejected');
            }

        } catch (error) {
            console.error('Failed to submit report:', error);
            setSubmitStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setUserId('user_' + Math.random().toString(36).substring(7));
        setReportType('traffic_jam');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
        setSubmitStatus('idle');
        setErrorMessage('');
        setReportId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Camera className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Report Traffic Incident</h2>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Success/Error Message */}
            {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-green-800">Report Submitted Successfully!</p>
                        <p className="text-sm text-green-700">Report ID: {reportId}</p>
                        <p className="text-sm text-green-600 mt-1">Your report is being processed and will appear on the map shortly.</p>
                    </div>
                </div>
            )}

            {submitStatus === 'error' && errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800">Submission Failed</p>
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* Location Error Message */}
            {submitStatus !== 'error' && errorMessage && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800">Location Notice</p>
                        <p className="text-sm text-amber-700 whitespace-pre-line">{errorMessage}</p>
                        <p className="text-xs text-amber-600 mt-2">
                            💡 Alternative: Click anywhere on the map behind this form to set your location.
                        </p>
                    </div>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* User ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        User ID
                    </label>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                        placeholder="Enter your user ID"
                        required
                    />
                </div>

                {/* Report Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Incident Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {reportTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setReportType(type.value)}
                                className={`p-4 border-2 rounded-lg transition-all ${reportType === type.value
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{type.icon}</div>
                                <div className="text-sm font-medium text-gray-800">{type.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-400"
                        placeholder="Provide additional details about the incident..."
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-700 font-medium">
                            🗺️ Cách chọn vị trí: Click trực tiếp vào bản đồ phía sau form này!
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Hoặc nhấn nút GPS bên dưới (có thể không hoạt động trên một số máy tính)
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Latitude</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={latitude}
                                onChange={(e) => setLatitude(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                                placeholder="Latitude"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Longitude</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={longitude}
                                onChange={(e) => setLongitude(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                                placeholder="Longitude"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={isGettingLocation}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 border border-gray-300"
                            title="Thử lấy vị trí từ GPS (có thể không hoạt động)"
                        >
                            {isGettingLocation ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <MapPin className="w-4 h-4" />
                            )}
                            {isGettingLocation ? 'Đang lấy GPS...' : 'Thử GPS'}
                        </button>
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Photo Evidence <span className="text-red-500">*</span>
                    </label>

                    {!imagePreview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                        >
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium mb-1">Click to upload image</p>
                            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-64 object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting || !imageFile}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Camera className="w-5 h-5" />
                                Submit Report
                            </>
                        )}
                    </button>
                    {submitStatus !== 'idle' && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
