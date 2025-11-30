/**
 * @module apps/traffic-web-app/frontend/src/components/CorrelationPanel
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Correlation Analysis Panel - Visualizes relationships between accidents, traffic patterns,
 * and congestion levels. Displays statistical correlations using interactive charts.
 * 
 * Features:
 * - Accident-pattern correlation analysis
 * - Traffic pattern breakdown (pie chart)
 * - Congestion level distribution (bar chart)
 * - Accident-vehicle count scatter plot
 * - Statistical metrics (correlation rate, avg vehicle count)
 * - Real-time data updates from backend API
 * 
 * Chart Types:
 * - Pie Chart: Accident distribution by traffic pattern
 * - Bar Chart: Accidents by congestion level
 * - Scatter Plot: Vehicle count vs accidents relationship
 * 
 * @dependencies
 * - recharts@^2.9: Chart visualization library
 * - lucide-react@^0.294: Icon components
 */

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';

// =====================================================
// INTERFACES
// =====================================================

interface CorrelationData {
  totalAccidents: number;
  accidentsWithPatterns: number;
  correlationRate: number;
  byPattern: PatternCorrelation[];
  byCongestion: CongestionBreakdown;
  avgVehicleCount: number;
  insights: string;
}

interface PatternCorrelation {
  patternId: string;
  patternType: string;
  congestionLevel: string;
  accidentCount: number;
  avgSeverity: string;
  severityBreakdown: {
    severe: number;
    moderate: number;
    minor: number;
  };
}

interface CongestionBreakdown {
  high: number;
  medium: number;
  low: number;
}

interface CorrelationPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const CONGESTION_COLORS = {
  high: '#ef4444',    // red-500
  medium: '#f59e0b',  // amber-500
  low: '#10b981'      // green-500
};

const PATTERN_TYPE_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
];

const SEVERITY_COLORS = {
  severe: '#dc2626',    // red-600
  moderate: '#f59e0b',  // amber-500
  minor: '#fbbf24'      // amber-400
};

// =====================================================
// COMPONENT
// =====================================================

const CorrelationPanel: React.FC<CorrelationPanelProps> = ({
  autoRefresh = true,
  refreshInterval = 60000
}) => {
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // =====================================================
  // FETCH CORRELATION DATA
  // =====================================================

  const fetchCorrelationData = async () => {
    try {
      setError(null);

      const response = await fetch('/api/correlations/accident-pattern');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setCorrelationData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Failed to fetch correlation data');
      }

    } catch (err) {
      console.error('Error fetching correlation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch correlation data');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    fetchCorrelationData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchCorrelationData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval]);

  // =====================================================
  // PREPARE CHART DATA
  // =====================================================

  const getCongestionPieData = () => {
    if (!correlationData) return [];

    return [
      { name: 'High Congestion', value: correlationData.byCongestion.high, color: CONGESTION_COLORS.high },
      { name: 'Medium Congestion', value: correlationData.byCongestion.medium, color: CONGESTION_COLORS.medium },
      { name: 'Low Congestion', value: correlationData.byCongestion.low, color: CONGESTION_COLORS.low }
    ].filter(item => item.value > 0);
  };

  const getPatternBarData = () => {
    if (!correlationData) return [];

    // Group by pattern type
    const patternTypeMap = new Map<string, number>();

    correlationData.byPattern.forEach(pattern => {
      const current = patternTypeMap.get(pattern.patternType) || 0;
      patternTypeMap.set(pattern.patternType, current + pattern.accidentCount);
    });

    return Array.from(patternTypeMap.entries()).map(([type, count]) => ({
      patternType: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      accidents: count
    }));
  };

  const getAqiScatterData = () => {
    if (!correlationData) return [];

    // For scatter plot, we need AQI vs severity mapping
    // Since we don't have direct AQI data in correlation response,
    // we'll map severity to numeric values and show accident distribution
    const severityToNumeric: Record<string, number> = {
      minor: 1,
      moderate: 2,
      severe: 3
    };

    return correlationData.byPattern.map(pattern => ({
      patternId: pattern.patternId,
      severity: severityToNumeric[pattern.avgSeverity] || 1,
      accidents: pattern.accidentCount,
      congestion: pattern.congestionLevel,
      vehicleCount: correlationData.avgVehicleCount // Use average as proxy
    }));
  };

  // =====================================================
  // RENDER LOADING/ERROR STATES
  // =====================================================

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchCorrelationData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!correlationData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No correlation data available</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  const congestionPieData = getCongestionPieData();
  const patternBarData = getPatternBarData();
  const aqiScatterData = getAqiScatterData();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            Accident-Pattern Correlation Analysis
          </h2>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <p className="text-gray-600">
          Analyzing relationships between traffic patterns and road accidents
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Accidents</div>
          <div className="text-3xl font-bold text-blue-700">{correlationData.totalAccidents}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">With Patterns</div>
          <div className="text-3xl font-bold text-green-700">{correlationData.accidentsWithPatterns}</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">Correlation Rate</div>
          <div className="text-3xl font-bold text-purple-700">{correlationData.correlationRate}%</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium mb-1">Avg Vehicle Count</div>
          <div className="text-3xl font-bold text-orange-700">{Math.round(correlationData.avgVehicleCount)}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Pie Chart: Accidents by Congestion Level */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            Accidents by Congestion Level
          </h3>
          {congestionPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={congestionPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {congestionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No congestion data available
            </div>
          )}
        </div>

        {/* Bar Chart: Accidents by Pattern Type */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Accidents by Pattern Type
          </h3>
          {patternBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patternBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="patternType"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accidents" fill="#3b82f6" name="Accident Count">
                  {patternBarData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PATTERN_TYPE_COLORS[index % PATTERN_TYPE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No pattern data available
            </div>
          )}
        </div>

        {/* Scatter Plot: Severity vs Vehicle Count */}
        <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Accident Severity vs Pattern Characteristics
          </h3>
          {aqiScatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="vehicleCount"
                  name="Avg Vehicle Count"
                  label={{ value: 'Average Vehicle Count', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="severity"
                  name="Severity Level"
                  domain={[0, 4]}
                  ticks={[1, 2, 3]}
                  tickFormatter={(value) => {
                    if (value === 1) return 'Minor';
                    if (value === 2) return 'Moderate';
                    if (value === 3) return 'Severe';
                    return '';
                  }}
                  label={{ value: 'Accident Severity', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-semibold">Pattern Details</p>
                          <p className="text-sm">Congestion: <span className="font-medium">{data.congestion}</span></p>
                          <p className="text-sm">Accidents: <span className="font-medium">{data.accidents}</span></p>
                          <p className="text-sm">Vehicles: <span className="font-medium">{Math.round(data.vehicleCount)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Scatter
                  name="High Congestion"
                  data={aqiScatterData.filter(d => d.congestion === 'high')}
                  fill={CONGESTION_COLORS.high}
                  shape="circle"
                />
                <Scatter
                  name="Medium Congestion"
                  data={aqiScatterData.filter(d => d.congestion === 'medium')}
                  fill={CONGESTION_COLORS.medium}
                  shape="triangle"
                />
                <Scatter
                  name="Low Congestion"
                  data={aqiScatterData.filter(d => d.congestion === 'low')}
                  fill={CONGESTION_COLORS.low}
                  shape="square"
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No scatter data available
            </div>
          )}
        </div>

      </div>

      {/* Insights Section */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Key Insights
        </h3>
        <p className="text-blue-700 leading-relaxed">
          {correlationData.insights}
        </p>
      </div>

      {/* Pattern Details Table */}
      {correlationData.byPattern.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pattern-Specific Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pattern Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Congestion</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Accidents</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Avg Severity</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Severe</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Moderate</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Minor</th>
                </tr>
              </thead>
              <tbody>
                {correlationData.byPattern
                  .sort((a, b) => b.accidentCount - a.accidentCount)
                  .slice(0, 10)
                  .map((pattern, index) => (
                    <tr key={pattern.patternId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {pattern.patternType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="px-2 py-1 rounded text-white text-xs font-medium"
                          style={{ backgroundColor: CONGESTION_COLORS[pattern.congestionLevel as keyof typeof CONGESTION_COLORS] }}
                        >
                          {pattern.congestionLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                        {pattern.accidentCount}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="px-2 py-1 rounded text-white text-xs font-medium capitalize"
                          style={{ backgroundColor: SEVERITY_COLORS[pattern.avgSeverity as keyof typeof SEVERITY_COLORS] }}
                        >
                          {pattern.avgSeverity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">
                        {pattern.severityBreakdown.severe}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-amber-600 font-medium">
                        {pattern.severityBreakdown.moderate}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-600 font-medium">
                        {pattern.severityBreakdown.minor}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {correlationData.byPattern.length > 10 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing top 10 of {correlationData.byPattern.length} patterns
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default CorrelationPanel;
