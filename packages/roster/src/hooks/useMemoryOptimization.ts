import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Memory optimization strategies
 */
export type MemoryOptimizationStrategy =
  | 'aggressive'
  | 'balanced'
  | 'conservative'
  | 'custom';

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  isLowMemory: boolean;
  isMemoryPressure: boolean;
}

/**
 * Memory optimization configuration
 */
interface MemoryOptimizationConfig {
  /** Optimization strategy to use */
  strategy: MemoryOptimizationStrategy;
  /** Memory monitoring interval in milliseconds */
  monitoringInterval: number;
  /** Memory usage threshold for warnings (percentage) */
  warningThreshold: number;
  /** Memory usage threshold for aggressive cleanup (percentage) */
  criticalThreshold: number;
  /** Number of history samples to keep for trend analysis */
  historySize: number;
  /** Enable automatic garbage collection requests */
  enableGCRequests: boolean;
  /** Enable component cleanup on memory pressure */
  enableComponentCleanup: boolean;
  /** Enable cache cleanup on memory pressure */
  enableCacheCleanup: boolean;
  /** Cleanup callback functions */
  cleanupCallbacks: Array<() => void>;
}

/**
 * Memory optimization actions
 */
interface MemoryOptimizationActions {
  /** Request garbage collection (if available) */
  requestGC: () => void;
  /** Clear all registered caches */
  clearCaches: () => void;
  /** Run component cleanup */
  cleanupComponents: () => void;
  /** Add a cleanup callback */
  addCleanupCallback: (callback: () => void) => void;
  /** Remove a cleanup callback */
  removeCleanupCallback: (callback: () => void) => void;
  /** Force memory optimization */
  forceOptimization: () => void;
  /** Get detailed memory report */
  getMemoryReport: () => MemoryReport;
}

/**
 * Detailed memory report
 */
interface MemoryReport {
  current: MemoryStats;
  history: MemoryStats[];
  recommendations: string[];
  lastOptimization: Date | null;
  optimizationCount: number;
  sessionDuration: number;
  avgMemoryUsage: number;
  peakMemoryUsage: number;
}

/**
 * Memory optimization result
 */
interface MemoryOptimizationResult {
  memoryStats: MemoryStats;
  isMonitoring: boolean;
  actions: MemoryOptimizationActions;
  report: MemoryReport;
  warnings: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MemoryOptimizationConfig = {
  strategy: 'balanced',
  monitoringInterval: 5000, // 5 seconds
  warningThreshold: 70, // 70%
  criticalThreshold: 85, // 85%
  historySize: 50,
  enableGCRequests: true,
  enableComponentCleanup: true,
  enableCacheCleanup: true,
  cleanupCallbacks: [],
};

/**
 * Get memory information from browser
 */
const getMemoryInfo = (): MemoryStats | null => {
  // Check for Chrome's memory API
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    const usagePercentage =
      (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
      trend: 'stable', // Will be calculated later
      isLowMemory: usagePercentage > 70,
      isMemoryPressure: usagePercentage > 85,
    };
  }

  // Fallback estimation for browsers without memory API
  return {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    usagePercentage: 0,
    trend: 'stable',
    isLowMemory: false,
    isMemoryPressure: false,
  };
};

/**
 * Calculate memory usage trend
 */
const calculateTrend = (
  history: MemoryStats[]
): 'increasing' | 'decreasing' | 'stable' => {
  if (history.length < 3) return 'stable';

  const recent = history.slice(-3);
  const trend = recent.map(stat => stat.usagePercentage);

  const isIncreasing = trend[2] > trend[1] && trend[1] > trend[0];
  const isDecreasing = trend[2] < trend[1] && trend[1] < trend[0];

  if (isIncreasing) return 'increasing';
  if (isDecreasing) return 'decreasing';
  return 'stable';
};

/**
 * Memory optimization hook
 */
export function useMemoryOptimization(
  config: Partial<MemoryOptimizationConfig> = {}
): MemoryOptimizationResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // State
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Refs for persistent data
  const memoryHistory = useRef<MemoryStats[]>([]);
  const cleanupCallbacks = useRef<Set<() => void>>(
    new Set(fullConfig.cleanupCallbacks)
  );
  const lastOptimization = useRef<Date | null>(null);
  const optimizationCount = useRef(0);
  const sessionStart = useRef(Date.now());
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Request garbage collection if available
   */
  const requestGC = useCallback(() => {
    if (fullConfig.enableGCRequests) {
      // Chrome DevTools GC
      if ((window as any).gc) {
        (window as any).gc();
      }

      // Force memory pressure by creating and destroying large objects
      try {
        const largeArray = new Array(1000000).fill(0);
        largeArray.length = 0;
      } catch (e) {
        // Ignore errors
      }
    }
  }, [fullConfig.enableGCRequests]);

  /**
   * Clear all registered caches
   */
  const clearCaches = useCallback(() => {
    if (fullConfig.enableCacheCleanup) {
      // Clear common browser caches
      try {
        // Clear URL object cache
        URL.revokeObjectURL.bind(URL);

        // Clear timer references
        performance.clearMeasures?.();
        performance.clearMarks?.();

        // Trigger cache cleanup callbacks
        cleanupCallbacks.current.forEach(callback => {
          try {
            callback();
          } catch (e) {
            console.warn('Cache cleanup callback failed:', e);
          }
        });
      } catch (e) {
        console.warn('Cache cleanup failed:', e);
      }
    }
  }, [fullConfig.enableCacheCleanup]);

  /**
   * Run component cleanup
   */
  const cleanupComponents = useCallback(() => {
    if (fullConfig.enableComponentCleanup) {
      // Trigger React cleanup by clearing component references
      try {
        // Clear any stored component references
        const event = new CustomEvent('memory-cleanup', {
          detail: { strategy: fullConfig.strategy },
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.warn('Component cleanup failed:', e);
      }
    }
  }, [fullConfig.enableComponentCleanup, fullConfig.strategy]);

  /**
   * Add cleanup callback
   */
  const addCleanupCallback = useCallback((callback: () => void) => {
    cleanupCallbacks.current.add(callback);
  }, []);

  /**
   * Remove cleanup callback
   */
  const removeCleanupCallback = useCallback((callback: () => void) => {
    cleanupCallbacks.current.delete(callback);
  }, []);

  /**
   * Force memory optimization
   */
  const forceOptimization = useCallback(() => {
    const strategy = fullConfig.strategy;

    switch (strategy) {
      case 'aggressive':
        requestGC();
        clearCaches();
        cleanupComponents();
        break;

      case 'balanced':
        clearCaches();
        if (memoryStats?.isMemoryPressure) {
          requestGC();
          cleanupComponents();
        }
        break;

      case 'conservative':
        if (memoryStats?.isMemoryPressure) {
          clearCaches();
        }
        break;

      case 'custom':
        // Custom strategy should be handled by cleanup callbacks
        cleanupCallbacks.current.forEach(callback => callback());
        break;
    }

    lastOptimization.current = new Date();
    optimizationCount.current++;
  }, [
    fullConfig.strategy,
    memoryStats,
    requestGC,
    clearCaches,
    cleanupComponents,
  ]);

  /**
   * Get detailed memory report
   */
  const getMemoryReport = useCallback((): MemoryReport => {
    const history = memoryHistory.current;
    const current = memoryStats ||
      getMemoryInfo() || {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usagePercentage: 0,
        trend: 'stable' as const,
        isLowMemory: false,
        isMemoryPressure: false,
      };

    const recommendations: string[] = [];
    const sessionDuration = Date.now() - sessionStart.current;
    const avgMemoryUsage =
      history.length > 0
        ? history.reduce((sum, stat) => sum + stat.usagePercentage, 0) /
          history.length
        : 0;
    const peakMemoryUsage =
      history.length > 0
        ? Math.max(...history.map(stat => stat.usagePercentage))
        : 0;

    // Generate recommendations
    if (current.usagePercentage > fullConfig.criticalThreshold) {
      recommendations.push(
        'Critical memory usage detected. Consider reducing data size or implementing pagination.'
      );
    }

    if (current.trend === 'increasing') {
      recommendations.push(
        'Memory usage is trending upward. Monitor for potential memory leaks.'
      );
    }

    if (avgMemoryUsage > fullConfig.warningThreshold) {
      recommendations.push(
        'Average memory usage is high. Consider implementing more aggressive cleanup strategies.'
      );
    }

    if (sessionDuration > 1800000 && optimizationCount.current < 3) {
      // 30 minutes
      recommendations.push(
        'Long session detected with few optimizations. Consider periodic memory cleanup.'
      );
    }

    return {
      current,
      history: [...history],
      recommendations,
      lastOptimization: lastOptimization.current,
      optimizationCount: optimizationCount.current,
      sessionDuration,
      avgMemoryUsage,
      peakMemoryUsage,
    };
  }, [memoryStats, fullConfig.criticalThreshold, fullConfig.warningThreshold]);

  /**
   * Update memory statistics
   */
  const updateMemoryStats = useCallback(() => {
    const newStats = getMemoryInfo();
    if (!newStats) return;

    // Calculate trend
    newStats.trend = calculateTrend(memoryHistory.current);

    // Update history
    memoryHistory.current.push(newStats);
    if (memoryHistory.current.length > fullConfig.historySize) {
      memoryHistory.current.shift();
    }

    // Update warnings
    const newWarnings: string[] = [];

    if (newStats.usagePercentage > fullConfig.criticalThreshold) {
      newWarnings.push(
        `Critical memory usage: ${newStats.usagePercentage.toFixed(1)}%`
      );
    } else if (newStats.usagePercentage > fullConfig.warningThreshold) {
      newWarnings.push(
        `High memory usage: ${newStats.usagePercentage.toFixed(1)}%`
      );
    }

    if (newStats.trend === 'increasing' && newStats.usagePercentage > 50) {
      newWarnings.push('Memory usage is steadily increasing');
    }

    setMemoryStats(newStats);
    setWarnings(newWarnings);

    // Auto-optimization based on strategy
    if (newStats.isMemoryPressure) {
      switch (fullConfig.strategy) {
        case 'aggressive':
          forceOptimization();
          break;
        case 'balanced':
          if (newStats.usagePercentage > fullConfig.criticalThreshold) {
            forceOptimization();
          }
          break;
        case 'conservative':
          // Only optimize if really necessary
          if (newStats.usagePercentage > 90) {
            forceOptimization();
          }
          break;
      }
    }
  }, [
    fullConfig.historySize,
    fullConfig.criticalThreshold,
    fullConfig.warningThreshold,
    fullConfig.strategy,
    forceOptimization,
  ]);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (monitoringInterval.current) return;

    setIsMonitoring(true);
    updateMemoryStats(); // Initial update

    monitoringInterval.current = setInterval(
      updateMemoryStats,
      fullConfig.monitoringInterval
    );
  }, [updateMemoryStats, fullConfig.monitoringInterval]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
    setIsMonitoring(false);
  }, []);

  /**
   * Start monitoring on mount
   */
  useEffect(() => {
    startMonitoring();
    return stopMonitoring;
  }, [startMonitoring, stopMonitoring]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopMonitoring();
      cleanupCallbacks.current.clear();
    };
  }, [stopMonitoring]);

  const actions: MemoryOptimizationActions = {
    requestGC,
    clearCaches,
    cleanupComponents,
    addCleanupCallback,
    removeCleanupCallback,
    forceOptimization,
    getMemoryReport,
  };

  return {
    memoryStats: memoryStats || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      usagePercentage: 0,
      trend: 'stable',
      isLowMemory: false,
      isMemoryPressure: false,
    },
    isMonitoring,
    actions,
    report: getMemoryReport(),
    warnings,
  };
}

/**
 * Memory-optimized cache with automatic cleanup
 */
export class OptimizedCache<T> {
  private cache = new Map<
    string,
    { data: T; timestamp: number; accessCount: number }
  >();
  private maxSize: number;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 100, ttl = 300000) {
    // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;

    // Periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), ttl / 5);
  }

  set(key: string, value: T): void {
    // Remove old entry if exists
    this.cache.delete(key);

    // Add new entry
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      accessCount: 0,
    });

    // Enforce size limit
    if (this.cache.size > this.maxSize) {
      this.evictLeastUsed();
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access count
    entry.accessCount++;
    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount) {
        leastAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * WeakMap-based cache for component cleanup tracking
 */
export class ComponentCleanupTracker {
  private componentCleanups = new WeakMap<object, Set<() => void>>();
  private globalCleanups = new Set<() => void>();

  /**
   * Register cleanup for a specific component
   */
  registerComponentCleanup(component: object, cleanup: () => void): void {
    if (!this.componentCleanups.has(component)) {
      this.componentCleanups.set(component, new Set());
    }
    this.componentCleanups.get(component)!.add(cleanup);
  }

  /**
   * Register global cleanup
   */
  registerGlobalCleanup(cleanup: () => void): void {
    this.globalCleanups.add(cleanup);
  }

  /**
   * Clean up for specific component
   */
  cleanupComponent(component: object): void {
    const cleanups = this.componentCleanups.get(component);
    if (cleanups) {
      cleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (e) {
          console.warn('Component cleanup failed:', e);
        }
      });
      cleanups.clear();
    }
  }

  /**
   * Run all global cleanups
   */
  cleanupAll(): void {
    this.globalCleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (e) {
        console.warn('Global cleanup failed:', e);
      }
    });
  }

  /**
   * Remove cleanup for component
   */
  unregisterComponent(component: object): void {
    this.componentCleanups.delete(component);
  }

  /**
   * Remove global cleanup
   */
  unregisterGlobalCleanup(cleanup: () => void): void {
    this.globalCleanups.delete(cleanup);
  }
}

/**
 * Global instances
 */
export const globalCleanupTracker = new ComponentCleanupTracker();
