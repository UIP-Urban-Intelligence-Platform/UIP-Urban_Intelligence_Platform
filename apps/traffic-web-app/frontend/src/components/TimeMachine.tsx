/**
 * Time Machine - Historical Data Explorer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/TimeMachine
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Time Machine Component - Historical data time-travel interface.
 * Allows users to query and visualize historical traffic, weather, AQI,
 * and accident data for any past date/time.
 * 
 * Features:
 * - Date/time picker for historical queries
 * - SPARQL-based time-series data retrieval from Fuseki
 * - Multi-entity type support (cameras, weather, AQI, accidents, patterns)
 * - Data playback controls (play, pause, speed)
 * - Timeline scrubber for navigation
 * - Snapshot comparison mode
 * - Export historical data
 * 
 * Data Sources:
 * - Fuseki SPARQL endpoint (historical LOD)
 * - TimescaleDB via PostgreSQL (time-series)
 * 
 * @dependencies
 * - date-fns@^2.30: Date manipulation
 * - lucide-react@^0.294: Control icons
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTrafficStore } from '../store/trafficStore';
import { Weather, AirQuality, TrafficPattern, Accident } from '../types';

interface TimeMachineProps {
  visible: boolean;
  onClose: () => void;
  onDataUpdate: (data: HistoricalData) => void;
}

interface HistoricalData {
  timestamp: Date;
  weather: Weather[];
  airQuality: AirQuality[];
  patterns: TrafficPattern[];
  accidents: Accident[];
}

type DateRange = '7days' | '14days' | '30days';
type PlaySpeed = 1 | 2 | 4 | 8;

const TimeMachine: React.FC<TimeMachineProps> = ({ visible, onClose, onDataUpdate }) => {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<number>(12); // Hour (0-23)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<PlaySpeed>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playIntervalRef = useRef<number | null>(null);
  const { cameras } = useTrafficStore();

  // Get date range bounds
  const getDateRangeBounds = useCallback(() => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '14days':
        start.setDate(start.getDate() - 14);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
    }

    return { start, end };
  }, [dateRange]);

  // Format timestamp for SPARQL query
  const formatTimestamp = useCallback((date: Date, hour: number): string => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }, []);

  // Fetch historical data from backend API (which queries Fuseki)
  const fetchHistoricalData = useCallback(async (date: Date, hour: number): Promise<HistoricalData | null> => {
    setIsLoading(true);
    setError(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      const timestamp = formatTimestamp(date, hour);

      // Fetch snapshot data from backend API
      const snapshotResponse = await fetch(
        `${API_URL}/api/historical/snapshot?timestamp=${encodeURIComponent(timestamp)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      let weatherData: Weather[] = [];
      let aqiData: AirQuality[] = [];
      let patternsData: TrafficPattern[] = [];
      let accidentsData: Accident[] = [];

      if (snapshotResponse.ok) {
        const snapshotResult = await snapshotResponse.json();

        if (snapshotResult.success && snapshotResult.data) {
          const data = snapshotResult.data;

          // Transform weather data
          if (data.weather && Array.isArray(data.weather)) {
            weatherData = data.weather.map((item: any) => ({
              id: item.cameraId || item.id,
              location: {
                latitude: item.location?.lat || item.location?.latitude || 0,
                longitude: item.location?.lng || item.location?.longitude || 0,
                district: item.district || 'Unknown'
              },
              temperature: item.temperature || 0,
              humidity: item.humidity || 0,
              rainfall: item.precipitation || item.rainfall || 0,
              windSpeed: item.windSpeed || 0,
              windDirection: item.windDirection || 'N',
              condition: item.condition || 'Clear',
              timestamp: data.timestamp || timestamp
            }));
          }

          // Transform AQI data
          if (data.aqi && Array.isArray(data.aqi)) {
            aqiData = data.aqi.map((item: any) => ({
              id: item.cameraId || item.id,
              location: {
                latitude: item.location?.lat || item.location?.latitude || 0,
                longitude: item.location?.lng || item.location?.longitude || 0,
                station: item.station || 'Unknown'
              },
              aqi: item.aqi || 0,
              pm25: item.pm25 || 0,
              pm10: item.pm10 || 0,
              co: item.co || 0,
              no2: item.no2 || 0,
              so2: item.so2 || 0,
              o3: item.o3 || 0,
              level: (item.level || 'good') as AirQuality['level'],
              timestamp: data.timestamp || timestamp
            }));
          }

          // Transform patterns data
          if (data.patterns && Array.isArray(data.patterns)) {
            patternsData = data.patterns.map((item: any) => ({
              id: item.patternId || item.id,
              patternType: item.patternType || 'normal',
              congestionLevel: (item.congestionLevel || 'low') as TrafficPattern['congestionLevel'],
              timeRange: item.timeRange || '00:00-23:59',
              daysOfWeek: item.daysOfWeek || [],
              affectedCameras: item.affectedCameras || [],
              averageSpeed: item.averageSpeed,
              vehicleCount: item.vehicleCount,
              timestamp: data.timestamp || timestamp
            }));
          }

          // Transform accidents data
          if (data.accidents && Array.isArray(data.accidents)) {
            accidentsData = data.accidents.map((item: any) => ({
              id: item.accidentId || item.id,
              location: {
                latitude: item.location?.lat || item.location?.latitude || 0,
                longitude: item.location?.lng || item.location?.longitude || 0,
                address: item.address || 'Unknown'
              },
              type: (item.type || 'collision') as Accident['type'],
              severity: (item.severity || 'minor') as Accident['severity'],
              description: item.description || '',
              timestamp: item.timestamp || data.timestamp || timestamp,
              resolved: item.resolved || false
            }));
          }
        }
      }

      setIsLoading(false);

      return {
        timestamp: new Date(timestamp),
        weather: weatherData,
        airQuality: aqiData,
        patterns: patternsData,
        accidents: accidentsData
      };
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch historical data');
      setIsLoading(false);
      return null;
    }
  }, [formatTimestamp]);

  // Load data for selected time
  const loadDataForTime = useCallback(async () => {
    const data = await fetchHistoricalData(selectedDate, selectedTime);
    if (data) {
      onDataUpdate(data);
    }
  }, [selectedDate, selectedTime, fetchHistoricalData, onDataUpdate]);

  // Play/pause animation
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Update play speed
  const cycleSpeed = useCallback(() => {
    setPlaySpeed(prev => {
      const speeds: PlaySpeed[] = [1, 2, 4, 8];
      const currentIndex = speeds.indexOf(prev);
      return speeds[(currentIndex + 1) % speeds.length];
    });
  }, []);

  // Auto-advance time when playing
  useEffect(() => {
    if (!isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }

    const intervalMs = 1000 / playSpeed; // Base interval adjusted by speed

    playIntervalRef.current = window.setInterval(() => {
      setSelectedTime(prev => {
        if (prev >= 23) {
          // Move to next day
          setSelectedDate(current => {
            const next = new Date(current);
            next.setDate(next.getDate() + 1);

            const bounds = getDateRangeBounds();
            if (next > bounds.end) {
              setIsPlaying(false);
              return current;
            }
            return next;
          });
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, getDateRangeBounds]);

  // Load data when time changes
  useEffect(() => {
    if (visible) {
      loadDataForTime();
    }
  }, [selectedDate, selectedTime, visible, loadDataForTime]);

  // Handle close
  const handleClose = useCallback(() => {
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const bounds = getDateRangeBounds();
  const minDate = bounds.start.toISOString().split('T')[0];
  const maxDate = bounds.end.toISOString().split('T')[0];
  const currentDateStr = selectedDate.toISOString().split('T')[0];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-5xl">
      <div className="bg-white rounded-t-xl shadow-2xl border-t border-l border-r border-gray-200 backdrop-blur-xl max-h-[45vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full p-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-base tracking-wide">Time Machine - Historical Data Playback</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-white/20 hover:border-white/40 shadow-lg">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Live
            </button>
            <button
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-all hover:scale-110 active:scale-95 shadow-lg"
              title="Close Time Machine"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.88a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3 bg-gray-50">
          {/* Date Range Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-900 whitespace-nowrap">Date Range:</label>
            <div className="flex gap-2">
              {(['7days', '14days', '30days'] as DateRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${dateRange === range
                    ? 'bg-gray-900 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                >
                  {range === '7days' ? 'Last 7 Days' : range === '14days' ? 'Last 14 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-900 whitespace-nowrap">Select Date:</label>
            <input
              type="date"
              value={currentDateStr}
              min={minDate}
              max={maxDate}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-sm font-medium"
            />
            <span className="text-xs text-gray-700 whitespace-nowrap bg-white px-3 py-1.5 rounded-lg font-medium border border-gray-200 shadow-sm">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* Time Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900">Time:</label>
              <div className="text-2xl font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                {selectedTime.toString().padStart(2, '0')}:00
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="23"
                value={selectedTime}
                onChange={(e) => setSelectedTime(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer border border-gray-300"
              />
              {/* Hour markers */}
              <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-medium">
                {Array.from({ length: 24 }, (_, i) => i).filter(h => h % 3 === 0).map(hour => (
                  <span key={hour} className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{hour.toString().padStart(2, '0')}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded-full transition-all shadow-lg hover:scale-110"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Speed Control */}
              <button
                onClick={cycleSpeed}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border border-gray-300 shadow-sm"
                title="Playback speed"
              >
                {playSpeed}x
              </button>

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-1.5 text-xs text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="font-medium">Loading data...</span>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-300 bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-500/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              <div className="text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-900">Camera Locations:</span> {cameras.length}
              </div>
              <div className="text-gray-900 font-bold bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                Historical Mode Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeMachine;
