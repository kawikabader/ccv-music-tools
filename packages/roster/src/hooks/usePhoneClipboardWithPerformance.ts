import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePhoneClipboard } from './usePhoneClipboard';
import {
  usePerformanceMonitor,
  useAsyncMeasurement,
} from './usePerformanceMonitor';
import type { Musician } from '../types/supabase';

/**
 * Enhanced phone clipboard hook with comprehensive performance monitoring
 * Tracks clipboard operations, selection changes, and performance metrics
 */
export function usePhoneClipboardWithPerformance(
  musicians: Musician[],
  selectedIds: Set<string>,
  options: {
    autoClearSelection?: boolean;
    autoUpdate?: boolean;
    enableToasts?: boolean;
    debounceMs?: number;
  } = {}
) {
  const performanceMonitor = usePerformanceMonitor({
    enableWarnings: true,
    collectMemoryMetrics: true,
    warningThresholds: {
      render: 16.67,
      clipboard: 200, // More lenient for clipboard operations
      selection: 100,
      virtualization: 20,
      memory: 100,
      interaction: 50,
    },
  });

  const { startMeasurement, endMeasurement, recordMeasurement } =
    performanceMonitor;
  const measureAsync = useAsyncMeasurement(performanceMonitor);

  // Use the base phone clipboard hook
  const baseClipboard = usePhoneClipboard(
    musicians,
    selectedIds,
    undefined,
    options
  );

  // Track selection changes
  const [previousSelectedIds, setPreviousSelectedIds] = useState(selectedIds);

  useEffect(() => {
    if (selectedIds !== previousSelectedIds) {
      const id = startMeasurement('selection', 'selection-change', {
        newSelectionSize: selectedIds.size,
        oldSelectionSize: previousSelectedIds.size,
        added: selectedIds.size - previousSelectedIds.size,
      });

      // Measure selection processing time
      setTimeout(() => {
        endMeasurement(id);
      }, 0);

      setPreviousSelectedIds(selectedIds);
    }
  }, [selectedIds, previousSelectedIds, startMeasurement, endMeasurement]);

  // Enhanced copy function with performance tracking
  const copyPhoneNumbers = useCallback(async () => {
    return measureAsync(
      'clipboard',
      'copy-multiple-phones',
      async () => {
        const startTime = performance.now();

        try {
          const result = await baseClipboard.copyPhoneNumbers();

          // Record additional metrics
          recordMeasurement(
            'clipboard',
            'format-phones',
            performance.now() - startTime,
            {
              phoneCount: result.phoneCount,
              success: result.success,
              selectionSize: selectedIds.size,
            }
          );

          return result;
        } catch (error) {
          recordMeasurement(
            'clipboard',
            'copy-error',
            performance.now() - startTime,
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              selectionSize: selectedIds.size,
            }
          );
          throw error;
        }
      },
      {
        phoneCount: baseClipboard.phoneStats.validPhones,
        selectionSize: selectedIds.size,
        formattedLength: baseClipboard.formattedPhoneNumbers.length,
      }
    );
  }, [measureAsync, baseClipboard, selectedIds.size, recordMeasurement]);

  // Performance-aware validation
  const validateSelection = useCallback(() => {
    const id = startMeasurement('selection', 'validate-selection', {
      totalMusicians: musicians.length,
      selectedCount: selectedIds.size,
    });

    const isValid =
      selectedIds.size > 0 && baseClipboard.phoneStats.validPhones > 0;

    endMeasurement(id);
    return isValid;
  }, [
    startMeasurement,
    endMeasurement,
    musicians.length,
    selectedIds.size,
    baseClipboard.phoneStats.validPhones,
  ]);

  // Performance-aware phone formatting
  const formatPhonesWithTracking = useCallback(() => {
    const id = startMeasurement('clipboard', 'format-phones', {
      phoneCount: baseClipboard.phoneStats.validPhones,
    });

    const formatted = baseClipboard.formattedPhoneNumbers;

    endMeasurement(id);
    return formatted;
  }, [
    startMeasurement,
    endMeasurement,
    baseClipboard.phoneStats.validPhones,
    baseClipboard.formattedPhoneNumbers,
  ]);

  // Performance statistics for the current operation
  const performanceStats = useMemo(() => {
    const stats = performanceMonitor.stats;
    return {
      clipboard: stats.clipboard,
      selection: stats.selection,
      currentMemoryUsage: performanceMonitor.currentMemoryUsage,
      recentAlerts: performanceMonitor.alerts.slice(-3),
      isEfficient:
        stats.clipboard.recentAverage < 100 &&
        stats.selection.recentAverage < 50,
    };
  }, [
    performanceMonitor.stats,
    performanceMonitor.currentMemoryUsage,
    performanceMonitor.alerts,
  ]);

  // Performance recommendations
  const recommendations = useMemo(() => {
    const suggestions: string[] = [];

    if (performanceStats.clipboard.recentAverage > 200) {
      suggestions.push(
        'Consider reducing the number of selected musicians for faster copying'
      );
    }

    if (performanceStats.selection.recentAverage > 100) {
      suggestions.push(
        'Selection changes are slow - consider using batch operations'
      );
    }

    if (performanceMonitor.currentMemoryUsage > 100) {
      suggestions.push(
        'High memory usage detected - consider clearing performance data'
      );
    }

    if (selectedIds.size > 100) {
      suggestions.push(
        'Large selection detected - virtualization is recommended'
      );
    }

    return suggestions;
  }, [
    performanceStats,
    performanceMonitor.currentMemoryUsage,
    selectedIds.size,
  ]);

  return {
    // Base functionality
    ...baseClipboard,

    // Enhanced functions with performance tracking
    copyPhoneNumbers,
    validateSelection,
    formatPhones: formatPhonesWithTracking,

    // Performance monitoring
    performanceMonitor,
    performanceStats,
    recommendations,

    // Utilities
    clearPerformanceData: performanceMonitor.clearMeasurements,
    exportPerformanceReport: performanceMonitor.exportData,

    // Development helpers
    measureOperation: measureAsync,
    startMeasurement,
    endMeasurement,
  };
}

/**
 * Hook for monitoring clipboard performance across the entire application
 */
export function useGlobalClipboardPerformance() {
  const performanceMonitor = usePerformanceMonitor({
    enableWarnings: true,
    collectMemoryMetrics: true,
    trackInteractions: true,
    statsInterval: 10000, // Check every 10 seconds
    warningThresholds: {
      render: 16.67,
      clipboard: 150,
      selection: 75,
      virtualization: 25,
      memory: 150,
      interaction: 100,
    },
  });

  // Track overall application health
  const applicationHealth = useMemo(() => {
    const { stats, currentMemoryUsage, alerts } = performanceMonitor;

    const recentErrors = alerts.filter(
      alert =>
        alert.severity === 'error' && Date.now() - alert.timestamp < 60000 // Last minute
    ).length;

    const avgPerformance =
      Object.values(stats).reduce((acc, stat) => acc + stat.recentAverage, 0) /
      Object.values(stats).length;

    let health: 'excellent' | 'good' | 'fair' | 'poor';
    if (recentErrors === 0 && avgPerformance < 50 && currentMemoryUsage < 100) {
      health = 'excellent';
    } else if (
      recentErrors <= 1 &&
      avgPerformance < 100 &&
      currentMemoryUsage < 200
    ) {
      health = 'good';
    } else if (
      recentErrors <= 3 &&
      avgPerformance < 200 &&
      currentMemoryUsage < 300
    ) {
      health = 'fair';
    } else {
      health = 'poor';
    }

    return {
      health,
      recentErrors,
      averagePerformance: avgPerformance,
      memoryUsage: currentMemoryUsage,
      totalMeasurements: Object.values(stats).reduce(
        (acc, stat) => acc + stat.totalMeasurements,
        0
      ),
    };
  }, [performanceMonitor]);

  return {
    performanceMonitor,
    applicationHealth,

    // Quick actions
    clearAllData: () => {
      performanceMonitor.clearMeasurements();
      performanceMonitor.clearAlerts();
    },

    // Export functions
    exportPerformanceReport: performanceMonitor.exportData,
  };
}
