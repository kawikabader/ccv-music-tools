import React, { useState, useEffect } from 'react';
import { useMemoryOptimization } from '../../hooks/useMemoryOptimization';
import type { MemoryOptimizationStrategy } from '../../hooks/useMemoryOptimization';

/**
 * Memory monitor props
 */
interface MemoryMonitorProps {
  /** Whether to show the monitor */
  show?: boolean;
  /** Position of the monitor */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether to auto-hide when not in development */
  autoHide?: boolean;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Memory chart component
 */
const MemoryChart: React.FC<{
  history: Array<{ usagePercentage: number; timestamp: number }>;
  height?: number;
}> = ({ history, height = 60 }) => {
  if (history.length === 0) return null;

  const maxUsage = Math.max(...history.map(h => h.usagePercentage), 100);
  const points = history.map((stat, index) => {
    const x = (index / (history.length - 1)) * 200;
    const y = height - (stat.usagePercentage / maxUsage) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="200" height={height} className="border rounded">
      <polyline
        points={points}
        fill="none"
        stroke={maxUsage > 85 ? '#ef4444' : maxUsage > 70 ? '#f59e0b' : '#10b981'}
        strokeWidth="2"
      />
      {/* Grid lines */}
      <line x1="0" y1={height * 0.25} x2="200" y2={height * 0.25} stroke="#e5e7eb" strokeWidth="1" />
      <line x1="0" y1={height * 0.5} x2="200" y2={height * 0.5} stroke="#e5e7eb" strokeWidth="1" />
      <line x1="0" y1={height * 0.75} x2="200" y2={height * 0.75} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  );
};

/**
 * Memory gauge component
 */
const MemoryGauge: React.FC<{
  percentage: number;
  size?: number;
}> = ({ percentage, size = 40 }) => {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct > 85) return '#ef4444';
    if (pct > 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(percentage)}
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
};

/**
 * Strategy selector component
 */
const StrategySelector: React.FC<{
  current: MemoryOptimizationStrategy;
  onChange: (strategy: MemoryOptimizationStrategy) => void;
}> = ({ current, onChange }) => {
  const strategies: MemoryOptimizationStrategy[] = ['conservative', 'balanced', 'aggressive', 'custom'];

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value as MemoryOptimizationStrategy)}
      className="text-xs border rounded px-2 py-1 bg-white"
    >
      {strategies.map(strategy => (
        <option key={strategy} value={strategy}>
          {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
        </option>
      ))}
    </select>
  );
};

/**
 * Memory monitor component
 */
export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  show = true,
  position = 'bottom-right',
  autoHide = true,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [strategy, setStrategy] = useState<MemoryOptimizationStrategy>('balanced');

  const {
    memoryStats,
    isMonitoring,
    actions,
    report,
    warnings,
  } = useMemoryOptimization({
    strategy,
    monitoringInterval: 2000, // 2 seconds for debug
  });

  // Auto-hide in production
  if (autoHide && process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!show) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 font-mono text-xs`}>
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden max-w-sm">
        {/* Header */}
        <div
          className="bg-gray-100 px-3 py-2 flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">Memory Monitor</span>
          </div>
          <div className="flex items-center space-x-2">
            <MemoryGauge percentage={memoryStats.usagePercentage} size={24} />
            <span className={isExpanded ? 'rotate-180' : ''}>▼</span>
          </div>
        </div>

        {/* Compact view */}
        {!isExpanded && (
          <div className="px-3 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-xs">
              <span>Usage:</span>
              <span className={`font-medium ${memoryStats.usagePercentage > 85 ? 'text-red-600' :
                  memoryStats.usagePercentage > 70 ? 'text-yellow-600' :
                    'text-green-600'
                }`}>
                {memoryStats.usagePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <div className="p-3 space-y-3">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="text-yellow-800 font-medium mb-1">⚠️ Warnings</div>
                {warnings.map((warning, index) => (
                  <div key={index} className="text-yellow-700 text-xs">{warning}</div>
                ))}
              </div>
            )}

            {/* Current stats */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Used Heap:</span>
                <span className="font-medium">{formatBytes(memoryStats.usedJSHeapSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Heap:</span>
                <span className="font-medium">{formatBytes(memoryStats.totalJSHeapSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Heap Limit:</span>
                <span className="font-medium">{formatBytes(memoryStats.jsHeapSizeLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Trend:</span>
                <span className={`font-medium ${memoryStats.trend === 'increasing' ? 'text-red-600' :
                    memoryStats.trend === 'decreasing' ? 'text-green-600' :
                      'text-gray-600'
                  }`}>
                  {memoryStats.trend === 'increasing' ? '📈' :
                    memoryStats.trend === 'decreasing' ? '📉' : '➡️'}
                  {memoryStats.trend}
                </span>
              </div>
            </div>

            {/* Memory chart */}
            <div>
              <div className="text-xs font-medium mb-2">Usage History</div>
              <MemoryChart
                history={report.history.map(stat => ({
                  usagePercentage: stat.usagePercentage,
                  timestamp: Date.now(), // Simplified for demo
                }))}
              />
            </div>

            {/* Session stats */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Session:</span>
                <span>{formatDuration(report.sessionDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Usage:</span>
                <span>{report.avgMemoryUsage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Peak Usage:</span>
                <span>{report.peakMemoryUsage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Optimizations:</span>
                <span>{report.optimizationCount}</span>
              </div>
            </div>

            {/* Strategy selector */}
            <div>
              <div className="text-xs font-medium mb-1">Strategy</div>
              <StrategySelector current={strategy} onChange={setStrategy} />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={actions.forceOptimization}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Optimize
              </button>
              <button
                onClick={actions.clearCaches}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              >
                Clear Cache
              </button>
              <button
                onClick={actions.requestGC}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                Force GC
              </button>
              <button
                onClick={actions.cleanupComponents}
                className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
              >
                Cleanup
              </button>
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-blue-800 font-medium mb-1">💡 Recommendations</div>
                {report.recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="text-blue-700 text-xs mb-1">{rec}</div>
                ))}
                {report.recommendations.length > 2 && (
                  <div className="text-blue-600 text-xs">+{report.recommendations.length - 2} more...</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryMonitor; 