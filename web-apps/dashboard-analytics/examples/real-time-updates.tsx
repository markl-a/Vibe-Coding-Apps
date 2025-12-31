/**
 * Real-Time Updates Component Example
 *
 * This example demonstrates:
 * - WebSocket connection for real-time data
 * - Live data streaming and updates
 * - Connection status indicators
 * - Auto-reconnection logic
 * - Real-time notifications
 * - Live metrics updates
 * - Activity feed with live updates
 *
 * Usage in dashboard apps: admin-panel, analytics-dashboard, nextjs-dashboard, sales-metrics-dashboard
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Type definitions
interface RealtimeMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

interface Activity {
  id: string;
  type: 'sale' | 'signup' | 'error' | 'notification';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export default function RealTimeUpdates() {
  // State management
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [metrics, setMetrics] = useState<RealtimeMetric[]>([
    { id: '1', label: 'Active Users', value: 0, change: 0, trend: 'stable', timestamp: new Date() },
    { id: '2', label: 'Revenue Today', value: 0, change: 0, trend: 'stable', timestamp: new Date() },
    { id: '3', label: 'Orders/Hour', value: 0, change: 0, trend: 'stable', timestamp: new Date() },
    { id: '4', label: 'Server Load', value: 0, change: 0, trend: 'stable', timestamp: new Date() },
  ]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000); // 3 seconds

  // Refs for cleanup and WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate WebSocket connection
  const connectWebSocket = useCallback(() => {
    setConnectionStatus('connecting');

    try {
      // In a real app, this would be an actual WebSocket connection
      // wsRef.current = new WebSocket('wss://your-api.com/realtime');

      // Simulate connection success
      setTimeout(() => {
        setConnectionStatus('connected');
        console.log('WebSocket connected');
      }, 1000);

      // In a real app, you would handle WebSocket events:
      // wsRef.current.onmessage = (event) => {
      //   const data = JSON.parse(event.data);
      //   handleRealtimeData(data);
      // };
      //
      // wsRef.current.onerror = () => {
      //   setConnectionStatus('error');
      //   scheduleReconnect();
      // };
      //
      // wsRef.current.onclose = () => {
      //   setConnectionStatus('disconnected');
      //   scheduleReconnect();
      // };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  }, []);

  // Auto-reconnect logic
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...');
      connectWebSocket();
    }, 5000);
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setConnectionStatus('disconnected');
  };

  // Simulate real-time data updates
  const generateRealtimeData = useCallback(() => {
    // Update metrics with random values
    setMetrics((prev) =>
      prev.map((metric) => {
        const change = (Math.random() - 0.5) * 20;
        const newValue = Math.max(0, metric.value + change);
        const trend: 'up' | 'down' | 'stable' =
          change > 5 ? 'up' : change < -5 ? 'down' : 'stable';

        return {
          ...metric,
          value: newValue,
          change: change,
          trend,
          timestamp: new Date(),
        };
      })
    );

    // Randomly add new activities
    if (Math.random() > 0.7) {
      const activityTypes: Activity['type'][] = ['sale', 'signup', 'error', 'notification'];
      const messages = {
        sale: ['New order placed: $', 'Customer purchased premium plan', 'International sale completed'],
        signup: ['New user registered', 'Free trial started', 'Newsletter subscription'],
        error: ['API error detected', 'Payment failed', 'Server warning'],
        notification: ['System update completed', 'Backup successful', 'New feature deployed'],
      };

      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const typeMessages = messages[type];
      const message = typeMessages[Math.floor(Math.random() * typeMessages.length)];

      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        type,
        message: type === 'sale' ? `${message}${(Math.random() * 500 + 50).toFixed(2)}` : message,
        timestamp: new Date(),
        metadata: type === 'sale' ? { amount: (Math.random() * 500 + 50).toFixed(2) } : undefined,
      };

      setActivities((prev) => [newActivity, ...prev].slice(0, 20)); // Keep last 20 activities
    }
  }, []);

  // Setup real-time updates
  useEffect(() => {
    if (isAutoRefresh && connectionStatus === 'connected') {
      intervalRef.current = setInterval(generateRealtimeData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, connectionStatus, refreshInterval, generateRealtimeData]);

  // Connect on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket]);

  // Helper function to format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'signup':
        return '👤';
      case 'error':
        return '⚠️';
      case 'notification':
        return '🔔';
    }
  };

  // Helper function to get activity color
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'signup':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'notification':
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Connection Status */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Dashboard</h1>
          <p className="text-gray-600">Live metrics and activity monitoring</p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {connectionStatus}
            </span>
          </div>

          {connectionStatus === 'disconnected' && (
            <button
              onClick={connectWebSocket}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Reconnect
            </button>
          )}

          {connectionStatus === 'connected' && (
            <button
              onClick={disconnectWebSocket}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAutoRefresh}
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              id="auto-refresh"
            />
            <label htmlFor="auto-refresh" className="text-sm font-medium text-gray-700">
              Auto-refresh
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Refresh Interval:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1000}>1 second</option>
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </div>

          <button
            onClick={generateRealtimeData}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            Manual Refresh
          </button>
        </div>
      </div>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-lg shadow-md p-6 relative overflow-hidden">
            {/* Trend indicator background */}
            <div
              className={`absolute top-0 right-0 w-20 h-20 opacity-10 ${
                metric.trend === 'up'
                  ? 'bg-green-500'
                  : metric.trend === 'down'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              }`}
              style={{
                borderBottomLeftRadius: '100%',
              }}
            />

            <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">
                {metric.id === '2' ? '$' : ''}
                {metric.value.toFixed(metric.id === '2' ? 2 : 0)}
                {metric.id === '4' ? '%' : ''}
              </p>
              {metric.trend === 'up' && <span className="text-green-600 text-xl">↑</span>}
              {metric.trend === 'down' && <span className="text-red-600 text-xl">↓</span>}
            </div>
            <p
              className={`text-sm mt-2 ${
                metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {metric.change > 0 ? '+' : ''}
              {metric.change.toFixed(1)} from last update
            </p>
            <p className="text-xs text-gray-500 mt-1">Updated: {formatTime(metric.timestamp)}</p>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Live Activity Feed</h2>
          <button
            onClick={() => setActivities([])}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No activities yet</p>
            <p className="text-sm">Live updates will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`border rounded-lg p-4 flex items-start gap-3 animate-slide-in ${getActivityColor(
                  activity.type
                )}`}
              >
                <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                <div className="flex-grow">
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-xs mt-1 opacity-75">{formatTime(activity.timestamp)}</p>
                </div>
                <button className="text-gray-500 hover:text-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">API Server</span>
            <span className="text-sm font-bold text-green-600">Operational</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Database</span>
            <span className="text-sm font-bold text-green-600">Operational</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">WebSocket</span>
            <span className="text-sm font-bold text-green-600">
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
