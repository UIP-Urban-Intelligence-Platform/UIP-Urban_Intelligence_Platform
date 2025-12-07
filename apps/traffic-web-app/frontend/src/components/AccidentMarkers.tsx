/**
 * Accident Markers - MapLibre GL Map Accident Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/AccidentMarkers
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Accident Markers Component - Displays traffic accidents on MapLibre GL map with clustering.
 * Features severity-based color coding, time-based filtering, and interactive popups
 * with detailed accident information.
 * 
 * Features:
 * - Marker clustering for performance with large datasets
 * - Severity-based color coding (high: red, medium: orange, low: yellow)
 * - Recency indicators (pulsing animation for recent accidents)
 * - Time-based filtering (1h, 6h, 24h, 7days, all)
 * - Interactive popups with accident details
 * - Real-time updates via Zustand store
 * 
 * @dependencies
 * - react-map-gl@^7.1: MapLibre GL React bindings (MIT license)
 * - maplibre-gl@^4.7: Interactive maps (BSD-3-Clause)
 * - date-fns@^2.30: Date manipulation
 * - lucide-react@^0.294: Icons
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Marker, Popup, DivIcon } from './map';
// Note: Clustering is now handled natively by MapLibre GL supercluster
import { useTrafficStore } from '../store/trafficStore';
import { Accident } from '../types';
import { format, parseISO, isAfter, subHours, subDays } from 'date-fns';

type TimeFilter = '1h' | '6h' | '24h' | '7days' | 'all';

interface AccidentMarkersProps {
  visible?: boolean;
}

const createAccidentIcon = (severity: string, isRecent: boolean): DivIcon => {
  const severityConfig: Record<string, { color: string; emoji: string }> = {
    severe: { color: '#ff0000', emoji: '🔴' },
    moderate: { color: '#ffaa00', emoji: '🟡' },
    minor: { color: '#00ff00', emoji: '🟢' },
    fatal: { color: '#000000', emoji: '⚫' },
  };

  const config = severityConfig[severity] || severityConfig.moderate;
  const pulseAnimation = isRecent ? 'accident-pulse' : '';

  const html = `
    <div class="accident-marker ${pulseAnimation}" style="position: relative; width: 40px; height: 40px;">
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .accident-pulse {
          animation: pulse 2s infinite;
        }
        .accident-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          position: absolute;
          top: 5px;
          left: 5px;
        }
      </style>
      <div class="accident-circle" style="background-color: ${config.color};">
        ${config.emoji}
      </div>
    </div>
  `;

  return new DivIcon({
    html,
    className: 'custom-accident-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const AccidentMarkers: React.FC<AccidentMarkersProps> = ({ visible = true }) => {
  const { accidents, cameras, setSelectedAccident } = useTrafficStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Hidden - controls now in Sidebar
  const [lastAccidentCount, setLastAccidentCount] = useState(0);
  const [, setRefreshTrigger] = useState(0);

  const filterCutoffDate = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case '1h':
        return subHours(now, 1);
      case '6h':
        return subHours(now, 6);
      case '24h':
        return subHours(now, 24);
      case '7days':
        return subDays(now, 7);
      case 'all':
      default:
        return null;
    }
  }, [timeFilter]);

  const filteredAccidents = useMemo(() => {
    let filtered = accidents.filter((acc) => !acc.resolved);

    if (filterCutoffDate) {
      filtered = filtered.filter((acc) => {
        const accidentDate = parseISO(acc.timestamp || acc.dateDetected || new Date().toISOString());
        return isAfter(accidentDate, filterCutoffDate);
      });
    }

    return filtered;
  }, [accidents, filterCutoffDate]);

  const groupedAccidents = useMemo(() => {
    const groups: Map<string, Accident[]> = new Map();
    const clusterRadius = 0.001;

    filteredAccidents.forEach((accident) => {
      let foundGroup = false;

      for (const [key, group] of groups.entries()) {
        const [lat, lng] = key.split(',').map(Number);
        const distance = Math.sqrt(
          Math.pow(accident.location.latitude - lat, 2) +
          Math.pow(accident.location.longitude - lng, 2)
        );

        if (distance < clusterRadius) {
          group.push(accident);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        const key = `${accident.location.latitude},${accident.location.longitude}`;
        groups.set(key, [accident]);
      }
    });

    return groups;
  }, [filteredAccidents]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const severeAccidents = filteredAccidents.filter((acc) => acc.severity === 'severe' || acc.severity === 'fatal');

    if (severeAccidents.length > lastAccidentCount) {
      const newAccident = severeAccidents[severeAccidents.length - 1];

      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('⚠️ Severe Accident Detected!', {
          body: `${newAccident.type} at ${newAccident.location.address}`,
          icon: '/accident-icon.png',
          badge: '/badge-icon.png',
          tag: `accident-${newAccident.id}`,
          requireInteraction: true,
        });

        notification.onclick = () => {
          setSelectedAccident(newAccident);
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
      }

      const flashElement = document.createElement('div');
      flashElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 0, 0, 0.3);
        z-index: 9999;
        pointer-events: none;
        animation: flash 0.5s ease-in-out;
      `;

      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(styleSheet);
      document.body.appendChild(flashElement);

      setTimeout(() => {
        document.body.removeChild(flashElement);
        document.head.removeChild(styleSheet);
      }, 500);
    }

    setLastAccidentCount(severeAccidents.length);
  }, [filteredAccidents, lastAccidentCount, setSelectedAccident]);

  const getAffectedCameraName = (cameraId: string | undefined): string => {
    if (!cameraId) return 'Unknown';
    const camera = cameras.find((c) => c.id === cameraId);
    return camera ? camera.name : cameraId;
  };

  const isRecentAccident = (accident: Accident): boolean => {
    const accidentDate = parseISO(accident.timestamp || accident.dateDetected || new Date().toISOString());
    const oneHourAgo = subHours(new Date(), 1);
    return isAfter(accidentDate, oneHourAgo);
  };

  if (!visible) return null;

  return (
    <>
      {isPanelVisible && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '550px',
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: '180px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
              Accident Timeline
            </h4>
            <button
              onClick={() => setIsPanelVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#666',
                borderRadius: '4px',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#666';
              }}
              title="Close panel"
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(['1h', '6h', '24h', '7days', 'all'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: timeFilter === filter ? '#ef4444' : '#e5e7eb',
                  color: timeFilter === filter ? 'white' : 'black',
                  fontSize: '12px',
                  fontWeight: timeFilter === filter ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
              >
                {filter === '1h' && 'Last Hour'}
                {filter === '6h' && 'Last 6 Hours'}
                {filter === '24h' && 'Last 24 Hours'}
                {filter === '7days' && 'Last 7 Days'}
                {filter === 'all' && 'All Time'}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
            <div>
              <strong>{filteredAccidents.length}</strong> active accidents
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px' }}>
              Auto-refresh: 60s
            </div>
          </div>
        </div>
      )}

      {/* Note: MarkerClusterGroup removed - MapLibre GL handles marker rendering */}
      {/* Individual markers are rendered without clustering for now */}
      {Array.from(groupedAccidents.values())
        .filter(group => {
          const primaryAccident = group[0];
          return primaryAccident?.location?.latitude != null &&
            primaryAccident?.location?.longitude != null &&
            !isNaN(primaryAccident.location.latitude) &&
            !isNaN(primaryAccident.location.longitude);
        })
        .map((group) => {
          const primaryAccident = group[0];
          const isRecent = isRecentAccident(primaryAccident);

          return (
            <Marker
              key={primaryAccident.id}
              position={[primaryAccident.location.latitude, primaryAccident.location.longitude]}
              icon={createAccidentIcon(primaryAccident.severity, isRecent)}
              eventHandlers={{
                click: () => setSelectedAccident(primaryAccident),
              }}
            >
              <Popup>
                <div style={{ minWidth: '280px', padding: '8px' }}>
                  {group.length > 1 && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      padding: '6px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ⚠️ {group.length} accidents at this location
                    </div>
                  )}

                  {group.map((accident, index) => (
                    <div
                      key={accident.id}
                      style={{
                        borderBottom: index < group.length - 1 ? '1px solid #e5e7eb' : 'none',
                        paddingBottom: index < group.length - 1 ? '12px' : '0',
                        marginBottom: index < group.length - 1 ? '12px' : '0',
                      }}
                    >
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#ef4444'
                      }}>
                        {isRecentAccident(accident) && '🚨 '} Accident {index > 0 ? `#${index + 1}` : ''}
                      </h3>

                      <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Type:</strong> {accident.type}
                        </div>

                        <div style={{ marginBottom: '6px' }}>
                          <strong>Severity:</strong>{' '}
                          <span style={{
                            color: accident.severity === 'fatal' || accident.severity === 'severe' ? '#ef4444' :
                              accident.severity === 'moderate' ? '#f97316' : '#22c55e',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {accident.severity}
                          </span>
                        </div>

                        <div style={{ marginBottom: '6px' }}>
                          <strong>Detected:</strong>{' '}
                          {format(parseISO(accident.timestamp || accident.dateDetected || new Date().toISOString()), 'PPpp')}
                        </div>

                        {accident.affectedCamera && (
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Camera:</strong> {getAffectedCameraName(accident.affectedCamera)}
                          </div>
                        )}

                        {accident.vehicles !== undefined && (
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Vehicles:</strong> {accident.vehicles}
                          </div>
                        )}

                        {accident.casualties !== undefined && accident.casualties > 0 && (
                          <div style={{ marginBottom: '6px', color: '#ef4444', fontWeight: 'bold' }}>
                            <strong>Casualties:</strong> {accident.casualties}
                          </div>
                        )}

                        {accident.confidence !== undefined && (
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Confidence:</strong>{' '}
                            <span style={{
                              color: accident.confidence > 0.8 ? '#22c55e' :
                                accident.confidence > 0.6 ? '#f97316' : '#ef4444'
                            }}>
                              {(accident.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}

                        {accident.description && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {accident.description}
                          </div>
                        )}

                        <div style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          color: '#6b7280',
                          fontStyle: 'italic'
                        }}>
                          📍 {accident.location.address}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setSelectedAccident(primaryAccident)}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  >
                    View Full Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
};

export default AccidentMarkers;
