import {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
  startTransition,
} from 'react';
import { useClipboard } from './useClipboard';
import {
  formatPhoneNumbersFromObjects,
  getPhoneFormatStats,
  type PhoneFormatOptions,
} from '../utils/phoneFormatter';
import {
  useClipboardToast,
  ClipboardToastVariants,
} from '../components/UI/ClipboardToast';
import { ClipboardErrorType, type ClipboardError } from './useClipboardError';
import type { Musician } from '../types/supabase';

export interface UsePhoneClipboardOptimizedOptions extends PhoneFormatOptions {
  /** Whether to automatically clear selection after copying (default: false) */
  autoClearSelection?: boolean;
  /** Custom success message format */
  successMessage?: (count: number) => string;
  /** Whether to automatically update clipboard when selection changes (default: false) */
  autoUpdateClipboard?: boolean;
  /** Minimum number of selected musicians before auto-update kicks in (default: 1) */
  autoUpdateMinSelection?: number;
  /** Debounce delay in ms for auto-updates to prevent excessive clipboard writes (default: 300) */
  autoUpdateDebounce?: number;
  /** Enable performance optimizations for large datasets (default: true) */
  enablePerformanceOptimizations?: boolean;
  /** Chunk size for processing large selections (default: 100) */
  chunkSize?: number;
  /** Maximum clipboard size in characters (default: 100000) */
  maxClipboardSize?: number;
  /** Enable performance monitoring (default: false) */
  enablePerformanceMonitoring?: boolean;
}

export interface PhoneClipboardStatsOptimized {
  totalSelected: number;
  validPhones: number;
  invalidPhones: number;
  validPercentage: number;
  processingTime?: number;
  chunkCount?: number;
  memoryUsage?: number;
}

interface PerformanceMetrics {
  selectionTime: number;
  formattingTime: number;
  clipboardTime: number;
  totalTime: number;
  memoryBefore: number;
  memoryAfter: number;
  chunkCount: number;
  phoneCount: number;
}

/**
 * Performance-optimized version of usePhoneClipboard for large datasets
 * Includes chunking, memoization, and memory management optimizations
 */
export function usePhoneClipboardOptimized(
  musicians: Musician[],
  selectedIds: Set<string>,
  clearSelection?: () => void,
  options: UsePhoneClipboardOptimizedOptions = {}
) {
  const clipboard = useClipboard();
  const toast = useClipboardToast();

  const {
    autoClearSelection = false,
    successMessage = (count: number) =>
      `Copied ${count} phone number${count !== 1 ? 's' : ''} to clipboard`,
    autoUpdateClipboard = false,
    autoUpdateMinSelection = 1,
    autoUpdateDebounce = 300,
    enablePerformanceOptimizations = true,
    chunkSize = 100,
    maxClipboardSize = 100000,
    enablePerformanceMonitoring = false,
    ...formatOptions
  } = options;

  // Performance monitoring state
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const performanceStartRef = useRef<number>(0);

  // Memoized musician lookup for O(1) access
  const musicianLookup = useMemo(() => {
    if (!enablePerformanceOptimizations || musicians.length < 50) {
      return null; // Use array filter for small datasets
    }

    const lookup = new Map<string, Musician>();
    musicians.forEach(musician => {
      lookup.set(musician.id, musician);
    });
    return lookup;
  }, [musicians, enablePerformanceOptimizations]);

  /**
   * Optimized selected musicians calculation using Map lookup or chunked processing
   */
  const selectedMusicians = useMemo(() => {
    const startTime = performance.now();

    if (!enablePerformanceOptimizations || selectedIds.size < 50) {
      // Simple filter for small selections
      const result = musicians.filter(musician => selectedIds.has(musician.id));
      return result;
    }

    // Use Map lookup for O(1) access time
    if (musicianLookup) {
      const result: Musician[] = [];
      selectedIds.forEach(id => {
        const musician = musicianLookup.get(id);
        if (musician) {
          result.push(musician);
        }
      });

      if (enablePerformanceMonitoring) {
        console.log(
          `Selection lookup took ${performance.now() - startTime}ms for ${result.length} musicians`
        );
      }

      return result;
    }

    // Fallback to chunked processing for very large datasets
    return processInChunks(musicians, chunkSize, chunk =>
      chunk.filter(musician => selectedIds.has(musician.id))
    ).flat();
  }, [
    musicians,
    selectedIds,
    musicianLookup,
    enablePerformanceOptimizations,
    chunkSize,
    enablePerformanceMonitoring,
  ]);

  /**
   * Optimized phone formatting with chunking for large datasets
   */
  const formattedPhoneNumbers = useMemo(() => {
    const startTime = performance.now();

    if (!enablePerformanceOptimizations || selectedMusicians.length < 100) {
      const result = formatPhoneNumbersFromObjects(
        selectedMusicians,
        formatOptions
      );
      return result;
    }

    // Process in chunks to avoid blocking the main thread
    const chunks = chunkArray(selectedMusicians, chunkSize);
    let combinedResult = '';

    chunks.forEach((chunk, index) => {
      const chunkFormatted = formatPhoneNumbersFromObjects(chunk, {
        ...formatOptions,
        separator:
          index === chunks.length - 1 ? '' : formatOptions.separator || ', ',
      });

      if (chunkFormatted) {
        combinedResult +=
          (combinedResult && index > 0 ? formatOptions.separator || ', ' : '') +
          chunkFormatted;
      }
    });

    // Check clipboard size limit
    if (combinedResult.length > maxClipboardSize) {
      console.warn(
        `Clipboard content exceeds maximum size (${combinedResult.length} > ${maxClipboardSize})`
      );
      // Truncate with warning
      const truncated =
        combinedResult.substring(0, maxClipboardSize - 3) + '...';
      toast.showCopyError(
        'Content truncated',
        `Selection too large, truncated to ${maxClipboardSize} characters`
      );
      return truncated;
    }

    if (enablePerformanceMonitoring) {
      console.log(
        `Formatting took ${performance.now() - startTime}ms for ${selectedMusicians.length} musicians`
      );
    }

    return combinedResult;
  }, [
    selectedMusicians,
    formatOptions,
    enablePerformanceOptimizations,
    chunkSize,
    maxClipboardSize,
    toast,
    enablePerformanceMonitoring,
  ]);

  /**
   * Optimized stats calculation with caching
   */
  const phoneStats = useMemo((): PhoneClipboardStatsOptimized => {
    const startTime = performance.now();
    const phones = selectedMusicians.map(m => m.phone);
    const stats = getPhoneFormatStats(phones);
    const processingTime = performance.now() - startTime;

    const result = {
      totalSelected: selectedMusicians.length,
      validPhones: stats.valid,
      invalidPhones: stats.invalid,
      validPercentage: stats.validPercentage,
      processingTime: enablePerformanceMonitoring ? processingTime : undefined,
      chunkCount: enablePerformanceOptimizations
        ? Math.ceil(selectedMusicians.length / chunkSize)
        : undefined,
      memoryUsage: enablePerformanceMonitoring ? getMemoryUsage() : undefined,
    };

    return result;
  }, [
    selectedMusicians,
    chunkSize,
    enablePerformanceOptimizations,
    enablePerformanceMonitoring,
  ]);

  // Refs for auto-update optimization
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdatedRef = useRef<string>('');
  const lastSelectionSizeRef = useRef<number>(0);

  /**
   * Optimized auto-update with intelligent debouncing
   */
  useEffect(() => {
    if (!autoUpdateClipboard || !clipboard.isSupported) {
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Skip if below minimum threshold
    if (selectedMusicians.length < autoUpdateMinSelection) {
      return;
    }

    // Skip if no valid phones
    if (!formattedPhoneNumbers || phoneStats.validPhones === 0) {
      return;
    }

    // Skip if content hasn't changed
    if (lastUpdatedRef.current === formattedPhoneNumbers) {
      return;
    }

    // Adaptive debouncing based on selection size
    const adaptiveDebounce =
      selectedMusicians.length > 100
        ? autoUpdateDebounce * 2 // Longer debounce for large selections
        : autoUpdateDebounce;

    // Skip rapid successive changes of similar size (likely bulk operations)
    const sizeDelta = Math.abs(
      selectedMusicians.length - lastSelectionSizeRef.current
    );
    if (sizeDelta > 10 && selectedMusicians.length > 50) {
      return; // Skip during bulk selection changes
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await clipboard.copyToClipboard(formattedPhoneNumbers);
        if (success) {
          lastUpdatedRef.current = formattedPhoneNumbers;
          lastSelectionSizeRef.current = selectedMusicians.length;

          // Show subtle notification for auto-updates
          toast.showToast({
            ...ClipboardToastVariants.copySuccess(
              phoneStats.validPhones,
              formattedPhoneNumbers
            ),
            duration: 2000,
            animation: 'fade',
          });
        }
      } catch (error) {
        // Silent fail for auto-updates
        if (enablePerformanceMonitoring) {
          console.warn('Auto-update clipboard failed:', error);
        }

        const clipboardError = clipboard.detailedError;
        if (
          clipboardError &&
          (clipboardError.type === ClipboardErrorType.PERMISSION_DENIED ||
            clipboardError.type === ClipboardErrorType.NOT_SUPPORTED)
        ) {
          if (clipboardError.type === ClipboardErrorType.PERMISSION_DENIED) {
            toast.showPermissionDenied();
          } else {
            toast.showNotSupported();
          }
        }
      }
    }, adaptiveDebounce);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    autoUpdateClipboard,
    selectedMusicians.length,
    autoUpdateMinSelection,
    formattedPhoneNumbers,
    phoneStats.validPhones,
    autoUpdateDebounce,
    clipboard,
    toast,
    enablePerformanceMonitoring,
  ]);

  /**
   * Optimized copy operation with performance monitoring and chunked processing
   */
  const copyPhoneNumbers = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    phoneCount: number;
    performanceMetrics?: PerformanceMetrics;
  }> => {
    const totalStartTime = performance.now();
    performanceStartRef.current = totalStartTime;

    let metrics: Partial<PerformanceMetrics> = {};

    if (enablePerformanceMonitoring) {
      metrics.memoryBefore = getMemoryUsage();
    }

    // Validation with timing
    const validationStart = performance.now();

    if (selectedMusicians.length === 0) {
      toast.showCopyError(
        'No musicians selected',
        'Please select some musicians first'
      );
      return {
        success: false,
        message: 'No musicians selected',
        phoneCount: 0,
      };
    }

    if (!formattedPhoneNumbers) {
      toast.showCopyError(
        'No valid phone numbers found',
        "Selected musicians don't have valid phone numbers"
      );
      return {
        success: false,
        message: 'No valid phone numbers found in selection',
        phoneCount: 0,
      };
    }

    if (enablePerformanceMonitoring) {
      metrics.selectionTime = performance.now() - validationStart;
    }

    // Show loading toast
    toast.showCopyLoading();

    try {
      // Format with timing
      const formatStart = performance.now();
      const finalContent = formattedPhoneNumbers;

      if (enablePerformanceMonitoring) {
        metrics.formattingTime = performance.now() - formatStart;
        metrics.chunkCount = Math.ceil(selectedMusicians.length / chunkSize);
        metrics.phoneCount = phoneStats.validPhones;
      }

      // Clipboard operation with timing
      const clipboardStart = performance.now();
      const success = await clipboard.copyToClipboard(finalContent);

      if (enablePerformanceMonitoring) {
        metrics.clipboardTime = performance.now() - clipboardStart;
        metrics.totalTime = performance.now() - totalStartTime;
        metrics.memoryAfter = getMemoryUsage();
      }

      if (success) {
        const phoneCount = phoneStats.validPhones;

        // Show success toast
        toast.showCopySuccess(phoneCount, finalContent);

        // Auto-clear selection if enabled
        if (autoClearSelection && clearSelection) {
          // Use startTransition for non-urgent state update
          startTransition(() => {
            clearSelection();
          });
        }

        // Update performance metrics
        if (enablePerformanceMonitoring) {
          const completeMetrics = metrics as PerformanceMetrics;
          setPerformanceMetrics(completeMetrics);

          console.log('Clipboard operation performance:', {
            totalTime: `${completeMetrics.totalTime.toFixed(2)}ms`,
            selectionTime: `${completeMetrics.selectionTime.toFixed(2)}ms`,
            formattingTime: `${completeMetrics.formattingTime.toFixed(2)}ms`,
            clipboardTime: `${completeMetrics.clipboardTime.toFixed(2)}ms`,
            phoneCount: completeMetrics.phoneCount,
            chunkCount: completeMetrics.chunkCount,
            memoryDelta: `${(completeMetrics.memoryAfter - completeMetrics.memoryBefore).toFixed(2)}MB`,
          });
        }

        return {
          success: true,
          message: successMessage(phoneCount),
          phoneCount,
          performanceMetrics: enablePerformanceMonitoring
            ? (metrics as PerformanceMetrics)
            : undefined,
        };
      } else {
        // Handle clipboard failure
        const error = clipboard.detailedError;
        if (error) {
          switch (error.type) {
            case ClipboardErrorType.PERMISSION_DENIED:
              toast.showPermissionDenied();
              break;
            case ClipboardErrorType.NOT_SUPPORTED:
              toast.showNotSupported();
              break;
            default:
              toast.showCopyError(error.message, error.suggestedAction);
          }
        } else {
          toast.showCopyError('Copy operation failed', 'Please try again');
        }

        return {
          success: false,
          message: clipboard.error || 'Failed to copy to clipboard',
          phoneCount: 0,
          performanceMetrics: enablePerformanceMonitoring
            ? (metrics as PerformanceMetrics)
            : undefined,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast.showCopyError(errorMessage, 'Please try again or copy manually');

      return {
        success: false,
        message: errorMessage,
        phoneCount: 0,
        performanceMetrics: enablePerformanceMonitoring
          ? (metrics as PerformanceMetrics)
          : undefined,
      };
    }
  }, [
    selectedMusicians.length,
    formattedPhoneNumbers,
    phoneStats.validPhones,
    clipboard,
    autoClearSelection,
    clearSelection,
    successMessage,
    toast,
    enablePerformanceMonitoring,
    chunkSize,
  ]);

  /**
   * Optimized canCopy calculation
   */
  const canCopy = useMemo(() => {
    return (
      selectedMusicians.length > 0 &&
      phoneStats.validPhones > 0 &&
      !clipboard.isLoading &&
      formattedPhoneNumbers.length <= maxClipboardSize
    );
  }, [
    selectedMusicians.length,
    phoneStats.validPhones,
    clipboard.isLoading,
    formattedPhoneNumbers.length,
    maxClipboardSize,
  ]);

  /**
   * Optimized preview with truncation for large content
   */
  const getPreview = useCallback(
    (maxLength: number = 100): string => {
      if (!formattedPhoneNumbers) return '';

      if (formattedPhoneNumbers.length <= maxLength) {
        return formattedPhoneNumbers;
      }

      return `${formattedPhoneNumbers.substring(0, maxLength - 3)}...`;
    },
    [formattedPhoneNumbers]
  );

  /**
   * Get performance insights for debugging
   */
  const getPerformanceInsights = useCallback(() => {
    if (!enablePerformanceMonitoring) {
      return null;
    }

    return {
      ...performanceMetrics,
      selectionSize: selectedMusicians.length,
      isLargeDataset: selectedMusicians.length > 100,
      shouldUseChunking:
        enablePerformanceOptimizations && selectedMusicians.length > chunkSize,
      memoryPressure: performanceMetrics
        ? performanceMetrics.memoryAfter - performanceMetrics.memoryBefore
        : 0,
    };
  }, [
    performanceMetrics,
    selectedMusicians.length,
    enablePerformanceOptimizations,
    chunkSize,
    enablePerformanceMonitoring,
  ]);

  return {
    // Main actions
    copyPhoneNumbers,

    // Data
    selectedMusicians,
    formattedPhoneNumbers,
    phoneStats,

    // State
    canCopy,
    isLoading: clipboard.isLoading,
    error: clipboard.error,
    isSupported: clipboard.isSupported,
    isAutoUpdateEnabled: autoUpdateClipboard,
    lastAutoUpdated: lastUpdatedRef.current,

    // Performance optimizations
    performanceMetrics,
    getPerformanceInsights,
    isOptimized: enablePerformanceOptimizations,

    // Toast integration
    toast: {
      isVisible: toast.isVisible,
      showCopyLoading: toast.showCopyLoading,
      showCopySuccess: toast.showCopySuccess,
      showCopyError: toast.showCopyError,
      hideToast: toast.hideToast,
    },

    // Utilities
    getPreview,
    clearError: clipboard.clearError,
    reset: clipboard.reset,
  };
}

// Utility functions for performance optimization

/**
 * Process array in chunks to avoid blocking the main thread
 */
function processInChunks<T, R>(
  array: T[],
  chunkSize: number,
  processor: (chunk: T[]) => R[]
): R[] {
  const result: R[] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(...processor(chunk));
  }

  return result;
}

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Get approximate memory usage (if available)
 */
function getMemoryUsage(): number {
  if ('memory' in performance && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
  }
  return 0;
}
