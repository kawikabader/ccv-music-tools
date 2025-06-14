import React, { useMemo } from 'react';
import { MusicianList } from './MusicianList';
import { VirtualizedMusicianList } from './VirtualizedMusicianList';
import { useVirtualization, useAdaptiveItemHeight, useDynamicListHeight } from '../../hooks/useVirtualization';
import { useMusicians } from '../../hooks/useMusicians';

interface AdaptiveMusicianListProps {
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  isSelected?: (id: string) => boolean;
  /** Override automatic virtualization decision */
  forceVirtualization?: boolean;
  /** Custom virtualization threshold */
  virtualizationThreshold?: number;
  /** Performance mode: 'auto' | 'performance' | 'accessibility' */
  mode?: 'auto' | 'performance' | 'accessibility';
}

/**
 * Performance Modes:
 * - auto: Automatically decide based on device capabilities and dataset size
 * - performance: Always prefer performance optimizations (virtualization)
 * - accessibility: Always prefer accessibility (no virtualization)
 */

export function AdaptiveMusicianList(props: AdaptiveMusicianListProps = {}) {
  const {
    selectedIds = new Set(),
    onToggleSelection,
    isSelected,
    forceVirtualization,
    virtualizationThreshold = 50,
    mode = 'auto',
  } = props;

  const { musicians } = useMusicians();

  // Configure virtualization based on mode and props
  const virtualizationConfig = useMemo(() => {
    const baseConfig = {
      threshold: virtualizationThreshold,
      forceVirtualization: forceVirtualization || false,
    };

    switch (mode) {
      case 'performance':
        return {
          ...baseConfig,
          threshold: Math.min(virtualizationThreshold, 25), // Lower threshold for performance mode
          forceVirtualization: true,
          respectMotionPreference: false,
        };
      case 'accessibility':
        return {
          ...baseConfig,
          forceVirtualization: false,
          respectMotionPreference: true,
          threshold: Number.MAX_SAFE_INTEGER, // Effectively disable auto-virtualization
        };
      case 'auto':
      default:
        return {
          ...baseConfig,
          respectMotionPreference: true,
        };
    }
  }, [virtualizationThreshold, forceVirtualization, mode]);

  // Use virtualization hook to determine rendering strategy
  const {
    shouldVirtualize,
    config,
    metrics,
    updateConfig,
    reevaluate,
  } = useVirtualization(musicians.length, virtualizationConfig);

  // Use adaptive item height based on device capabilities
  const itemHeight = useAdaptiveItemHeight(
    config.itemHeight,
    metrics.isLowPowerDevice
  );

  // Use dynamic list height based on content and viewport
  const listHeight = useDynamicListHeight(
    config.listHeight,
    200, // min height
    musicians.length,
    itemHeight
  );

  // Debug info for development (can be removed in production)
  const debugInfo = useMemo(() => ({
    shouldVirtualize,
    itemCount: musicians.length,
    threshold: config.threshold,
    mode,
    metrics: {
      isLowPowerDevice: metrics.isLowPowerDevice,
      prefersReducedMotion: metrics.prefersReducedMotion,
      memoryUsage: `${metrics.memoryUsage.toFixed(2)}MB`,
      renderTime: `${metrics.renderTime.toFixed(2)}ms`,
    },
    config: {
      itemHeight,
      listHeight,
      overscan: config.overscan,
    },
  }), [shouldVirtualize, musicians.length, config, mode, metrics, itemHeight, listHeight]);

  // Log debug info in development
  if (process.env.NODE_ENV === 'development') {
    // Debug info available in React DevTools
  }

  // Render appropriate component based on virtualization decision
  if (shouldVirtualize) {
    return (
      <div className="adaptive-musician-list virtualized">
        {/* Debug info banner in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Virtualized Rendering</strong> - {musicians.length} items, {mode} mode
                  {metrics.isLowPowerDevice && ' (Low-power device detected)'}
                </p>
              </div>
            </div>
          </div>
        )}

        <VirtualizedMusicianList
          selectedIds={selectedIds}
          onToggleSelection={onToggleSelection}
          isSelected={isSelected}
          itemHeight={itemHeight}
          listHeight={listHeight}
          overscan={config.overscan}
        />
      </div>
    );
  }

  return (
    <div className="adaptive-musician-list standard">
      {/* Debug info banner in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Standard Rendering</strong> - {musicians.length} items, {mode} mode
                {metrics.prefersReducedMotion && ' (Reduced motion preferred)'}
              </p>
            </div>
          </div>
        </div>
      )}

      <MusicianList
        selectedIds={selectedIds}
        onToggleSelection={onToggleSelection}
        isSelected={isSelected}
      />
    </div>
  );
}

/**
 * Hook to provide performance controls for the adaptive musician list
 */
export function useAdaptiveMusicianListControls() {
  const { musicians } = useMusicians();

  const {
    shouldVirtualize,
    config,
    metrics,
    updateConfig,
    reevaluate,
  } = useVirtualization(musicians.length);

  return {
    // Current state
    currentStrategy: shouldVirtualize ? 'virtualized' : 'standard',
    itemCount: musicians.length,
    metrics,

    // Controls
    forceVirtualization: () => updateConfig({ forceVirtualization: true }),
    disableVirtualization: () => updateConfig({ forceVirtualization: false, threshold: Number.MAX_SAFE_INTEGER }),
    resetToAuto: () => updateConfig({ forceVirtualization: false, threshold: 50 }),
    setThreshold: (threshold: number) => updateConfig({ threshold }),
    reevaluate,

    // Configuration
    config,
    updateConfig,
  };
} 