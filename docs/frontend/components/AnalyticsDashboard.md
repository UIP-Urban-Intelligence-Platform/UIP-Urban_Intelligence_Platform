<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
AnalyticsDashboard component documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/AnalyticsDashboard.md
Author: UIP Team
Version: 1.0.0
-->

# AnalyticsDashboard Component

## Overview

The AnalyticsDashboard provides comprehensive traffic analytics visualization including real-time metrics, historical trends, accident frequency analysis, and correlation insights.

## Features

- **Real-time Metrics**: Live traffic statistics and KPIs
- **Charts & Graphs**: Line charts, bar charts, heatmaps, pie charts
- **Accident Analysis**: Frequency, severity distribution, hotspots
- **Traffic Patterns**: Peak hours, seasonal trends
- **Correlation Analysis**: Weather-traffic, time-based correlations
- **Export Capabilities**: Download data as CSV, PDF reports

## Props

```typescript
interface AnalyticsDashboardProps {
  timeRange?: '24h' | '7d' | '30d' | '1y';
  locations?: string[];
  refreshInterval?: number;           // Auto-refresh (ms)
  showRealtime?: boolean;
  showTrends?: boolean;
  showCorrelations?: boolean;
}
```

## Usage

### Basic Usage

```tsx
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <AnalyticsDashboard
      timeRange="7d"
      showRealtime={true}
      showTrends={true}
    />
  );
}
```

### Advanced Usage

```tsx
<AnalyticsDashboard
  timeRange="30d"
  locations={['District 1', 'District 3']}
  refreshInterval={60000}
  showRealtime={true}
  showTrends={true}
  showCorrelations={true}
  onExport={(format) => handleExport(format)}
/>
```

## Component Structure

```tsx
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '7d',
  locations,
  refreshInterval = 60000,
  showRealtime = true,
  showTrends = true,
  showCorrelations = false
}) => {
  const { data, loading } = useAnalytics(timeRange, locations);
  
  return (
    <div className="analytics-dashboard">
      {showRealtime && (
        <div className="metrics-section">
          <MetricCard title="Total Vehicles" value={data.totalVehicles} />
          <MetricCard title="Avg Speed" value={data.avgSpeed} unit="km/h" />
          <MetricCard title="Accidents Today" value={data.accidentsToday} />
          <MetricCard title="Congestion Level" value={data.congestionLevel} />
        </div>
      )}
      
      {showTrends && (
        <div className="trends-section">
          <LineChart data={data.hourlyTrend} title="Traffic Trend" />
          <BarChart data={data.locationBreakdown} title="By Location" />
        </div>
      )}
      
      {showCorrelations && (
        <CorrelationPanel data={data.correlations} />
      )}
      
      <AccidentFrequencyChart data={data.accidents} />
    </div>
  );
};
```

## Charts

### Traffic Trend Chart

```tsx
<LineChart
  data={hourlyData}
  xAxis="time"
  yAxis="vehicle_count"
  title="24-Hour Traffic Trend"
  color="#1976d2"
/>
```

### Accident Frequency

```tsx
<AccidentFrequencyChart
  data={accidentData}
  groupBy="hour"
  showSeverity={true}
/>
```

### Heatmap

```tsx
<Heatmap
  data={congestionData}
  xAxis="hour"
  yAxis="day"
  colorScheme="YlOrRd"
/>
```

## Integration Examples

### With Date Picker

```tsx
const [dateRange, setDateRange] = useState<DateRange>({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});

<DateRangePicker value={dateRange} onChange={setDateRange} />
<AnalyticsDashboard customDateRange={dateRange} />
```

### With Export

```tsx
const handleExport = (format: 'csv' | 'pdf') => {
  if (format === 'csv') {
    exportToCSV(analyticsData);
  } else {
    generatePDFReport(analyticsData);
  }
};

<AnalyticsDashboard onExport={handleExport} />
```

## Styling

```css
.analytics-dashboard {
  padding: 24px;
  background: #f5f5f5;
}

.metrics-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.trends-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
```

## Performance

- Virtualized data rendering
- Memoized chart calculations
- Lazy loading for historical data
- Request debouncing

## Related Components

- [AccidentFrequencyChart](./AccidentFrequencyChart.md)
- [CorrelationPanel](./CorrelationPanel.md)
- [MetricCard](./MetricCard.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)
