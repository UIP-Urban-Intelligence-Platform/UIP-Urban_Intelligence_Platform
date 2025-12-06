<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Complete frontend components reference.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/complete-components-reference.md
Author: UIP Team
Version: 1.0.0
-->

# Complete Frontend Components Reference

## Overview

Comprehensive documentation for all 40+ React components in the HCMC Traffic Management System frontend, built with React 18.2, TypeScript, Leaflet, and modern web technologies.

---

## Table of Contents

### [Map Components](#map-components)
1. [TrafficMap](#trafficmap)
2. [CameraMarkers](#cameramarkers)
3. [AccidentMarkers](#accidentmarkers)
4. [CongestionZones](#congestionzones)
5. [WeatherOverlay](#weatheroverlay)
6. [AQIHeatmap](#aqiheatmap)
7. [VehicleHeatmap](#vehicleheatmap)
8. [SpeedZones](#speedzones)
9. [PatternZones](#patternzones)
10. [RouteOverlay](#routeoverlay)

### [UI Components](#ui-components)
11. [MapLegend](#maplegend)
12. [SimpleLegend](#simplelegend)
13. [FilterPanel](#filterpanel)
14. [Sidebar](#sidebar)
15. [Header](#header)
16. [Footer](#footer)
17. [CameraDetailModal](#cameradetailmodal)
18. [AccidentDetailModal](#accidentdetailmodal)

### [Feature Components](#feature-components)
19. [CitizenReportForm](#citizenreportform)
20. [CitizenReportMap](#citizenreportmap)
21. [RoutePlanner](#routeplanner)
22. [TimeMachine](#timemachine)
23. [AnalyticsDashboard](#analyticsdashboard)
24. [RealTimeMonitor](#realtimemonitor)
25. [AlertPanel](#alertpanel)
26. [NotificationCenter](#notificationcenter)

### [Chart Components](#chart-components)
27. [LineChart](#linechart)
28. [BarChart](#barchart)
29. [PieChart](#piechart)
30. [Heatmap](#heatmap)
31. [AccidentFrequencyChart](#accidentfrequencychart)
32. [TrafficTrendChart](#traffictrendchart)
33. [CorrelationPanel](#correlationpanel)

### [Form Components](#form-components)
34. [LocationPicker](#locationpicker)
35. [PhotoUpload](#photoupload)
36. [DateRangePicker](#daterangepicker)
37. [TimeRangePicker](#timerangepicker)
38. [CategorySelect](#categoryselect)

### [Utility Components](#utility-components)
39. [Loading](#loading)
40. [ErrorBoundary](#errorboundary)
41. [MetricCard](#metriccard)
42. [StatusBadge](#statusbadge)

---

# Map Components

## TrafficMap

### Overview
Core interactive map component displaying real-time traffic conditions, camera feeds, accidents, congestion zones, and weather overlays using Leaflet.

### Props

```typescript
interface TrafficMapProps {
  center?: [number, number];        // Map center [lat, lon]
  zoom?: number;                     // Initial zoom level (1-18)
  height?: string;                   // Map container height
  showCameras?: boolean;             // Show camera markers
  showAccidents?: boolean;           // Show accident markers
  showCongestion?: boolean;          // Show congestion zones
  showWeather?: boolean;             // Show weather overlay
  showAQI?: boolean;                 // Show air quality heatmap
  showVehicles?: boolean;            // Show vehicle heatmap
  enableClustering?: boolean;        // Enable marker clustering
  enableGeolocation?: boolean;       // Show user location
  onCameraClick?: (cameraId: string) => void;
  onAccidentClick?: (accidentId: string) => void;
  onZoneClick?: (zoneId: string) => void;
  onMapClick?: (lat: number, lon: number) => void;
  style?: React.CSSProperties;
}
```

### Usage

```tsx
import TrafficMap from '@/components/TrafficMap';

// Basic usage
<TrafficMap
  center={[10.7769, 106.7009]}
  zoom={13}
  height="600px"
/>

// Full features
<TrafficMap
  center={[10.7769, 106.7009]}
  zoom={13}
  height="100vh"
  showCameras={true}
  showAccidents={true}
  showCongestion={true}
  showWeather={true}
  showAQI={true}
  enableClustering={true}
  enableGeolocation={true}
  onCameraClick={(id) => console.log('Camera:', id)}
  onAccidentClick={(id) => console.log('Accident:', id)}
  style={{ borderRadius: '8px' }}
/>

// With state management
const [mapConfig, setMapConfig] = useState({
  showCameras: true,
  showAccidents: true,
  showCongestion: false
});

<TrafficMap {...mapConfig} />
```

### Features
- **Real-time Updates**: WebSocket-powered live data
- **Multiple Layers**: Toggle-able overlay layers
- **Marker Clustering**: Performance optimization for 100+ markers
- **Responsive**: Mobile-friendly with touch gestures
- **Custom Controls**: Zoom, fullscreen, layer controls
- **Geolocation**: User location tracking

### Styling

```css
.traffic-map {
  width: 100%;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.leaflet-container {
  font-family: 'Inter', sans-serif;
  background: #f5f5f5;
}
```

---

## CameraMarkers

### Overview
Displays camera locations on map with clickable markers showing camera status and latest image preview.

### Props

```typescript
interface CameraMarkersProps {
  cameras: Camera[];
  onCameraClick?: (cameraId: string) => void;
  clustering?: boolean;
  showStatus?: boolean;
  iconSize?: number;
}

interface Camera {
  id: string;
  name: string;
  location: { lat: number; lon: number };
  status: 'active' | 'inactive' | 'error';
  last_update: string;
}
```

### Usage

```tsx
import CameraMarkers from '@/components/CameraMarkers';

const cameras = [
  {
    id: 'CAM_001',
    name: 'District 1 - Nguyen Hue',
    location: { lat: 10.7769, lon: 106.7009 },
    status: 'active',
    last_update: '2024-01-15T10:30:00Z'
  }
];

<MapContainer>
  <CameraMarkers
    cameras={cameras}
    onCameraClick={(id) => handleCameraClick(id)}
    clustering={true}
    showStatus={true}
    iconSize={32}
  />
</MapContainer>
```

### Features
- **Status Indicators**: Color-coded by camera status
- **Clustering**: Group nearby cameras at low zoom
- **Popup Preview**: Show camera info on hover
- **Custom Icons**: SVG camera icons
- **Batch Updates**: Efficient re-rendering

---

## AccidentMarkers

### Overview
Displays accident locations with severity-based styling and animated alerts for critical incidents.

### Props

```typescript
interface AccidentMarkersProps {
  accidents: Accident[];
  onAccidentClick?: (accidentId: string) => void;
  showSeverity?: boolean;
  animateCritical?: boolean;
}

interface Accident {
  id: string;
  location: { lat: number; lon: number };
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  timestamp: string;
  vehicles_involved: number;
}
```

### Usage

```tsx
import AccidentMarkers from '@/components/AccidentMarkers';

<AccidentMarkers
  accidents={accidents}
  onAccidentClick={(id) => showAccidentDetails(id)}
  showSeverity={true}
  animateCritical={true}
/>
```

### Styling

```css
.accident-marker {
  transition: transform 0.2s;
}

.accident-marker.critical {
  animation: pulse 2s infinite;
  color: #d32f2f;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}
```

---

## CongestionZones

### Overview
Renders congestion zones as colored polygons with opacity based on severity level.

### Props

```typescript
interface CongestionZonesProps {
  zones: CongestionZone[];
  onZoneClick?: (zoneId: string) => void;
  showLabels?: boolean;
  interactive?: boolean;
}

interface CongestionZone {
  id: string;
  name: string;
  polygon: [number, number][];
  level: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe';
  avg_speed: number;
}
```

### Usage

```tsx
import CongestionZones from '@/components/CongestionZones';

<CongestionZones
  zones={congestionZones}
  onZoneClick={(id) => console.log('Zone:', id)}
  showLabels={true}
  interactive={true}
/>
```

### Color Scheme

```javascript
const congestionColors = {
  free_flow: '#4caf50',    // Green
  light: '#8bc34a',        // Light green
  moderate: '#ffeb3b',     // Yellow
  heavy: '#ff9800',        // Orange
  severe: '#f44336'        // Red
};
```

---

## WeatherOverlay

### Overview
Displays weather information overlay with temperature, conditions, and precipitation data.

### Props

```typescript
interface WeatherOverlayProps {
  weather: WeatherData;
  showForecast?: boolean;
  showRadar?: boolean;
  opacity?: number;
}

interface WeatherData {
  temperature: number;
  conditions: string;
  precipitation: number;
  wind: { speed: number; direction: number };
}
```

### Usage

```tsx
import WeatherOverlay from '@/components/WeatherOverlay';

<WeatherOverlay
  weather={currentWeather}
  showForecast={true}
  showRadar={true}
  opacity={0.6}
/>
```

---

## AQIHeatmap

### Overview
Air quality index heatmap showing pollution levels across the city.

### Props

```typescript
interface AQIHeatmapProps {
  data: AQIDataPoint[];
  radius?: number;
  blur?: number;
  maxOpacity?: number;
  gradient?: Record<number, string>;
}

interface AQIDataPoint {
  lat: number;
  lon: number;
  aqi: number;
}
```

### Usage

```tsx
import AQIHeatmap from '@/components/AQIHeatmap';

const aqiGradient = {
  0.0: '#00e400',  // Good
  0.2: '#ffff00',  // Moderate
  0.4: '#ff7e00',  // Unhealthy for Sensitive
  0.6: '#ff0000',  // Unhealthy
  0.8: '#8f3f97',  // Very Unhealthy
  1.0: '#7e0023'   // Hazardous
};

<AQIHeatmap
  data={aqiData}
  radius={25}
  blur={15}
  maxOpacity={0.6}
  gradient={aqiGradient}
/>
```

---

## VehicleHeatmap

### Overview
Real-time vehicle density heatmap based on traffic camera detections.

### Props

```typescript
interface VehicleHeatmapProps {
  data: VehicleDensityPoint[];
  radius?: number;
  blur?: number;
  updateInterval?: number;
}
```

### Usage

```tsx
<VehicleHeatmap
  data={vehicleDensity}
  radius={30}
  blur={20}
  updateInterval={30000}
/>
```

---

# UI Components

## MapLegend

### Overview
Interactive legend showing all map layers with toggle controls.

### Props

```typescript
interface MapLegendProps {
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  layers: LayerConfig[];
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  collapsible?: boolean;
}

interface LayerConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  visible: boolean;
  color?: string;
}
```

### Usage

```tsx
import MapLegend from '@/components/MapLegend';

const layers = [
  { id: 'cameras', name: 'Cameras', icon: <CameraIcon />, visible: true },
  { id: 'accidents', name: 'Accidents', icon: <AccidentIcon />, visible: true, color: '#d32f2f' },
  { id: 'congestion', name: 'Congestion', icon: <TrafficIcon />, visible: false }
];

<MapLegend
  position="topright"
  layers={layers}
  onLayerToggle={(id, visible) => handleLayerToggle(id, visible)}
  collapsible={true}
/>
```

### Styling

```css
.map-legend {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.legend-item:hover {
  background: #f5f5f5;
}
```

---

## FilterPanel

### Overview
Advanced filtering panel for map layers and data visualization.

### Props

```typescript
interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
  dateRange?: [Date, Date];
  locations?: string[];
}

interface FilterState {
  categories: string[];
  severity?: string[];
  dateRange?: [Date, Date];
  locations?: string[];
  timeOfDay?: string;
}
```

### Usage

```tsx
import FilterPanel from '@/components/FilterPanel';

const [filters, setFilters] = useState({
  categories: ['accidents', 'congestion'],
  severity: ['moderate', 'severe'],
  dateRange: [new Date('2024-01-01'), new Date('2024-01-31')]
});

<FilterPanel
  filters={filters}
  onFilterChange={setFilters}
  categories={['accidents', 'congestion', 'weather']}
  locations={['District 1', 'District 3', 'District 5']}
/>
```

---

## Sidebar

### Overview
Collapsible sidebar with navigation and quick access to features.

### Props

```typescript
interface SidebarProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
  width?: number;
  position?: 'left' | 'right';
  children: React.ReactNode;
}
```

### Usage

```tsx
import Sidebar from '@/components/Sidebar';

<Sidebar open={sidebarOpen} onToggle={setSidebarOpen} width={300}>
  <nav>
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/cameras">Cameras</Link>
    <Link to="/analytics">Analytics</Link>
  </nav>
</Sidebar>
```

---

## CameraDetailModal

### Overview
Modal displaying detailed camera information with live feed and statistics.

### Props

```typescript
interface CameraDetailModalProps {
  camera: CameraDetail;
  open: boolean;
  onClose: () => void;
  showLiveFeed?: boolean;
  showStatistics?: boolean;
}

interface CameraDetail {
  id: string;
  name: string;
  location: Location;
  status: string;
  stream_url?: string;
  stats?: CameraStats;
}
```

### Usage

```tsx
import CameraDetailModal from '@/components/CameraDetailModal';

<CameraDetailModal
  camera={selectedCamera}
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  showLiveFeed={true}
  showStatistics={true}
/>
```

---

# Feature Components

## CitizenReportForm

### Overview
Form for citizens to submit traffic reports with photo upload and location selection.

### Props

```typescript
interface CitizenReportFormProps {
  onSubmit: (report: CitizenReport) => void;
  defaultLocation?: [number, number];
  enableCamera?: boolean;
  maxPhotos?: number;
  categories?: string[];
}

interface CitizenReport {
  category: string;
  description: string;
  location: { lat: number; lon: number };
  images: File[];
  reporter?: { name: string; contact: string };
}
```

### Usage

```tsx
import CitizenReportForm from '@/components/CitizenReportForm';

const handleSubmit = async (report: CitizenReport) => {
  const result = await submitReport(report);
  console.log('Report submitted:', result.id);
};

<CitizenReportForm
  onSubmit={handleSubmit}
  defaultLocation={[10.7769, 106.7009]}
  enableCamera={true}
  maxPhotos={3}
  categories={['accident', 'congestion', 'hazard', 'other']}
/>
```

### Form Fields

```tsx
// Category selection
<Select
  label="Report Type"
  options={[
    { value: 'accident', label: 'Traffic Accident' },
    { value: 'congestion', label: 'Traffic Jam' },
    { value: 'hazard', label: 'Road Hazard' },
    { value: 'construction', label: 'Construction' },
    { value: 'other', label: 'Other Issue' }
  ]}
/>

// Location picker
<LocationPicker
  defaultLocation={defaultLocation}
  onLocationChange={(coords) => setLocation(coords)}
/>

// Photo upload
<PhotoUpload
  max={maxPhotos}
  accept="image/*"
  onUpload={(files) => setPhotos(files)}
  enableCamera={enableCamera}
/>

// Description
<TextArea
  label="Description"
  placeholder="Describe the issue in detail..."
  minLength={20}
  required
/>
```

### Validation

```typescript
const validateReport = (report: CitizenReport): ValidationResult => {
  const errors: string[] = [];
  
  if (!report.category) errors.push('Category is required');
  if (!report.location) errors.push('Location is required');
  if (report.description.length < 20) errors.push('Description must be at least 20 characters');
  if (report.images.length === 0) errors.push('At least one photo is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

---

## RoutePlanner

### Overview
Interactive route planning with traffic-aware routing and alternative route suggestions.

### Props

```typescript
interface RoutePlannerProps {
  origin?: [number, number];
  destination?: [number, number];
  onRouteCalculated?: (route: Route) => void;
  avoidCongestion?: boolean;
  avoidAccidents?: boolean;
  preferredRouteType?: 'fastest' | 'shortest' | 'eco';
}

interface Route {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  traffic_delay: number;
  alternative_routes?: Route[];
}
```

### Usage

```tsx
import RoutePlanner from '@/components/RoutePlanner';

<RoutePlanner
  origin={[10.7769, 106.7009]}
  destination={[10.8231, 106.6297]}
  onRouteCalculated={(route) => console.log('Route:', route)}
  avoidCongestion={true}
  avoidAccidents={true}
  preferredRouteType="fastest"
/>
```

### Features
- **Traffic-Aware Routing**: Real-time traffic consideration
- **Alternative Routes**: Multiple route options
- **ETA Calculation**: Accurate arrival time
- **Turn-by-Turn**: Navigation instructions
- **Avoid Zones**: Exclude accidents/congestion

---

## TimeMachine

### Overview
Historical data visualization with timeline slider for replay of past traffic conditions.

### Props

```typescript
interface TimeMachineProps {
  startDate: Date;
  endDate: Date;
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  playbackSpeed?: number;
  showPlayControls?: boolean;
}
```

### Usage

```tsx
import TimeMachine from '@/components/TimeMachine';

const [currentTime, setCurrentTime] = useState(new Date());

<TimeMachine
  startDate={new Date('2024-01-01')}
  endDate={new Date('2024-01-31')}
  currentTime={currentTime}
  onTimeChange={setCurrentTime}
  playbackSpeed={1}
  showPlayControls={true}
/>
```

### Controls
- **Play/Pause**: Auto-advance timeline
- **Speed Control**: 1x, 2x, 5x, 10x
- **Jump To**: Date/time picker
- **Bookmarks**: Save interesting moments

---

## AnalyticsDashboard

### Overview
Comprehensive analytics dashboard with charts, metrics, and insights.

### Props

```typescript
interface AnalyticsDashboardProps {
  timeRange: '24h' | '7d' | '30d' | '1y';
  locations?: string[];
  refreshInterval?: number;
  showRealtime?: boolean;
  showTrends?: boolean;
  showCorrelations?: boolean;
  onExport?: (format: 'csv' | 'pdf') => void;
}
```

### Usage

```tsx
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

<AnalyticsDashboard
  timeRange="7d"
  locations={['District 1', 'District 3']}
  refreshInterval={60000}
  showRealtime={true}
  showTrends={true}
  showCorrelations={true}
  onExport={(format) => handleExport(format)}
/>
```

### Metrics

```tsx
<div className="metrics-grid">
  <MetricCard
    title="Total Vehicles"
    value={totalVehicles}
    change={+5.2}
    icon={<CarIcon />}
  />
  <MetricCard
    title="Average Speed"
    value={avgSpeed}
    unit="km/h"
    change={-2.1}
    icon={<SpeedIcon />}
  />
  <MetricCard
    title="Accidents Today"
    value={accidentsToday}
    severity="high"
    icon={<AccidentIcon />}
  />
  <MetricCard
    title="Congestion Level"
    value={congestionLevel}
    max={1}
    icon={<TrafficIcon />}
  />
</div>
```

---

## RealTimeMonitor

### Overview
Real-time monitoring panel with live updates and alerts.

### Props

```typescript
interface RealTimeMonitorProps {
  cameras?: string[];
  zones?: string[];
  updateInterval?: number;
  showAlerts?: boolean;
  maxItems?: number;
}
```

### Usage

```tsx
import RealTimeMonitor from '@/components/RealTimeMonitor';

<RealTimeMonitor
  cameras={['CAM_001', 'CAM_002']}
  zones={['ZONE_001']}
  updateInterval={5000}
  showAlerts={true}
  maxItems={50}
/>
```

---

# Chart Components

## LineChart

### Overview
Responsive line chart for time-series data visualization.

### Props

```typescript
interface LineChartProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  title?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
}

interface DataPoint {
  [key: string]: string | number;
}
```

### Usage

```tsx
import LineChart from '@/components/LineChart';

const trafficData = [
  { time: '00:00', vehicles: 120 },
  { time: '01:00', vehicles: 80 },
  { time: '02:00', vehicles: 60 },
  // ...
];

<LineChart
  data={trafficData}
  xAxis="time"
  yAxis="vehicles"
  title="24-Hour Traffic Trend"
  color="#1976d2"
  height={400}
  showGrid={true}
  showTooltip={true}
/>
```

---

## BarChart

### Overview
Vertical or horizontal bar chart for categorical data comparison.

### Props

```typescript
interface BarChartProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  title?: string;
  orientation?: 'vertical' | 'horizontal';
  colors?: string[];
  height?: number;
}
```

### Usage

```tsx
import BarChart from '@/components/BarChart';

const locationData = [
  { location: 'District 1', accidents: 45 },
  { location: 'District 3', accidents: 32 },
  { location: 'District 5', accidents: 28 }
];

<BarChart
  data={locationData}
  xAxis="location"
  yAxis="accidents"
  title="Accidents by Location"
  orientation="vertical"
  colors={['#1976d2', '#388e3c', '#f57c00']}
  height={300}
/>
```

---

## PieChart

### Overview
Pie or donut chart for proportional data visualization.

### Props

```typescript
interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  donut?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  height?: number;
}
```

### Usage

```tsx
import PieChart from '@/components/PieChart';

const severityData = [
  { label: 'Minor', value: 45, color: '#4caf50' },
  { label: 'Moderate', value: 32, color: '#ff9800' },
  { label: 'Severe', value: 18, color: '#f44336' },
  { label: 'Critical', value: 5, color: '#9c27b0' }
];

<PieChart
  data={severityData}
  title="Accident Severity Distribution"
  donut={true}
  showLabels={true}
  showLegend={true}
  height={300}
/>
```

---

## AccidentFrequencyChart

### Overview
Specialized chart showing accident frequency patterns by time, location, or other factors.

### Props

```typescript
interface AccidentFrequencyChartProps {
  data: AccidentData[];
  groupBy: 'hour' | 'day' | 'week' | 'month' | 'location';
  showSeverity?: boolean;
  height?: number;
}
```

### Usage

```tsx
import AccidentFrequencyChart from '@/components/AccidentFrequencyChart';

<AccidentFrequencyChart
  data={accidentHistory}
  groupBy="hour"
  showSeverity={true}
  height={400}
/>
```

---

# Form Components

## LocationPicker

### Overview
Interactive map-based location picker with GPS detection and manual pin placement.

### Props

```typescript
interface LocationPickerProps {
  defaultLocation?: [number, number];
  onLocationChange: (coords: [number, number]) => void;
  enableGPS?: boolean;
  height?: number;
  zoom?: number;
}
```

### Usage

```tsx
import LocationPicker from '@/components/LocationPicker';

const [location, setLocation] = useState<[number, number] | null>(null);

<LocationPicker
  defaultLocation={[10.7769, 106.7009]}
  onLocationChange={setLocation}
  enableGPS={true}
  height={400}
  zoom={15}
/>
```

---

## PhotoUpload

### Overview
Photo upload component with camera capture, preview, and drag-and-drop support.

### Props

```typescript
interface PhotoUploadProps {
  max?: number;
  accept?: string;
  onUpload: (files: File[]) => void;
  enableCamera?: boolean;
  maxSize?: number;
  preview?: boolean;
}
```

### Usage

```tsx
import PhotoUpload from '@/components/PhotoUpload';

<PhotoUpload
  max={3}
  accept="image/*"
  onUpload={(files) => handlePhotoUpload(files)}
  enableCamera={true}
  maxSize={5 * 1024 * 1024}  // 5MB
  preview={true}
/>
```

---

## DateRangePicker

### Overview
Date range selector with calendar interface and preset ranges.

### Props

```typescript
interface DateRangePickerProps {
  value: [Date, Date];
  onChange: (range: [Date, Date]) => void;
  minDate?: Date;
  maxDate?: Date;
  presets?: PresetRange[];
}

interface PresetRange {
  label: string;
  range: [Date, Date];
}
```

### Usage

```tsx
import DateRangePicker from '@/components/DateRangePicker';

const [dateRange, setDateRange] = useState<[Date, Date]>([
  new Date('2024-01-01'),
  new Date('2024-01-31')
]);

const presets = [
  { label: 'Last 7 days', range: [subDays(new Date(), 7), new Date()] },
  { label: 'Last 30 days', range: [subDays(new Date(), 30), new Date()] },
  { label: 'This month', range: [startOfMonth(new Date()), endOfMonth(new Date())] }
];

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  presets={presets}
/>
```

---

# Utility Components

## Loading

### Overview
Loading spinner with customizable size, color, and message.

### Props

```typescript
interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  fullscreen?: boolean;
}
```

### Usage

```tsx
import Loading from '@/components/Loading';

// Inline loading
<Loading size="medium" message="Loading data..." />

// Fullscreen loading
<Loading fullscreen={true} message="Please wait..." />

// Conditional rendering
{loading && <Loading />}
```

---

## ErrorBoundary

### Overview
React error boundary for graceful error handling.

### Props

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

### Usage

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => logError(error, errorInfo)}
>
  <App />
</ErrorBoundary>
```

---

## MetricCard

### Overview
Card displaying key metrics with trend indicators and icons.

### Props

```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  icon?: React.ReactNode;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  max?: number;
}
```

### Usage

```tsx
import MetricCard from '@/components/MetricCard';

<MetricCard
  title="Average Speed"
  value={35.5}
  unit="km/h"
  change={-2.1}
  icon={<SpeedIcon />}
/>

<MetricCard
  title="Congestion Level"
  value={0.75}
  max={1}
  severity="high"
  icon={<TrafficIcon />}
/>
```

---

## StatusBadge

### Overview
Badge component for displaying status with color coding.

### Props

```typescript
interface StatusBadgeProps {
  status: string;
  variant?: 'filled' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}
```

### Usage

```tsx
import StatusBadge from '@/components/StatusBadge';

<StatusBadge status="active" variant="filled" color="#4caf50" />
<StatusBadge status="error" variant="outlined" color="#f44336" />
<StatusBadge status="pending" variant="text" size="small" />
```

---

## Integration Examples

### Complete Dashboard

```tsx
import {
  TrafficMap,
  AnalyticsDashboard,
  RealTimeMonitor,
  FilterPanel,
  Sidebar
} from '@/components';

function Dashboard() {
  const [filters, setFilters] = useState({});
  
  return (
    <div className="dashboard">
      <Sidebar>
        <FilterPanel filters={filters} onFilterChange={setFilters} />
      </Sidebar>
      
      <main>
        <TrafficMap {...filters} height="60vh" />
        <AnalyticsDashboard timeRange="7d" />
        <RealTimeMonitor />
      </main>
    </div>
  );
}
```

### Citizen Report Page

```tsx
import { CitizenReportForm, CitizenReportMap } from '@/components';

function ReportPage() {
  const [location, setLocation] = useState(null);
  
  return (
    <div className="report-page">
      <CitizenReportMap onLocationSelect={setLocation} />
      <CitizenReportForm defaultLocation={location} />
    </div>
  );
}
```

---

## Performance Best Practices

### Memoization

```tsx
import { memo, useMemo } from 'react';

const TrafficMap = memo(({ cameras, accidents }) => {
  const markers = useMemo(() => 
    cameras.map(camera => createMarker(camera)),
    [cameras]
  );
  
  return <Map>{markers}</Map>;
});
```

### Virtualization

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={cameras.length}
  itemSize={50}
>
  {({ index, style }) => (
    <CameraItem camera={cameras[index]} style={style} />
  )}
</FixedSizeList>
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const AnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard'));

<Suspense fallback={<Loading />}>
  <AnalyticsDashboard />
</Suspense>
```

---

## Styling Guidelines

### CSS Modules

```tsx
import styles from './TrafficMap.module.css';

<div className={styles.mapContainer}>
  <div className={styles.controls}>
    {/* Controls */}
  </div>
</div>
```

### Styled Components

```tsx
import styled from 'styled-components';

const MapContainer = styled.div`
  width: 100%;
  height: ${props => props.height};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;
```

### Tailwind CSS

```tsx
<div className="w-full h-screen rounded-lg shadow-md">
  <TrafficMap />
</div>
```

---

## Testing

### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import TrafficMap from './TrafficMap';

describe('TrafficMap', () => {
  it('renders map with markers', () => {
    render(<TrafficMap cameras={mockCameras} />);
    expect(screen.getAllByRole('marker')).toHaveLength(5);
  });
  
  it('calls onCameraClick when marker clicked', () => {
    const handleClick = jest.fn();
    render(<TrafficMap cameras={mockCameras} onCameraClick={handleClick} />);
    
    fireEvent.click(screen.getByTestId('camera-CAM_001'));
    expect(handleClick).toHaveBeenCalledWith('CAM_001');
  });
});
```

---

## Accessibility

### ARIA Labels

```tsx
<button
  aria-label="Show camera details"
  onClick={() => showDetails(camera.id)}
>
  <CameraIcon />
</button>
```

### Keyboard Navigation

```tsx
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
  {content}
</div>
```

---

## Related Documentation

- [Complete Agents Reference](../agents/complete-agents-reference.md)
- [API Reference](../api/complete-api-reference.md)
- [Development Workflow](../guides/development.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)

See [LICENSE](../LICENSE) for details.
