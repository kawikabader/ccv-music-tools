import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Configuration options for virtualization behavior
 */
interface VirtualizationConfig {
  /** Minimum number of items before virtualization kicks in */
  threshold: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the virtualized list container */
  listHeight: number;
  /** Number of items to render outside visible area for smooth scrolling */
  overscan: number;
  /** Whether to force virtualization regardless of item count */
  forceVirtualization: boolean;
  /** Whether to respect user's preference for reduced motion */
  respectMotionPreference: boolean;
}

/**
 * Performance metrics for virtualization decisions
 */
interface PerformanceMetrics {
  /** Average render time for non-virtualized list (ms) */
  renderTime: number;
  /** Memory usage estimate (MB) */
  memoryUsage: number;
  /** Whether the device appears to be low-powered */
  isLowPowerDevice: boolean;
  /** Whether motion is preferred by user */
  prefersReducedMotion: boolean;
}

/**
 * Return type for the useVirtualization hook
 */
interface VirtualizationResult {
  /** Whether to use virtualization for the current dataset */
  shouldVirtualize: boolean;
  /** Configuration object for virtualization */
  config: VirtualizationConfig;
  /** Performance metrics */
  metrics: PerformanceMetrics;
  /** Update configuration dynamically */
  updateConfig: (updates: Partial<VirtualizationConfig>) => void;
  /** Force re-evaluation of virtualization decision */
  reevaluate: () => void;
}

/**
 * Default configuration for virtualization
 */
const DEFAULT_CONFIG: VirtualizationConfig = {
  threshold: 50, // Start virtualizing with 50+ items
  itemHeight: 120, // Height of each musician item
  listHeight: 600, // Default container height
  overscan: 5, // Render 5 extra items beyond visible area
  forceVirtualization: false,
  respectMotionPreference: true,
};

/**
 * Detect device capabilities and preferences
 */
function detectDeviceCapabilities(): Partial<PerformanceMetrics> {
  const isLowPowerDevice = (() => {
    // Use various heuristics to detect low-power devices
    if (typeof navigator !== 'undefined') {
      // Check for mobile devices
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      // Check hardware concurrency (number of CPU cores)
      const cores = navigator.hardwareConcurrency || 4;

      // Check memory if available (Chrome/Edge)
      const memory = (navigator as any).deviceMemory || 4;

      return isMobile || cores <= 2 || memory <= 2;
    }
    return false;
  })();

  const prefersReducedMotion = (() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  })();

  return {
    isLowPowerDevice,
    prefersReducedMotion,
  };
}

/**
 * Estimate memory usage for a given number of items
 */
function estimateMemoryUsage(itemCount: number): number {
  // Rough estimate: each musician item ~1KB in memory
  const bytesPerItem = 1024;
  const totalBytes = itemCount * bytesPerItem;
  return totalBytes / (1024 * 1024); // Convert to MB
}

/**
 * Measure render performance (simplified)
 */
function measureRenderPerformance(): number {
  // This is a simplified performance measurement
  // In a real implementation, you might use Performance API
  if (typeof performance !== 'undefined' && performance.now) {
    const start = performance.now();
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      // Empty loop to simulate rendering work
    }
    return performance.now() - start;
  }
  return 5; // Default fallback
}

/**
 * Hook to manage virtualization behavior and performance optimization
 */
export function useVirtualization(
  itemCount: number,
  initialConfig: Partial<VirtualizationConfig> = {}
): VirtualizationResult {
  const [config, setConfig] = useState<VirtualizationConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => {
    const capabilities = detectDeviceCapabilities();
    return {
      renderTime: measureRenderPerformance(),
      memoryUsage: estimateMemoryUsage(itemCount),
      isLowPowerDevice: capabilities.isLowPowerDevice ?? false,
      prefersReducedMotion: capabilities.prefersReducedMotion ?? false,
    };
  });

  // Update metrics when item count changes
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      memoryUsage: estimateMemoryUsage(itemCount),
      renderTime: measureRenderPerformance(),
    }));
  }, [itemCount]);

  // Monitor for changes in user preferences
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setMetrics(prev => ({
        ...prev,
        prefersReducedMotion: e.matches,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine if virtualization should be used
  const shouldVirtualize = useMemo(() => {
    // Force virtualization if explicitly requested
    if (config.forceVirtualization) return true;

    // Don't virtualize if user prefers reduced motion and we respect that preference
    if (config.respectMotionPreference && metrics.prefersReducedMotion) {
      return false;
    }

    // Use virtualization for large datasets
    if (itemCount >= config.threshold) return true;

    // Use virtualization on low-power devices with smaller thresholds
    if (metrics.isLowPowerDevice && itemCount >= config.threshold / 2) {
      return true;
    }

    // Use virtualization if memory usage is high
    if (metrics.memoryUsage > 10) {
      // 10MB threshold
      return true;
    }

    // Don't virtualize for small datasets
    return false;
  }, [
    itemCount,
    config.threshold,
    config.forceVirtualization,
    config.respectMotionPreference,
    metrics.isLowPowerDevice,
    metrics.prefersReducedMotion,
    metrics.memoryUsage,
  ]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<VirtualizationConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Force re-evaluation of metrics
  const reevaluate = useCallback(() => {
    const capabilities = detectDeviceCapabilities();
    setMetrics(prev => ({
      ...prev,
      renderTime: measureRenderPerformance(),
      memoryUsage: estimateMemoryUsage(itemCount),
      isLowPowerDevice: capabilities.isLowPowerDevice ?? false,
      prefersReducedMotion: capabilities.prefersReducedMotion ?? false,
    }));
  }, [itemCount]);

  return {
    shouldVirtualize,
    config,
    metrics,
    updateConfig,
    reevaluate,
  };
}

/**
 * Hook for adaptive item height based on content and device
 */
export function useAdaptiveItemHeight(
  baseHeight: number = 120,
  isLowPowerDevice: boolean = false
): number {
  return useMemo(() => {
    // Use smaller heights on low-power devices to reduce rendering complexity
    const modifier = isLowPowerDevice ? 0.9 : 1;
    return Math.floor(baseHeight * modifier);
  }, [baseHeight, isLowPowerDevice]);
}

/**
 * Hook for dynamic list height based on available space
 */
export function useDynamicListHeight(
  maxHeight: number = 600,
  minHeight: number = 200,
  itemCount: number = 0,
  itemHeight: number = 120
): number {
  return useMemo(() => {
    if (typeof window === 'undefined') return maxHeight;

    // Calculate available viewport height
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight * 0.6; // Use 60% of viewport

    // Calculate ideal height based on content
    const contentHeight = itemCount * itemHeight;
    const idealHeight = Math.min(contentHeight, availableHeight, maxHeight);

    return Math.max(idealHeight, minHeight);
  }, [maxHeight, minHeight, itemCount, itemHeight]);
}
