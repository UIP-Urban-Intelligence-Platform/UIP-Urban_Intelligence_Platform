/**
 * @module apps/traffic-web-app/backend/src/services/websocketService
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * WebSocket Service for real-time bidirectional communication between
 * backend and frontend clients. Manages client connections, subscriptions,
 * and message broadcasting with heartbeat mechanism.
 * 
 * Core Features:
 * - Client connection management with subscription tracking
 * - Topic-based publish/subscribe pattern
 * - Heartbeat mechanism (ping/pong) for connection health monitoring
 * - Automatic dead connection cleanup (30s timeout)
 * - Initial state snapshot delivery on connection
 * - Broadcast to all clients or specific topic subscribers
 * - Message type routing (UPDATE, ALERT, SNAPSHOT, PONG)
 * 
 * Supported Topics:
 * - cameras: Traffic camera updates
 * - vehicles: Vehicle flow observations
 * - accidents: Real-time accident alerts
 * - airQuality: AQI sensor readings
 * - patterns: Traffic pattern updates
 * - congestion: Congestion state changes
 * 
 * @dependencies
 * - ws@^8.14: WebSocket server implementation
 * 
 * @example
 * ```typescript
 * import { WebSocketService } from './websocketService';
 * import { WebSocketServer } from 'ws';
 * 
 * const wss = new WebSocketServer({ server: httpServer });
 * const wsService = new WebSocketService(wss);
 * 
 * // Set snapshot provider
 * wsService.setSnapshotProvider(() => ({
 *   cameras: allCameras,
 *   vehicles: allVehicles
 * }));
 * 
 * // Broadcast update
 * wsService.broadcast('cameras', { type: 'UPDATE', topic: 'cameras', data: updatedCamera });
 * 
 * // Start heartbeat
 * wsService.startHeartbeat();
 * ```
 */

import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { WebSocketMessage } from '../types';

interface ClientSubscription {
  ws: WebSocket;
  topics: string[];
  lastPing: number;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientSubscription>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 10000; // 10 seconds
  private readonly HEARTBEAT_TIMEOUT = 30000; // 30 seconds
  private snapshotProvider: (() => any) | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.clients = new Map();
    this.initialize();
    this.startHeartbeat();
  }

  /**
   * Set snapshot provider function (called by DataAggregator)
   */
  setSnapshotProvider(provider: () => any): void {
    this.snapshotProvider = provider;
    logger.info('Snapshot provider registered');
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket client connected');

      // Initialize client subscription
      this.clients.set(ws, {
        ws,
        topics: ['all'],
        lastPing: Date.now()
      });

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to HCMC Traffic Monitoring System',
        timestamp: new Date().toISOString(),
        heartbeatInterval: this.HEARTBEAT_INTERVAL
      }));

      // Send initial data snapshot to new client using snapshot provider
      if (this.snapshotProvider) {
        try {
          const snapshot = this.snapshotProvider();
          this.sendInitialSnapshot(ws, snapshot);
        } catch (error) {
          logger.error('Error getting snapshot from provider:', error);
        }
      }

      // Handle incoming messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          logger.debug('Received message from client:', data);
          this.handleClientMessage(ws, data);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle pong responses
      ws.on('pong', () => {
        const client = this.clients.get(ws);
        if (client) {
          client.lastPing = Date.now();
          logger.debug('Received pong from client');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * Start heartbeat mechanism
   * Sends ping every 10 seconds and removes stale clients
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleClients: WebSocket[] = [];

      this.clients.forEach((client, ws) => {
        // Check if client is stale (no pong in 30 seconds)
        if (now - client.lastPing > this.HEARTBEAT_TIMEOUT) {
          logger.warn('Client heartbeat timeout, terminating connection');
          staleClients.push(ws);
          ws.terminate();
          return;
        }

        // Send ping if client is active
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.ping();
            logger.debug('Sent ping to client');
          } catch (error) {
            logger.error('Error sending ping:', error);
            staleClients.push(ws);
          }
        }
      });

      // Remove stale clients
      staleClients.forEach(ws => this.clients.delete(ws));

      logger.debug(`Heartbeat: ${this.clients.size} active clients`);
    }, this.HEARTBEAT_INTERVAL);

    logger.info('WebSocket heartbeat started');
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.info('WebSocket heartbeat stopped');
    }
  }

  private handleClientMessage(ws: WebSocket, data: any): void {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'subscribe':
        client.topics = data.topics || ['all'];
        ws.send(JSON.stringify({
          type: 'subscribed',
          topics: client.topics,
          timestamp: new Date().toISOString()
        }));
        logger.info(`Client subscribed to topics: ${client.topics.join(', ')}`);
        break;

      case 'unsubscribe':
        const topicsToRemove = data.topics || [];
        client.topics = client.topics.filter(t => !topicsToRemove.includes(t));
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          topics: topicsToRemove,
          remainingTopics: client.topics,
          timestamp: new Date().toISOString()
        }));
        logger.info(`Client unsubscribed from topics: ${topicsToRemove.join(', ')}`);
        break;

      case 'ping':
        // Manual ping from client
        client.lastPing = Date.now();
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;

      default:
        logger.warn(`Unknown message type: ${data.type}`);
    }
  }

  /**
   * Broadcast message to all subscribed clients
   * Filters by topic subscription
   */
  broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    let successCount = 0;
    let errorCount = 0;

    this.clients.forEach((client, ws) => {
      // Check if client is subscribed to this topic
      const isSubscribed = client.topics.includes('all') ||
        client.topics.includes(message.type);

      if (isSubscribed && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          successCount++;
        } catch (error) {
          logger.error('Error sending message to client:', error);
          errorCount++;
        }
      }
    });

    logger.debug(`Broadcast ${message.type} to ${successCount} clients (${errorCount} errors)`);
  }

  /**
   * Send alert message with priority
   * Used for severe accidents and high AQI warnings
   */
  sendAlert(alertType: 'accident_alert' | 'aqi_warning', data: any, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const alertMessage: WebSocketMessage = {
      type: 'update',
      data: {
        alertType,
        ...data,
        priority,
        alert: true
      },
      timestamp: new Date().toISOString()
    };

    this.broadcast(alertMessage);
    logger.info(`Sent ${priority} priority alert: ${alertType}`);
  }

  sendToClient(client: WebSocket, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Error sending message to specific client:', error);
      }
    }
  }

  /**
   * Send initial data snapshot to new client
   * This will be called by DataAggregator after client connects
   */
  sendInitialSnapshot(client: WebSocket, snapshot?: any): void {
    if (client.readyState === WebSocket.OPEN) {
      try {
        if (snapshot) {
          // Send provided snapshot
          client.send(JSON.stringify({
            type: 'initial',
            data: snapshot,
            timestamp: new Date().toISOString()
          }));
          logger.info('Sent initial data snapshot to client');
        } else {
          // Send ready signal for DataAggregator to provide data
          client.send(JSON.stringify({
            type: 'ready',
            message: 'Ready to receive initial data',
            timestamp: new Date().toISOString()
          }));
          logger.info('Sent ready signal to client');
        }
      } catch (error) {
        logger.error('Error sending initial snapshot:', error);
      }
    }
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get active clients by topic
   */
  getClientsByTopic(topic: string): number {
    let count = 0;
    this.clients.forEach(client => {
      if (client.topics.includes('all') || client.topics.includes(topic)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    this.stopHeartbeat();
    this.clients.forEach((_, ws) => {
      ws.close(1000, 'Server shutting down');
    });
    this.clients.clear();
    logger.info('WebSocket service shutdown complete');
  }
}

