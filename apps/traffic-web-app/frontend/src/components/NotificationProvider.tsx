/**
 * @module apps/traffic-web-app/frontend/src/components/NotificationProvider
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Global notification system providing toast-style alerts throughout the application.
 * Uses React Context API to manage notification queue, auto-dismiss timers, and actions
 * like "View on Map" for location-based alerts. Supports multiple notification types
 * (info, warning, error, success) with customizable durations and callbacks.
 * 
 * Core features:
 * - Toast notification queue with position management
 * - Auto-dismiss with configurable duration (default 5s)
 * - Type-specific styling (info/warning/error/success)
 * - Location-based notifications with map navigation
 * - Manual dismiss and "View on Map" actions
 * - Sound alerts for critical notifications
 * - Maximum queue limit to prevent overflow
 * 
 * @dependencies
 * - react@18.2.0 - Context, state, and lifecycle hooks
 * 
 * @example
 * ```tsx
 * const { showToast } = useNotification();
 * 
 * showToast({
 *   type: 'warning',
 *   title: 'High AQI Detected',
 *   message: 'PM2.5 level exceeds safe threshold',
 *   location: { latitude: 10.762622, longitude: 106.660172 },
 *   onViewOnMap: () => map.flyTo([10.762622, 106.660172], 15)
 * });
 * ```
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface Toast {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  location?: { latitude: number; longitude: number };
  onViewOnMap?: () => void;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationContextType {
  toasts: Toast[];
  showNotification: (notification: Omit<Toast, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxToasts = 3
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<Map<string, number>>(new Map());

  // Initialize AudioContext for sound notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new AudioContext();
    }

    return () => {
      // Clear all timers on unmount
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback((type: Toast['type']) => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different frequencies for different notification types
      const frequencies = {
        info: 440,      // A4
        success: 523,   // C5
        warning: 659,   // E5
        error: 784      // G5
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [soundEnabled]);

  // Show notification
  const showNotification = useCallback((notification: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    const newToast: Toast = {
      id,
      timestamp,
      autoClose: notification.autoClose !== false,
      duration: notification.duration || (notification.type === 'error' ? 10000 : 5000),
      ...notification
    };

    setToasts(prev => {
      // Remove oldest toast if max limit reached
      const updatedToasts = prev.length >= maxToasts ? prev.slice(1) : prev;
      return [...updatedToasts, newToast];
    });

    // Play sound for warnings and errors
    if (notification.type === 'warning' || notification.type === 'error') {
      playNotificationSound(notification.type);
    }

    // Auto-dismiss timer
    if (newToast.autoClose) {
      const timer = window.setTimeout(() => {
        removeNotification(id);
      }, newToast.duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [maxToasts, playNotificationSound]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));

    // Clear timer if exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setToasts([]);
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showNotification,
        removeNotification,
        clearAll,
        soundEnabled,
        toggleSound
      }}
    >
      {children}
      <ToastContainer
        toasts={toasts}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-20 right-4 z-[10000] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  const handleViewOnMap = useCallback(() => {
    if (toast.onViewOnMap) {
      toast.onViewOnMap();
      handleRemove();
    }
  }, [toast.onViewOnMap, handleRemove]);

  // Get colors based on type
  const getColors = () => {
    switch (toast.type) {
      case 'info':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-50',
          icon: 'text-blue-500',
          iconBg: 'bg-blue-100'
        };
      case 'success':
        return {
          border: 'border-green-500',
          bg: 'bg-green-50',
          icon: 'text-green-500',
          iconBg: 'bg-green-100'
        };
      case 'warning':
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-50',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100'
        };
      case 'error':
        return {
          border: 'border-red-500',
          bg: 'bg-red-50',
          icon: 'text-red-500',
          iconBg: 'bg-red-100'
        };
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (toast.type) {
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const colors = getColors();
  const animationClass = isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right';

  return (
    <div
      className={`pointer-events-auto bg-white rounded-lg shadow-2xl border-l-4 ${colors.border} max-w-md w-full ${animationClass}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.iconBg}`}>
            <div className={colors.icon}>
              {getIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1">{toast.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{toast.message}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">
                {toast.timestamp.toLocaleTimeString()}
              </span>
              {toast.location && toast.onViewOnMap && (
                <button
                  onClick={handleViewOnMap}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View on map
                </button>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleRemove}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.autoClose && (
        <div className="h-1 bg-gray-100 overflow-hidden">
          <div
            className={`h-full ${colors.bg} animate-progress`}
            style={{
              animationDuration: `${toast.duration}ms`,
              animationTimingFunction: 'linear'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationProvider;
