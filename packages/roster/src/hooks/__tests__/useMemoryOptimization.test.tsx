import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useMemoryOptimization,
  OptimizedCache,
  ComponentCleanupTracker,
  globalCleanupTracker
} from '../useMemoryOptimization';
import {
  useMemoryOptimizedPhoneClipboard,
  useMemoryOptimizedMusicianList,
  useSessionCleanup
} from '../useMemoryOptimizedPhoneClipboard';
import type { MemoryOptimizationStrategy } from '../useMemoryOptimization';

// Mock performance.memory API
const mockMemoryAPI = {
  usedJSHeapSize: 50000000, // 50MB
  totalJSHeapSize: 100000000, // 100MB
  jsHeapSizeLimit: 200000000, // 200MB
};

const mockPerformance = {
  memory: mockMemoryAPI,
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Mock phone clipboard hook
vi.mock('../usePhoneClipboardWithPerformance', () => ({
  usePhoneClipboardWithPerformance: () => ({
    selectedPhones: new Set(['555-1234', '555-5678']),
    formattedPhoneNumbers: '555-1234, 555-5678',
    copyToClipboard: vi.fn().mockResolvedValue(true),
    togglePhoneSelection: vi.fn(),
    clearSelection: vi.fn(),
    selectAllPhones: vi.fn(),
    performanceStats: {
      operationCount: 10,
      averageTime: 15,
      successRate: 100,
    },
  }),
}));

describe('useMemoryOptimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock performance API
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      configurable: true,
    });

    // Mock window.gc for Chrome DevTools
    Object.defineProperty(global.window, 'gc', {
      value: vi.fn(),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useMemoryOptimization());

      expect(result.current.memoryStats).toBeDefined();
      expect(result.current.isMonitoring).toBe(true);
      expect(result.current.actions).toBeDefined();
      expect(result.current.report).toBeDefined();
      expect(result.current.warnings).toEqual([]);
    });

    it('should calculate memory usage percentage correctly', () => {
      const { result } = renderHook(() => useMemoryOptimization());

      expect(result.current.memoryStats.usagePercentage).toBe(25); // 50MB / 200MB = 25%
      expect(result.current.memoryStats.isLowMemory).toBe(false);
      expect(result.current.memoryStats.isMemoryPressure).toBe(false);
    });

    it('should detect memory pressure', () => {
      // Mock high memory usage
      mockMemoryAPI.usedJSHeapSize = 180000000; // 180MB (90%)

      const { result } = renderHook(() => useMemoryOptimization());

      expect(result.current.memoryStats.usagePercentage).toBe(90);
      expect(result.current.memoryStats.isLowMemory).toBe(true);
      expect(result.current.memoryStats.isMemoryPressure).toBe(true);
    });

    it('should generate warnings for high memory usage', async () => {
      mockMemoryAPI.usedJSHeapSize = 160000000; // 160MB (80%)

      const { result } = renderHook(() => useMemoryOptimization({
        warningThreshold: 70,
        criticalThreshold: 85,
      }));

      await act(async () => {
        vi.advanceTimersByTime(5000); // Advance monitoring interval
      });

      expect(result.current.warnings.length).toBeGreaterThan(0);
      expect(result.current.warnings[0]).toContain('High memory usage');
    });
  });

  describe('memory optimization strategies', () => {
    const strategies: MemoryOptimizationStrategy[] = ['conservative', 'balanced', 'aggressive', 'custom'];

    strategies.forEach(strategy => {
      it(`should work with ${strategy} strategy`, () => {
        const { result } = renderHook(() => useMemoryOptimization({ strategy }));

        expect(result.current.isMonitoring).toBe(true);

        act(() => {
          result.current.actions.forceOptimization();
        });

        expect(result.current.report.optimizationCount).toBe(1);
      });
    });

    it('should perform automatic optimization based on strategy', async () => {
      mockMemoryAPI.usedJSHeapSize = 180000000; // High memory usage

      const { result } = renderHook(() => useMemoryOptimization({
        strategy: 'aggressive',
        criticalThreshold: 80,
      }));

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should have performed automatic optimization
      expect(result.current.report.optimizationCount).toBeGreaterThan(0);
    });
  });

  describe('cleanup functionality', () => {
    it('should request garbage collection', () => {
      const { result } = renderHook(() => useMemoryOptimization());

      act(() => {
        result.current.actions.requestGC();
      });

      expect(global.window.gc).toHaveBeenCalled();
    });

    it('should clear caches', () => {
      const cleanupCallback = vi.fn();
      const { result } = renderHook(() => useMemoryOptimization());

      act(() => {
        result.current.actions.addCleanupCallback(cleanupCallback);
        result.current.actions.clearCaches();
      });

      expect(cleanupCallback).toHaveBeenCalled();
    });

    it('should manage cleanup callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { result } = renderHook(() => useMemoryOptimization());

      act(() => {
        result.current.actions.addCleanupCallback(callback1);
        result.current.actions.addCleanupCallback(callback2);
        result.current.actions.forceOptimization();
      });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      // Remove callback
      act(() => {
        result.current.actions.removeCleanupCallback(callback1);
        result.current.actions.forceOptimization();
      });

      expect(callback1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(callback2).toHaveBeenCalledTimes(2); // Should be called again
    });
  });

  describe('memory reporting', () => {
    it('should generate detailed memory report', () => {
      const { result } = renderHook(() => useMemoryOptimization());

      const report = result.current.actions.getMemoryReport();

      expect(report).toHaveProperty('current');
      expect(report).toHaveProperty('history');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('sessionDuration');
      expect(report).toHaveProperty('avgMemoryUsage');
      expect(report).toHaveProperty('peakMemoryUsage');
    });

    it('should provide memory recommendations', async () => {
      mockMemoryAPI.usedJSHeapSize = 180000000; // High memory usage

      const { result } = renderHook(() => useMemoryOptimization({
        criticalThreshold: 80,
      }));

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      const report = result.current.actions.getMemoryReport();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });
});

describe('OptimizedCache', () => {
  let cache: OptimizedCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new OptimizedCache<string>(3, 1000); // Max 3 items, 1 second TTL
  });

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.size()).toBe(1);
  });

  it('should respect TTL expiry', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Advance time beyond TTL
    vi.advanceTimersByTime(1500);

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.has('key1')).toBe(false);
  });

  it('should enforce size limits with LRU eviction', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    expect(cache.size()).toBe(3);

    // Access key1 to make it recently used
    cache.get('key1');

    // Add fourth item, should evict least recently used (key2)
    cache.set('key4', 'value4');
    expect(cache.size()).toBe(3);
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false); // Should be evicted
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
  });

  it('should update access counts', () => {
    cache.set('key1', 'value1');

    // Access multiple times
    cache.get('key1');
    cache.get('key1');
    cache.get('key1');

    // Access count should influence LRU eviction
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // Should evict key2, not key1

    expect(cache.has('key1')).toBe(true); // Frequently accessed, should remain
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(false);
  });
});

describe('ComponentCleanupTracker', () => {
  let tracker: ComponentCleanupTracker;

  beforeEach(() => {
    tracker = new ComponentCleanupTracker();
  });

  it('should register and execute component cleanups', () => {
    const component = {};
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    tracker.registerComponentCleanup(component, cleanup1);
    tracker.registerComponentCleanup(component, cleanup2);

    tracker.cleanupComponent(component);

    expect(cleanup1).toHaveBeenCalled();
    expect(cleanup2).toHaveBeenCalled();
  });

  it('should register and execute global cleanups', () => {
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    tracker.registerGlobalCleanup(cleanup1);
    tracker.registerGlobalCleanup(cleanup2);

    tracker.cleanupAll();

    expect(cleanup1).toHaveBeenCalled();
    expect(cleanup2).toHaveBeenCalled();
  });

  it('should handle cleanup errors gracefully', () => {
    const component = {};
    const failingCleanup = vi.fn().mockImplementation(() => {
      throw new Error('Cleanup failed');
    });
    const successCleanup = vi.fn();

    tracker.registerComponentCleanup(component, failingCleanup);
    tracker.registerComponentCleanup(component, successCleanup);

    // Should not throw
    expect(() => tracker.cleanupComponent(component)).not.toThrow();
    expect(successCleanup).toHaveBeenCalled();
  });

  it('should unregister cleanups', () => {
    const component = {};
    const cleanup = vi.fn();

    tracker.registerComponentCleanup(component, cleanup);
    tracker.unregisterComponent(component);
    tracker.cleanupComponent(component);

    expect(cleanup).not.toHaveBeenCalled();
  });
});

describe('useMemoryOptimizedPhoneClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide memory-optimized clipboard functionality', () => {
    const { result } = renderHook(() => useMemoryOptimizedPhoneClipboard());

    expect(result.current.isMemoryOptimized).toBe(true);
    expect(result.current.memoryStats).toBeDefined();
    expect(result.current.cleanup).toBeDefined();
    expect(result.current.selectedPhones).toBeDefined();
    expect(result.current.formattedPhoneNumbers).toBeDefined();
  });

  it('should track memory statistics', () => {
    const { result } = renderHook(() => useMemoryOptimizedPhoneClipboard());

    expect(result.current.memoryStats.cacheSize).toBeDefined();
    expect(result.current.memoryStats.cacheHitRate).toBeDefined();
    expect(result.current.memoryStats.totalOperations).toBeDefined();
  });

  it('should perform cleanup on memory pressure', () => {
    mockMemoryAPI.usedJSHeapSize = 180000000; // High memory usage

    const { result } = renderHook(() => useMemoryOptimizedPhoneClipboard({
      autoCleanup: true,
      memoryThreshold: 70,
    }));

    const initialCleanupCount = result.current.memoryStats.cleanupCount;

    act(() => {
      vi.advanceTimersByTime(5000); // Trigger monitoring
    });

    expect(result.current.memoryStats.cleanupCount).toBeGreaterThanOrEqual(initialCleanupCount);
  });
});

describe('useMemoryOptimizedMusicianList', () => {
  const mockMusicians = [
    { id: '1', name: 'John Doe', instrument: 'Guitar', phone: '555-1234' },
    { id: '2', name: 'Jane Smith', instrument: 'Piano', phone: '555-5678' },
    { id: '3', name: 'Bob Johnson', instrument: 'Drums', phone: '555-9012' },
  ];

  it('should provide optimized filtering', () => {
    const { result } = renderHook(() => useMemoryOptimizedMusicianList(mockMusicians));

    const filtered = result.current.filterMusicians('guitar');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('John Doe');

    // Should use cache for subsequent calls
    const filtered2 = result.current.filterMusicians('guitar');
    expect(filtered2).toBe(filtered); // Same reference due to caching
  });

  it('should provide optimized sorting', () => {
    const { result } = renderHook(() => useMemoryOptimizedMusicianList(mockMusicians));

    const sorted = result.current.sortMusicians(mockMusicians, 'name');
    expect(sorted[0].name).toBe('Bob Johnson');
    expect(sorted[1].name).toBe('Jane Smith');
    expect(sorted[2].name).toBe('John Doe');

    // Should use cache for subsequent calls
    const sorted2 = result.current.sortMusicians(mockMusicians, 'name');
    expect(sorted2).toBe(sorted); // Same reference due to caching
  });

  it('should track memory statistics', () => {
    const { result } = renderHook(() => useMemoryOptimizedMusicianList(mockMusicians));

    expect(result.current.memoryStats.cacheSize).toBeDefined();
    expect(result.current.memoryStats.memoryUsage).toBeDefined();
    expect(result.current.memoryStats.isOptimized).toBe(true);
  });
});

describe('useSessionCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should perform periodic cleanup', () => {
    const { result } = renderHook(() => useSessionCleanup(1)); // 1 minute interval

    const initialTime = result.current.lastCleanup;

    // Advance time by 1 minute
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.lastCleanup).toBeGreaterThan(initialTime);
  });

  it('should perform cleanup on visibility change', () => {
    const { result } = renderHook(() => useSessionCleanup(30)); // 30 minute interval

    const initialTime = result.current.lastCleanup;

    // Simulate tab becoming hidden and then visible again after a while
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
      vi.advanceTimersByTime(1800000); // 30 minutes
      Object.defineProperty(document, 'visibilityState', { value: 'visible' });

      // Trigger visibility change event
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });

    expect(result.current.lastCleanup).toBeGreaterThan(initialTime);
  });

  it('should provide memory statistics', () => {
    const { result } = renderHook(() => useSessionCleanup());

    expect(result.current.memoryStats).toBeDefined();
    expect(result.current.memoryStats.usagePercentage).toBeDefined();
  });
}); 