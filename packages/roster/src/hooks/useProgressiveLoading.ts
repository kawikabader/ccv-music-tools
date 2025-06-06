import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Progressive loading strategies
 */
export type LoadingStrategy =
  | 'pagination'
  | 'infinite-scroll'
  | 'hybrid'
  | 'background-prefetch';

/**
 * Loading state for progressive loading
 */
export type LoadingState =
  | 'idle'
  | 'loading'
  | 'loading-more'
  | 'success'
  | 'error'
  | 'complete';

/**
 * Progressive loading configuration
 */
interface ProgressiveLoadingConfig {
  /** Loading strategy to use */
  strategy: LoadingStrategy;
  /** Number of items to load per batch */
  batchSize: number;
  /** Number of batches to prefetch in background */
  prefetchBatches: number;
  /** Threshold for triggering infinite scroll (pixels from bottom) */
  infiniteScrollThreshold: number;
  /** Whether to cache loaded data */
  enableCaching: boolean;
  /** Cache expiry time in milliseconds */
  cacheExpiry: number;
  /** Whether to preload the first batch immediately */
  preloadFirst: boolean;
  /** Debounce delay for scroll events */
  scrollDebounce: number;
}

/**
 * Cached data entry
 */
interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  page: number;
  total?: number;
}

/**
 * Progressive loading result
 */
interface ProgressiveLoadingResult<T> {
  // Data
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // State
  loadingState: LoadingState;
  error: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;

  // Actions
  loadNextPage: () => Promise<void>;
  loadPreviousPage: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;

  // Infinite scroll
  infiniteScrollRef: React.RefObject<HTMLDivElement>;

  // Cache management
  clearCache: () => void;
  getCacheStats: () => { entries: number; size: number; hitRate: number };
}

/**
 * Data loader function type
 */
type DataLoader<T> = (
  page: number,
  limit: number
) => Promise<{
  data: T[];
  total: number;
  hasMore: boolean;
}>;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ProgressiveLoadingConfig = {
  strategy: 'hybrid',
  batchSize: 25,
  prefetchBatches: 2,
  infiniteScrollThreshold: 200,
  enableCaching: true,
  cacheExpiry: 300000, // 5 minutes
  preloadFirst: true,
  scrollDebounce: 100,
};

/**
 * Progressive loading hook
 */
export function useProgressiveLoading<T = any>(
  dataLoader: DataLoader<T>,
  config: Partial<ProgressiveLoadingConfig> = {}
): ProgressiveLoadingResult<T> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // State
  const [items, setItems] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Cache
  const cache = useRef<Map<number, CacheEntry<T>>>(new Map());
  const cacheHits = useRef(0);
  const cacheMisses = useRef(0);

  // Refs
  const infiniteScrollRef = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);

  // Computed values
  const totalPages = Math.ceil(totalItems / fullConfig.batchSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const isLoading = loadingState === 'loading';
  const isLoadingMore = loadingState === 'loading-more';

  /**
   * Check if cache entry is valid
   */
  const isCacheValid = useCallback(
    (entry: CacheEntry<T>): boolean => {
      if (!fullConfig.enableCaching) return false;
      return Date.now() - entry.timestamp < fullConfig.cacheExpiry;
    },
    [fullConfig.enableCaching, fullConfig.cacheExpiry]
  );

  /**
   * Get data from cache if available and valid
   */
  const getCachedData = useCallback(
    (page: number): CacheEntry<T> | null => {
      const entry = cache.current.get(page);
      if (entry && isCacheValid(entry)) {
        cacheHits.current++;
        return entry;
      }
      if (entry) {
        cache.current.delete(page); // Remove expired entry
      }
      cacheMisses.current++;
      return null;
    },
    [isCacheValid]
  );

  /**
   * Store data in cache
   */
  const setCachedData = useCallback(
    (page: number, data: T[], total: number) => {
      if (fullConfig.enableCaching) {
        cache.current.set(page, {
          data,
          timestamp: Date.now(),
          page,
          total,
        });
      }
    },
    [fullConfig.enableCaching]
  );

  /**
   * Load a specific page
   */
  const loadPage = useCallback(
    async (page: number, append = false) => {
      // Cancel any existing request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      // Check cache first
      const cachedData = getCachedData(page);
      if (cachedData) {
        if (append) {
          setItems(prev => [...prev, ...cachedData.data]);
        } else {
          setItems(cachedData.data);
        }
        if (cachedData.total !== undefined) {
          setTotalItems(cachedData.total);
        }
        setCurrentPage(page);
        setLoadingState('success');
        return;
      }

      const isFirstLoad = items.length === 0;
      setLoadingState(isFirstLoad ? 'loading' : 'loading-more');
      setError(null);

      try {
        const result = await dataLoader(page, fullConfig.batchSize);

        // Check if request was aborted
        if (abortController.current?.signal.aborted) {
          return;
        }

        // Cache the result
        setCachedData(page, result.data, result.total);

        // Update state
        if (append) {
          setItems(prev => [...prev, ...result.data]);
        } else {
          setItems(result.data);
        }
        setTotalItems(result.total);
        setCurrentPage(page);
        setLoadingState(result.hasMore ? 'success' : 'complete');
      } catch (err) {
        if (abortController.current?.signal.aborted) {
          return; // Ignore aborted requests
        }

        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        setLoadingState('error');
      }
    },
    [
      dataLoader,
      fullConfig.batchSize,
      getCachedData,
      setCachedData,
      items.length,
    ]
  );

  /**
   * Load next page
   */
  const loadNextPage = useCallback(async () => {
    if (!hasNextPage || isLoading || isLoadingMore) return;

    const nextPage = currentPage + 1;
    const shouldAppend =
      fullConfig.strategy === 'infinite-scroll' ||
      fullConfig.strategy === 'hybrid';

    await loadPage(nextPage, shouldAppend);
  }, [
    hasNextPage,
    isLoading,
    isLoadingMore,
    currentPage,
    fullConfig.strategy,
    loadPage,
  ]);

  /**
   * Load previous page
   */
  const loadPreviousPage = useCallback(async () => {
    if (!hasPreviousPage || isLoading || isLoadingMore) return;
    await loadPage(currentPage - 1, false);
  }, [hasPreviousPage, isLoading, isLoadingMore, currentPage, loadPage]);

  /**
   * Refresh current data
   */
  const refresh = useCallback(async () => {
    // Clear cache for current page
    cache.current.delete(currentPage);
    await loadPage(currentPage, false);
  }, [currentPage, loadPage]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setItems([]);
    setTotalItems(0);
    setCurrentPage(1);
    setLoadingState('idle');
    setError(null);
    cache.current.clear();
    cacheHits.current = 0;
    cacheMisses.current = 0;
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    cache.current.clear();
    cacheHits.current = 0;
    cacheMisses.current = 0;
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    const totalRequests = cacheHits.current + cacheMisses.current;
    return {
      entries: cache.current.size,
      size: Array.from(cache.current.values()).reduce(
        (size, entry) => size + entry.data.length,
        0
      ),
      hitRate: totalRequests > 0 ? cacheHits.current / totalRequests : 0,
    };
  }, []);

  /**
   * Background prefetching
   */
  const prefetchNextBatches = useCallback(async () => {
    if (
      fullConfig.strategy !== 'background-prefetch' &&
      fullConfig.strategy !== 'hybrid'
    ) {
      return;
    }

    const startPage = currentPage + 1;
    const endPage = Math.min(
      startPage + fullConfig.prefetchBatches - 1,
      totalPages
    );

    for (let page = startPage; page <= endPage; page++) {
      // Only prefetch if not already cached
      if (!getCachedData(page)) {
        try {
          const result = await dataLoader(page, fullConfig.batchSize);
          setCachedData(page, result.data, result.total);
        } catch (err) {
          // Silent fail for prefetching
          console.warn(`Prefetch failed for page ${page}:`, err);
        }
      }
    }
  }, [
    fullConfig.strategy,
    fullConfig.prefetchBatches,
    currentPage,
    totalPages,
    getCachedData,
    dataLoader,
    fullConfig.batchSize,
    setCachedData,
  ]);

  /**
   * Infinite scroll handler
   */
  const handleInfiniteScroll = useCallback(() => {
    if (
      fullConfig.strategy !== 'infinite-scroll' &&
      fullConfig.strategy !== 'hybrid'
    ) {
      return;
    }

    const element = infiniteScrollRef.current;
    if (!element || !hasNextPage || isLoading || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < fullConfig.infiniteScrollThreshold) {
      loadNextPage();
    }
  }, [
    fullConfig.strategy,
    fullConfig.infiniteScrollThreshold,
    hasNextPage,
    isLoading,
    isLoadingMore,
    loadNextPage,
  ]);

  /**
   * Debounced scroll handler
   */
  const debouncedScrollHandler = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInfiniteScroll, fullConfig.scrollDebounce);
    };
  }, [handleInfiniteScroll, fullConfig.scrollDebounce]);

  /**
   * Setup infinite scroll listener
   */
  useEffect(() => {
    const element = infiniteScrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', debouncedScrollHandler);
    return () => {
      element.removeEventListener('scroll', debouncedScrollHandler);
    };
  }, [debouncedScrollHandler]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (fullConfig.preloadFirst && loadingState === 'idle') {
      loadPage(1, false);
    }
  }, [fullConfig.preloadFirst, loadingState, loadPage]);

  /**
   * Prefetch next batches when current page changes
   */
  useEffect(() => {
    if (loadingState === 'success' && totalPages > 0) {
      // Small delay to avoid blocking the main thread
      const timeoutId = setTimeout(prefetchNextBatches, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [loadingState, totalPages, prefetchNextBatches]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    // Data
    items,
    totalItems,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,

    // State
    loadingState,
    error,
    isLoading,
    isLoadingMore,

    // Actions
    loadNextPage,
    loadPreviousPage,
    loadPage: (page: number) => loadPage(page, false),
    refresh,
    reset,

    // Infinite scroll
    infiniteScrollRef,

    // Cache management
    clearCache,
    getCacheStats,
  };
}

/**
 * Musician interface for type safety
 */
export interface Musician {
  id: string;
  name: string;
  instrument: string;
  phone: string;
}

/**
 * Hook for progressive musician loading
 */
export function useProgressiveMusicianLoading(
  searchTerm: string = '',
  config: Partial<ProgressiveLoadingConfig> = {}
): ProgressiveLoadingResult<Musician> {
  // This would integrate with your actual API
  const dataLoader: DataLoader<Musician> = useCallback(
    async (page: number, limit: number) => {
      // Simulate API call - replace with actual implementation
      const offset = (page - 1) * limit;

      // In a real implementation, this would call your API
      // const response = await fetch(`/api/musicians?page=${page}&limit=${limit}&search=${searchTerm}`);
      // const result = await response.json();

      // Simulated response for demonstration
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      const mockData: Musician[] = Array.from({ length: limit }, (_, i) => ({
        id: `musician-${offset + i + 1}`,
        name: `Musician ${offset + i + 1}${searchTerm ? ` (${searchTerm})` : ''}`,
        instrument: ['Guitar', 'Piano', 'Drums', 'Bass', 'Violin'][i % 5],
        phone: `555-${String(offset + i + 1).padStart(4, '0')}`,
      }));

      return {
        data: mockData,
        total: 250, // Simulated total
        hasMore: page < 10, // Simulated hasMore
      };
    },
    [searchTerm]
  );

  return useProgressiveLoading<Musician>(dataLoader, {
    batchSize: 25,
    strategy: 'hybrid',
    prefetchBatches: 2,
    infiniteScrollThreshold: 200,
    enableCaching: true,
    ...config,
  });
}
