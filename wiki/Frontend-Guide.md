# 🖥️ Frontend Guide

React + TypeScript + TailwindCSS web application documentation.

---

## 📊 Overview

The frontend is a modern Single Page Application (SPA):

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| TailwindCSS | 3.x | Styling |
| React Query | 5.x | Data Fetching |
| Zustand | 4.x | State Management |
| React Router | 6.x | Routing |
| Leaflet | 1.x | Maps |
| Socket.IO | 4.x | Real-time |
| Recharts | 2.x | Charts |

---

## 📁 Project Structure

```
apps/traffic-web-app/frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Shared components
│   │   ├── dashboard/        # Dashboard widgets
│   │   ├── map/              # Map components
│   │   └── charts/           # Chart components
│   ├── pages/                # Page components
│   │   ├── Dashboard.tsx
│   │   ├── MapView.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useTrafficData.ts
│   │   ├── useWebSocket.ts
│   │   └── useLocalStorage.ts
│   ├── services/             # API services
│   │   ├── api.ts
│   │   ├── cameraService.ts
│   │   └── weatherService.ts
│   ├── store/                # Zustand stores
│   │   ├── trafficStore.ts
│   │   └── settingsStore.ts
│   ├── types/                # TypeScript types
│   │   ├── camera.ts
│   │   ├── weather.ts
│   │   └── traffic.ts
│   ├── utils/                # Utility functions
│   ├── styles/               # Global styles
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── public/                   # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Installation

```bash
cd apps/traffic-web-app/frontend
npm install
```

### Development

```bash
# Start dev server (hot reload)
npm run dev

# Open http://localhost:3001
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

---

## 🎨 UI Components

### Dashboard Widgets

```tsx
// src/components/dashboard/TrafficStats.tsx
import { useTrafficData } from '@/hooks/useTrafficData';

export const TrafficStats: React.FC = () => {
  const { data, isLoading } = useTrafficData();

  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Active Cameras"
        value={data.activeCameras}
        icon={<CameraIcon />}
        trend="+5%"
      />
      <StatCard
        title="Congestion Level"
        value={`${data.congestionLevel}%`}
        icon={<TrafficIcon />}
        trend="-2%"
      />
      {/* More stats */}
    </div>
  );
};
```

### Map Component

```tsx
// src/components/map/TrafficMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export const TrafficMap: React.FC = () => {
  const { cameras } = useCameras();
  
  return (
    <MapContainer
      center={[10.8231, 106.6297]}
      zoom={13}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      {cameras.map((camera) => (
        <Marker
          key={camera.id}
          position={[camera.lat, camera.lng]}
        >
          <Popup>
            <CameraPopup camera={camera} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
```

### Chart Component

```tsx
// src/components/charts/TrafficTrend.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const TrafficTrend: React.FC<{ data: TrendData[] }> = ({ data }) => (
  <LineChart width={600} height={300} data={data}>
    <XAxis dataKey="time" />
    <YAxis />
    <Tooltip />
    <Line
      type="monotone"
      dataKey="vehicles"
      stroke="#3b82f6"
      strokeWidth={2}
    />
  </LineChart>
);
```

---

## 🔄 State Management

### Zustand Store

```tsx
// src/store/trafficStore.ts
import { create } from 'zustand';

interface TrafficState {
  cameras: Camera[];
  selectedCamera: Camera | null;
  filters: FilterOptions;
  setCameras: (cameras: Camera[]) => void;
  selectCamera: (camera: Camera | null) => void;
  setFilters: (filters: FilterOptions) => void;
}

export const useTrafficStore = create<TrafficState>((set) => ({
  cameras: [],
  selectedCamera: null,
  filters: { status: 'all', type: 'all' },
  setCameras: (cameras) => set({ cameras }),
  selectCamera: (camera) => set({ selectedCamera: camera }),
  setFilters: (filters) => set({ filters }),
}));
```

### Using the Store

```tsx
// In any component
const { cameras, selectCamera } = useTrafficStore();
```

---

## 📡 Data Fetching

### React Query Setup

```tsx
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Custom Hooks

```tsx
// src/hooks/useTrafficData.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useTrafficData = () => {
  return useQuery({
    queryKey: ['traffic'],
    queryFn: async () => {
      const { data } = await api.get('/traffic/current');
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
};

export const useCameras = (filters?: CameraFilters) => {
  return useQuery({
    queryKey: ['cameras', filters],
    queryFn: async () => {
      const { data } = await api.get('/cameras', { params: filters });
      return data;
    },
  });
};
```

---

## 🔌 Real-time Updates

### WebSocket Hook

```tsx
// src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_WS_URL, {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, connected };
};
```

### Using WebSocket

```tsx
// In component
const { socket, connected } = useWebSocket();

useEffect(() => {
  if (!socket) return;

  socket.on('traffic:update', (data) => {
    // Handle real-time update
    updateTrafficData(data);
  });

  socket.on('alert:new', (alert) => {
    // Show notification
    showNotification(alert);
  });
}, [socket]);
```

---

## 🎨 Styling with TailwindCSS

### Configuration

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        traffic: {
          low: '#22c55e',
          medium: '#eab308',
          high: '#ef4444',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### Component Styling

```tsx
// Using Tailwind classes
<button className="
  px-4 py-2 
  bg-primary-500 hover:bg-primary-600 
  text-white font-medium rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Click me
</button>
```

---

## 🧪 Testing

### Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Test Example

```tsx
// src/components/__tests__/TrafficStats.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TrafficStats } from '../TrafficStats';

const queryClient = new QueryClient();

describe('TrafficStats', () => {
  it('displays loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficStats />
      </QueryClientProvider>
    );
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('displays stats after loading', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TrafficStats />
      </QueryClientProvider>
    );
    
    expect(await screen.findByText('Active Cameras')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
npm test           # Run tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage
```

---

## 📱 Responsive Design

### Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### Responsive Component

```tsx
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-4 
  gap-4
">
  {/* Cards */}
</div>
```

---

## 🌙 Dark Mode

### Implementation

```tsx
// src/hooks/useTheme.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'theme' }
  )
);
```

### Tailwind Dark Mode

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Content */}
</div>
```

---

## 🔧 Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_DEFAULT_CENTER_LAT=10.8231
VITE_DEFAULT_CENTER_LNG=106.6297
```

---

## 📚 Related Pages

- [[Backend-Guide]] - Backend documentation
- [[API-Reference]] - API endpoints
- [[Technology-Stack]] - Technologies
