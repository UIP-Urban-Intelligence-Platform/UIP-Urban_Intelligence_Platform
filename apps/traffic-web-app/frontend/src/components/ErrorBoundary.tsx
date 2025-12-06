/**
 * Error Boundary - Graceful Error Handling Component
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/ErrorBoundary
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Error Boundary Component - React error boundary for graceful error handling.
 * Catches JavaScript errors in child components, logs errors, and displays
 * fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Catches rendering errors in component tree
 * - Displays user-friendly error message
 * - Shows error details and component stack in development
 * - Page reload button for error recovery
 * - Error logging to console
 * - Prevents entire app crash from component errors
 * 
 * @dependencies
 * - react@^18.2: Error boundary lifecycle methods
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                    <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
                        <div className="flex items-center mb-6">
                            <svg
                                className="w-12 h-12 text-red-500 mr-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <h1 className="text-3xl font-bold text-red-500">Đã xảy ra lỗi</h1>
                        </div>

                        <p className="text-gray-300 mb-4 text-lg">
                            Ứng dụng đã gặp lỗi không mong đợi. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.
                        </p>

                        {this.state.error && (
                            <div className="bg-gray-900 rounded p-4 mb-4">
                                <p className="text-red-400 font-mono text-sm mb-2">
                                    <strong>Error:</strong> {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="mt-2">
                                        <summary className="text-gray-400 cursor-pointer hover:text-white">
                                            Chi tiết lỗi (Stack trace)
                                        </summary>
                                        <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-64">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                Tải lại trang
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                            >
                                Về trang chủ
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded border border-blue-500">
                            <p className="text-sm text-blue-300">
                                <strong>Gợi ý:</strong> Lỗi này có thể do:
                            </p>
                            <ul className="list-disc list-inside text-sm text-blue-200 mt-2 space-y-1">
                                <li>Kết nối mạng không ổn định</li>
                                <li>Backend server không phản hồi</li>
                                <li>Dữ liệu không hợp lệ từ API</li>
                                <li>Lỗi trong quá trình render component</li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
