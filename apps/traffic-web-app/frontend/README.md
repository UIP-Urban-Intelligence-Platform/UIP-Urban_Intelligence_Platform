# Traffic Monitoring System - Frontend

## Overview

Complete React + TypeScript + Leaflet frontend for real-time traffic monitoring in Ho Chi Minh City, Vietnam. Features live WebSocket updates, interactive map layers, and advanced data visualizations.

## Features Implemented

### ✅ Core Map Component (`TrafficMap.tsx`)
- **Map Container**: Centered on HCMC (10.8231, 106.6297), zoom 11-18
- **Base Layers**: 
  - OpenStreetMap (default)
  - Satellite imagery (Esri)
- **Controls**: Zoom (top-right), Scale bar (bottom-left)
- **5 Data Overlays**:
  1. **Cameras** - Blue (online) / Red (offline) markers by type (PTZ/Static/Dome)
  2. **Accidents** - Color-coded by severity (fatal/severe/moderate/minor)
  3. **Weather** - Green markers with temperature and conditions
  4. **Air Quality** - Color-coded by AQI level (good/moderate/unhealthy/hazardous)
  5. **Traffic Patterns** - Polylines with congestion-based colors

### ✅ Advanced Overlays

#### **AQI Heatmap Layer** (`AQIHeatmap.tsx`)
- Uses `leaflet.heat` plugin for smooth gradient visualization
- **Color Gradient**:
  - 0-50 (Good) → Green `#00ff00`
  - 51-100 (Moderate) → Yellow `#ffff00`
  - 101-150 (Unhealthy) → Orange `#ff8800`
  - 151-200 (Very Unhealthy) → Red `#ff0000`
  - 201+ (Hazardous) → Purple `#800080`
- **Heatmap Options**: radius=30, blur=20, maxZoom=14
- **Legend**: Collapsible legend showing AQI ranges with color indicators
- **Toggle**: On/off control via Sidebar

#### **Weather Overlay** (`WeatherOverlay.tsx`)
- **4 View Modes**: All / Temperature / Precipitation / Wind
- **Temperature Circles**:
  - Radius proportional to temperature (15-40°C)
  - Color gradient: Blue (cold ≤15°C) → Red (hot ≥35°C)
  - Circle size: 10-40px based on temperature
- **Precipitation Markers**:
  - Displayed only when rainfall > 0
  - Marker size based on mm/h intensity
  - Blue rain icon
- **Wind Arrows**:
  - SVG arrows rotated by wind direction (N/NE/E/SE/S/SW/W/NW)
  - Arrow length proportional to wind speed
  - Color: Green (<10 km/h), Orange (10-20), Red (>20)
- **View Switcher**: Button panel (top-right) to toggle between views
- **Legend**: Embedded guide explaining each visualization

### ✅ Interactive Features

#### **Camera Markers**
- **Tooltips**: Hover to see camera name
- **Rich Popups**:
  - Camera name, address, type, status
  - **Contextual Data**:
    - Nearest weather station (temperature, humidity)
    - Nearest air quality (AQI with color indicator)
    - Recent accidents count (24h within 0.01° radius)
  - "View Stream" button (if streamUrl available)
  - "View Details" button

#### **Accident Markers**
- **Severity-based Icons**: Black (fatal), Red (severe), Orange (moderate), Yellow (minor)
- **Tooltips**: Severity + accident type
- **Popups**:
  - Type, severity, vehicles involved, casualties
  - Timestamp (formatted with date-fns)
  - Description (if available)

#### **Weather Markers**
- **Tooltips**: Temperature + condition
- **Popups**: Full weather details (temp, humidity, rainfall, wind speed/direction, condition)

#### **Air Quality Markers**
- **Color-coded Icons**: Green → Yellow → Orange → Red → Violet
- **Tooltips**: AQI value + level
- **Popups**: AQI, PM2.5, PM10, CO, NO2 with units

#### **Traffic Pattern Polylines**
- **Color-coded by Congestion**:
  - Free Flow → Green `#00FF00`
  - Light → Light Green `#90EE90`
  - Moderate → Yellow `#FFFF00`
  - Heavy → Orange `#FFA500`
  - Severe → Red `#FF0000`
- **Popups**: Pattern type, congestion level, time range, avg speed, vehicle count, predictions

### ✅ Sidebar Component (`Sidebar.tsx`)
- **Connection Status**: Green/Red indicator for WebSocket
- **Layer Toggles** (7 total):
  - Cameras (with count)
  - Accidents (active only)
  - Weather (with count)
  - Air Quality (with count)
  - Traffic Patterns (with count)
  - **AQI Heatmap** (NEW)
  - **Weather Overlay** (NEW)
- **Statistics Panel**:
  - Total cameras
  - Active accidents
  - Weather stations
  - Air quality stations
  - Traffic patterns
- **Last Updated Timestamp**

### ✅ Real-Time WebSocket Integration (`websocket.ts`)
- **Connection**: ws://localhost:8081
- **Heartbeat**: 10s ping/pong to keep connection alive
- **13 Event Types**:
  1. `initial` - Full data snapshot on connect
  2. `camera_update` - Individual camera updates
  3. `weather_update` - Weather station updates
  4. `aqi_update` - Air quality updates
  5. `new_accident` - New accident with browser notification
  6. `pattern_change` - Traffic pattern updates
  7. `accident_alert` - Severe accident HIGH priority alerts
  8. `aqi_warning` - AQI > 150 MEDIUM priority warnings
  9. `ping` - Server heartbeat (responds with pong)
  10-13. Legacy types for backward compatibility
- **Browser Notifications**: Automatic for severe accidents and AQI warnings
- **Auto-reconnect**: Exponential backoff on disconnect

### ✅ API Integration (`api.ts`)
- **Base URL**: http://localhost:5000
- **Endpoints**:
  - `GET /api/cameras` - All traffic cameras
  - `GET /api/weather` - Weather data
  - `GET /api/air-quality` - AQI data
  - `GET /api/accidents` - Accident reports
  - `GET /api/patterns` - Traffic patterns
  - `GET /api/correlations/accident-pattern` - Correlation analysis (NEW)
  - `GET /api/analytics/hotspots` - Accident hotspots (NEW)
  - `GET /api/historical/aqi` - Historical AQI with filters (NEW)

### ✅ State Management (`trafficStore.ts`)
- **Zustand Store** with TypeScript
- **State**:
  - 5 data arrays (cameras, weather, airQuality, accidents, patterns)
  - 3 selected items (camera, accident, pattern)
  - WebSocket connection status
  - 7 layer visibility filters
- **Actions**:
  - setX() - Replace entire array
  - addX() - Add or update single item
  - setSelectedX() - Select item for detail view
  - toggleFilter() - Toggle layer visibility

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend WebSocket server running on port 8081
- Backend HTTP API running on port 5000

### Install Dependencies
```bash
cd frontend
npm install
```

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-leaflet": "^4.2.1",
  "leaflet": "^1.9.4",
  "leaflet.heat": "^0.2.0",
  "zustand": "^4.4.6",
  "date-fns": "^3.0.0",
  "tailwindcss": "^3.3.0"
}
```

### Environment Variables
Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:8081
```

### Start Development Server
```bash
npm run dev
```
App will open at `http://localhost:5173`

## Architecture

### Component Hierarchy
```
App.tsx
├── Sidebar.tsx (filters, statistics)
└── TrafficMap.tsx (main map)
    ├── LayersControl (base layers + overlays)
    ├── AQIHeatmap.tsx (heatmap overlay)
    └── WeatherOverlay.tsx (weather visualizations)
```

### Data Flow
```
Backend WebSocket (8081)
    ↓
websocket.ts (event handlers)
    ↓
trafficStore.ts (Zustand state)
    ↓
React Components (auto re-render)
    ↓
Leaflet Map Layers
```

### File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── TrafficMap.tsx          # Main map (543 lines)
│   │   ├── AQIHeatmap.tsx          # Heatmap overlay (155 lines)
│   │   ├── WeatherOverlay.tsx      # Weather visualizations (250 lines)
│   │   └── Sidebar.tsx             # Filters & stats
│   ├── services/
│   │   ├── websocket.ts            # WebSocket client (300+ lines)
│   │   └── api.ts                  # REST API client
│   ├── store/
│   │   └── trafficStore.ts         # Zustand state management
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces (250+ lines)
│   ├── App.tsx                     # Root component
│   └── main.tsx                    # Entry point
├── .env                            # Environment variables
├── package.json
└── vite.config.ts
```

## Usage Guide

### Basic Navigation
1. **Pan**: Click and drag map
2. **Zoom**: Scroll wheel or +/- buttons (top-right)
3. **Base Layer**: Switch between OSM and Satellite in layer control
4. **Overlays**: Toggle layers via checkboxes in layer control or sidebar

### Layer Controls
- **Top-Right**: Leaflet LayersControl with all overlay toggles
- **Sidebar**: Duplicate toggles with data counts

### View AQI Heatmap
1. Check "AQI Heatmap" in sidebar
2. Heatmap appears with smooth gradient
3. Legend shows at bottom-left
4. Click "×" on legend to hide (click "AQI Legend" to show again)

### View Weather Overlay
1. Check "Weather Overlay" in sidebar
2. Control panel appears at top-right
3. Click view mode buttons:
   - **All**: Shows temperature circles, rain markers, wind arrows
   - **Temperature**: Only temperature circles (color-coded)
   - **Rain**: Only precipitation markers (size by intensity)
   - **Wind**: Only wind arrows (direction + speed)

### Explore Camera Details
1. Click any camera marker (blue/red)
2. Popup shows:
   - Camera info (name, address, type, status)
   - Nearby weather conditions
   - Nearby air quality
   - Recent accidents (24h)
3. Click "View Stream" to open camera feed (if available)
4. Click "View Details" to see full information in sidebar

### Monitor Accidents
1. Red/orange/yellow markers indicate active accidents
2. Hover to see severity + type
3. Click for full details:
   - Type, severity, vehicles, casualties
   - Timestamp
   - Description
4. Severe accidents trigger browser notifications automatically

### Check Air Quality
1. Enable "Air Quality" layer
2. Markers color-coded: Green (good) → Violet (hazardous)
3. Hover to see AQI value
4. Click for detailed pollutant levels (PM2.5, PM10, CO, NO2)
5. AQI > 150 triggers warning notifications

### View Traffic Patterns
1. Enable "Traffic Patterns" layer
2. Polylines show congestion:
   - Green = Free flow
   - Yellow = Moderate
   - Orange = Heavy
   - Red = Severe
3. Click polyline for details:
   - Pattern type, time range
   - Average speed, vehicle count
   - Predictions (if available)

## Helper Functions

### `getRecentAccidentsCount(lat, lng, radius)`
- Counts accidents within 24h and specified radius
- Used in camera popups for contextual awareness

### `getWeatherAtLocation(lat, lng)`
- Finds closest weather station to given coordinates
- Returns Weather object or null

### `getAQIAtLocation(lat, lng)`
- Finds closest air quality station
- Returns AirQuality object or null

### `getCongestionColor(level)`
- Maps congestion level to color
- Levels: free_flow, light, moderate, heavy, severe

### `getAQIColor(level)`
- Maps AQI level to standard EPA colors
- Levels: good, moderate, unhealthy, very_unhealthy, hazardous

## Browser Notifications

### Setup
On first load, app requests notification permission.

### Triggers
1. **Severe Accidents**: HIGH priority
   - Title: "Severe Accident Detected"
   - Body: Accident type + location
2. **AQI Warnings**: MEDIUM priority
   - Title: "Air Quality Warning"
   - Body: AQI level + value + location

### Permissions
User must allow notifications in browser settings for alerts to appear.

## Performance Optimizations

1. **Marker Clustering**: Use `react-leaflet-cluster` for >50 cameras
2. **Heatmap MaxZoom**: Heatmap disappears at zoom >14 (shows markers instead)
3. **Memoization**: useMemo for expensive calculations
4. **Conditional Rendering**: Layers only render when visible
5. **WebSocket Debouncing**: 30s polling interval on backend

## Troubleshooting

### Map Not Loading
- Check console for Leaflet CSS import errors
- Verify `leaflet/dist/leaflet.css` is imported

### Heatmap Not Showing
- Install `leaflet.heat` and `@types/leaflet.heat`
- Check browser console for heatLayer errors
- Verify AQI data has valid lat/lng coordinates

### Weather Overlay Issues
- Ensure weather data has all required fields
- Check DivIcon HTML rendering in browser inspector
- Verify wind direction values match directionMap

### WebSocket Connection Failed
- Check backend is running on port 8081
- Verify VITE_WS_URL in .env
- Check browser console for WebSocket errors
- Firewall may block WebSocket connections

### No Notifications
- Check browser notification permission
- Open browser settings → Notifications
- Allow notifications for localhost/domain
- Test with `Notification.requestPermission()`

## Development

### Add New Overlay
1. Create component in `src/components/`
2. Use `useMap()` hook from react-leaflet
3. Add visibility prop from store
4. Import in TrafficMap.tsx
5. Add filter to trafficStore.ts
6. Add toggle in Sidebar.tsx

### Add New Event Type
1. Update WebSocketMessage type in types/index.ts
2. Add handler in websocket.ts handleMessage()
3. Update store action if needed

### Modify Icon Colors
Edit icon URL color parameter:
```typescript
const color = 'green'; // blue, red, orange, yellow, violet, grey, black
iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`
```

## Testing

### Manual Testing Checklist
- [ ] Map loads centered on HCMC
- [ ] All 5 base overlays render correctly
- [ ] AQI Heatmap shows smooth gradient
- [ ] Weather Overlay switches views
- [ ] Camera popups show contextual data
- [ ] Accident markers color-coded by severity
- [ ] WebSocket connects and receives updates
- [ ] Browser notifications work for alerts
- [ ] Layer toggles work in sidebar
- [ ] Scale bar and zoom controls visible

### Test WebSocket Connection
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:8081');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', e.data);
```

### Test API Endpoints
```bash
# Check correlation API
curl http://localhost:5000/api/correlations/accident-pattern

# Check hotspots
curl http://localhost:5000/api/analytics/hotspots

# Check historical AQI
curl "http://localhost:5000/api/historical/aqi?startDate=2024-01-01&endDate=2024-12-31"
```

## Production Deployment

### Build for Production
```bash
npm run build
```
Creates optimized bundle in `dist/`

### Environment Variables
Update `.env.production`:
```env
VITE_API_URL=https://your-api-domain.com
VITE_WS_URL=wss://your-ws-domain.com
```

### Serve Static Files
```bash
npm run preview
# OR
npx serve -s dist
```

### Deploy to Cloud
- Vercel: `vercel deploy`
- Netlify: `netlify deploy --prod`
- AWS S3: Upload `dist/` to bucket
- Docker: Create Dockerfile with nginx

## Credits

### Libraries Used
- **Leaflet**: Open-source mapping library
- **React-Leaflet**: React components for Leaflet
- **Leaflet.heat**: Heatmap plugin by Vladimir Agafonkin
- **Zustand**: Lightweight state management
- **Date-fns**: Modern date utility library
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework

### Icon Credits
Marker icons from [leaflet-color-markers](https://github.com/pointhi/leaflet-color-markers) by pointhi

### Map Data
- OpenStreetMap contributors
- Esri World Imagery

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
1. Check this README
2. Review backend documentation
3. Check browser console for errors
4. Test WebSocket connection separately
5. Verify backend is running and accessible

## Changelog

### v2.0.0 (Current)
- ✅ Added AQI Heatmap Layer with leaflet.heat
- ✅ Added Weather Overlay with 4 view modes
- ✅ Added contextual data in camera popups
- ✅ Added browser notifications for alerts
- ✅ Enhanced TypeScript interfaces
- ✅ Improved WebSocket event handling (13 event types)
- ✅ Added correlation API integration
- ✅ Added sidebar toggles for new overlays

### v1.0.0
- Initial release with basic map and 5 overlays
- WebSocket real-time updates
- REST API integration
- Zustand state management
