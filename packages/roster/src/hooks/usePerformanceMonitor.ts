import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

/**
 * Performance metric categories
 */
export type MetricCategory =
  | 'render'
  | 'clipboard'
  | 'selection'
  | 'virtualization'
  | 'memory'
  | 'interaction';

/**
 * Individual performance measurement
 */
interface PerformanceMeasurement {
  id: string;
  category: MetricCategory;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  category: MetricCategory;
  totalMeasurements: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  recentAverage: number; // Average of last 10 measurements
  p95Duration: number; // 95th percentile
  errorRate: number;
  trends: {
    improving: boolean;
    degrading: boolean;
    stable: boolean;
  };
}

/**
 * Performance monitoring configuration
 */
interface PerformanceConfig {
  /** Maximum number of measurements to keep in memory */
  maxMeasurements: number;
  /** Whether to automatically collect memory metrics */
  collectMemoryMetrics: boolean;
  /** Whether to track user interactions */
  trackInteractions: boolean;
  /** How often to calculate aggregated stats (ms) */
  statsInterval: number;
  /** Whether to log performance warnings */
  enableWarnings: boolean;
  /** Thresholds for performance warnings */
  warningThresholds: {
    render: number;
    clipboard: number;
    selection: number;
    virtualization: number;
    memory: number;
    interaction: number;
  };
}

/**
 * Performance alert when thresholds are exceeded
 */
interface PerformanceAlert {
  id: string;
  category: MetricCategory;
  message: string;
  severity: 'warning' | 'error';
  timestamp: number;
  measurement: PerformanceMeasurement;
}

/**
 * Hook return type
 */
interface PerformanceMonitorResult {
  // Measurement functions
  startMeasurement: (
    category: MetricCategory,
    name: string,
    metadata?: Record<string, any>
  ) => string;
  endMeasurement: (id: string) => void;
  recordMeasurement: (
    category: MetricCategory,
    name: string,
    duration: number,
    metadata?: Record<string, any>
  ) => void;

  // Data access
  measurements: PerformanceMeasurement[];
  stats: Record<MetricCategory, PerformanceStats>;
  alerts: PerformanceAlert[];

  // Controls
  clearMeasurements: () => void;
  clearAlerts: () => void;
  exportData: () => string;

  // Current metrics
  currentMemoryUsage: number;
  isCollecting: boolean;

  // Configuration
  config: PerformanceConfig;
  updateConfig: (updates: Partial<PerformanceConfig>) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  maxMeasurements: 1000,
  collectMemoryMetrics: true,
  trackInteractions: true,
  statsInterval: 5000, // 5 seconds
  enableWarnings: true,
  warningThresholds: {
    render: 16.67, // 60fps threshold
    clipboard: 100, // 100ms for clipboard operations
    selection: 50, // 50ms for selection changes
    virtualization: 20, // 20ms for virtualization operations
    memory: 50, // 50MB memory usage
    interaction: 100, // 100ms for user interactions
  },
};

/**
 * Calculate memory usage estimate
 */
function getMemoryUsage(): number {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    // Chrome/Edge specific API
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
  }

  // Fallback estimation
  return 0;
}

/**
 * Generate unique measurement ID
 */
function generateMeasurementId(): string {
  return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate performance statistics for a category
 */
function calculateStats(
  measurements: PerformanceMeasurement[],
  category: MetricCategory
): PerformanceStats {
  const categoryMeasurements = measurements
    .filter(m => m.category === category && m.duration !== undefined)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (categoryMeasurements.length === 0) {
    return {
      category,
      totalMeasurements: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      recentAverage: 0,
      p95Duration: 0,
      errorRate: 0,
      trends: { improving: false, degrading: false, stable: true },
    };
  }

  const durations = categoryMeasurements.map(m => m.duration!);
  const recent = categoryMeasurements.slice(-10).map(m => m.duration!);
  const older = categoryMeasurements.slice(-20, -10).map(m => m.duration!);

  const totalMeasurements = categoryMeasurements.length;
  const averageDuration =
    durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const recentAverage =
    recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;

  // Calculate 95th percentile
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedDurations.length * 0.95);
  const p95Duration = sortedDurations[p95Index] || 0;

  // Calculate error rate (measurements without duration are considered errors)
  const errors = measurements.filter(
    m => m.category === category && m.duration === undefined
  ).length;
  const errorRate = totalMeasurements > 0 ? errors / totalMeasurements : 0;

  // Calculate trends
  const olderAverage =
    older.length > 0
      ? older.reduce((a, b) => a + b, 0) / older.length
      : recentAverage;
  const improvementThreshold = 0.1; // 10% improvement/degradation threshold

  const improving = recentAverage < olderAverage * (1 - improvementThreshold);
  const degrading = recentAverage > olderAverage * (1 + improvementThreshold);
  const stable = !improving && !degrading;

  return {
    category,
    totalMeasurements,
    averageDuration,
    minDuration,
    maxDuration,
    recentAverage,
    p95Duration,
    errorRate,
    trends: { improving, degrading, stable },
  };
}

/**
 * Hook for comprehensive performance monitoring
 */
export function usePerformanceMonitor(
  initialConfig: Partial<PerformanceConfig> = {}
): PerformanceMonitorResult {
  const [config, setConfig] = useState<PerformanceConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const [measurements, setMeasurements] = useState<PerformanceMeasurement[]>(
    []
  );
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [currentMemoryUsage, setCurrentMemoryUsage] = useState<number>(0);
  const [isCollecting, setIsCollecting] = useState<boolean>(true);

  const activeMeasurements = useRef<Map<string, PerformanceMeasurement>>(
    new Map()
  );

  // Calculate aggregated statistics
  const stats = useMemo(() => {
    const categories: MetricCategory[] = [
      'render',
      'clipboard',
      'selection',
      'virtualization',
      'memory',
      'interaction',
    ];
    const result: Record<MetricCategory, PerformanceStats> = {} as any;

    categories.forEach(category => {
      result[category] = calculateStats(measurements, category);
    });

    return result;
  }, [measurements]);

  // Start a new measurement
  const startMeasurement = useCallback(
    (
      category: MetricCategory,
      name: string,
      metadata?: Record<string, any>
    ): string => {
      if (!isCollecting) return '';

      const id = generateMeasurementId();
      const measurement: PerformanceMeasurement = {
        id,
        category,
        name,
        startTime: performance.now(),
        metadata,
        timestamp: Date.now(),
      };

      activeMeasurements.current.set(id, measurement);
      return id;
    },
    [isCollecting]
  );

  // End a measurement and calculate duration
  const endMeasurement = useCallback(
    (id: string) => {
      if (!isCollecting || !id) return;

      const measurement = activeMeasurements.current.get(id);
      if (!measurement) return;

      const endTime = performance.now();
      const duration = endTime - measurement.startTime;

      const completedMeasurement: PerformanceMeasurement = {
        ...measurement,
        endTime,
        duration,
      };

      activeMeasurements.current.delete(id);

      setMeasurements(prev => {
        const updated = [...prev, completedMeasurement];
        // Keep only the latest measurements
        return updated.slice(-config.maxMeasurements);
      });

      // Check for performance warnings
      if (
        config.enableWarnings &&
        config.warningThresholds[measurement.category]
      ) {
        const threshold = config.warningThresholds[measurement.category];
        if (duration > threshold) {
          const alert: PerformanceAlert = {
            id: generateMeasurementId(),
            category: measurement.category,
            message: `Slow ${measurement.category} operation: ${measurement.name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
            severity: duration > threshold * 2 ? 'error' : 'warning',
            timestamp: Date.now(),
            measurement: completedMeasurement,
          };

          setAlerts(prev => [...prev.slice(-50), alert]); // Keep last 50 alerts
        }
      }
    },
    [
      isCollecting,
      config.maxMeasurements,
      config.enableWarnings,
      config.warningThresholds,
    ]
  );

  // Record a measurement directly with known duration
  const recordMeasurement = useCallback(
    (
      category: MetricCategory,
      name: string,
      duration: number,
      metadata?: Record<string, any>
    ) => {
      if (!isCollecting) return;

      const measurement: PerformanceMeasurement = {
        id: generateMeasurementId(),
        category,
        name,
        startTime: performance.now() - duration,
        endTime: performance.now(),
        duration,
        metadata,
        timestamp: Date.now(),
      };

      setMeasurements(prev => {
        const updated = [...prev, measurement];
        return updated.slice(-config.maxMeasurements);
      });
    },
    [isCollecting, config.maxMeasurements]
  );

  // Clear all measurements
  const clearMeasurements = useCallback(() => {
    setMeasurements([]);
    activeMeasurements.current.clear();
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Export performance data as JSON
  const exportData = useCallback(() => {
    const data = {
      measurements,
      stats,
      alerts,
      config,
      exportTime: new Date().toISOString(),
      memoryUsage: currentMemoryUsage,
    };
    return JSON.stringify(data, null, 2);
  }, [measurements, stats, alerts, config, currentMemoryUsage]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<PerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Collect memory metrics periodically
  useEffect(() => {
    if (!config.collectMemoryMetrics) return;

    const interval = setInterval(() => {
      const memoryUsage = getMemoryUsage();
      setCurrentMemoryUsage(memoryUsage);

      if (memoryUsage > 0) {
        recordMeasurement('memory', 'heap-usage', memoryUsage, {
          timestamp: Date.now(),
          unit: 'MB',
        });
      }
    }, config.statsInterval);

    return () => clearInterval(interval);
  }, [config.collectMemoryMetrics, config.statsInterval, recordMeasurement]);

  // Track user interactions if enabled
  useEffect(() => {
    if (!config.trackInteractions) return;

    const handleClick = () => {
      const id = startMeasurement('interaction', 'click');
      // End measurement after a short delay to capture any immediate effects
      setTimeout(() => endMeasurement(id), 10);
    };

    const handleKeydown = () => {
      const id = startMeasurement('interaction', 'keydown');
      setTimeout(() => endMeasurement(id), 10);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [config.trackInteractions, startMeasurement, endMeasurement]);

  return {
    startMeasurement,
    endMeasurement,
    recordMeasurement,
    measurements,
    stats,
    alerts,
    clearMeasurements,
    clearAlerts,
    exportData,
    currentMemoryUsage,
    isCollecting,
    config,
    updateConfig,
  };
}

/**
 * Higher-order component to automatically measure render performance
 */
export function withPerformanceMonitoring(
  WrappedComponent: React.ComponentType<any>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: any) {
    const { startMeasurement, endMeasurement } = usePerformanceMonitor();

    useEffect(() => {
      const id = startMeasurement('render', `${componentName}-mount`);
      return () => endMeasurement(id);
    }, [startMeasurement, endMeasurement]);

    useEffect(() => {
      const id = startMeasurement('render', `${componentName}-render`);
      endMeasurement(id);
    });

    return React.createElement(WrappedComponent, props);
  };
}

/**
 * Hook to measure async operations
 */
export function useAsyncMeasurement(monitor: PerformanceMonitorResult) {
  return useCallback(
    async <T>(
      category: MetricCategory,
      name: string,
      asyncOperation: () => Promise<T>,
      metadata?: Record<string, any>
    ): Promise<T> => {
      const id = monitor.startMeasurement(category, name, metadata);
      try {
        const result = await asyncOperation();
        monitor.endMeasurement(id);
        return result;
      } catch (error) {
        monitor.endMeasurement(id);
        throw error;
      }
    },
    [monitor]
  );
}
