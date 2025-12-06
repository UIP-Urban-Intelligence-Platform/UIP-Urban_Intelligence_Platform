---
slug: frontend-architecture
title: 🎨 Kiến trúc Frontend của UIP với React 18
authors: [nguyendinhanhtuan]
tags: [uip, frontend, react, typescript, leaflet, technical]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Blog post: Frontend Architecture.

Module: apps/traffic-web-app/frontend/docs/blog/2024-04-05-frontend-architecture.md
Author: UIP Team
Version: 1.0.0
-->

# Xây dựng Dashboard Giao thông Real-time với React 18 ⚡

Trong bài viết này, tôi sẽ chia sẻ về kiến trúc frontend của UIP - một ứng dụng React 18 hiện đại với real-time updates và interactive maps.

<!-- truncate -->

## 🎯 Yêu cầu kỹ thuật

Dashboard của UIP cần đáp ứng:

- 📡 **Real-time updates** - Cập nhật mỗi 5 giây
- 🗺️ **Interactive Map** - Hiển thị 1000+ markers
- 📊 **Data Visualization** - Charts động
- 📱 **Responsive** - Mobile-friendly
- ⚡ **Performance** - Smooth với large datasets

## 🏗️ Technology Stack

```
┌─────────────────────────────────────────────────┐
│                  Frontend Stack                  │
├─────────────────────────────────────────────────┤
│  Framework    │  React 18.2 + TypeScript        │
│  Build Tool   │  Vite 5.0                       │
│  Styling      │  Tailwind CSS + Framer Motion   │
│  Maps         │  Leaflet + React-Leaflet        │
│  Charts       │  Recharts                       │
│  State        │  Zustand                        │
│  Real-time    │  WebSocket + React Query        │
└─────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── components/           # React Components
│   ├── TrafficMap.tsx   # Main map component (500+ lines)
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── FilterPanel.tsx  # Data filters
│   ├── AnalyticsDashboard.tsx
│   ├── map/             # Map-specific components
│   │   ├── CameraMarkers.tsx
│   │   ├── AccidentMarkers.tsx
│   │   ├── WeatherOverlay.tsx
│   │   ├── AQIHeatmap.tsx
│   │   └── VehicleHeatmap.tsx
│   ├── charts/          # Visualization
│   ├── citizen/         # Citizen report system
│   └── agents/          # AI Agent UI panels
├── hooks/               # Custom hooks
├── services/            # API & WebSocket
├── store/               # Zustand store
├── types/               # TypeScript types
└── pages/               # Route pages
```

## 🗺️ TrafficMap Component

### Core Implementation

```tsx
// components/TrafficMap.tsx
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useTrafficStore } from '@/store/trafficStore';
import { CameraMarkers } from './map/CameraMarkers';
import { AccidentMarkers } from './map/AccidentMarkers';

export const TrafficMap: React.FC = () => {
  const { cameras, accidents, filters } = useTrafficStore();
  const [viewport, setViewport] = useState({
    center: [10.7731, 106.7004] as LatLng,
    zoom: 13
  });

  // Filter cameras based on active filters
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      if (filters.district && cam.district !== filters.district) return false;
      if (filters.congestion && cam.congestionLevel !== filters.congestion) return false;
      return true;
    });
  }, [cameras, filters]);

  return (
    <MapContainer
      center={viewport.center}
      zoom={viewport.zoom}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      
      {/* Camera Markers with clustering */}
      <CameraMarkers cameras={filteredCameras} />
      
      {/* Accident Markers with alerts */}
      <AccidentMarkers accidents={accidents} />
      
      {/* Weather Overlay */}
      {filters.showWeather && <WeatherOverlay />}
      
      {/* AQI Heatmap */}
      {filters.showAQI && <AQIHeatmap />}
      
      {/* Vehicle Density Heatmap */}
      {filters.showHeatmap && <VehicleHeatmap />}
    </MapContainer>
  );
};
```

### Performance Optimization

```tsx
// Marker Clustering for 1000+ cameras
import MarkerClusterGroup from 'react-leaflet-cluster';

const CameraMarkers: React.FC<{ cameras: Camera[] }> = ({ cameras }) => {
  // Memoize markers to prevent re-render
  const markers = useMemo(() => (
    cameras.map(camera => (
      <Marker
        key={camera.id}
        position={[camera.lat, camera.lng]}
        icon={getCameraIcon(camera.congestionLevel)}
      >
        <Popup>
          <CameraPopup camera={camera} />
        </Popup>
      </Marker>
    ))
  ), [cameras]);

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={50}
      spiderfyOnMaxZoom
    >
      {markers}
    </MarkerClusterGroup>
  );
};
```

## 📡 Real-time Updates

### WebSocket Integration

```tsx
// hooks/useWebSocket.ts
export const useWebSocket = () => {
  const { updateCameras, addAccident } = useTrafficStore();
  
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'CAMERA_UPDATE':
          updateCameras(data.payload);
          break;
        case 'ACCIDENT_DETECTED':
          addAccident(data.payload);
          // Show notification
          toast.error(`🚨 Tai nạn phát hiện tại ${data.payload.location}`);
          break;
        case 'CONGESTION_ALERT':
          // Handle congestion...
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

### Optimistic Updates

```tsx
// services/api.ts
export const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submitCitizenReport,
    onMutate: async (newReport) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['reports']);
      
      // Snapshot previous value
      const previousReports = queryClient.getQueryData(['reports']);
      
      // Optimistically update
      queryClient.setQueryData(['reports'], (old) => [...old, newReport]);
      
      return { previousReports };
    },
    onError: (err, newReport, context) => {
      // Rollback on error
      queryClient.setQueryData(['reports'], context.previousReports);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['reports']);
    }
  });
};
```

## 📊 Data Visualization

### Analytics Dashboard

```tsx
// components/AnalyticsDashboard.tsx
import { LineChart, BarChart, PieChart, AreaChart } from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const { trafficData, timeRange } = useTrafficStore();
  
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Traffic Trend */}
      <Card>
        <CardHeader>Xu hướng giao thông 24h</CardHeader>
        <AreaChart data={trafficData.hourly}>
          <XAxis dataKey="hour" />
          <YAxis />
          <Area 
            type="monotone" 
            dataKey="vehicles" 
            fill="#3B82F6" 
            stroke="#1D4ED8"
          />
          <Tooltip />
        </AreaChart>
      </Card>
      
      {/* Congestion by District */}
      <Card>
        <CardHeader>Ùn tắc theo Quận</CardHeader>
        <BarChart data={trafficData.byDistrict}>
          <XAxis dataKey="district" />
          <YAxis />
          <Bar dataKey="congestionIndex" fill="#EF4444" />
        </BarChart>
      </Card>
      
      {/* Accident Statistics */}
      <Card>
        <CardHeader>Thống kê tai nạn</CardHeader>
        <PieChart>
          <Pie
            data={trafficData.accidentTypes}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
          />
          <Legend />
        </PieChart>
      </Card>
    </div>
  );
};
```

## 🎭 State Management

### Zustand Store

```tsx
// store/trafficStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface TrafficState {
  cameras: Camera[];
  accidents: Accident[];
  filters: FilterState;
  
  // Actions
  updateCameras: (cameras: Camera[]) => void;
  addAccident: (accident: Accident) => void;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
}

export const useTrafficStore = create<TrafficState>()(
  devtools(
    persist(
      (set) => ({
        cameras: [],
        accidents: [],
        filters: initialFilters,
        
        updateCameras: (cameras) => 
          set({ cameras }, false, 'updateCameras'),
          
        addAccident: (accident) =>
          set((state) => ({ 
            accidents: [...state.accidents, accident] 
          }), false, 'addAccident'),
          
        setFilter: (key, value) =>
          set((state) => ({
            filters: { ...state.filters, [key]: value }
          }), false, 'setFilter'),
          
        resetFilters: () =>
          set({ filters: initialFilters }, false, 'resetFilters')
      }),
      { name: 'traffic-store' }
    )
  )
);
```

## 🎨 UI/UX Highlights

### Animated Transitions

```tsx
// Framer Motion animations
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-72 bg-gray-900 text-white"
        >
          {/* Sidebar content */}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
```

### Dark Mode Support

```tsx
// Tailwind dark mode
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">
    Traffic Dashboard
  </h1>
</div>
```

## 📱 Responsive Design

```tsx
// Mobile-first approach
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4
">
  {cameras.map(camera => (
    <CameraCard key={camera.id} camera={camera} />
  ))}
</div>
```

## 📈 Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| First Contentful Paint | 1.2s | < 1.5s ✅ |
| Largest Contentful Paint | 2.1s | < 2.5s ✅ |
| Time to Interactive | 2.8s | < 3.0s ✅ |
| Bundle Size (gzipped) | 245KB | < 300KB ✅ |
| Lighthouse Score | 92 | > 90 ✅ |

## 🎓 Key Learnings

1. **React 18 Concurrent** - Sử dụng `useTransition` cho UI smooth
2. **Virtualization** - Render chỉ visible items
3. **Code Splitting** - Lazy load components
4. **Memoization** - `useMemo` và `useCallback` đúng cách
5. **WebSocket reconnection** - Auto-reconnect với exponential backoff

---

**Source code:** [GitHub Repository](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform)

*Nguyễn Đình Anh Tuấn - Backend Developer @ UIP Team*
