---
sidebar_position: 1
sidebar_label: 'Overview'
title: 'Frontend Overview'
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Frontend overview documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/overview.md
Author: UIP Team
Version: 1.0.0
-->

# Frontend Overview

The HCMC Traffic Monitoring System frontend is a modern **React 18** application built with **TypeScript** and **Vite**. It provides an interactive, real-time traffic visualization interface.

## 🎯 Key Features

- 🗺️ **Interactive Leaflet Map** - 1,000+ camera markers with real-time updates
- 📊 **Analytics Dashboard** - 7 chart types for data visualization
- 📱 **Citizen Reports** - Mobile-friendly report submission
- ⏱️ **Time Machine** - Historical data playback
- 🤖 **AI Agent UI** - Interactive panels for investigator, predictor, health advisor
- 🔄 **Real-time Updates** - WebSocket connections for live data
- 🎨 **Modern UI** - Tailwind CSS + Framer Motion animations

## 🏗️ Architecture

```
apps/traffic-web-app/frontend/
├── src/
│   ├── components/       # 40+ React components
│   │   ├── TrafficMap.tsx
│   │   ├── Sidebar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── map/          # Map-specific components
│   │   │   ├── CameraMarkers.tsx
│   │   │   ├── AccidentMarkers.tsx
│   │   │   ├── WeatherOverlay.tsx
│   │   │   ├── AQIHeatmap.tsx
│   │   │   ├── VehicleHeatmap.tsx
│   │   │   ├── SpeedZones.tsx
│   │   │   └── PatternZones.tsx
│   │   ├── charts/       # Recharts visualizations
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   ├── AreaChart.tsx
│   │   │   └── RadarChart.tsx
│   │   ├── citizen/      # Citizen report system
│   │   │   ├── CitizenReportForm.tsx (480 lines)
│   │   │   ├── CitizenReportMap.tsx
│   │   │   ├── CitizenReportMarkers.tsx
│   │   │   └── CitizenReportList.tsx
│   │   ├── routing/      # Route planning
│   │   │   ├── RoutePlanner.tsx (510 lines)
│   │   │   ├── RouteVisualization.tsx
│   │   │   └── CircleDrawTool.tsx
│   │   ├── timemachine/  # Historical playback
│   │   │   ├── TimeMachine.tsx (450 lines)
│   │   │   ├── CorrelationPanel.tsx (385 lines)
│   │   │   └── TimelineSlider.tsx
│   │   └── agents/       # AI Agent interfaces
│   │       ├── InvestigatorPanel.tsx (420 lines)
│   │       ├── PredictiveTimeline.tsx (380 lines)
│   │       └── HealthAdvisorChat.tsx (350 lines)
│   ├── pages/
│   │   ├── Dashboard.tsx (380 lines)
│   │   └── LandingPage.tsx (420 lines)
│   ├── services/
│   │   ├── api.ts (280 lines) - REST API client
│   │   ├── websocket.ts (195 lines) - WebSocket client
│   │   └── citizenReportService.ts (220 lines)
│   ├── store/
│   │   └── trafficStore.ts (340 lines) - Zustand state
│   ├── types/
│   │   ├── camera.ts
│   │   ├── accident.ts
│   │   ├── weather.ts
│   │   └── index.ts (600+ lines total)
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── icons/
│   └── images/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 📦 Technology Stack

### Core
- **React 18.2** - UI framework with concurrent rendering
- **TypeScript 5.2** - Type-safe JavaScript
- **Vite 5.0** - Fast build tool (HMR < 50ms)

### Map & Visualization
- **Leaflet 1.9** - Interactive maps
- **React-Leaflet 4.2** - React bindings for Leaflet
- **Recharts 2.10** - Composable charting library
- **D3.js** - Advanced visualizations

### State Management
- **Zustand 4.4** - Lightweight state management (< 1KB)
- **React Query** - Server state synchronization

### Styling
- **Tailwind CSS 3.3** - Utility-first CSS
- **Framer Motion 10** - Animation library
- **CSS Modules** - Component-scoped styles

### Real-time
- **Socket.io Client** - WebSocket connections
- **Axios 1.6** - HTTP client with interceptors

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form** - Form management

## 🗺️ TrafficMap Component

The core component that renders the interactive map.

```tsx
// src/components/TrafficMap.tsx (450 lines)
import { MapContainer, TileLayer } from 'react-leaflet';
import CameraMarkers from './map/CameraMarkers';
import AccidentMarkers from './map/AccidentMarkers';
import WeatherOverlay from './map/WeatherOverlay';

export default function TrafficMap() {
  const { cameras, accidents, filters } = useTrafficStore();
  
  return (
    <MapContainer
      center={[10.8231, 106.6297]} // Ho Chi Minh City
      zoom={13}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {filters.showCameras && <CameraMarkers cameras={cameras} />}
      {filters.showAccidents && <AccidentMarkers accidents={accidents} />}
      {filters.showWeather && <WeatherOverlay />}
      {filters.showAQI && <AQIHeatmap />}
      {filters.showVehicles && <VehicleHeatmap />}
    </MapContainer>
  );
}
```

## 📊 Analytics Dashboard

7 chart types for comprehensive data visualization.

```tsx
// src/components/AnalyticsDashboard.tsx (680 lines)
export default function AnalyticsDashboard() {
  const { trafficData, timeRange } = useTrafficStore();
  
  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-4 p-4">
      {/* Row 1: Time-series */}
      <Card className="col-span-2">
        <LineChart data={trafficData.hourly} />
      </Card>
      <Card>
        <BarChart data={trafficData.byLocation} />
      </Card>
      <Card>
        <PieChart data={trafficData.byType} />
      </Card>
      
      {/* Row 2: Comparisons */}
      <Card className="col-span-2">
        <AreaChart data={trafficData.trends} />
      </Card>
      <Card className="col-span-2">
        <RadarChart data={trafficData.patterns} />
      </Card>
      
      {/* Row 3: Details */}
      <Card className="col-span-3">
        <ScatterPlot data={trafficData.correlations} />
      </Card>
      <Card>
        <GaugeChart value={trafficData.congestionScore} />
      </Card>
    </div>
  );
}
```

## 🎨 State Management (Zustand)

Lightweight global state with TypeScript.

```typescript
// src/store/trafficStore.ts (340 lines)
import { create } from 'zustand';

interface TrafficStore {
  // State
  cameras: Camera[];
  accidents: Accident[];
  weather: Weather | null;
  filters: Filters;
  selectedCamera: Camera | null;
  
  // Actions
  setCameras: (cameras: Camera[]) => void;
  addAccident: (accident: Accident) => void;
  updateFilters: (filters: Partial<Filters>) => void;
  selectCamera: (camera: Camera | null) => void;
}

export const useTrafficStore = create<TrafficStore>((set) => ({
  cameras: [],
  accidents: [],
  weather: null,
  filters: {
    showCameras: true,
    showAccidents: true,
    showWeather: false,
    timeRange: '24h',
  },
  selectedCamera: null,
  
  setCameras: (cameras) => set({ cameras }),
  addAccident: (accident) => 
    set((state) => ({ 
      accidents: [...state.accidents, accident] 
    })),
  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  selectCamera: (camera) => set({ selectedCamera: camera }),
}));
```

## 🔌 WebSocket Integration

Real-time updates via WebSocket.

```typescript
// src/services/websocket.ts (195 lines)
import { io, Socket } from 'socket.io-client';
import { useTrafficStore } from '../store/trafficStore';

class WebSocketService {
  private socket: Socket | null = null;
  
  connect() {
    this.socket = io('http://localhost:8001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    
    this.socket.on('connect', () => {
      console.log('[WS] Connected');
    });
    
    this.socket.on('accident', (data: Accident) => {
      console.log('[WS] New accident:', data);
      useTrafficStore.getState().addAccident(data);
    });
    
    this.socket.on('camera_update', (data: Camera) => {
      console.log('[WS] Camera update:', data);
      // Update camera state
    });
    
    this.socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
    });
  }
  
  disconnect() {
    this.socket?.disconnect();
  }
  
  subscribe(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }
}

export const wsService = new WebSocketService();
```

## 📱 Citizen Report System

Mobile-friendly form for submitting traffic reports.

```tsx
// src/components/citizen/CitizenReportForm.tsx (480 lines)
export default function CitizenReportForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('description', data.description);
    formData.append('location', JSON.stringify(location));
    if (photo) formData.append('photo', photo);
    
    try {
      const response = await citizenReportService.submit(formData);
      toast.success('Report submitted! ID: ' + response.id);
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select {...register('type', { required: true })}>
        <option value="accident">Accident</option>
        <option value="congestion">Congestion</option>
        <option value="pothole">Pothole</option>
        <option value="flooding">Flooding</option>
      </Select>
      
      <MapPicker onLocationSelect={setLocation} />
      
      <ImageUpload onChange={setPhoto} />
      
      <Textarea 
        {...register('description', { required: true, minLength: 10 })}
        placeholder="Describe the issue..."
      />
      
      <Button type="submit">Submit Report</Button>
    </form>
  );
}
```

## ⏱️ Time Machine Feature

Playback historical traffic data.

```tsx
// src/components/timemachine/TimeMachine.tsx (450 lines)
export default function TimeMachine() {
  const [playbackTime, setPlaybackTime] = useState(Date.now() - 3600000);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setPlaybackTime((t) => t + 1000 * speed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, speed]);
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Card className="p-4 w-[600px]">
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          
          <Slider
            value={[playbackTime]}
            min={Date.now() - 86400000} // 24h ago
            max={Date.now()}
            step={60000} // 1 minute
            onValueChange={([value]) => setPlaybackTime(value)}
            className="flex-1"
          />
          
          <Select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </Select>
          
          <span className="text-sm">
            {new Date(playbackTime).toLocaleString()}
          </span>
        </div>
      </Card>
    </div>
  );
}
```

## 🎨 Styling with Tailwind CSS

```tsx
// Example: Styled components with Tailwind
<div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
    Traffic Overview
  </h2>
  
  <div className="grid grid-cols-3 gap-4">
    <StatCard
      icon={Camera}
      label="Active Cameras"
      value={1234}
      className="bg-blue-50 dark:bg-blue-900"
    />
    <StatCard
      icon={AlertTriangle}
      label="Active Accidents"
      value={12}
      className="bg-red-50 dark:bg-red-900"
    />
    <StatCard
      icon={Activity}
      label="Congestion Level"
      value="Medium"
      className="bg-yellow-50 dark:bg-yellow-900"
    />
  </div>
</div>
```

## 📖 Component Documentation

- **[TrafficMap](components/traffic-map)** - Core map component
- **[Analytics Dashboard](features/analytics-dashboard)** - Data visualization
- **[Citizen Reports](features/citizen-reports)** - Report submission
- **[Route Planner](features/route-planner)** - Route optimization
- **[Time Machine](features/time-machine)** - Historical playback

## 🚀 Development

```bash
# Install dependencies
cd apps/traffic-web-app/frontend
npm install

# Start dev server (HMR enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 Performance Metrics

- **Initial Load**: < 2s (with code splitting)
- **Time to Interactive (TTI)**: < 3s
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)
- **Bundle Size**: 450KB gzipped (with tree-shaking)

---

Next: Explore [TrafficMap Component](components/traffic-map) details.
