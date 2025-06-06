import React, { useState, useMemo } from 'react';
import { usePerformanceMonitor, type MetricCategory, type PerformanceStats } from '../../hooks/usePerformanceMonitor';

interface PerformanceDashboardProps {
  /** Whether to show the dashboard (typically only in development) */
  show?: boolean;
  /** Whether to start in minimized state */
  minimized?: boolean;
  /** Position of the dashboard */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface MetricCardProps {
  stats: PerformanceStats;
  isSelected: boolean;
  onClick: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ stats, isSelected, onClick }) => {
  const getTrendIcon = () => {
    if (stats.trends.improving) {
      return <span className="text-green-500">↗</span>;
    } else if (stats.trends.degrading) {
      return <span className="text-red-500">↘</span>;
    } else {
      return <span className="text-gray-500">→</span>;
    }
  };

  const getTrendColor = () => {
    if (stats.trends.improving) return 'border-green-500';
    if (stats.trends.degrading) return 'border-red-500';
    return 'border-gray-300';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${isSelected ? 'bg-blue-50 border-blue-500' : `bg-white ${getTrendColor()}`
        }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold capitalize">{stats.category}</h4>
        {getTrendIcon()}
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Count:</span>
          <span className="font-mono">{stats.totalMeasurements}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Avg:</span>
          <span className="font-mono">{formatDuration(stats.averageDuration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">P95:</span>
          <span className="font-mono">{formatDuration(stats.p95Duration)}</span>
        </div>
        {stats.errorRate > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Error:</span>
            <span className="font-mono">{(stats.errorRate * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export function PerformanceDashboard(props: PerformanceDashboardProps = {}) {
  const {
    show = process.env.NODE_ENV === 'development',
    minimized: initialMinimized = false,
    position = 'bottom-right',
  } = props;

  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);

  const monitor = usePerformanceMonitor({
    enableWarnings: true,
    collectMemoryMetrics: true,
    trackInteractions: true,
  });

  const { stats, alerts, measurements, currentMemoryUsage, exportData, clearMeasurements, clearAlerts } = monitor;

  // Filter measurements for selected category
  const filteredMeasurements = useMemo(() => {
    if (!selectedCategory) return measurements.slice(-20);
    return measurements
      .filter(m => m.category === selectedCategory)
      .slice(-20);
  }, [measurements, selectedCategory]);

  // Recent alerts (last 5)
  const recentAlerts = useMemo(() => alerts.slice(-5), [alerts]);

  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (position) {
      case 'top-left': return `${base} top-4 left-4`;
      case 'top-right': return `${base} top-4 right-4`;
      case 'bottom-left': return `${base} bottom-4 left-4`;
      case 'bottom-right': return `${base} bottom-4 right-4`;
      default: return `${base} bottom-4 right-4`;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const downloadReport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!show) return null;

  return (
    <div className={getPositionClasses()}>
      <div className={`bg-white border border-gray-300 rounded-lg shadow-lg transition-all duration-300 ${isMinimized ? 'w-12 h-12' : 'w-96 max-h-96'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className={`text-sm font-semibold ${isMinimized ? 'hidden' : ''}`}>
              Performance Monitor
            </h3>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-gray-100 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMinimized ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              )}
            </svg>
          </button>
        </div>

        {!isMinimized && (
          <div className="overflow-auto max-h-80">
            {/* Summary Stats */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Memory Usage</span>
                <span className="text-xs font-mono">
                  {currentMemoryUsage > 0 ? `${currentMemoryUsage.toFixed(1)}MB` : 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(stats).map(([category, categoryStats]) => (
                  <MetricCard
                    key={category}
                    stats={categoryStats}
                    isSelected={selectedCategory === category}
                    onClick={() => setSelectedCategory(
                      selectedCategory === category ? null : category as MetricCategory
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Alerts Section */}
            {recentAlerts.length > 0 && (
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Recent Alerts</h4>
                  <button
                    onClick={() => setShowAlerts(!showAlerts)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showAlerts ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showAlerts && (
                  <div className="space-y-1">
                    {recentAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-2 text-xs rounded ${alert.severity === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          }`}
                      >
                        <div className="font-medium">{alert.category}</div>
                        <div className="truncate">{alert.message}</div>
                        <div className="text-gray-500">{formatTime(alert.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Measurements */}
            {selectedCategory && (
              <div className="p-3 border-b border-gray-200">
                <h4 className="text-sm font-semibold mb-2">
                  Recent {selectedCategory} measurements
                </h4>
                <div className="space-y-1 max-h-32 overflow-auto">
                  {filteredMeasurements.map(measurement => (
                    <div key={measurement.id} className="flex justify-between text-xs">
                      <span className="truncate">{measurement.name}</span>
                      <span className="font-mono ml-2">
                        {measurement.duration ? `${measurement.duration.toFixed(1)}ms` : 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="p-3 flex justify-between">
              <div className="space-x-2">
                <button
                  onClick={clearMeasurements}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Clear Data
                </button>
                <button
                  onClick={clearAlerts}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Clear Alerts
                </button>
              </div>
              <button
                onClick={downloadReport}
                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
              >
                Export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple performance indicator component for minimal impact
 */
export function PerformanceIndicator() {
  const { currentMemoryUsage, alerts } = usePerformanceMonitor();
  const recentAlerts = alerts.slice(-3);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
      <div className="flex items-center space-x-2">
        {currentMemoryUsage > 0 && (
          <span>MEM: {currentMemoryUsage.toFixed(1)}MB</span>
        )}
        {recentAlerts.length > 0 && (
          <span className="text-red-400">
            {recentAlerts.length} alert{recentAlerts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
} 