/**
 * @module apps/traffic-web-app/frontend/src/services/websocket
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.3.0
 * @license MIT
 * 
 * @description
 * WebSocket service class managing real-time bidirectional communication with backend.
 * Handles connection lifecycle, automatic reconnection, heartbeat pings, message routing,
 * and integration with Zustand store for state updates.
 * 
 * Core features:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat mechanism to detect stale connections
 * - Topic-based message routing (camera, weather, airQuality, accident, pattern updates)
 * - Connection state management (connecting, connected, disconnected, error)
 * - Manual connect/disconnect controls
 * - Message handler registration system
 * - Integration with useTrafficStore
 * 
 * @dependencies
 * - WebSocket API (native browser) - Real-time communication
 * - zustand (via trafficStore) - State management
 * 
 * @example
 * ```typescript
 * const wsService = new WebSocketService();
 * wsService.connect();
 * wsService.registerHandler('accident', (data) => console.log('New accident:', data));
 * ```
 */
import { WebSocketMessage } from '../types';
import { useTrafficStore } from '../store/trafficStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private url: string;
  private isIntentionalClose: boolean = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isIntentionalClose = false;

    try {
      console.log(`Connecting to WebSocket: ${this.url}`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        useTrafficStore.getState().setIsConnected(true);

        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        useTrafficStore.getState().setIsConnected(false);
        this.stopHeartbeat();

        if (!this.isIntentionalClose) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Server sends ping, we don't need to send it
        // Just keep connection alive
      }
    }, 10000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isIntentionalClose) {
      return;
    }

    console.log(`Reconnecting in ${this.reconnectInterval / 1000} seconds...`);

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  private handleMessage(message: WebSocketMessage): void {
    const store = useTrafficStore.getState();

    switch (message.type) {
      case 'initial':
        console.log('📦 Received initial snapshot');
        if (message.data) {
          if (message.data.cameras) {
            message.data.cameras.forEach((camera: any) => store.addCamera(camera));
          }
          if (message.data.weather) {
            message.data.weather.forEach((weather: any) => store.addWeather(weather));
          }
          if (message.data.airQuality) {
            message.data.airQuality.forEach((airQuality: any) => store.addAirQuality(airQuality));
          }
          if (message.data.accidents) {
            message.data.accidents.forEach((accident: any) => store.addAccident(accident));
          }
          if (message.data.patterns) {
            message.data.patterns.forEach((pattern: any) => store.addPattern(pattern));
          }
        }
        break;

      case 'camera_update':
        console.log('📹 Camera update received');
        if (message.data && Array.isArray(message.data)) {
          message.data.forEach((camera: any) => store.addCamera(camera));
        }
        break;

      case 'weather_update':
        console.log('🌤️ Weather update received');
        if (message.data && Array.isArray(message.data)) {
          message.data.forEach((weather: any) => store.addWeather(weather));
        }
        break;

      case 'aqi_update':
        console.log('💨 AQI update received');
        if (message.data && Array.isArray(message.data)) {
          message.data.forEach((airQuality: any) => store.addAirQuality(airQuality));
        }
        break;

      case 'new_accident':
        console.log('🚨 New accident detected');
        if (message.data && Array.isArray(message.data)) {
          message.data.forEach((accident: any) => store.addAccident(accident));
          this.showNotification('New Accident', `Accident detected: ${message.data[0].type}`, 'warning');
        }
        break;

      case 'pattern_change':
        console.log('🔄 Traffic pattern changed');
        if (message.data && Array.isArray(message.data)) {
          message.data.forEach((pattern: any) => store.addPattern(pattern));
        }
        break;

      case 'accident_alert':
        console.log('🚨🚨 SEVERE ACCIDENT ALERT');
        if (message.data) {
          store.addAccident(message.data);
          this.showNotification(
            'SEVERE ACCIDENT ALERT',
            message.data.message || 'Severe accident detected',
            'error'
          );
        }
        break;

      case 'aqi_warning':
        console.log('⚠️ HIGH AQI WARNING');
        if (message.data) {
          store.addAirQuality(message.data);
          this.showNotification(
            'Air Quality Warning',
            message.data.message || `High AQI detected: ${message.data.aqi}`,
            'warning'
          );
        }
        break;

      case 'ping':
        this.sendPong();
        break;

      case 'camera':
      case 'weather':
      case 'air_quality':
      case 'accident':
      case 'pattern':
        if (message.data) {
          const dataArray = Array.isArray(message.data) ? message.data : [message.data];
          dataArray.forEach((item: any) => {
            switch (message.type) {
              case 'camera':
                store.addCamera(item);
                break;
              case 'weather':
                store.addWeather(item);
                break;
              case 'air_quality':
                store.addAirQuality(item);
                break;
              case 'accident':
                store.addAccident(item);
                break;
              case 'pattern':
                store.addPattern(item);
                break;
            }
          });
        }
        break;

      case 'connection':
        console.log('📡 Connection message:', message.message);
        break;

      case 'subscribed':
        console.log('✅ Subscribed to topics');
        break;

      default:
        console.log('Unknown message type:', message.type);
    }

    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }

  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'pong' }));
    }
  }

  private showNotification(title: string, message: string, type: 'info' | 'warning' | 'error'): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️',
      });
    } else {
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
  }

  public requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  public on(eventType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(eventType, handler);
  }

  public off(eventType: string): void {
    this.messageHandlers.delete(eventType);
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  getConnectionState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
