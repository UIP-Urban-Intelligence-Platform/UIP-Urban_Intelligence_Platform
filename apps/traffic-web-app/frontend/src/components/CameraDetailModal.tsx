/**
 * Camera Detail Modal - Comprehensive Camera Information
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/CameraDetailModal
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Camera Detail Modal - Comprehensive camera information modal with multiple tabs.
 * Displays camera overview, current traffic metrics, historical charts, and nearby accidents.
 * 
 * Features:
 * - 4 tabs: Overview, Current Metrics, Historical Data, Nearby Accidents
 * - Real-time traffic flow metrics (vehicle count, speed, occupancy)
 * - Historical trend charts (24h vehicle count, speed trends)
 * - Nearby accidents map with distance calculation
 * - Camera location mini-map
 * - Image snapshot display
 * - Status indicators and metadata
 * 
 * Data Sources:
 * - Camera entity from NGSI-LD
 * - ItemFlowObserved for traffic metrics
 * - Historical data from Fuseki SPARQL endpoint
 * - Accident entities from Stellio
 * 
 * @dependencies
 * - react-leaflet@^4.2: Mini-map rendering
 * - recharts@^2.9: Chart visualization
 * - lucide-react@^0.294: Icons
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Camera, Accident } from '../types';
import { useTrafficStore } from '../store/trafficStore';
import L from 'leaflet';

interface CameraDetailModalProps {
  camera: Camera;
  onClose: () => void;
  onViewOnMap: (camera: Camera) => void;
}

type TabType = 'overview' | 'current' | 'history' | 'accidents';

interface HistoricalAQI {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
  timestamp: string;
}

interface HistoricalWeather {
  date: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  timestamp: string;
}

interface NearbyAccident extends Accident {
  distance: number;
}

const CameraDetailModal: React.FC<CameraDetailModalProps> = ({ camera, onClose, onViewOnMap }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historicalAQI, setHistoricalAQI] = useState<HistoricalAQI[]>([]);
  const [historicalWeather, setHistoricalWeather] = useState<HistoricalWeather[]>([]);
  const [nearbyAccidents, setNearbyAccidents] = useState<NearbyAccident[]>([]);

  const { weather, airQuality, accidents } = useTrafficStore();

  // Extract camera coordinates with fallback for both formats
  // Backend sends {lat, lng}, not {latitude, longitude}
  const cameraLat = (camera.location as any).lat || camera.location.latitude || 0;
  const cameraLng = (camera.location as any).lng || camera.location.longitude || 0;

  console.log('📷 Camera Detail Modal opened:', {
    cameraId: camera.id,
    cameraName: camera.name || camera.cameraName,
    cameraLat,
    cameraLng,
    weatherCount: weather.length,
    aqiCount: airQuality.length
  });

  // Calculate distance using Haversine formula - MUST be defined before useMemo usage
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get current data for this camera's location
  const currentWeather = useMemo(() => {
    if (!cameraLat || !cameraLng) return undefined;

    console.log('🔍 Finding weather for camera:', { cameraLat, cameraLng });
    console.log('📊 Available weather data:', weather.map(w => ({
      id: w.id,
      lat: w.location.lat || (w.location as any).latitude,
      lng: w.location.lng || (w.location as any).longitude
    })));

    return weather.find(w => {
      // Backend sends {lat, lng}, not {latitude, longitude}
      const wLat = (w.location as any).lat || w.location.latitude || 0;
      const wLng = (w.location as any).lng || w.location.longitude || 0;

      const distance = calculateDistance(cameraLat, cameraLng, wLat, wLng);

      console.log(`📍 Weather ${w.id}: lat=${wLat} lng=${wLng}, distance=${distance.toFixed(2)}km`);

      return distance < 1; // Within 1km
    });
  }, [weather, camera, cameraLat, cameraLng]); const currentAQI = useMemo(() => {
    if (!cameraLat || !cameraLng) return undefined;

    console.log('🔍 Finding AQI for camera:', { cameraLat, cameraLng });
    console.log('📊 Available AQI data:', airQuality.map(a => ({
      id: a.id,
      lat: a.location.lat || (a.location as any).latitude,
      lng: a.location.lng || (a.location as any).longitude
    })));

    return airQuality.find(a => {
      // Backend sends {lat, lng}, not {latitude, longitude}
      const aLat = (a.location as any).lat || a.location.latitude || 0;
      const aLng = (a.location as any).lng || a.location.longitude || 0;

      const distance = calculateDistance(cameraLat, cameraLng, aLat, aLng);

      console.log(`📍 AQI ${a.id}: lat=${aLat} lng=${aLng}, distance=${distance.toFixed(2)}km`);

      return distance < 2; // Within 2km
    });
  }, [airQuality, camera, cameraLat, cameraLng]);  // Fetch historical data from Fuseki
  const fetchHistoricalData = async () => {
    setIsRefreshing(true);

    try {
      // Fetch AQI history (last 7 days)
      const aqiQuery = `
        PREFIX ex: <http://example.org/traffic#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT ?date ?aqi ?pm25 ?pm10 ?timestamp
        WHERE {
          ?measurement a ex:AirQuality ;
            ex:location ?location ;
            ex:aqi ?aqi ;
            ex:pm25 ?pm25 ;
            ex:pm10 ?pm10 ;
            ex:timestamp ?timestamp .
          
          ?location ex:latitude ?lat ;
            ex:longitude ?lon .
          
          FILTER(?lat > ${cameraLat - 0.02} && ?lat < ${cameraLat + 0.02})
          FILTER(?lon > ${cameraLng - 0.02} && ?lon < ${cameraLng + 0.02})
          FILTER(?timestamp >= "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"^^xsd:dateTime)
          
          BIND(SUBSTR(STR(?timestamp), 1, 10) as ?date)
        }
        ORDER BY DESC(?timestamp)
        LIMIT 168
      `;

      const aqiResponse = await fetch('http://localhost:3030/traffic/sparql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/json'
        },
        body: aqiQuery
      });

      if (aqiResponse.ok) {
        const aqiData = await aqiResponse.json();
        const aqiResults = aqiData.results?.bindings || [];

        // Group by date and calculate averages
        const aqiByDate = aqiResults.reduce((acc: any, item: any) => {
          const date = item.date.value;
          if (!acc[date]) {
            acc[date] = { aqi: [], pm25: [], pm10: [], timestamp: item.timestamp.value };
          }
          acc[date].aqi.push(parseFloat(item.aqi.value));
          acc[date].pm25.push(parseFloat(item.pm25.value));
          acc[date].pm10.push(parseFloat(item.pm10.value));
          return acc;
        }, {});

        const aqiHistory = Object.keys(aqiByDate).map(date => ({
          date,
          aqi: Math.round(aqiByDate[date].aqi.reduce((a: number, b: number) => a + b, 0) / aqiByDate[date].aqi.length),
          pm25: Math.round(aqiByDate[date].pm25.reduce((a: number, b: number) => a + b, 0) / aqiByDate[date].pm25.length),
          pm10: Math.round(aqiByDate[date].pm10.reduce((a: number, b: number) => a + b, 0) / aqiByDate[date].pm10.length),
          timestamp: aqiByDate[date].timestamp
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setHistoricalAQI(aqiHistory);
      }

      // Fetch Weather history (last 7 days)
      const weatherQuery = `
        PREFIX ex: <http://example.org/traffic#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT ?date ?temperature ?humidity ?rainfall ?timestamp
        WHERE {
          ?measurement a ex:Weather ;
            ex:location ?location ;
            ex:temperature ?temperature ;
            ex:humidity ?humidity ;
            ex:rainfall ?rainfall ;
            ex:timestamp ?timestamp .
          
          ?location ex:latitude ?lat ;
            ex:longitude ?lon .
          
          FILTER(?lat > ${cameraLat - 0.02} && ?lat < ${cameraLat + 0.02})
          FILTER(?lon > ${cameraLng - 0.02} && ?lon < ${cameraLng + 0.02})
          FILTER(?timestamp >= "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"^^xsd:dateTime)
          
          BIND(SUBSTR(STR(?timestamp), 1, 10) as ?date)
        }
        ORDER BY DESC(?timestamp)
        LIMIT 168
      `;

      const weatherResponse = await fetch('http://localhost:3030/traffic/sparql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/json'
        },
        body: weatherQuery
      });

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        const weatherResults = weatherData.results?.bindings || [];

        // Group by date and calculate averages
        const weatherByDate = weatherResults.reduce((acc: any, item: any) => {
          const date = item.date.value;
          if (!acc[date]) {
            acc[date] = { temperature: [], humidity: [], rainfall: [], timestamp: item.timestamp.value };
          }
          acc[date].temperature.push(parseFloat(item.temperature.value));
          acc[date].humidity.push(parseFloat(item.humidity.value));
          acc[date].rainfall.push(parseFloat(item.rainfall.value));
          return acc;
        }, {});

        const weatherHistory = Object.keys(weatherByDate).map(date => ({
          date,
          temperature: Math.round(weatherByDate[date].temperature.reduce((a: number, b: number) => a + b, 0) / weatherByDate[date].temperature.length * 10) / 10,
          humidity: Math.round(weatherByDate[date].humidity.reduce((a: number, b: number) => a + b, 0) / weatherByDate[date].humidity.length),
          rainfall: Math.round(weatherByDate[date].rainfall.reduce((a: number, b: number) => a + b, 0) / weatherByDate[date].rainfall.length * 10) / 10,
          timestamp: weatherByDate[date].timestamp
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setHistoricalWeather(weatherHistory);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get nearby accidents (last 30 days)
  useEffect(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const nearby = accidents
      .filter(accident => {
        const accidentTime = new Date(accident.timestamp).getTime();
        return accidentTime >= thirtyDaysAgo;
      })
      .map(accident => {
        const distance = calculateDistance(
          cameraLat,
          cameraLng,
          accident.location.latitude || accident.location.lat || 0,
          accident.location.longitude || accident.location.lng || 0
        );
        return { ...accident, distance };
      })
      .filter(accident => accident.distance < 2) // Within 2km
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    setNearbyAccidents(nearby);
  }, [accidents, camera, cameraLat, cameraLng]);

  // Fetch historical data when History tab is opened
  useEffect(() => {
    if (activeTab === 'history' && historicalAQI.length === 0 && historicalWeather.length === 0) {
      fetchHistoricalData();
    }
  }, [activeTab]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get AQI level color
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-600';
    if (aqi <= 100) return 'text-yellow-600';
    if (aqi <= 150) return 'text-orange-600';
    if (aqi <= 200) return 'text-red-600';
    if (aqi <= 300) return 'text-purple-600';
    return 'text-red-900';
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal':
        return 'bg-red-900 text-white';
      case 'severe':
        return 'bg-red-600 text-white';
      case 'moderate':
        return 'bg-orange-500 text-white';
      case 'minor':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Custom marker icon for camera location
  const cameraIcon = L.divIcon({
    html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{camera.name}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {camera.type || 'Camera'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(camera.status)}`}>
                  {camera.status}
                </span>
                <span className="text-sm opacity-90">
                  ID: {camera.id}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📍' },
              { id: 'current', label: 'Current Data', icon: '📊' },
              { id: 'history', label: 'History', icon: '📈' },
              { id: 'accidents', label: 'Accidents', icon: '🚨' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Map */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Location Map</h3>
                  </div>
                  <div className="h-64">
                    <MapContainer
                      center={[cameraLat, cameraLng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <Marker position={[cameraLat, cameraLng]} icon={cameraIcon}>
                        <Popup>{camera.name || camera.cameraName || 'Camera'}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Camera Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-right">{camera.location.address || camera.district || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latitude:</span>
                        <span className="font-medium">{cameraLat ? cameraLat.toFixed(6) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Longitude:</span>
                        <span className="font-medium">{cameraLng ? cameraLng.toFixed(6) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Update:</span>
                        <span className="font-medium">{new Date(camera.lastUpdate).toLocaleString()}</span>
                      </div>
                      {camera.streamUrl && (
                        <div className="pt-2 border-t border-gray-200">
                          <a
                            href={camera.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Live Stream →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white bg-opacity-70 p-3 rounded">
                        <div className="text-gray-600 text-xs">Nearby Accidents</div>
                        <div className="text-2xl font-bold text-blue-600">{nearbyAccidents.length}</div>
                      </div>
                      <div className="bg-white bg-opacity-70 p-3 rounded">
                        <div className="text-gray-600 text-xs">Current AQI</div>
                        <div className={`text-2xl font-bold ${currentAQI ? getAQIColor(currentAQI.aqi) : 'text-gray-400'}`}>
                          {currentAQI ? currentAQI.aqi : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Data Tab */}
          {activeTab === 'current' && (
            <div className="space-y-6">
              {/* Weather Section */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>🌤️</span> Current Weather
                  </h3>
                </div>
                <div className="p-4">
                  {currentWeather ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">🌡️</div>
                        <div className="text-2xl font-bold text-gray-900">{currentWeather.temperature}°C</div>
                        <div className="text-sm text-gray-600">Temperature</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">💧</div>
                        <div className="text-2xl font-bold text-gray-900">{currentWeather.humidity}%</div>
                        <div className="text-sm text-gray-600">Humidity</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">💨</div>
                        <div className="text-2xl font-bold text-gray-900">{currentWeather.windSpeed} km/h</div>
                        <div className="text-sm text-gray-600">Wind Speed</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-3xl mb-1">🌧️</div>
                        <div className="text-2xl font-bold text-gray-900">{currentWeather.rainfall} mm</div>
                        <div className="text-sm text-gray-600">Rainfall</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No weather data available for this location
                    </div>
                  )}
                </div>
              </div>

              {/* Air Quality Section */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>🌫️</span> Air Quality Index
                  </h3>
                </div>
                <div className="p-4">
                  {currentAQI ? (
                    <>
                      {/* AQI Gauge */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg mb-4 text-center">
                        <div className={`text-6xl font-bold ${getAQIColor(currentAQI.aqi)} mb-2`}>
                          {currentAQI.aqi}
                        </div>
                        <div className="text-lg font-semibold text-gray-700 uppercase">{currentAQI.level.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500 mt-1">Air Quality Index</div>
                      </div>

                      {/* Pollutants Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700">Pollutant</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-700">Value</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-700">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">PM2.5</td>
                              <td className="px-4 py-3 text-right text-gray-900">{currentAQI.pm25}</td>
                              <td className="px-4 py-3 text-right text-gray-600">µg/m³</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">PM10</td>
                              <td className="px-4 py-3 text-right text-gray-900">{currentAQI.pm10}</td>
                              <td className="px-4 py-3 text-right text-gray-600">µg/m³</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">CO</td>
                              <td className="px-4 py-3 text-right text-gray-900">{currentAQI.co}</td>
                              <td className="px-4 py-3 text-right text-gray-600">ppm</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">NO₂</td>
                              <td className="px-4 py-3 text-right text-gray-900">{currentAQI.no2}</td>
                              <td className="px-4 py-3 text-right text-gray-600">ppb</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">SO₂</td>
                              <td className="px-4 py-3 text-right text-gray-900">{currentAQI.so2}</td>
                              <td className="px-4 py-3 text-right text-gray-600">ppb</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">O₃</td>
                              <td className="px-4 py-3 text-right text-gray-900">{currentAQI.o3}</td>
                              <td className="px-4 py-3 text-right text-gray-600">ppb</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No air quality data available for this location
                    </div>
                  )}
                </div>
              </div>

              {/* Traffic Section */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>🚗</span> Traffic Information
                  </h3>
                </div>
                <div className="p-4">
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <div className="text-4xl mb-2">🚦</div>
                    <div className="text-lg text-gray-700">Real-time traffic data</div>
                    <div className="text-sm text-gray-500 mt-2">
                      Vehicle count and congestion level monitoring active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {isRefreshing && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <div className="mt-4 text-gray-600">Loading historical data...</div>
                </div>
              )}

              {!isRefreshing && (
                <>
                  {/* AQI History Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">AQI History (Last 7 Days)</h3>
                    </div>
                    <div className="p-4">
                      {historicalAQI.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={historicalAQI}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              formatter={(value: number) => [value, '']}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="aqi" stroke="#8b5cf6" strokeWidth={2} name="AQI" />
                            <Line type="monotone" dataKey="pm25" stroke="#f59e0b" strokeWidth={2} name="PM2.5" />
                            <Line type="monotone" dataKey="pm10" stroke="#10b981" strokeWidth={2} name="PM10" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          No historical AQI data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Temperature & Humidity Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Weather History (Last 7 Days)</h3>
                    </div>
                    <div className="p-4">
                      {historicalWeather.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={historicalWeather}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                            <Tooltip
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                            <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          No historical weather data available
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Accidents Tab */}
          {activeTab === 'accidents' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Accidents Near Camera (Last 30 Days)
                  </h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {nearbyAccidents.length} incidents
                  </span>
                </div>
                <div className="p-4">
                  {nearbyAccidents.length > 0 ? (
                    <>
                      {/* Timeline Visualization */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-4">Timeline</h4>
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                          <div className="space-y-4">
                            {nearbyAccidents.slice(0, 10).map((accident, index) => (
                              <div key={accident.id} className="relative pl-10">
                                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(accident.severity)}`}>
                                  {index + 1}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">{accident.type}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(accident.severity)}`}>
                                          {accident.severity}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{accident.description}</p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>📍 {accident.location.address}</span>
                                        <span>📏 {accident.distance.toFixed(2)} km away</span>
                                      </div>
                                    </div>
                                    <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                                      {new Date(accident.timestamp).toLocaleDateString()}
                                      <br />
                                      {new Date(accident.timestamp).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-600">
                            {nearbyAccidents.filter(a => a.severity === 'fatal').length}
                          </div>
                          <div className="text-sm text-gray-600">Fatal</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <div className="text-2xl font-bold text-orange-600">
                            {nearbyAccidents.filter(a => a.severity === 'severe').length}
                          </div>
                          <div className="text-sm text-gray-600">Severe</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-600">
                            {nearbyAccidents.filter(a => a.severity === 'moderate').length}
                          </div>
                          <div className="text-sm text-gray-600">Moderate</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">
                            {nearbyAccidents.filter(a => a.severity === 'minor').length}
                          </div>
                          <div className="text-sm text-gray-600">Minor</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">✅</div>
                      <div className="text-lg font-medium text-gray-900 mb-2">No Accidents Reported</div>
                      <div className="text-sm text-gray-500">
                        No accidents within 2km in the last 30 days
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => fetchHistoricalData()}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onViewOnMap(camera);
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View on Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraDetailModal;
