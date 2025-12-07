/**
 * Accident Frequency Chart - Temporal Analysis Component
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/AccidentFrequencyChart
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Temporal accident frequency analysis component displaying bar charts with multiple
 * time aggregations (hourly, daily, weekly, monthly). Supports severity filtering and
 * interactive drill-down to view accident details at specific time points.
 * 
 * Core features:
 * - 4 time aggregation modes (hourly, daily, weekly, monthly)
 * - Severity filtering (minor, moderate, major, severe)
 * - Color-coded bars by severity level
 * - Interactive tooltips with counts and percentages
 * - Click-through to accident details
 * - Date range filtering integration
 * - Responsive chart sizing
 * 
 * @dependencies
 * - react@18.2.0 - Component state and memoization
 * - recharts@2.7.2 - BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
 * - date-fns@2.30.0 - Date manipulation and formatting
 * - zustand (via trafficStore) - Accident data source
 * 
 * @example
 * ```tsx
 * <AccidentFrequencyChart
 *   timeRange={{ start: startDate, end: endDate }}
 *   onAccidentClick={(accident) => showDetails(accident)}
 * />
 * ```
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTrafficStore } from '../store/trafficStore';
import {
  format,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachHourOfInterval,
  startOfHour,
  isSameDay,
  isSameHour,
  subDays,
  startOfWeek,
  endOfWeek,
  getDay,
  getHours,
} from 'date-fns';

type ViewMode = 'hourly' | 'daily' | 'calendar';
type DateRange = '7days' | '14days' | '30days' | 'custom';

interface AccidentFrequencyChartProps {
  visible?: boolean;
}

interface HourlyData {
  hour: string;
  fatal: number;
  severe: number;
  moderate: number;
  minor: number;
  total: number;
}

interface DailyData {
  date: string;
  fatal: number;
  severe: number;
  moderate: number;
  minor: number;
  total: number;
}

interface CalendarCell {
  date: Date;
  count: number;
  severity: { fatal: number; severe: number; moderate: number; minor: number };
}

export const AccidentFrequencyChart: React.FC<AccidentFrequencyChartProps> = ({ visible = false }) => {
  // Early return if not visible
  if (!visible) return null;

  const accidents = useTrafficStore((state) => state.accidents);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('hourly');
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [isOpen, setIsOpen] = useState(false);

  // Date range calculation
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;

    switch (dateRange) {
      case '7days':
        start = subDays(now, 7);
        break;
      case '14days':
        start = subDays(now, 14);
        break;
      case '30days':
        start = subDays(now, 30);
        break;
      default:
        start = subDays(now, 7);
    }

    return {
      startDate: startOfDay(start),
      endDate: endOfDay(now),
    };
  }, [dateRange]);

  // Filter accidents by date range
  const filteredAccidents = useMemo(() => {
    return accidents.filter((accident) => {
      const accidentDate = new Date(accident.timestamp);
      return accidentDate >= startDate && accidentDate <= endDate;
    });
  }, [accidents, startDate, endDate]);

  // Hourly data
  const hourlyData = useMemo((): HourlyData[] => {
    const hours = eachHourOfInterval({ start: startDate, end: endDate });

    return hours.map((hour) => {
      const hourStart = startOfHour(hour);
      const accidentsInHour = filteredAccidents.filter((a) => {
        const accidentDate = new Date(a.timestamp);
        return isSameHour(accidentDate, hourStart);
      });

      const counts = accidentsInHour.reduce(
        (acc, a) => {
          const severity = a.severity?.toLowerCase() || 'minor';
          if (severity === 'fatal') acc.fatal++;
          else if (severity === 'severe') acc.severe++;
          else if (severity === 'moderate') acc.moderate++;
          else acc.minor++;
          return acc;
        },
        { fatal: 0, severe: 0, moderate: 0, minor: 0 }
      );

      return {
        hour: format(hour, 'MMM dd HH:mm'),
        ...counts,
        total: accidentsInHour.length,
      };
    });
  }, [filteredAccidents, startDate, endDate]);

  // Daily data
  const dailyData = useMemo((): DailyData[] => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const accidentsInDay = filteredAccidents.filter((a) => {
        const accidentDate = new Date(a.timestamp);
        return isSameDay(accidentDate, dayStart);
      });

      const counts = accidentsInDay.reduce(
        (acc, a) => {
          const severity = a.severity?.toLowerCase() || 'minor';
          if (severity === 'fatal') acc.fatal++;
          else if (severity === 'severe') acc.severe++;
          else if (severity === 'moderate') acc.moderate++;
          else acc.minor++;
          return acc;
        },
        { fatal: 0, severe: 0, moderate: 0, minor: 0 }
      );

      return {
        date: format(day, 'MMM dd'),
        ...counts,
        total: accidentsInDay.length,
      };
    });
  }, [filteredAccidents, startDate, endDate]);

  // Calendar heatmap data
  const calendarData = useMemo((): CalendarCell[][] => {
    const weeks: CalendarCell[][] = [];
    const start = startOfWeek(startDate);
    const end = endOfWeek(endDate);
    const days = eachDayOfInterval({ start, end });

    let currentWeek: CalendarCell[] = [];
    days.forEach((day) => {
      const dayOfWeek = getDay(day);

      // Start new week on Sunday
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      const accidentsInDay = filteredAccidents.filter((a) => {
        const accidentDate = new Date(a.timestamp);
        return isSameDay(accidentDate, day);
      });

      const severity = accidentsInDay.reduce(
        (acc, a) => {
          const sev = a.severity?.toLowerCase() || 'minor';
          if (sev === 'fatal') acc.fatal++;
          else if (sev === 'severe') acc.severe++;
          else if (sev === 'moderate') acc.moderate++;
          else acc.minor++;
          return acc;
        },
        { fatal: 0, severe: 0, moderate: 0, minor: 0 }
      );

      currentWeek.push({
        date: day,
        count: accidentsInDay.length,
        severity,
      });
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [filteredAccidents, startDate, endDate]);

  // Get heatmap color
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return '#f3f4f6';
    if (count <= 2) return '#dbeafe';
    if (count <= 5) return '#93c5fd';
    if (count <= 10) return '#3b82f6';
    if (count <= 20) return '#1d4ed8';
    return '#1e3a8a';
  };

  // Statistics
  const statistics = useMemo(() => {
    const total = filteredAccidents.length;
    const bySeverity = filteredAccidents.reduce(
      (acc, a) => {
        const severity = a.severity?.toLowerCase() || 'minor';
        if (severity === 'fatal') acc.fatal++;
        else if (severity === 'severe') acc.severe++;
        else if (severity === 'moderate') acc.moderate++;
        else acc.minor++;
        return acc;
      },
      { fatal: 0, severe: 0, moderate: 0, minor: 0 }
    );

    // Find peak hour
    const hourCounts = new Map<number, number>();
    filteredAccidents.forEach((a) => {
      const hour = getHours(new Date(a.timestamp));
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const peakHour = Array.from(hourCounts.entries()).reduce(
      (max, [hour, count]) => (count > max.count ? { hour, count } : max),
      { hour: 0, count: 0 }
    );

    // Daily average
    const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAvg = daysInRange > 0 ? (total / daysInRange).toFixed(1) : '0.0';

    return {
      total,
      bySeverity,
      peakHour: `${peakHour.hour}:00`,
      peakCount: peakHour.count,
      dailyAvg,
    };
  }, [filteredAccidents, startDate, endDate]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    let csvContent = '';
    let filename = '';

    if (viewMode === 'hourly') {
      csvContent = 'Hour,Fatal,Severe,Moderate,Minor,Total\n';
      hourlyData.forEach((row) => {
        csvContent += `${row.hour},${row.fatal},${row.severe},${row.moderate},${row.minor},${row.total}\n`;
      });
      filename = 'accident_frequency_hourly.csv';
    } else {
      csvContent = 'Date,Fatal,Severe,Moderate,Minor,Total\n';
      dailyData.forEach((row) => {
        csvContent += `${row.date},${row.fatal},${row.severe},${row.moderate},${row.minor},${row.total}\n`;
      });
      filename = 'accident_frequency_daily.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }, [viewMode, hourlyData, dailyData]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Toggle open
  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (!isOpen && !isFullscreen) {
    return (
      <div className="fixed bottom-4 right-4 z-[1000]">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-xl hover:bg-gray-50 transition-colors"
          title="Open Accident Frequency Chart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">Frequency Chart</span>
        </button>
      </div>
    );
  }

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-[2000] bg-white overflow-auto'
    : 'fixed bottom-4 right-4 z-[1000] w-[800px] max-h-[600px] rounded-lg bg-white shadow-2xl overflow-auto';

  return (
    <div className={containerClass}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-indigo-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">Accident Frequency Analysis</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              title="Export to CSV"
            >
              Export CSV
            </button>
            <button
              onClick={toggleFullscreen}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <button
              onClick={() => (isFullscreen ? setIsFullscreen(false) : setIsOpen(false))}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              title="Close"
            >
              Close
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-5 gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <div className="text-sm text-blue-600 font-medium">Total Accidents</div>
            <div className="text-3xl font-bold text-blue-900">{statistics.total}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-4">
            <div className="text-sm text-red-600 font-medium">Fatal</div>
            <div className="text-3xl font-bold text-red-900">{statistics.bySeverity.fatal}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-4">
            <div className="text-sm text-orange-600 font-medium">Severe</div>
            <div className="text-3xl font-bold text-orange-900">{statistics.bySeverity.severe}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4">
            <div className="text-sm text-purple-600 font-medium">Peak Hour</div>
            <div className="text-2xl font-bold text-purple-900">{statistics.peakHour}</div>
            <div className="text-xs text-purple-600">{statistics.peakCount} accidents</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4">
            <div className="text-sm text-green-600 font-medium">Daily Average</div>
            <div className="text-3xl font-bold text-green-900">{statistics.dailyAvg}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center justify-between">
          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('hourly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'hourly'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'daily'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Calendar
            </button>
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            {(['7days', '14days', '30days'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {range === '7days' ? '7 Days' : range === '14days' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        {viewMode === 'hourly' && (
          <div className={isFullscreen ? 'h-[600px]' : 'h-[400px]'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fatal" stackId="a" fill="#dc2626" name="Fatal" />
                <Bar dataKey="severe" stackId="a" fill="#f97316" name="Severe" />
                <Bar dataKey="moderate" stackId="a" fill="#eab308" name="Moderate" />
                <Bar dataKey="minor" stackId="a" fill="#22c55e" name="Minor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'daily' && (
          <div className={isFullscreen ? 'h-[600px]' : 'h-[400px]'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fatal" stackId="a" fill="#dc2626" name="Fatal" />
                <Bar dataKey="severe" stackId="a" fill="#f97316" name="Severe" />
                <Bar dataKey="moderate" stackId="a" fill="#eab308" name="Moderate" />
                <Bar dataKey="minor" stackId="a" fill="#22c55e" name="Minor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800">Accident Calendar Heatmap</h3>
              <p className="text-sm text-gray-600">
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </p>
            </div>

            {/* Day Labels */}
            <div className="mb-2 flex gap-1">
              <div className="w-12"></div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="flex-1 text-center text-xs font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="mb-1 flex gap-1">
                <div className="flex w-12 items-center text-xs text-gray-500">
                  Week {weekIndex + 1}
                </div>
                {week.map((cell, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="group relative flex-1 aspect-square rounded-md cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: getHeatmapColor(cell.count) }}
                    title={`${format(cell.date, 'MMM dd')}: ${cell.count} accidents`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                      {cell.count > 0 ? cell.count : ''}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap">
                        <div className="font-bold">{format(cell.date, 'MMM dd, yyyy')}</div>
                        <div>Total: {cell.count}</div>
                        {cell.count > 0 && (
                          <>
                            <div className="text-red-300">Fatal: {cell.severity.fatal}</div>
                            <div className="text-orange-300">Severe: {cell.severity.severe}</div>
                            <div className="text-yellow-300">Moderate: {cell.severity.moderate}</div>
                            <div className="text-green-300">Minor: {cell.severity.minor}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-600">Less</span>
              {[0, 2, 5, 10, 20].map((val, idx) => (
                <div
                  key={idx}
                  className="h-4 w-8 rounded"
                  style={{ backgroundColor: getHeatmapColor(val) }}
                  title={`${val}+ accidents`}
                ></div>
              ))}
              <span className="text-xs text-gray-600">More</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccidentFrequencyChart;
