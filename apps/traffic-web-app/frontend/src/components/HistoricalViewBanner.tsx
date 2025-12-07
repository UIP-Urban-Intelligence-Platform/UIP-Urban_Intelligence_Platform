/**
 * Historical View Banner - Time Machine Status Indicator
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/HistoricalViewBanner
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Banner notification component displayed when viewing historical data instead of real-time
 * feeds. Shows selected timestamp, available data counts, and close button to return to
 * live mode. Provides visual context to prevent confusion between historical and current data.
 * 
 * Core features:
 * - Prominent timestamp display with clock icon
 * - Data availability counts (weather, air quality, patterns, accidents)
 * - Warning icon for historical mode indicator
 * - Dismissible close button
 * - Sticky positioning at top of viewport
 * 
 * @dependencies
 * - react@18.2.0 - Functional component
 * - lucide-react@0.263.1 - Clock, AlertTriangle, X icons
 * 
 * @example
 * ```tsx
 * <HistoricalViewBanner
 *   timestamp={new Date('2025-11-29T14:30:00')}
 *   dataCount={{ weather: 45, airQuality: 38, patterns: 12, accidents: 3 }}
 *   onClose={() => setHistoricalMode(false)}
 * />
 * ```
 */
import React from 'react';
import { Clock, AlertTriangle, X } from 'lucide-react';

interface HistoricalViewBannerProps {
  timestamp: Date;
  dataCount: {
    weather: number;
    airQuality: number;
    patterns: number;
    accidents: number;
  };
  onClose?: () => void;
}

const HistoricalViewBanner: React.FC<HistoricalViewBannerProps> = ({ timestamp, dataCount, onClose }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none animate-slide-in-right">
      <div className="bg-white text-gray-900 px-5 py-3 rounded-xl shadow-lg border border-gray-200 backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 bg-gray-100 rounded-full p-2">
            <Clock className="w-4 h-4 text-gray-600" />
          </div>

          {/* Content */}
          <div>
            <div className="font-semibold text-sm mb-0.5 flex items-center gap-2 text-gray-900">
              Historical View Mode
            </div>
            <div className="text-xs text-gray-600 font-medium">
              Viewing data from{' '}
              <span className="font-semibold bg-gray-100 text-gray-900 px-2 py-0.5 rounded">
                {timestamp.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                {' at '}
                {timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-2 ml-3 border-l border-gray-200 pl-3">
            <div className="text-center bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
              <div className="text-base font-bold text-gray-900">{dataCount.weather}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Weather</div>
            </div>
            <div className="text-center bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
              <div className="text-base font-bold text-gray-900">{dataCount.airQuality}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">AQI</div>
            </div>
            <div className="text-center bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
              <div className="text-base font-bold text-gray-900">{dataCount.patterns}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Patterns</div>
            </div>
            <div className="text-center bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
              <div className="text-base font-bold text-gray-900">{dataCount.accidents}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">Accidents</div>
            </div>
          </div>

          {/* Warning Icon */}
          <div className="flex-shrink-0">
            <div className="bg-amber-100 text-amber-700 rounded-full p-1.5 shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg p-2 transition-all hover:shadow-md shadow-sm"
              title="Close Historical View"
            >
              <X className="w-5 h-5" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalViewBanner;
