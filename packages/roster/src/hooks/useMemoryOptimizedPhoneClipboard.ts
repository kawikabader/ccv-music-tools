import { useCallback, useEffect, useRef, useMemo } from 'react';
import { usePhoneClipboardWithPerformance } from './usePhoneClipboardWithPerformance';
import {
  useMemoryOptimization,
  OptimizedCache,
  globalCleanupTracker,
} from './useMemoryOptimization';
import type { Musician } from './useProgressiveLoading';

/**
 * Memory optimization configuration for clipboard
 */
interface MemoryOptimizedClipboardConfig {
  /** Maximum number of cached phone formats */
  maxCacheSize?: number;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Enable memory monitoring */
  enableMonitoring?: boolean;
  /** Memory threshold for aggressive cleanup */
  memoryThreshold?: number;
  /** Enable automatic cleanup on memory pressure */
  autoCleanup?: boolean;
}

/**
 * Memory statistics for clipboard operations
 */
interface ClipboardMemoryStats {
  cacheSize: number;
  cacheHitRate: number;
  totalOperations: number;
  memoryUsage: number;
  cleanupCount: number;
  lastCleanup: Date | null;
}

/**
 * Memory-optimized clipboard result
 */
interface MemoryOptimizedClipboardResult {
  // Original clipboard functionality
  selectedPhones: Set<string>;
  formattedPhoneNumbers: string;
  copyToClipboard: () => Promise<boolean>;
  togglePhoneSelection: (musicianId: string, phone: string) => void;
  clearSelection: () => void;
  selectAllPhones: (musicians: Musician[]) => void;

  // Performance metrics
  performanceStats: any;

  // Memory optimization
  memoryStats: ClipboardMemoryStats;
  cleanup: () => void;
  isMemoryOptimized: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MemoryOptimizedClipboardConfig> = {
  maxCacheSize: 1000,
  cacheTTL: 300000, // 5 minutes
  enableMonitoring: true,
  memoryThreshold: 80, // 80%
  autoCleanup: true,
};

/**
 * Memory-optimized phone clipboard hook
 */
export function useMemoryOptimizedPhoneClipboard(
  config: MemoryOptimizedClipboardConfig = {}
): MemoryOptimizedClipboardResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Original clipboard functionality with performance monitoring
  const originalClipboard = usePhoneClipboardWithPerformance();

  // Memory optimization
  const memoryOptimization = useMemoryOptimization({
    strategy: 'balanced',
    enableCacheCleanup: true,
    enableComponentCleanup: true,
    warningThreshold: fullConfig.memoryThreshold,
  });

  // Optimized caches
  const phoneFormatCache = useRef<OptimizedCache<string>>(
    new OptimizedCache(fullConfig.maxCacheSize, fullConfig.cacheTTL)
  );
  const selectionCache = useRef<OptimizedCache<Set<string>>>(
    new OptimizedCache(100, fullConfig.cacheTTL)
  );

  // Statistics tracking
  const stats = useRef({
    totalOperations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cleanupCount: 0,
    lastCleanup: null as Date | null,
  });

  /**
   * Optimized phone formatter with caching
   */
  const optimizedFormatPhones = useCallback((phones: Set<string>): string => {
    stats.current.totalOperations++;

    // Create cache key from sorted phone numbers
    const cacheKey = Array.from(phones).sort().join(',');

    // Check cache first
    const cached = phoneFormatCache.current.get(cacheKey);
    if (cached) {
      stats.current.cacheHits++;
      return cached;
    }

    // Format phones (use original logic)
    const formatted = Array.from(phones).join(', ');

    // Cache the result
    phoneFormatCache.current.set(cacheKey, formatted);
    stats.current.cacheMisses++;

    return formatted;
  }, []);

  /**
   * Memory-optimized selection management
   */
  const optimizedToggleSelection = useCallback(
    (musicianId: string, phone: string) => {
      // Use original toggle logic but with memory awareness
      originalClipboard.togglePhoneSelection(musicianId, phone);

      // Clear old selection cache entries to free memory
      if (memoryOptimization.memoryStats.isMemoryPressure) {
        selectionCache.current.clear();
      }
    },
    [
      originalClipboard.togglePhoneSelection,
      memoryOptimization.memoryStats.isMemoryPressure,
    ]
  );

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    phoneFormatCache.current.clear();
    selectionCache.current.clear();
    stats.current.cleanupCount++;
    stats.current.lastCleanup = new Date();
  }, []);

  /**
   * Register cleanup with global tracker
   */
  useEffect(() => {
    globalCleanupTracker.registerGlobalCleanup(cleanup);
    memoryOptimization.actions.addCleanupCallback(cleanup);

    return () => {
      globalCleanupTracker.unregisterGlobalCleanup(cleanup);
      memoryOptimization.actions.removeCleanupCallback(cleanup);
    };
  }, [cleanup, memoryOptimization.actions]);

  /**
   * Auto-cleanup on memory pressure
   */
  useEffect(() => {
    if (
      fullConfig.autoCleanup &&
      memoryOptimization.memoryStats.isMemoryPressure
    ) {
      cleanup();
    }
  }, [
    fullConfig.autoCleanup,
    memoryOptimization.memoryStats.isMemoryPressure,
    cleanup,
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      phoneFormatCache.current.destroy();
      selectionCache.current.destroy();
    };
  }, []);

  /**
   * Memory statistics
   */
  const memoryStats: ClipboardMemoryStats = useMemo(() => {
    const totalRequests = stats.current.cacheHits + stats.current.cacheMisses;
    const hitRate =
      totalRequests > 0 ? stats.current.cacheHits / totalRequests : 0;

    return {
      cacheSize:
        phoneFormatCache.current.size() + selectionCache.current.size(),
      cacheHitRate: hitRate,
      totalOperations: stats.current.totalOperations,
      memoryUsage: memoryOptimization.memoryStats.usagePercentage,
      cleanupCount: stats.current.cleanupCount,
      lastCleanup: stats.current.lastCleanup,
    };
  }, [memoryOptimization.memoryStats.usagePercentage]);

  /**
   * Optimized formatted phone numbers
   */
  const formattedPhoneNumbers = useMemo(() => {
    return optimizedFormatPhones(originalClipboard.selectedPhones);
  }, [originalClipboard.selectedPhones, optimizedFormatPhones]);

  return {
    // Original functionality
    selectedPhones: originalClipboard.selectedPhones,
    formattedPhoneNumbers,
    copyToClipboard: originalClipboard.copyToClipboard,
    togglePhoneSelection: optimizedToggleSelection,
    clearSelection: originalClipboard.clearSelection,
    selectAllPhones: originalClipboard.selectAllPhones,

    // Performance metrics
    performanceStats: originalClipboard.performanceStats,

    // Memory optimization
    memoryStats,
    cleanup,
    isMemoryOptimized: true,
  };
}

/**
 * Memory-optimized musician list hook
 */
export function useMemoryOptimizedMusicianList(musicians: Musician[]) {
  const memoryOptimization = useMemoryOptimization({
    strategy: 'balanced',
    enableComponentCleanup: true,
  });

  // Optimized musician cache
  const musicianCache = useRef<OptimizedCache<Musician[]>>(
    new OptimizedCache(10, 300000) // Cache up to 10 filtered lists for 5 minutes
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    musicianCache.current.clear();
  }, []);

  // Register cleanup
  useEffect(() => {
    memoryOptimization.actions.addCleanupCallback(cleanup);
    return () => {
      memoryOptimization.actions.removeCleanupCallback(cleanup);
      musicianCache.current.destroy();
    };
  }, [cleanup, memoryOptimization.actions]);

  /**
   * Memory-optimized filtering
   */
  const filterMusicians = useCallback(
    (searchTerm: string): Musician[] => {
      if (!searchTerm.trim()) return musicians;

      const cacheKey = `filter:${searchTerm.toLowerCase()}`;
      const cached = musicianCache.current.get(cacheKey);

      if (cached) return cached;

      const filtered = musicians.filter(
        musician =>
          musician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          musician.instrument
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          musician.phone.includes(searchTerm)
      );

      musicianCache.current.set(cacheKey, filtered);
      return filtered;
    },
    [musicians]
  );

  /**
   * Memory-optimized sorting
   */
  const sortMusicians = useCallback(
    (
      musicians: Musician[],
      sortBy: 'name' | 'instrument' | 'phone' = 'name'
    ): Musician[] => {
      const cacheKey = `sort:${sortBy}:${musicians.length}`;
      const cached = musicianCache.current.get(cacheKey);

      if (cached && cached.length === musicians.length) return cached;

      const sorted = [...musicians].sort((a, b) => {
        const aValue = a[sortBy].toLowerCase();
        const bValue = b[sortBy].toLowerCase();
        return aValue.localeCompare(bValue);
      });

      musicianCache.current.set(cacheKey, sorted);
      return sorted;
    },
    []
  );

  return {
    filterMusicians,
    sortMusicians,
    cleanup,
    memoryStats: {
      cacheSize: musicianCache.current.size(),
      memoryUsage: memoryOptimization.memoryStats.usagePercentage,
      isOptimized: true,
    },
  };
}

/**
 * Session cleanup hook for extended sessions
 */
export function useSessionCleanup(intervalMinutes = 30) {
  const memoryOptimization = useMemoryOptimization({
    strategy: 'balanced',
    enableCacheCleanup: true,
    enableComponentCleanup: true,
  });

  const lastCleanup = useRef(Date.now());
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);

  const performSessionCleanup = useCallback(() => {
    // Force garbage collection
    memoryOptimization.actions.requestGC();

    // Clear caches
    memoryOptimization.actions.clearCaches();

    // Clean up components
    memoryOptimization.actions.cleanupComponents();

    // Force optimization
    memoryOptimization.actions.forceOptimization();

    lastCleanup.current = Date.now();

    // Session cleanup performed
  }, [memoryOptimization.actions]);

  // Periodic cleanup
  useEffect(() => {
    cleanupInterval.current = setInterval(
      performSessionCleanup,
      intervalMinutes * 60 * 1000
    );

    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [performSessionCleanup, intervalMinutes]);

  // Cleanup on page visibility change (when user returns)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastCleanup = Date.now() - lastCleanup.current;
        const shouldCleanup =
          timeSinceLastCleanup > (intervalMinutes * 60 * 1000) / 2;

        if (shouldCleanup) {
          performSessionCleanup();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [performSessionCleanup, intervalMinutes]);

  return {
    performSessionCleanup,
    lastCleanup: lastCleanup.current,
    memoryStats: memoryOptimization.memoryStats,
  };
}
