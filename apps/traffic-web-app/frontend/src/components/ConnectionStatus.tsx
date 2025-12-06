/**
 * Connection Status Indicator - WebSocket Status Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/ConnectionStatus
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Connection Status Indicator - Displays WebSocket connection status with visual feedback.
 * Shows connection state, reconnection attempts, and error messages.
 * 
 * Features:
 * - Real-time connection status (connected, connecting, disconnected)
 * - Reconnection attempt counter
 * - Error message display
 * - Color-coded status indicators (green, yellow, red)
 * - Animated icons for visual feedback
 * 
 * @dependencies
 * - lucide-react@^0.294: Icon library (Wifi, WifiOff, Loader2, AlertTriangle)
 */

import React from 'react';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  reconnectCount?: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connected,
  connecting,
  error,
  reconnectCount = 0
}) => {
  const getStatusConfig = () => {
    if (error) {
      return {
        bgColor: 'bg-red-50 border-red-200',
        text: 'Connection Error',
        Icon: AlertTriangle,
        pulse: false,
        iconColor: 'text-red-600',
        textColor: 'text-red-700'
      };
    }
    if (connecting || reconnectCount > 0) {
      return {
        bgColor: 'bg-amber-50 border-amber-200',
        text: reconnectCount > 0 ? `Reconnecting (${reconnectCount})...` : 'Connecting...',
        Icon: Loader2,
        pulse: true,
        iconColor: 'text-amber-600',
        textColor: 'text-amber-700'
      };
    }
    if (connected) {
      return {
        bgColor: 'bg-green-50 border-green-200',
        text: 'Connected',
        Icon: Wifi,
        pulse: false,
        iconColor: 'text-green-600',
        textColor: 'text-green-700'
      };
    }
    return {
      bgColor: 'bg-gray-50 border-gray-200',
      text: 'Disconnected',
      Icon: WifiOff,
      pulse: false,
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700'
    };
  };

  const status = getStatusConfig();
  const Icon = status.Icon;

  // Không hiển thị khi đã connected
  if (connected && !connecting && !error) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-[9999] ${status.bgColor} border rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3 animate-slide-in-right`}>
      <div className="relative flex items-center justify-center">
        <Icon
          className={`w-5 h-5 ${status.iconColor} ${status.pulse ? 'animate-spin' : ''}`}
        />
      </div>
      <div>
        <div className={`text-sm font-semibold ${status.textColor}`}>{status.text}</div>
        {error && (
          <div className="text-xs text-red-600 mt-0.5">{error.message}</div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
