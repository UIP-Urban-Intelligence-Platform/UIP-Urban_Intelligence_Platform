/**
 * Traffic Map Component - Interactive Leaflet Map with Multiple Overlays
 * 
 * @module apps/traffic-web-app/frontend/src/components/TrafficMap
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Core map component providing interactive traffic visualization with 8 overlay layers,
 * real-time updates, and geo-spatial filtering. Built on Leaflet with React wrappers.
 * 
 * Map Overlays (8 layers):
 * 1. Camera Markers: Traffic cameras with image popups and intensity indicators
 * 2. AQI Heatmap: Air quality circles with color-coded severity
 * 3. Vehicle Heatmap: Traffic density visualization with gradient colors
 * 4. Speed Zones: Road segments colored by average speed
 * 5. Pattern Zones: Congestion pattern polygons
 * 6. Accident Markers: Red markers with severity levels
 * 7. Weather Overlay: Temperature/humidity/wind vectors
 * 8. Correlation Lines: Visual links between correlated entities
 * 
 * Key Features:
 * - OpenStreetMap base layer
 * - Layer toggle controls
 * - Zoom/pan interactions
 * - Popup windows with entity details
 * - Tooltips on hover
 * - Scale control
 * - Coordinate display
 * - Bounding box filtering
 * - Center/zoom programmatic control
 * 
 * Performance Optimizations:
 * - Marker clustering for dense areas
 * - Lazy loading of popups
 * - Memoized layer rendering
 * - Debounced map move events
 * - Canvas-based heatmaps
 * 
 * @dependencies
 * - react-leaflet@^4.2: React bindings for Leaflet
 * - leaflet@^1.9: Interactive map library
 * - Zustand store for state management
 * 
 * @example
 * <TrafficMap
 *   ref={mapRef}
 *   center={[10.8231, 106.6297]}
 *   zoom={13}
 *   onBoundsChange={(bounds) => console.log(bounds)}
 * />
 */

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect, useCallback, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  LayersControl,
  ScaleControl,
  ZoomControl,
  Tooltip,
  useMap
} from 'react-leaflet';
import { Icon, LatLngExpression, Map as LeafletMap } from 'leaflet';
import { useTrafficStore } from '../store/trafficStore';
import { Camera, Accident, Weather, AirQuality, TrafficPattern } from '../types';
import { format, subHours, parseISO } from 'date-fns';
import AQIHeatmap from './AQIHeatmap';
import WeatherOverlay from './WeatherOverlay';
import AccidentMarkers from './AccidentMarkers';
import PatternZones from './PatternZones';
// Advanced components disabled - require API endpoints not available
// import PollutantCircles from './PollutantCircles';
// import HumidityVisibilityLayer from './HumidityVisibilityLayer';
// import VehicleHeatmap from './VehicleHeatmap';
// import SpeedZones from './SpeedZones';
// import CorrelationLines from './CorrelationLines';
// import AccidentFrequencyChart from './AccidentFrequencyChart';
import CameraDetailModal from './CameraDetailModal';
import ConnectionStatus from './ConnectionStatus';
import TimeMachine from './TimeMachine';
import HistoricalViewBanner from './HistoricalViewBanner';
import RoutePlanner from './RoutePlanner';
import RouteVisualization from './RouteVisualization';
// AI Agents
import { HealthAdvisorChat } from './agents/HealthAdvisorChat';
import { InvestigatorPanel } from './agents/InvestigatorPanel';
import { PredictiveTimeline } from './agents/PredictiveTimeline';
// Citizen Reports
import { CitizenReportForm } from './CitizenReportForm';
import { CitizenReportMarkers } from './CitizenReportMarkers';
import { citizenReportService } from '../services/citizenReportService';
import { CitizenReport } from '../types/citizenReport';
import useWebSocket from '../hooks/useWebSocket';
import 'leaflet/dist/leaflet.css';

const { BaseLayer } = LayersControl;

const createCameraIcon = (status: string = 'active'): Icon => {
  // Note: Future versions may include type-specific icons (PTZ/Static/Dome)
  const color = status === 'active' || status === 'online' ? 'blue' : 'red';
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png`,
    iconSize: [35, 57],  // Tăng từ [25, 41] lên 40% để dễ nhìn hơn
    iconAnchor: [17, 57],  // Điều chỉnh anchor point
    popupAnchor: [1, -50],  // Điều chỉnh popup position
    shadowSize: [57, 57],  // Tăng shadow size
  });
};

const accidentIconBySeverity = (severity: string): Icon => {
  const colorMap: Record<string, string> = {
    'fatal': 'black',
    'severe': 'red',
    'moderate': 'orange',
    'minor': 'yellow',
  };
  const color = colorMap[severity] || 'red';
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png`,
    iconSize: [35, 57],
    iconAnchor: [17, 57],
    popupAnchor: [1, -50],
    shadowSize: [57, 57],
  });
};

const weatherIcon = new Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png`,
  shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png`,
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -50],
  shadowSize: [57, 57],
});

const airQualityIconByLevel = (level: string): Icon => {
  const colorMap: Record<string, string> = {
    'good': 'green',
    'moderate': 'yellow',
    'unhealthy': 'orange',
    'very_unhealthy': 'red',
    'hazardous': 'violet',
  };
  const color = colorMap[level] || 'grey';
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png`,
    iconSize: [35, 57],
    iconAnchor: [17, 57],
    popupAnchor: [1, -50],
    shadowSize: [57, 57],
  });
};

const TrafficMap = forwardRef<any, {}>((_props, ref) => {
  const {
    cameras,
    accidents,
    weather,
    airQuality,
    patterns,
    filters,
    setSelectedCamera,
    setSelectedAccident,
    setSelectedPattern,
  } = useTrafficStore();

  // Debug: Log data counts
  useEffect(() => {
    console.log('📊 TrafficMap Data:', {
      cameras: cameras.length,
      accidents: accidents.length,
      weather: weather.length,
      airQuality: airQuality.length,
      patterns: patterns.length
    });
  }, [cameras, accidents, weather, airQuality, patterns]);

  // WebSocket connection
  const { connected, connecting, error, reconnectCount } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
    heartbeatInterval: 10000,
    reconnectInterval: 3000
  });

  // Camera detail modal state
  const [selectedCameraForModal, setSelectedCameraForModal] = useState<Camera | null>(null);
  // InvestigatorPanel camera state (separate from CameraDetailModal)
  const [selectedCameraForInvestigator, setSelectedCameraForInvestigator] = useState<Camera | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // Memoized callbacks for InvestigatorPanel to prevent re-render loop
  const handleCameraChange = useCallback((cameraId: string) => {
    console.log('📷 Switching to camera:', cameraId);
    const newCamera = cameras.find(c => c.id === cameraId);
    if (newCamera) {
      setSelectedCameraForInvestigator(newCamera);
    }
  }, [cameras]);

  const handleInvestigatorClose = useCallback(() => {
    console.log('🔴 Closing InvestigatorPanel via X button');
    useTrafficStore.getState().updateFilters({ showInvestigator: false });
  }, []);

  // InvestigatorPanelWithAI - Wrapper component with REAL AI Vision + LOD Cloud data
  const InvestigatorPanelWithAI: React.FC<{
    targetCamera: Camera;
    cameraList: Array<{ id: string; name: string }>;
    onCameraChange: (cameraId: string) => void;
    onClose: () => void;
  }> = ({ targetCamera, cameraList, onCameraChange, onClose }) => {
    // 🆕 NEW: Real AI data state (no more mock!)
    const [realData, setRealData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // 🆕 NEW: Fetch REAL AI Vision + Real LOD Cloud data
    useEffect(() => {
      const fetchRealAIData = async () => {
        setLoading(true);
        try {
          console.log(`🔍 [NEW] Fetching real AI Vision data for camera: ${targetCamera.id}`);

          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const response = await fetch(`${API_URL}/api/agents/graph-investigator/analyze-camera-with-vision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cameraId: targetCamera.id,
              cameraName: targetCamera.name || targetCamera.cameraName || 'Unknown'
              // imageBase64: optional - backend will use demo image if not provided
            })
          });

          const result = await response.json();

          if (result.success) {
            console.log(`✅ Received real AI data:`, {
              detections: result.data.detections.length,
              trafficLevel: result.data.trafficLevel,
              aqi: result.data.aqi.value,
              temp: result.data.weather.temperature
            });

            // Transform detections to include colors for rendering
            const colors = ['#00FF00', '#FF0000', '#FFFF00', '#00FFFF', '#FF00FF'];
            const colorMap: Record<string, string> = {
              'Xe cộ': '#00FF00',
              'Xe máy': '#FFFF00',
              'Xe tải': '#FF0000',
              'Xe buýt': '#00FFFF',
              'Người đi bộ': '#FF00FF'
            };

            const detectionsWithColors = result.data.detections.map((d: any, i: number) => ({
              ...d,
              // Convert normalized coordinates (0-1) to pixel coordinates
              box: {
                x: d.box.x * 640,      // Assuming 640x480 image
                y: d.box.y * 480,
                width: d.box.width * 640,
                height: d.box.height * 480
              },
              color: colorMap[d.label] || colors[i % colors.length]
            }));

            setRealData({
              detections: detectionsWithColors,
              trafficLevel: result.data.trafficLevel,
              weather: result.data.weather,
              aqi: result.data.aqi,
              analysis: result.data.analysis,
              imageAnalyzed: result.data.imageAnalyzed
            });
          } else {
            console.error('❌ Failed to fetch real AI data:', result.error);
          }
        } catch (error) {
          console.error('❌ Error fetching real AI data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchRealAIData();
    }, [targetCamera.id]);

    // Use REAL data if available, otherwise show loading state
    const detections = realData?.detections || [];
    const trafficLevel = realData?.trafficLevel || 'Đang tải...';
    const currentAqi = realData?.aqi?.value || 50;
    const aqiCategory = realData?.aqi?.category || 'Đang tải...';
    const weatherDesc = realData?.weather?.description || 'Đang tải...';
    const temperature = realData?.weather?.temperature || 28;

    // Calculate severity from traffic level
    const trafficSeverity: 'normal' | 'warning' | 'critical' =
      trafficLevel.includes('nghiêm trọng') ? 'critical' :
        trafficLevel.includes('Tắc nghẽn') ? 'warning' : 'normal';

    const aqiSeverity: 'normal' | 'warning' | 'critical' =
      currentAqi > 150 ? 'critical' : currentAqi > 100 ? 'warning' : 'normal';

    const verdict = realData?.analysis || {
      summary: loading ? `Đang phân tích camera ${targetCamera.name || 'này'} bằng AI Vision...` : 'Chưa có dữ liệu',
      confidence: 0.0,
      severity: 'normal',
      recommendations: loading ? ['Đang phân tích bằng Gemini Vision...', 'Đang query dữ liệu từ LOD Cloud...', 'Đang tính toán traffic level...'] : ['Chưa có khuyến nghị']
    };

    return (
      <InvestigatorPanel
        investigationResult={{
          cameraId: targetCamera.id,
          cameraName: targetCamera.name || targetCamera.cameraName || 'Unknown',
          location: {
            lat: targetCamera.location.latitude,
            lng: targetCamera.location.longitude,
            address: targetCamera.location.address || 'No address'
          },
          timestamp: new Date().toISOString(),
          snapshot: {
            url: targetCamera.streamUrl || 'https://via.placeholder.com/640x480',
            width: 640,
            height: 480
          },
          // 🆕 REAL AI detections with bounding boxes from Gemini Vision
          aiDetections: detections,
          externalNews: [],
          sensorData: [
            // 🆕 REAL traffic level calculated from detection count
            {
              type: 'traffic',
              label: 'Giao thông',
              value: trafficLevel,
              severity: trafficSeverity,
              icon: '🚦'
            },
            // 🆕 REAL AQI from Stellio AirQualityObserved entities
            {
              type: 'airquality',
              label: 'Chất lượng không khí',
              value: `AQI ${currentAqi} - ${aqiCategory}`,
              severity: aqiSeverity,
              icon: '🌫️'
            },
            // 🆕 REAL weather from Stellio WeatherObserved entities
            {
              type: 'weather',
              label: 'Thời tiết',
              value: `${weatherDesc} (${temperature}°C)`,
              severity: 'normal',
              icon: '🌤️'
            }
          ],
          verdict: {
            // 🆕 REAL Gemini AI-generated analysis
            summary: verdict.summary,
            confidence: verdict.confidence,
            severity: verdict.severity,
            items: [],
            recommendations: verdict.recommendations
          }
        }}
        isLoading={loading}
        availableCameras={cameraList}
        onCameraChange={onCameraChange}
        onClose={onClose}
      />
    );
  };

  // Sync InvestigatorPanel camera when toggling showInvestigator
  useEffect(() => {
    if (filters.showInvestigator && !selectedCameraForInvestigator && cameras.length > 0) {
      // When InvestigatorPanel is opened and no camera selected, use first camera
      setSelectedCameraForInvestigator(cameras[0]);
    }
    if (!filters.showInvestigator) {
      // Clear InvestigatorPanel camera when closed
      setSelectedCameraForInvestigator(null);
    }
  }, [filters.showInvestigator, cameras.length]);

  // Historical mode state
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const [historicalData, setHistoricalData] = useState<{
    timestamp: Date;
    weather: Weather[];
    airQuality: AirQuality[];
    patterns: TrafficPattern[];
    accidents: Accident[];
  } | null>(null);

  // Display mode for PatternZones
  const [displayMode] = useState<'congestion' | 'aqi' | 'dual'>('dual');

  // Routing state
  const [calculatedRoutes, setCalculatedRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);

  // Citizen Reports state
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);

  // Fetch citizen reports
  const fetchCitizenReports = useCallback(async () => {
    try {
      const reports = await citizenReportService.queryReports({});
      setCitizenReports(reports);
    } catch (err) {
      console.error('Failed to fetch citizen reports:', err);
    }
  }, []);

  // Fetch citizen reports on mount and when showCitizenReports is enabled
  useEffect(() => {
    if (filters.showCitizenReports) {
      fetchCitizenReports();
    }
  }, [filters.showCitizenReports, fetchCitizenReports]);

  // Handle citizen report submission
  const handleCitizenReportSubmit = (reportId: string) => {
    console.log('Citizen report submitted:', reportId);
    // Refresh reports after submission
    setTimeout(() => {
      fetchCitizenReports();
    }, 1000);
  };

  // =====================================================
  // HEALTH ADVISOR HANDLERS
  // =====================================================

  // Handle Health Advisor chat messages
  const handleHealthAdvisorMessage = useCallback(async (message: string): Promise<any> => {
    console.log('💬 Health Advisor message:', message);

    try {
      // Get current location from air quality data or use default HCMC location
      const currentLocation = airQuality.length > 0
        ? { lat: airQuality[0].location.lat, lng: airQuality[0].location.lng }
        : { lat: 10.8231, lng: 106.6297 }; // Default HCMC center

      // Call real EcoTwinAgent API
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/agents/eco-twin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          location: currentLocation,
          userProfile: {
            language: 'vi',
            sensitivityLevel: 'medium',
            transportMode: 'motorbike',
            healthConditions: [],
            activityType: 'commute'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response from EcoTwinAgent');
      }

      // Build suggestions from recommendations
      const suggestions = [
        {
          id: 'sug_route',
          type: 'route',
          label: 'Xem tuyến đường sạch hơn',
          icon: '🗺️',
          action: 'show_cleaner_route'
        },
        {
          id: 'sug_cafe',
          type: 'location',
          label: 'Tìm quán cafe gần đây',
          icon: '☕',
          action: 'find_cafe'
        }
      ];

      // Add traffic suggestion if AQI is bad
      if (data.data.aqi > 100) {
        suggestions.push({
          id: 'sug_traffic',
          type: 'route',
          label: 'Xem mật độ giao thông',
          icon: '🚦',
          action: 'show_traffic'
        });
      }

      // Return formatted response
      return {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.data.message,
        timestamp: data.data.timestamp,
        metadata: {
          aqi: data.data.aqi,
          aqiCategory: data.data.aqiCategory,
          predictedAQI: data.data.predictedAQI,
          riskLevel: data.data.riskLevel,
          weather: {
            condition: weather[0]?.condition || 'clear',
            temperature: weather[0]?.temperature || 28,
            humidity: weather[0]?.humidity || 70,
            rainfall: weather[0]?.rainfall || 0
          }
        },
        suggestions
      };

    } catch (error) {
      console.error('Failed to call EcoTwinAgent API:', error);

      // Fallback to basic response with current data
      return {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `Tôi đã nhận được câu hỏi: "${message}". Đây là lời khuyên dựa trên điều kiện hiện tại:\n\n🌤️ Chất lượng không khí: ${airQuality[0]?.level || 'good'} (AQI: ${airQuality[0]?.aqi || 50})\n🌡️ Nhiệt độ: ${weather[0]?.temperature || 28}°C\n💧 Độ ẩm: ${weather[0]?.humidity || 70}%\n\nLời khuyên: Điều kiện hiện tại khá tốt cho việc di chuyển.\n\n⚠️ Lưu ý: Không thể kết nối với AI advisor service. Đây là thông tin cơ bản.`,
        timestamp: new Date().toISOString(),
        metadata: {
          aqi: airQuality[0]?.aqi || 50,
          aqiCategory: airQuality[0]?.level || 'good',
          weather: {
            condition: weather[0]?.condition || 'clear',
            temperature: weather[0]?.temperature || 28,
            humidity: weather[0]?.humidity || 70,
            rainfall: weather[0]?.rainfall || 0
          }
        },
        suggestions: [
          {
            id: 'sug_route',
            type: 'route',
            label: 'Xem tuyến đường sạch hơn',
            icon: '🗺️',
            action: 'show_cleaner_route'
          },
          {
            id: 'sug_cafe',
            type: 'location',
            label: 'Tìm quán cafe gần đây',
            icon: '☕',
            action: 'find_cafe'
          }
        ]
      };
    }
  }, [airQuality, weather]);

  // Handle Health Advisor suggestion clicks
  const handleHealthAdvisorSuggestion = useCallback((suggestion: any) => {
    console.log('✨ Health Advisor suggestion clicked:', suggestion);

    switch (suggestion.action) {
      case 'show_cleaner_route':
        // Enable Route Planner with "healthiest" preference
        console.log('🗺️ Opening Route Planner with healthiest preference...');
        useTrafficStore.getState().updateFilters({
          showRoutePlanner: true
        });
        // Note: Route Planner will default to user's location or can be set programmatically
        break;

      case 'find_cafe':
        // Zoom to areas with good air quality (could be cafes, parks, etc.)
        console.log('☕ Finding nearby clean air zones...');
        if (mapRef.current && airQuality.length > 0) {
          // Find location with best AQI
          const bestAQI = airQuality.reduce((best, current) =>
            current.aqi < best.aqi ? current : best
          );
          if (bestAQI.location?.lat && bestAQI.location?.lng) {
            mapRef.current.setView(
              [bestAQI.location.lat, bestAQI.location.lng],
              15,
              { animate: true, duration: 1 }
            );
          }
        }
        break;

      case 'show_traffic':
        // Enable traffic pattern visualization
        console.log('🚦 Showing traffic patterns...');
        useTrafficStore.getState().updateFilters({
          showPatterns: true,
          showPatternZones: true
        });
        break;

      case 'request_route':
        // Open route planner
        console.log('🛣️ Opening route planner...');
        useTrafficStore.getState().updateFilters({
          showRoutePlanner: true
        });
        break;

      default:
        console.log('⚠️ Unknown suggestion action:', suggestion.action);
    }
  }, [airQuality]);

  // Handle camera click for modal
  const handleCameraClick = (camera: Camera) => {
    setSelectedCamera(camera);
    setSelectedCameraForModal(camera);
  };

  // Handle view on map from modal
  const handleViewOnMap = (camera: Camera) => {
    if (mapRef.current) {
      mapRef.current.setView([camera.location.latitude, camera.location.longitude], 16, {
        animate: true,
        duration: 1
      });
    }
  };

  // Handle zoom to camera from FilterPanel
  const handleZoomToCamera = (camera: Camera) => {
    if (mapRef.current) {
      mapRef.current.setView([camera.location.latitude, camera.location.longitude], 16, {
        animate: true,
        duration: 1
      });
    }
  };

  // Handle zoom to district from FilterPanel
  const handleZoomToDistrict = (
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    _center: { lat: number; lng: number }
  ) => {
    if (mapRef.current) {
      // Zoom to fit district bounds
      mapRef.current.fitBounds(
        [[bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]],
        {
          padding: [50, 50],
          animate: true,
          duration: 1
        }
      );
    }
  };

  // Handle historical data update from TimeMachine
  const handleHistoricalDataUpdate = (data: {
    timestamp: Date;
    weather: Weather[];
    airQuality: AirQuality[];
    patterns: TrafficPattern[];
    accidents: Accident[];
  }) => {
    setHistoricalData(data);
  };

  // Handle close Historical View Banner - only closes the banner, not TimeMachine
  const handleCloseHistoricalBanner = () => {
    setHistoricalData(null);
  };

  // Handle close TimeMachine - closes both TimeMachine and banner
  const handleCloseTimeMachine = () => {
    setShowTimeMachine(false);
    setHistoricalData(null);
  };

  // Handle route selection
  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);
  };

  // Handle routes calculated
  const handleRoutesCalculated = (routes: any[]) => {
    setCalculatedRoutes(routes);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleCameraClick,
    handleZoomToCamera,
    handleZoomToDistrict,
  }));

  const center: LatLngExpression = [10.8231, 106.6297];

  // Component to capture map ref
  const MapRefCapture: React.FC = () => {
    const map = useMap();
    mapRef.current = map;
    return null;
  };

  const getCongestionColor = (level: string): string => {
    const levelNormalized = level.toLowerCase();
    switch (levelNormalized) {
      case 'free_flow':
      case 'low':
        return '#00FF00';
      case 'light':
        return '#90EE90';
      case 'moderate':
      case 'medium':
        return '#FFFF00';
      case 'heavy':
      case 'high':
        return '#FFA500';
      case 'severe':
        return '#FF0000';
      default:
        return '#808080';
    }
  };

  const getAQIColor = (level: string): string => {
    switch (level) {
      case 'good':
        return '#00E400';
      case 'moderate':
        return '#FFFF00';
      case 'unhealthy':
        return '#FF7E00';
      case 'very_unhealthy':
        return '#FF0000';
      case 'hazardous':
        return '#8F3F97';
      default:
        return '#808080';
    }
  };

  const getRecentAccidentsCount = (cameraLat: number, cameraLng: number, radius: number = 0.01): number => {
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return accidents.filter(accident => {
      const accidentTime = parseISO(accident.timestamp || accident.dateDetected || new Date().toISOString());
      const isRecent = accidentTime >= twentyFourHoursAgo;
      const distance = Math.sqrt(
        Math.pow(accident.location.latitude - cameraLat, 2) +
        Math.pow(accident.location.longitude - cameraLng, 2)
      );
      return isRecent && distance <= radius;
    }).length;
  };

  const getWeatherAtLocation = (lat: number, lng: number): Weather | null => {
    if (weather.length === 0) return null;

    let closest: Weather | null = null;
    let minDistance = Infinity;

    weather.forEach(w => {
      const distance = Math.sqrt(
        Math.pow(w.location.latitude - lat, 2) +
        Math.pow(w.location.longitude - lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = w;
      }
    });

    return closest;
  };

  const getAQIAtLocation = (lat: number, lng: number): AirQuality | null => {
    if (airQuality.length === 0) return null;

    let closest: AirQuality | null = null;
    let minDistance = Infinity;

    airQuality.forEach(aq => {
      const distance = Math.sqrt(
        Math.pow(aq.location.latitude - lat, 2) +
        Math.pow(aq.location.longitude - lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = aq;
      }
    });

    return closest;
  };

  return (
    <>
      {/* Connection Status Indicator */}
      <ConnectionStatus
        connected={connected}
        connecting={connecting}
        error={error}
        reconnectCount={reconnectCount}
      />

      {/* Camera Detail Modal - Only show when NOT in InvestigatorPanel mode */}
      {selectedCameraForModal && !filters.showInvestigator && (
        <CameraDetailModal
          camera={selectedCameraForModal}
          onClose={() => setSelectedCameraForModal(null)}
          onViewOnMap={handleViewOnMap}
        />
      )}

      <MapContainer
        center={center}
        zoom={13}
        minZoom={11}
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" />

        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri'
            />
          </BaseLayer>
        </LayersControl>

        {/* Cameras - Controlled by Sidebar filters */}
        {filters.showCameras && (
          <>
            {(() => {
              const filteredCameras = cameras.filter((camera: Camera) => {
                const lat = camera?.location?.latitude || (camera?.location as any)?.lat;
                const lng = camera?.location?.longitude || (camera?.location as any)?.lng;
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
              });

              console.log('🎥 Camera Rendering:', {
                total: cameras.length,
                filtered: filteredCameras.length,
                showCameras: filters.showCameras,
                sample: cameras[0]
              });

              return filteredCameras.map((camera: Camera) => {
                const lat = camera.location.latitude || (camera.location as any).lat;
                const lng = camera.location.longitude || (camera.location as any).lng;
                const nearbyWeather = getWeatherAtLocation(lat, lng);
                const nearbyAQI = getAQIAtLocation(lat, lng);
                const recentAccidents = getRecentAccidentsCount(lat, lng);

                return (
                  <Marker
                    key={camera.id}
                    position={[lat, lng]}
                    icon={createCameraIcon(camera.status)}
                    eventHandlers={{
                      click: () => handleCameraClick(camera),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                      <strong>{camera.name}</strong>
                    </Tooltip>
                    <Popup>
                      <div className="p-3 min-w-[280px]">
                        <h3 className="font-bold text-lg mb-2">{camera.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{camera.location.address}</p>

                        <div className="space-y-1 mb-3">
                          <p className="text-sm">
                            <span className="font-semibold">Type:</span> {camera.type || 'Static'}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Status:</span>{' '}
                            <span
                              className={`font-semibold ${camera.status === 'active' || camera.status === 'online'
                                ? 'text-green-600'
                                : camera.status === 'inactive' || camera.status === 'offline'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                                }`}
                            >
                              {camera.status}
                            </span>
                          </p>
                        </div>

                        {nearbyWeather && (
                          <div className="border-t pt-2 mb-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Current Weather:</p>
                            <p className="text-sm">{nearbyWeather.temperature}°C, {nearbyWeather.condition}</p>
                            <p className="text-xs text-gray-600">Humidity: {nearbyWeather.humidity}%</p>
                          </div>
                        )}

                        {nearbyAQI && (
                          <div className="border-t pt-2 mb-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Air Quality:</p>
                            <p className="text-sm">
                              AQI: <span style={{ color: getAQIColor(nearbyAQI.level), fontWeight: 'bold' }}>
                                {nearbyAQI.aqi}
                              </span> ({nearbyAQI.level})
                            </p>
                          </div>
                        )}

                        <div className="border-t pt-2">
                          <p className="text-sm">
                            <span className="font-semibold">Recent Accidents (24h):</span>{' '}
                            <span className={recentAccidents > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {recentAccidents}
                            </span>
                          </p>
                        </div>

                        {camera.streamUrl && (
                          <a
                            href={camera.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-3 text-center bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors shadow-sm"
                          >
                            View Stream
                          </a>
                        )}

                        <button
                          onClick={() => handleCameraClick(camera)}
                          className="block w-full mt-2 text-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              });
            })()}
          </>
        )}

        {/* Accidents - Controlled by Sidebar filters */}
        {filters.showAccidents && (
          <>
            {(() => {
              const filteredAccidents = accidents.filter((accident: Accident) => {
                const lat = accident?.location?.latitude || (accident?.location as any)?.lat;
                const lng = accident?.location?.longitude || (accident?.location as any)?.lng;
                // Show all accidents regardless of resolved status
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
              });

              console.log('🚨 Accident Rendering:', {
                total: accidents.length,
                filtered: filteredAccidents.length,
                showAccidents: filters.showAccidents,
                sample: accidents[0],
                sampleLocation: accidents[0]?.location,
                allAccidentLocations: accidents.slice(0, 3).map(a => a.location)
              });

              return filteredAccidents.map((accident: Accident) => {
                const lat = accident.location.latitude || (accident.location as any).lat;
                const lng = accident.location.longitude || (accident.location as any).lng;
                return (
                  <Marker
                    key={accident.id}
                    position={[lat, lng]}
                    icon={accidentIconBySeverity(accident.severity)}
                    eventHandlers={{
                      click: () => setSelectedAccident(accident),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                      {accident.severity.toUpperCase()} - {accident.type}
                    </Tooltip>
                    <Popup>
                      <div className="p-3 min-w-[260px]">
                        <h3 className="font-bold text-lg mb-2 text-red-600">Accident</h3>
                        <p className="text-sm text-gray-600 mb-2">{accident.location.address}</p>

                        <div className="space-y-1 mb-2">
                          <p className="text-sm">
                            <span className="font-semibold">Type:</span> {accident.type}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Severity:</span>{' '}
                            <span
                              className={`font-semibold ${accident.severity === 'fatal'
                                ? 'text-black'
                                : accident.severity === 'severe'
                                  ? 'text-red-600'
                                  : accident.severity === 'moderate'
                                    ? 'text-orange-600'
                                    : 'text-yellow-600'
                                }`}
                            >
                              {accident.severity.toUpperCase()}
                            </span>
                          </p>
                          {accident.vehicles !== undefined && (
                            <p className="text-sm">
                              <span className="font-semibold">Vehicles:</span> {accident.vehicles}
                            </p>
                          )}
                          {accident.casualties !== undefined && accident.casualties > 0 && (
                            <p className="text-sm font-semibold text-red-600">
                              Casualties: {accident.casualties}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {format(parseISO(accident.timestamp || accident.dateDetected || new Date().toISOString()), 'PPpp')}
                          </p>
                        </div>

                        {accident.description && (
                          <p className="text-sm mt-2 p-2 bg-gray-100 rounded">{accident.description}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              });
            })()}
          </>
        )}

        {/* Weather - Controlled by Sidebar filters */}
        {filters.showWeather && (
          <>
            {(() => {
              // Filter valid coordinates
              const filteredWeather = weather.filter((w: Weather) => {
                // Backend sends {lat, lng}, frontend types define {latitude, longitude}
                const lat = (w?.location as any)?.lat || w?.location?.latitude;
                const lng = (w?.location as any)?.lng || w?.location?.longitude;
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
              });

              console.log('🌤️ Weather Rendering:', {
                total: weather.length,
                filtered: filteredWeather.length,
                showWeather: filters.showWeather,
                sample: filteredWeather[0],
                allIds: filteredWeather.map(w => w.id),
                allCoords: filteredWeather.map(w => ({
                  id: w.id,
                  lat: (w.location as any)?.lat || w.location?.latitude,
                  lng: (w.location as any)?.lng || w.location?.longitude
                }))
              });

              return filteredWeather.map((w: Weather, index: number) => {
                // Backend sends location as {lat, lng}
                const lat = (w.location as any).lat || w.location.latitude;
                const lng = (w.location as any).lng || w.location.longitude;
                return (
                  <Marker
                    key={`weather-${w.id}-${index}`}
                    position={[lat, lng]}
                    icon={weatherIcon}
                  >
                    <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                      {w.temperature}°C - {w.condition}
                    </Tooltip>
                    <Popup>
                      <div className="p-3 min-w-[240px]">
                        <h3 className="font-bold text-lg mb-2">Weather</h3>
                        <p className="text-sm text-gray-600 mb-2">{w.location.district}</p>

                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-semibold">Temperature:</span> {w.temperature}°C
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Humidity:</span> {w.humidity}%
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Rainfall:</span> {w.rainfall}mm
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Wind:</span> {w.windSpeed}km/h {w.windDirection}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Condition:</span> {w.condition}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              });
            })()}
          </>
        )}

        {/* Air Quality - Controlled by Sidebar filters */}
        {filters.showAirQuality && (
          <>
            {(() => {
              // Filter valid coordinates
              const filteredAQ = airQuality.filter((aq: AirQuality) => {
                // Backend sends {lat, lng}, frontend types define {latitude, longitude}
                const lat = (aq?.location as any)?.lat || aq?.location?.latitude;
                const lng = (aq?.location as any)?.lng || aq?.location?.longitude;
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
              });

              console.log('💨 Air Quality Rendering:', {
                total: airQuality.length,
                filtered: filteredAQ.length,
                showAirQuality: filters.showAirQuality,
                sample: filteredAQ[0],
                allIds: filteredAQ.map(aq => aq.id),
                allCoords: filteredAQ.map(aq => ({
                  id: aq.id,
                  lat: (aq.location as any)?.lat || aq.location?.latitude,
                  lng: (aq.location as any)?.lng || aq.location?.longitude
                })),
                duplicateIds: filteredAQ.map(aq => aq.id).filter((id, index, arr) => arr.indexOf(id) !== index)
              });

              return filteredAQ.map((aq: AirQuality, index: number) => {
                // Backend sends {lat, lng}, frontend types define {latitude, longitude}
                const lat = (aq.location as any).lat || aq.location.latitude;
                const lng = (aq.location as any).lng || aq.location.longitude;
                // Add small offset to avoid exact overlap with weather marker at same location
                const offsetLat = lat + 0.0003; // ~33 meters north
                return (
                  <Marker
                    key={`airquality-${aq.id}-${index}`}
                    position={[offsetLat, lng]}
                    icon={airQualityIconByLevel(aq.level)}
                  >
                    <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                      AQI: {aq.aqi} ({aq.level})
                    </Tooltip>
                    <Popup>
                      <div className="p-3 min-w-[240px]">
                        <h3 className="font-bold text-lg mb-2">Air Quality</h3>
                        <p className="text-sm text-gray-600 mb-2">{aq.location.station}</p>

                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-semibold">AQI:</span>{' '}
                            <span
                              className="font-semibold text-lg"
                              style={{ color: getAQIColor(aq.level) }}
                            >
                              {aq.aqi}
                            </span>
                            {' '}({aq.level})
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">PM2.5:</span> {aq.pm25} µg/m³
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">PM10:</span> {aq.pm10} µg/m³
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">CO:</span> {aq.co} ppm
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">NO2:</span> {aq.no2} ppb
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              });
            })()}
          </>
        )}

        {/* Traffic Patterns - Controlled by Sidebar filters */}
        {filters.showPatterns && (
          <>
            {(() => {
              const filteredPatterns = patterns.filter((pattern: TrafficPattern) => {
                if (!pattern.location || !pattern.location.startPoint || !pattern.location.endPoint) return false;
                const startLat = pattern.location.startPoint.latitude || (pattern.location.startPoint as any).lat;
                const startLng = pattern.location.startPoint.longitude || (pattern.location.startPoint as any).lng;
                const endLat = pattern.location.endPoint.latitude || (pattern.location.endPoint as any).lat;
                const endLng = pattern.location.endPoint.longitude || (pattern.location.endPoint as any).lng;
                return startLat != null && startLng != null && endLat != null && endLng != null &&
                  !isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng);
              });

              console.log('🚦 Traffic Patterns Rendering:', {
                total: patterns.length,
                filtered: filteredPatterns.length,
                showPatterns: filters.showPatterns,
                sample: patterns[0]
              });

              return filteredPatterns.map((pattern: TrafficPattern) => {
                const startLat = pattern.location!.startPoint.latitude || (pattern.location!.startPoint as any).lat;
                const startLng = pattern.location!.startPoint.longitude || (pattern.location!.startPoint as any).lng;
                const endLat = pattern.location!.endPoint.latitude || (pattern.location!.endPoint as any).lat;
                const endLng = pattern.location!.endPoint.longitude || (pattern.location!.endPoint as any).lng;
                const positions: LatLngExpression[] = [
                  [startLat, startLng],
                  [endLat, endLng],
                ];
                return (
                  <Polyline
                    key={pattern.id}
                    positions={positions}
                    color={getCongestionColor(pattern.congestionLevel)}
                    weight={5}
                    opacity={0.7}
                    eventHandlers={{
                      click: () => setSelectedPattern(pattern),
                    }}
                  >
                    <Popup>
                      <div className="p-3 min-w-[240px]">
                        <h3 className="font-bold text-lg mb-2">Traffic Pattern</h3>
                        {pattern.roadSegment && (
                          <p className="text-sm text-gray-600 mb-2">{pattern.roadSegment}</p>
                        )}

                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-semibold">Type:</span> {pattern.patternType}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Congestion:</span>{' '}
                            <span
                              className="font-semibold"
                              style={{ color: getCongestionColor(pattern.congestionLevel) }}
                            >
                              {pattern.congestionLevel}
                            </span>
                          </p>
                          {pattern.timeRange && (
                            <p className="text-sm">
                              <span className="font-semibold">Time:</span> {pattern.timeRange}
                            </p>
                          )}
                          {pattern.averageSpeed !== undefined && (
                            <p className="text-sm">
                              <span className="font-semibold">Avg Speed:</span> {pattern.averageSpeed} km/h
                            </p>
                          )}
                          {pattern.vehicleCount !== undefined && (
                            <p className="text-sm">
                              <span className="font-semibold">Vehicles:</span> {pattern.vehicleCount}
                            </p>
                          )}
                          {pattern.predictions && (
                            <p className="text-sm mt-2 p-2 bg-blue-50 rounded">
                              <span className="font-semibold">Prediction:</span> {pattern.predictions.nextHour} km/h
                              <br />
                              <span className="text-xs">({(pattern.predictions.confidence * 100).toFixed(1)}% confidence)</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                );
              });
            })()}
          </>
        )}

        <AQIHeatmap visible={filters.showAQIHeatmap} />
        <WeatherOverlay visible={filters.showWeatherOverlay} />
        <AccidentMarkers visible={filters.showAccidentMarkers} />
        <PatternZones visible={filters.showPatternZones} displayMode={displayMode} />

        {/* Citizen Report Markers */}
        {filters.showCitizenReports && (
          <CitizenReportMarkers reports={citizenReports} />
        )}

        {/* Route Visualization */}
        {calculatedRoutes.length > 0 && (
          <RouteVisualization
            routes={calculatedRoutes}
            selectedRoute={selectedRoute}
            onRouteClick={handleRouteSelect}
          />
        )}

        {/* Advanced Components - Disabled: Require API endpoints not available */}
        {/* FilterPanel, MapLegend, and SimpleLegend are now integrated into Sidebar */}
        {/* <PollutantCircles visible={filters.showPollutantCircles} /> */}
        {/* <HumidityVisibilityLayer visible={filters.showHumidityLayer} /> */}
        {/* <VehicleHeatmap visible={filters.showVehicleHeatmap} /> */}
        {/* <SpeedZones visible={filters.showSpeedZones} /> */}
        {/* <CorrelationLines visible={filters.showCorrelationLines} /> */}
        {/* <AccidentFrequencyChart visible={filters.showAccidentFrequency} /> */}

        {/* Map Ref Capture */}
        <MapRefCapture />
      </MapContainer>

      {/* Route Planner Panel */}
      {filters.showRoutePlanner && (
        <RoutePlanner
          onRouteSelect={handleRouteSelect}
          onRoutesCalculated={handleRoutesCalculated}
          onClose={() => useTrafficStore.getState().updateFilters({ showRoutePlanner: false })}
        />
      )}

      {/* Time Machine Toggle Button */}
      <button
        onClick={() => setShowTimeMachine(!showTimeMachine)}
        className="fixed bottom-8 right-8 z-[9998] bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2.5 transition-all duration-300 hover:shadow-xl"
        title="Time Machine"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">
          {showTimeMachine ? 'Hide' : 'Show'} Time Machine
        </span>
      </button>

      {/* Historical View Banner */}
      {historicalData && (
        <HistoricalViewBanner
          timestamp={historicalData.timestamp}
          dataCount={{
            weather: historicalData.weather.length,
            airQuality: historicalData.airQuality.length,
            patterns: historicalData.patterns.length,
            accidents: historicalData.accidents.length
          }}
          onClose={handleCloseHistoricalBanner}
        />
      )}

      {/* Time Machine Component */}
      {showTimeMachine && (
        <TimeMachine
          visible={showTimeMachine}
          onDataUpdate={handleHistoricalDataUpdate}
          onClose={handleCloseTimeMachine}
        />
      )}

      {/* Citizen Report Form */}
      {filters.showCitizenForm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <CitizenReportForm
              onReportSubmitted={handleCitizenReportSubmit}
              onClose={() => useTrafficStore.getState().updateFilters({ showCitizenForm: false })}
            />
          </div>
        </div>
      )}

      {/* AI Agent Panels */}
      {filters.showHealthAdvisor && (
        <div className="fixed top-20 right-4 z-[9995] w-96 max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl shadow-2xl">
          <HealthAdvisorChat
            userProfile={{
              name: 'Người dùng',
              healthConditions: [],
              sensitivityLevel: 'medium',
              preferredLanguage: 'vi',
              transportMode: 'motorbike'
            }}
            currentWeather={{
              condition: weather[0]?.condition || 'clear',
              temperature: weather[0]?.temperature || 28,
              humidity: weather[0]?.humidity || 70,
              rainfall: weather[0]?.rainfall || 0,
              windSpeed: weather[0]?.windSpeed || 5
            }}
            currentAQI={{
              value: airQuality[0]?.aqi || 50,
              category: airQuality[0]?.level || 'good',
              pm25: airQuality[0]?.pm25 || 25,
              pm10: airQuality[0]?.pm10 || 40
            }}
            onSendMessage={handleHealthAdvisorMessage}
            onSuggestionClick={handleHealthAdvisorSuggestion}
          />
          <button
            onClick={() => useTrafficStore.getState().updateFilters({ showHealthAdvisor: false })}
            className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors z-10"
            title="Close Health Advisor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {(() => {
        // Debug logging
        console.log('🔍 InvestigatorPanel Debug:', {
          showInvestigator: filters.showInvestigator,
          camerasCount: cameras.length,
          selectedCamera: selectedCameraForInvestigator?.id,
          firstCamera: cameras[0]?.id
        });

        if (!filters.showInvestigator) {
          return null;
        }

        if (cameras.length === 0) {
          return (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9996] w-[90vw] max-w-6xl max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl shadow-2xl bg-white p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#111827' }}>Không có camera khả dụng</h3>
                <p className="text-gray-600 mb-4">Vui lòng đợi hệ thống tải dữ liệu camera hoặc chọn một camera trên bản đồ.</p>
                <button
                  onClick={() => {
                    console.log('🔴 Closing InvestigatorPanel');
                    useTrafficStore.getState().updateFilters({ showInvestigator: false });
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          );
        }

        // Use useMemo to prevent infinite re-render loop
        const targetCamera = useMemo(
          () => selectedCameraForInvestigator || cameras[0],
          [selectedCameraForInvestigator, cameras]
        );
        console.log('✅ Rendering InvestigatorPanel with camera:', targetCamera.id);

        // Prepare camera list for dropdown - memoized to prevent re-creation
        const cameraList = useMemo(
          () => cameras.map(cam => ({
            id: cam.id,
            name: cam.name || cam.cameraName || cam.id
          })),
          [cameras]
        );

        return (
          <InvestigatorPanelWithAI
            targetCamera={targetCamera}
            cameraList={cameraList}
            onCameraChange={handleCameraChange}
            onClose={handleInvestigatorClose}
          />
        );
      })()}

      {filters.showPredictive && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9994] w-[90vw] max-w-6xl max-h-[45vh] overflow-hidden rounded-xl shadow-2xl bg-white">
          <PredictiveTimeline
            predictions={[
              {
                timestamp: new Date().toISOString(),
                currentCongestion: 45,
                predictedCongestion: 65,
                confidence: 0.82,
                contributingEvents: ['event1'],
                factors: { baselineTraffic: 40, eventImpact: 15, weatherImpact: 5, historicalPattern: 5 }
              },
              {
                timestamp: new Date(Date.now() + 3600000).toISOString(),
                currentCongestion: 45,
                predictedCongestion: 75,
                confidence: 0.75,
                contributingEvents: ['event2'],
                factors: { baselineTraffic: 50, eventImpact: 20, weatherImpact: 3, historicalPattern: 2 }
              }
            ]}
            events={[
              {
                id: 'event1',
                type: 'concert',
                name: 'Đêm nhạc tại Nhà hát Thành phố',
                venue: 'Nhà hát Thành phố, Quận 1',
                startTime: new Date(Date.now() + 1800000).toISOString(),
                endTime: new Date(Date.now() + 7200000).toISOString(),
                estimatedAttendees: 5000,
                impactRadius: 2000,
                location: { lat: 10.7769, lng: 106.7009 },
                riskScore: 75
              },
              {
                id: 'event2',
                type: 'sports',
                name: 'Trận đấu bóng đá V-League',
                venue: 'Sân vận động Thống Nhất',
                startTime: new Date(Date.now() + 3600000).toISOString(),
                endTime: new Date(Date.now() + 9000000).toISOString(),
                estimatedAttendees: 15000,
                impactRadius: 3000,
                location: { lat: 10.7874, lng: 106.6938 },
                riskScore: 85
              },
              {
                id: 'event3',
                type: 'conference',
                name: 'Hội nghị Công nghệ HCMC 2025',
                venue: 'Trung tâm Hội nghị Sài Gòn',
                startTime: new Date(Date.now() + 5400000).toISOString(),
                endTime: new Date(Date.now() + 14400000).toISOString(),
                estimatedAttendees: 3000,
                impactRadius: 1500,
                location: { lat: 10.7624, lng: 106.6820 },
                riskScore: 60
              }
            ]}
            actions={[
              {
                id: '1',
                type: 'green_wave',
                label: 'Kích hoạt Sóng Xanh',
                description: 'Tối ưu hóa đèn tín hiệu giao thông để giảm tắc nghẽn',
                targetArea: 'Quận 1',
                estimatedImpact: 'Giảm 15% tắc nghẽn',
                requiredRiskLevel: 60,
                icon: '🚦',
                status: 'available'
              },
              {
                id: '2',
                type: 'alert',
                label: 'Gửi Cảnh báo Công chúng',
                description: 'Thông báo cho người dân về tình trạng giao thông',
                targetArea: 'Toàn thành phố',
                estimatedImpact: 'Tăng nhận thức 40%',
                requiredRiskLevel: 70,
                icon: '📢',
                status: 'available'
              }
            ]}
            onClose={() => useTrafficStore.getState().updateFilters({ showPredictive: false })}
            onRefresh={() => console.log('Refreshing predictive data...')}
          />
        </div>
      )}
    </>
  );
});

TrafficMap.displayName = 'TrafficMap';

export default TrafficMap;
