/**
 * Analytics Dashboard Component - Traffic Metrics Visualization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/AnalyticsDashboard
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Comprehensive analytics dashboard displaying traffic, weather, air quality, and accident
 * metrics with interactive charts and real-time updates.
 * 
 * Chart Types:
 * - Line Charts: Congestion trends over time
 * - Bar Charts: Accident frequency by hour/day
 * - Area Charts: AQI trends with severity zones
 * - Scatter Plots: Weather-traffic correlations
 * - Donut Charts: Traffic distribution by severity
 * 
 * Metrics Displayed:
 * - Traffic: Congestion levels, vehicle counts, average speeds
 * - Air Quality: AQI, PM2.5, PM10, NO2, O3 trends
 * - Weather: Temperature, humidity, wind speed
 * - Accidents: Frequency, severity distribution, hotspots
 * - Patterns: Peak hours, recurring congestion zones
 * 
 * Features:
 * - Real-time data updates via Zustand store
 * - Responsive layout with collapsible sections
 * - Export to CSV/PNG functionality
 * - Time range filtering (1h, 6h, 24h, 7d)
 * - Color-coded severity indicators
 * 
 * @dependencies
 * - recharts@^2.10: Chart library
 * - zustand: State management
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTrafficStore } from '../store/trafficStore';
import { Accident } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  format,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
  subHours,
  getHours,
  differenceInHours,
} from 'date-fns';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface TopAQILocation {
  cameraName: string;
  value: number;
  level: string;
  color: string;
}

interface AccidentHotspot {
  cameraName: string;
  accidentCount: number;
  severityCounts: {
    fatal: number;
    severe: number;
    moderate: number;
    minor: number;
  };
}

interface CongestionZone {
  name: string;
  vehicleCount: number;
  congestionLevel: string;
  averageSpeed: number;
}

interface AQITrendPoint {
  time: string;
  aqi: number;
}

interface AccidentByHourPoint {
  hour: string;
  count: number;
  severe: number;
  moderate: number;
  minor: number;
}

interface CongestionTimelinePoint {
  hour: string;
  vehicleCount: number;
  avgSpeed: number;
}

interface CongestionSummary {
  totalObservations: number;
  byCongestionLevel: {
    congested: number;
    moderate: number;
    free: number;
    unknown: number;
  };
  highCongestionZones: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onToggle }) => {
  const { cameras, airQuality, accidents, patterns } = useTrafficStore();
  const [expandedSections, setExpandedSections] = useState({
    topMetrics: true,
    topLists: true,
    charts: true,
  });

  // Congestion data from ItemFlowObserved entities
  const [congestionData, setCongestionData] = useState<CongestionSummary | null>(null);

  // Fetch congestion summary from API
  useEffect(() => {
    const fetchCongestionSummary = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patterns/congestion-summary`);
        const result = await response.json();
        if (result.success) {
          setCongestionData(result.data);
        }
      } catch (error) {
        console.warn('Failed to fetch congestion summary:', error);
      }
    };

    fetchCongestionSummary();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCongestionSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  // Draggable button state (AssistiveTouch style)
  const [buttonPosition, setButtonPosition] = useState({ x: 16, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasMoved = useRef(false);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setIsSnapping(false);
    hasMoved.current = false;
  }, []);

  // Handle drag move - directly update position for instant response
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    hasMoved.current = true;

    // Calculate position from right edge
    const newX = Math.max(8, Math.min(window.innerWidth - 64, window.innerWidth - clientX - 28));
    const newY = Math.max(8, Math.min(window.innerHeight - 64, clientY - 28));

    setButtonPosition({ x: newX, y: newY });
  }, [isDragging]);

  // Handle drag end - snap to nearest edge like AssistiveTouch
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Snap to nearest horizontal edge (left or right)
    const buttonCenterX = window.innerWidth - buttonPosition.x - 28;
    const snapToRight = buttonCenterX > window.innerWidth / 2;

    setIsSnapping(true);
    setButtonPosition(prev => ({
      x: snapToRight ? 8 : window.innerWidth - 64,
      y: prev.y
    }));

    // Reset snapping state after animation
    setTimeout(() => setIsSnapping(false), 300);
  }, [isDragging, buttonPosition.x]);

  // Handle click - only trigger if not dragged
  const handleClick = useCallback(() => {
    if (!hasMoved.current) {
      onToggle();
    }
  }, [onToggle]);

  // Add/remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const options = { passive: false };
      window.addEventListener('mousemove', handleDragMove, options);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, options);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getAQILevel = (aqi: number): { level: string; color: string } => {
    if (aqi <= 50) return { level: 'Good', color: '#22c55e' };
    if (aqi <= 100) return { level: 'Moderate', color: '#eab308' };
    if (aqi <= 150) return { level: 'Unhealthy', color: '#f97316' };
    if (aqi <= 200) return { level: 'Very Unhealthy', color: '#ef4444' };
    return { level: 'Hazardous', color: '#991b1b' };
  };

  const getCameraName = (cameraId: string): string => {
    const camera = cameras.find((c) => c.id === cameraId);
    return camera ? camera.name : cameraId;
  };

  const topMetrics = useMemo(() => {
    const onlineCameras = cameras.filter(
      (c) => c.status === 'active' || c.status === 'online'
    ).length;
    const offlineCameras = cameras.length - onlineCameras;

    const avgAQI =
      airQuality.length > 0
        ? Math.round(airQuality.reduce((sum, aq) => sum + aq.aqi, 0) / airQuality.length)
        : 0;
    const aqiInfo = getAQILevel(avgAQI);

    // Helper to get accident date - use dateDetected (from Stellio) or timestamp as fallback
    // Note: dateDetected from Stellio is in UTC (ends with 'Z'), parseISO handles timezone correctly
    const getAccidentDate = (acc: Accident): Date => {
      const dateStr = acc.dateDetected || acc.timestamp;
      if (!dateStr) return new Date(0); // Return epoch if no date
      return parseISO(dateStr);
    };

    // Use local timezone for "today" comparison
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const accidentsToday = accidents.filter((acc) => {
      const accDate = getAccidentDate(acc);
      return accDate >= todayStart && accDate <= todayEnd;
    });

    const accidentsBySeverity = {
      fatal: accidentsToday.filter((a) => a.severity === 'fatal').length,
      severe: accidentsToday.filter((a) => a.severity === 'severe').length,
      moderate: accidentsToday.filter((a) => a.severity === 'moderate').length,
      minor: accidentsToday.filter((a) => a.severity === 'minor').length,
    };

    // Use congestion data from ItemFlowObserved API, fallback to patterns
    const highCongestionZones = congestionData?.highCongestionZones ?? patterns.filter(
      (p) => p.congestionLevel === 'high' || p.congestionLevel === 'severe' || p.congestionLevel === 'heavy'
    ).length;

    return {
      cameras: {
        total: cameras.length,
        online: onlineCameras,
        offline: offlineCameras,
      },
      aqi: {
        average: avgAQI,
        level: aqiInfo.level,
        color: aqiInfo.color,
      },
      accidents: {
        total: accidentsToday.length,
        bySeverity: accidentsBySeverity,
      },
      congestion: {
        highZones: highCongestionZones,
      },
    };
  }, [cameras, airQuality, accidents, patterns, congestionData]);

  const topAQILocations = useMemo((): TopAQILocation[] => {
    const sorted = [...airQuality]
      .sort((a, b) => b.aqi - a.aqi)
      .slice(0, 5);

    return sorted.map((aq) => {
      const aqiInfo = getAQILevel(aq.aqi);
      const cameraId = aq.cameraId || aq.id;
      return {
        cameraName: getCameraName(cameraId),
        value: aq.aqi,
        level: aqiInfo.level,
        color: aqiInfo.color,
      };
    });
  }, [airQuality, cameras]);

  const accidentHotspots = useMemo((): AccidentHotspot[] => {
    const cameraAccidentMap = new Map<string, Accident[]>();

    accidents.forEach((accident) => {
      const cameraId = accident.affectedCamera || accident.id;
      if (!cameraAccidentMap.has(cameraId)) {
        cameraAccidentMap.set(cameraId, []);
      }
      cameraAccidentMap.get(cameraId)!.push(accident);
    });

    const hotspots: AccidentHotspot[] = [];
    cameraAccidentMap.forEach((accList, cameraId) => {
      hotspots.push({
        cameraName: getCameraName(cameraId),
        accidentCount: accList.length,
        severityCounts: {
          fatal: accList.filter((a) => a.severity === 'fatal').length,
          severe: accList.filter((a) => a.severity === 'severe').length,
          moderate: accList.filter((a) => a.severity === 'moderate').length,
          minor: accList.filter((a) => a.severity === 'minor').length,
        },
      });
    });

    return hotspots.sort((a, b) => b.accidentCount - a.accidentCount).slice(0, 5);
  }, [accidents, cameras]);

  const worstCongestionZones = useMemo((): CongestionZone[] => {
    const sorted = [...patterns]
      .filter((p) => p.vehicleCount !== undefined)
      .sort((a, b) => (b.vehicleCount || 0) - (a.vehicleCount || 0))
      .slice(0, 5);

    return sorted.map((pattern) => ({
      name: pattern.roadSegment || pattern.patternType || 'Unknown Zone',
      vehicleCount: pattern.vehicleCount || 0,
      congestionLevel: pattern.congestionLevel,
      averageSpeed: pattern.averageSpeed || 0,
    }));
  }, [patterns]);

  const aqiTrendData = useMemo((): AQITrendPoint[] => {
    const now = new Date();
    const last24h = subHours(now, 24);

    // Helper to get date from airQuality record - backend sends dateObserved, fallback to timestamp
    const getAQDate = (aq: typeof airQuality[0]): Date => {
      const dateStr = aq.dateObserved || aq.timestamp || new Date().toISOString();
      return parseISO(dateStr);
    };

    const recentAirQuality = airQuality.filter((aq) => {
      const aqDate = getAQDate(aq);
      return aqDate >= last24h;
    });

    const hourlyData = new Map<number, number[]>();

    recentAirQuality.forEach((aq) => {
      const aqDate = getAQDate(aq);
      const hoursSinceStart = differenceInHours(aqDate, last24h);
      if (!hourlyData.has(hoursSinceStart)) {
        hourlyData.set(hoursSinceStart, []);
      }
      hourlyData.get(hoursSinceStart)!.push(aq.aqi);
    });

    const trendData: AQITrendPoint[] = [];
    for (let i = 0; i <= 24; i++) {
      const values = hourlyData.get(i) || [];
      const avgAqi = values.length > 0
        ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
        : 0;

      const hour = subHours(now, 24 - i);
      trendData.push({
        time: format(hour, 'HH:mm'),
        aqi: avgAqi,
      });
    }

    return trendData;
  }, [airQuality]);

  const accidentsByHour = useMemo((): AccidentByHourPoint[] => {
    // Helper to get date from accident record - backend sends dateDetected, fallback to timestamp
    const getAccidentDate = (acc: Accident): Date => {
      const dateStr = acc.dateDetected || acc.timestamp || new Date().toISOString();
      return parseISO(dateStr);
    };

    const todayAccidents = accidents.filter((acc) => {
      const accDate = getAccidentDate(acc);
      return isToday(accDate);
    });

    const hourlyData = new Map<number, Accident[]>();
    for (let i = 0; i < 24; i++) {
      hourlyData.set(i, []);
    }

    todayAccidents.forEach((accident) => {
      const accDate = getAccidentDate(accident);
      const hour = getHours(accDate);
      hourlyData.get(hour)!.push(accident);
    });

    const data: AccidentByHourPoint[] = [];
    for (let i = 0; i < 24; i++) {
      const hourAccidents = hourlyData.get(i) || [];
      data.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: hourAccidents.length,
        severe: hourAccidents.filter((a) => a.severity === 'severe' || a.severity === 'fatal').length,
        moderate: hourAccidents.filter((a) => a.severity === 'moderate').length,
        minor: hourAccidents.filter((a) => a.severity === 'minor').length,
      });
    }

    return data;
  }, [accidents]);

  const congestionTimeline = useMemo((): CongestionTimelinePoint[] => {
    const hourlyData = new Map<number, { vehicles: number[]; speeds: number[] }>();
    for (let i = 0; i < 24; i++) {
      hourlyData.set(i, { vehicles: [], speeds: [] });
    }

    patterns.forEach((pattern) => {
      if (pattern.vehicleCount !== undefined) {
        let hour: number | null = null;

        // Try to extract hour from timeRange (format: "HH:MM" or "HH:MM - HH:MM")
        if (pattern.timeRange) {
          const timeMatch = pattern.timeRange.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            hour = parseInt(timeMatch[1], 10);
          }
        }

        // Fallback: try to extract hour from timestamp or timeOfDay
        if (hour === null && pattern.timestamp) {
          try {
            const patternDate = parseISO(pattern.timestamp);
            hour = getHours(patternDate);
          } catch (e) {
            // Ignore parse errors
          }
        }

        if (hour === null && pattern.timeOfDay) {
          const timeMatch = pattern.timeOfDay.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            hour = parseInt(timeMatch[1], 10);
          }
        }

        if (hour !== null && hour >= 0 && hour < 24) {
          const data = hourlyData.get(hour);
          if (data) {
            data.vehicles.push(pattern.vehicleCount);
            if (pattern.averageSpeed !== undefined) {
              data.speeds.push(pattern.averageSpeed);
            }
          }
        }
      }
    });

    const data: CongestionTimelinePoint[] = [];
    for (let i = 0; i < 24; i++) {
      const hourData = hourlyData.get(i)!;
      const avgVehicles = hourData.vehicles.length > 0
        ? Math.round(hourData.vehicles.reduce((sum, v) => sum + v, 0) / hourData.vehicles.length)
        : 0;
      const avgSpeed = hourData.speeds.length > 0
        ? Math.round(hourData.speeds.reduce((sum, s) => sum + s, 0) / hourData.speeds.length)
        : 0;

      data.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        vehicleCount: avgVehicles,
        avgSpeed: avgSpeed,
      });
    }

    return data;
  }, [patterns]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpandedSections({
          topMetrics: true,
          topLists: false,
          charts: false,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`fixed z-[1001] w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm text-white shadow-lg flex items-center justify-center text-2xl select-none ${isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab hover:bg-black/70'
          } ${isSnapping ? 'transition-all duration-300 ease-out' : ''}`}
        style={{
          right: buttonPosition.x,
          top: buttonPosition.y,
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          willChange: isDragging ? 'transform' : 'auto',
        }}
        aria-label="Open Analytics Dashboard"
      >
        📊
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`fixed z-[1002] w-14 h-14 rounded-full bg-red-500/80 backdrop-blur-sm text-white shadow-lg flex items-center justify-center text-2xl select-none ${isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab hover:bg-red-600/80'
          } ${isSnapping ? 'transition-all duration-300 ease-out' : ''}`}
        style={{
          right: buttonPosition.x,
          top: buttonPosition.y,
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          willChange: isDragging ? 'transform' : 'auto',
        }}
        aria-label="Close Analytics Dashboard"
      >
        ✕
      </button>

      <div className="absolute top-0 right-0 h-full w-full md:w-[480px] lg:w-[560px] bg-gray-900 text-white shadow-2xl z-[1000] overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-blue-400 border-b border-gray-700 pb-3">
            📊 Analytics Dashboard
          </h1>

          {/* Top Metrics Cards */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-100">Key Metrics</h2>
              <button
                onClick={() => toggleSection('topMetrics')}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle metrics section"
              >
                {expandedSections.topMetrics ? '▼' : '▶'}
              </button>
            </div>

            {expandedSections.topMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cameras Card */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Total Cameras</h3>
                    <span className="text-2xl">📹</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">{topMetrics.cameras.total}</div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-green-400">
                      ✓ {topMetrics.cameras.online} online
                    </span>
                    <span className="text-red-400">
                      ✗ {topMetrics.cameras.offline} offline
                    </span>
                  </div>
                </div>

                {/* Average AQI Card */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Average AQI</h3>
                    <span className="text-2xl">💨</span>
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: topMetrics.aqi.color }}
                  >
                    {topMetrics.aqi.average}
                  </div>
                  <div className="mt-2 text-sm font-medium" style={{ color: topMetrics.aqi.color }}>
                    {topMetrics.aqi.level}
                  </div>
                </div>

                {/* Accidents Today Card */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Accidents Today</h3>
                    <span className="text-2xl">🚨</span>
                  </div>
                  <div className="text-3xl font-bold text-red-400">{topMetrics.accidents.total}</div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <span className="text-black bg-black/50 px-1 rounded">
                      ⚫ {topMetrics.accidents.bySeverity.fatal} fatal
                    </span>
                    <span className="text-red-400">
                      🔴 {topMetrics.accidents.bySeverity.severe} severe
                    </span>
                    <span className="text-yellow-400">
                      🟡 {topMetrics.accidents.bySeverity.moderate} moderate
                    </span>
                    <span className="text-green-400">
                      🟢 {topMetrics.accidents.bySeverity.minor} minor
                    </span>
                  </div>
                </div>

                {/* High Congestion Zones Card */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">High Congestion</h3>
                    <span className="text-2xl">🚦</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-400">
                    {topMetrics.congestion.highZones}
                  </div>
                  <div className="mt-2 text-sm text-gray-400">zones affected</div>
                </div>
              </div>
            )}
          </section>

          {/* Top 5 Lists */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-100">Top 5 Rankings</h2>
              <button
                onClick={() => toggleSection('topLists')}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle lists section"
              >
                {expandedSections.topLists ? '▼' : '▶'}
              </button>
            </div>

            {expandedSections.topLists && (
              <div className="space-y-4">
                {/* Highest AQI Locations */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-orange-400">
                    🏭 Highest AQI Locations
                  </h3>
                  {topAQILocations.length > 0 ? (
                    <div className="space-y-2">
                      {topAQILocations.map((location, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm truncate">
                              {index + 1}. {location.cameraName}
                            </div>
                            <div className="text-xs" style={{ color: location.color }}>
                              {location.level}
                            </div>
                          </div>
                          <div
                            className="text-xl font-bold ml-2"
                            style={{ color: location.color }}
                          >
                            {location.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">No AQI data available</div>
                  )}
                </div>

                {/* Accident Hotspots */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-red-400">
                    ⚠️ Accident Hotspots
                  </h3>
                  {accidentHotspots.length > 0 ? (
                    <div className="space-y-2">
                      {accidentHotspots.map((hotspot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm truncate">
                              {index + 1}. {hotspot.cameraName}
                            </div>
                            <div className="text-xs text-gray-400 flex gap-2">
                              {hotspot.severityCounts.fatal > 0 && (
                                <span>⚫{hotspot.severityCounts.fatal}</span>
                              )}
                              {hotspot.severityCounts.severe > 0 && (
                                <span className="text-red-400">🔴{hotspot.severityCounts.severe}</span>
                              )}
                              {hotspot.severityCounts.moderate > 0 && (
                                <span className="text-yellow-400">🟡{hotspot.severityCounts.moderate}</span>
                              )}
                              {hotspot.severityCounts.minor > 0 && (
                                <span className="text-green-400">🟢{hotspot.severityCounts.minor}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-red-400 ml-2">
                            {hotspot.accidentCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">No accidents recorded</div>
                  )}
                </div>

                {/* Worst Congestion Zones */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-purple-400">
                    🚗 Worst Congestion Zones
                  </h3>
                  {worstCongestionZones.length > 0 ? (
                    <div className="space-y-2">
                      {worstCongestionZones.map((zone, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm truncate">
                              {index + 1}. {zone.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              Avg Speed: {zone.averageSpeed} km/h • {zone.congestionLevel}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-purple-400 ml-2">
                            {zone.vehicleCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">No congestion data available</div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Mini Charts */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-100">Trend Analysis</h2>
              <button
                onClick={() => toggleSection('charts')}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle charts section"
              >
                {expandedSections.charts ? '▼' : '▶'}
              </button>
            </div>

            {expandedSections.charts && (
              <div className="space-y-6">
                {/* AQI Trend Chart */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-orange-400">
                    📈 AQI Trend (Last 24h)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={aqiTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="time"
                        stroke="#9ca3af"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: '#f97316', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Accidents by Hour Chart */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-red-400">
                    📊 Accidents by Hour (Today)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={accidentsByHour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="hour"
                        stroke="#9ca3af"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="severe" stackId="a" fill="#ef4444" name="Severe" />
                      <Bar dataKey="moderate" stackId="a" fill="#f59e0b" name="Moderate" />
                      <Bar dataKey="minor" stackId="a" fill="#22c55e" name="Minor" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Congestion Timeline Chart */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-purple-400">
                    🚦 Congestion Timeline (Rush Hours)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={congestionTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="hour"
                        stroke="#9ca3af"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#a78bfa"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Vehicles', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#34d399"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Speed (km/h)', angle: 90, position: 'insideRight', style: { fontSize: 11 } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="vehicleCount"
                        fill="#a78bfa"
                        stroke="#a78bfa"
                        fillOpacity={0.6}
                        name="Vehicle Count"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgSpeed"
                        fill="#34d399"
                        stroke="#34d399"
                        fillOpacity={0.3}
                        name="Avg Speed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>

          {/* Footer Info */}
          <div className="mt-8 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
            <p>Real-time analytics • Auto-updates on data changes</p>
            <p className="mt-1">
              Last updated: {format(new Date(), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;
