import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProgressiveLoading, useProgressiveMusicianLoading } from '../useProgressiveLoading';
import type { LoadingStrategy } from '../useProgressiveLoading';

// Mock data loader
const createMockDataLoader = (totalItems = 100, itemsPerPage = 10, delay = 0) => {
  return vi.fn(async (page: number, limit: number) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const offset = (page - 1) * limit;
    const data = Array.from({ length: Math.min(limit, totalItems - offset) }, (_, i) => ({
      id: `item-${offset + i + 1}`,
      name: `Item ${offset + i + 1}`,
      value: offset + i + 1,
    }));

    return {
      data,
      total: totalItems,
      hasMore: offset + limit < totalItems,
    };
  });
};

const createFailingDataLoader = (failOnPage = 1) => {
  return vi.fn(async (page: number) => {
    if (page === failOnPage) {
      throw new Error(`Failed to load page ${page}`);
    }
    return {
      data: [],
      total: 0,
      hasMore: false,
    };
  });
};

describe('useProgressiveLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('basic functionality', () => {
    it('should initialize with default state', () => {
      const mockLoader = createMockDataLoader();
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, { preloadFirst: false })
      );

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.loadingState).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingMore).toBe(false);
    });

    it('should load first page automatically when preloadFirst is true', async () => {
      const mockLoader = createMockDataLoader(50, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, { preloadFirst: true, batchSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.loadingState).toBe('success');
      });

      expect(result.current.items).toHaveLength(10);
      expect(result.current.totalItems).toBe(50);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(5);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(mockLoader).toHaveBeenCalledWith(1, 10);
    });

    it('should handle loading states correctly', async () => {
      const mockLoader = createMockDataLoader(30, 10, 100); // 100ms delay
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, { preloadFirst: false })
      );

      // Initial state
      expect(result.current.loadingState).toBe('idle');
      expect(result.current.isLoading).toBe(false);

      // Start loading
      act(() => {
        result.current.loadPage(1);
      });

      expect(result.current.loadingState).toBe('loading');
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.loadingState).toBe('success');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.items).toHaveLength(10);
    });

    it('should handle error states correctly', async () => {
      const mockLoader = createFailingDataLoader(1);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, { preloadFirst: false })
      );

      act(() => {
        result.current.loadPage(1);
      });

      await waitFor(() => {
        expect(result.current.loadingState).toBe('error');
      });

      expect(result.current.error).toBe('Failed to load page 1');
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('pagination functionality', () => {
    it('should load next page correctly', async () => {
      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          strategy: 'pagination',
          batchSize: 10,
          preloadFirst: true
        })
      );

      // Wait for first page
      await waitFor(() => {
        expect(result.current.items).toHaveLength(10);
      });

      // Load next page
      await act(async () => {
        await result.current.loadNextPage();
      });

      expect(result.current.items).toHaveLength(10); // Should replace, not append for pagination
      expect(result.current.currentPage).toBe(2);
      expect(mockLoader).toHaveBeenCalledWith(2, 10);
    });

    it('should load previous page correctly', async () => {
      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          strategy: 'pagination',
          batchSize: 10,
          preloadFirst: false
        })
      );

      // Load page 2 first
      await act(async () => {
        await result.current.loadPage(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Load previous page
      await act(async () => {
        await result.current.loadPreviousPage();
      });

      expect(result.current.currentPage).toBe(1);
      expect(mockLoader).toHaveBeenCalledWith(1, 10);
    });

    it('should not load next page when at the end', async () => {
      const mockLoader = createMockDataLoader(20, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, { batchSize: 10, preloadFirst: false })
      );

      // Load last page
      await act(async () => {
        await result.current.loadPage(2);
      });

      expect(result.current.hasNextPage).toBe(false);

      const callCountBefore = mockLoader.mock.calls.length;

      // Try to load next page
      await act(async () => {
        await result.current.loadNextPage();
      });

      expect(mockLoader.mock.calls.length).toBe(callCountBefore); // No additional calls
    });
  });

  describe('infinite scroll functionality', () => {
    it('should append items for infinite scroll strategy', async () => {
      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          strategy: 'infinite-scroll',
          batchSize: 10,
          preloadFirst: true
        })
      );

      // Wait for first page
      await waitFor(() => {
        expect(result.current.items).toHaveLength(10);
      });

      // Load next page
      await act(async () => {
        await result.current.loadNextPage();
      });

      expect(result.current.items).toHaveLength(20); // Should append for infinite scroll
      expect(result.current.currentPage).toBe(2);
    });

    it('should handle loading more state for infinite scroll', async () => {
      const mockLoader = createMockDataLoader(30, 10, 100);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          strategy: 'infinite-scroll',
          batchSize: 10,
          preloadFirst: true
        })
      );

      // Wait for first page
      await waitFor(() => {
        expect(result.current.items).toHaveLength(10);
      });

      // Start loading next page
      act(() => {
        result.current.loadNextPage();
      });

      expect(result.current.isLoadingMore).toBe(true);
      expect(result.current.loadingState).toBe('loading-more');

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      expect(result.current.items).toHaveLength(20);
    });
  });

  describe('caching functionality', () => {
    it('should cache loaded data', async () => {
      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          enableCaching: true,
          batchSize: 10,
          preloadFirst: false
        })
      );

      // Load page 1
      await act(async () => {
        await result.current.loadPage(1);
      });

      expect(mockLoader).toHaveBeenCalledTimes(1);

      // Load page 1 again - should use cache
      await act(async () => {
        await result.current.loadPage(1);
      });

      expect(mockLoader).toHaveBeenCalledTimes(1); // No additional call

      const cacheStats = result.current.getCacheStats();
      expect(cacheStats.entries).toBe(1);
      expect(cacheStats.hitRate).toBe(0.5); // 1 hit out of 2 requests
    });

    it('should respect cache expiry', async () => {
      vi.useFakeTimers();

      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          enableCaching: true,
          cacheExpiry: 1000, // 1 second
          batchSize: 10,
          preloadFirst: false
        })
      );

      // Load page 1
      await act(async () => {
        await result.current.loadPage(1);
      });

      expect(mockLoader).toHaveBeenCalledTimes(1);

      // Advance time beyond cache expiry
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Load page 1 again - should not use expired cache
      await act(async () => {
        await result.current.loadPage(1);
      });

      expect(mockLoader).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should clear cache correctly', async () => {
      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          enableCaching: true,
          batchSize: 10,
          preloadFirst: false
        })
      );

      // Load page 1
      await act(async () => {
        await result.current.loadPage(1);
      });

      let cacheStats = result.current.getCacheStats();
      expect(cacheStats.entries).toBe(1);

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      cacheStats = result.current.getCacheStats();
      expect(cacheStats.entries).toBe(0);
      expect(cacheStats.hitRate).toBe(0);
    });
  });

  describe('reset functionality', () => {
    it('should reset to initial state', async () => {
      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, { batchSize: 10, preloadFirst: true })
      );

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.items).toHaveLength(10);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.loadingState).toBe('idle');
      expect(result.current.error).toBeNull();
    });
  });

  describe('refresh functionality', () => {
    it('should refresh current page', async () => {
      const mockLoader = createMockDataLoader(30, 10);
      const { result } = renderHook(() =>
        useProgressiveLoading(mockLoader, {
          enableCaching: true,
          batchSize: 10,
          preloadFirst: true
        })
      );

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.items).toHaveLength(10);
      });

      expect(mockLoader).toHaveBeenCalledTimes(1);

      // Refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockLoader).toHaveBeenCalledTimes(2); // Should bypass cache
      expect(result.current.items).toHaveLength(10);
    });
  });

  describe('different strategies', () => {
    const strategies: LoadingStrategy[] = ['pagination', 'infinite-scroll', 'hybrid', 'background-prefetch'];

    strategies.forEach(strategy => {
      it(`should work with ${strategy} strategy`, async () => {
        const mockLoader = createMockDataLoader(30, 10);
        const { result } = renderHook(() =>
          useProgressiveLoading(mockLoader, {
            strategy,
            batchSize: 10,
            preloadFirst: true
          })
        );

        await waitFor(() => {
          expect(result.current.items).toHaveLength(10);
        });

        expect(result.current.loadingState).toBe('success');
        expect(mockLoader).toHaveBeenCalledWith(1, 10);
      });
    });
  });
});

describe('useProgressiveMusicianLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load musician data correctly', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useProgressiveMusicianLoading('guitar', {
        batchSize: 5,
        preloadFirst: true
      })
    );

    // Fast-forward through the simulated delay
    await act(async () => {
      vi.advanceTimersByTime(600); // 500ms delay + buffer
      await new Promise(resolve => process.nextTick(resolve));
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(5);
    });

    expect(result.current.items[0]).toMatchObject({
      id: expect.stringContaining('musician-'),
      name: expect.stringContaining('guitar'),
      instrument: expect.any(String),
      phone: expect.stringMatching(/555-\d{4}/),
    });

    vi.useRealTimers();
  });

  it('should handle search term changes', async () => {
    const { result, rerender } = renderHook(
      ({ searchTerm }) => useProgressiveMusicianLoading(searchTerm, { preloadFirst: false }),
      { initialProps: { searchTerm: 'piano' } }
    );

    // Load some data
    await act(async () => {
      await result.current.loadPage(1);
    });

    const initialItems = result.current.items;
    expect(initialItems[0].name).toContain('piano');

    // Change search term
    rerender({ searchTerm: 'guitar' });

    // Should reset and start fresh
    expect(result.current.items).toEqual([]);
    expect(result.current.loadingState).toBe('idle');
  });

  it('should provide correct musician interface', async () => {
    const { result } = renderHook(() =>
      useProgressiveMusicianLoading('', {
        batchSize: 1,
        preloadFirst: true
      })
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    const musician = result.current.items[0];
    expect(musician).toHaveProperty('id');
    expect(musician).toHaveProperty('name');
    expect(musician).toHaveProperty('instrument');
    expect(musician).toHaveProperty('phone');

    expect(typeof musician.id).toBe('string');
    expect(typeof musician.name).toBe('string');
    expect(typeof musician.instrument).toBe('string');
    expect(typeof musician.phone).toBe('string');
  });
}); 