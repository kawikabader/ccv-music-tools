import React, { useMemo, useCallback, useState } from 'react';
import { useProgressiveMusicianLoading } from '../../hooks/useProgressiveLoading';
import type { LoadingStrategy, Musician } from '../../hooks/useProgressiveLoading';

/**
 * Simplified UI components for the demo
 */
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => (
  <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
    } ${className}`} />
);

const Button: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled = false, variant = 'primary', size = 'md', className = '', children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
      } ${size === 'sm' ? 'px-3 py-1.5 text-sm' :
        size === 'lg' ? 'px-6 py-3 text-lg' :
          'px-4 py-2 text-base'
      } ${className}`}
  >
    {children}
  </button>
);

const ErrorMessage: React.FC<{
  message: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning'
}> = ({ message, onRetry, variant = 'error' }) => (
  <div className={`rounded-lg p-4 ${variant === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'
    }`}>
    <p className="text-sm">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} size="sm" className="mt-2">
        Retry
      </Button>
    )}
  </div>
);

const MusicianCard: React.FC<{
  musician: Musician;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit?: (id: string) => void;
}> = ({ musician, isSelected, onSelect, onEdit }) => (
  <div className={`p-4 rounded-lg border transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
    <div className="flex items-center space-x-4">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(musician.id, e.target.checked)}
        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{musician.name}</h3>
        <p className="text-sm text-gray-500">{musician.instrument}</p>
        <p className="text-sm text-gray-600">{musician.phone}</p>
      </div>
      {onEdit && (
        <Button onClick={() => onEdit(musician.id)} size="sm" variant="outline">
          Edit
        </Button>
      )}
    </div>
  </div>
);

/**
 * Progressive loading controls
 */
interface ProgressiveLoadingControls {
  strategy: LoadingStrategy;
  batchSize: number;
  enableInfiniteScroll: boolean;
  showLoadMore: boolean;
  showPagination: boolean;
}

/**
 * Progressive musician list props
 */
interface ProgressiveMusicianListProps {
  searchTerm?: string;
  selectedMusicianIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onMusicianEdit?: (musicianId: string) => void;
  controls?: Partial<ProgressiveLoadingControls>;
  className?: string;
}

/**
 * Default controls configuration
 */
const DEFAULT_CONTROLS: ProgressiveLoadingControls = {
  strategy: 'hybrid',
  batchSize: 25,
  enableInfiniteScroll: true,
  showLoadMore: true,
  showPagination: false,
};

/**
 * Loading skeleton component
 */
const LoadingSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-20"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Load more button component
 */
const LoadMoreButton: React.FC<{
  onLoadMore: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  itemsCount: number;
  totalItems: number;
}> = ({ onLoadMore, hasNextPage, isLoading, itemsCount, totalItems }) => {
  if (!hasNextPage) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>All {totalItems} musicians loaded</p>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Loading more...
          </>
        ) : (
          <>
            Load More ({itemsCount} of {totalItems})
          </>
        )}
      </Button>
    </div>
  );
};

/**
 * Pagination component
 */
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}> = ({ currentPage, totalPages, onPageChange, isLoading }) => {
  const visiblePages = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 py-6">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        variant="outline"
        size="sm"
      >
        Previous
      </Button>

      {visiblePages[0] > 1 && (
        <>
          <Button
            onClick={() => onPageChange(1)}
            disabled={isLoading}
            variant={currentPage === 1 ? 'primary' : 'outline'}
            size="sm"
          >
            1
          </Button>
          {visiblePages[0] > 2 && <span className="px-2">...</span>}
        </>
      )}

      {visiblePages.map(page => (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={isLoading}
          variant={currentPage === page ? 'primary' : 'outline'}
          size="sm"
        >
          {page}
        </Button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2">...</span>
          )}
          <Button
            onClick={() => onPageChange(totalPages)}
            disabled={isLoading}
            variant={currentPage === totalPages ? 'primary' : 'outline'}
            size="sm"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        variant="outline"
        size="sm"
      >
        Next
      </Button>
    </div>
  );
};

/**
 * Progressive loading stats component
 */
const LoadingStats: React.FC<{
  itemsCount: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  cacheStats: { entries: number; size: number; hitRate: number };
  loadingState: string;
}> = ({ itemsCount, totalItems, currentPage, totalPages, cacheStats, loadingState }) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 text-sm">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <span className="text-gray-500 dark:text-gray-400">Items:</span>
        <span className="ml-2 font-medium">{itemsCount} / {totalItems}</span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Page:</span>
        <span className="ml-2 font-medium">{currentPage} / {totalPages}</span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Cache:</span>
        <span className="ml-2 font-medium">
          {cacheStats.entries} entries ({(cacheStats.hitRate * 100).toFixed(1)}% hit rate)
        </span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Status:</span>
        <span className={`ml-2 font-medium ${loadingState === 'loading' ? 'text-blue-600' :
          loadingState === 'error' ? 'text-red-600' :
            loadingState === 'complete' ? 'text-green-600' :
              'text-gray-600'
          }`}>
          {loadingState}
        </span>
      </div>
    </div>
  </div>
);

/**
 * Progressive musician list component
 */
export const ProgressiveMusicianList: React.FC<ProgressiveMusicianListProps> = ({
  searchTerm = '',
  selectedMusicianIds = new Set(),
  onSelectionChange,
  onMusicianEdit,
  controls: controlsOverride = {},
  className = '',
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const controls = { ...DEFAULT_CONTROLS, ...controlsOverride };

  // Progressive loading hook
  const {
    items: musicians,
    totalItems,
    currentPage,
    totalPages,
    hasNextPage,
    loadingState,
    error,
    isLoading,
    isLoadingMore,
    loadNextPage,
    loadPage,
    refresh,
    reset,
    infiniteScrollRef,
    clearCache,
    getCacheStats,
  } = useProgressiveMusicianLoading(searchTerm, {
    strategy: controls.strategy,
    batchSize: controls.batchSize,
    infiniteScrollThreshold: 200,
    enableCaching: true,
    preloadFirst: true,
  });

  // Selection handlers
  const handleMusicianSelect = useCallback((musicianId: string, selected: boolean) => {
    if (!onSelectionChange) return;

    const newSelection = new Set(selectedMusicianIds);
    if (selected) {
      newSelection.add(musicianId);
    } else {
      newSelection.delete(musicianId);
    }
    onSelectionChange(newSelection);
  }, [selectedMusicianIds, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const allIds = new Set(musicians.map((m: Musician) => m.id));
    onSelectionChange(allIds);
  }, [musicians, onSelectionChange]);

  const handleDeselectAll = useCallback(() => {
    if (!onSelectionChange) return;
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  // Cache stats for debug info
  const cacheStats = getCacheStats();

  // Handle search term changes
  React.useEffect(() => {
    reset();
  }, [searchTerm, reset]);

  // Render loading state
  if (loadingState === 'loading' && musicians.length === 0) {
    return (
      <div className={className}>
        <LoadingSkeleton count={controls.batchSize} />
      </div>
    );
  }

  // Render error state
  if (loadingState === 'error' && musicians.length === 0) {
    return (
      <div className={className}>
        <ErrorMessage
          message={error || 'Failed to load musicians'}
          onRetry={refresh}
        />
      </div>
    );
  }

  // Render empty state
  if (musicians.length === 0 && loadingState !== 'loading') {
    return (
      <div className={`${className} text-center py-12`}>
        <p className="text-gray-500 dark:text-gray-400">
          {searchTerm ? `No musicians found for "${searchTerm}"` : 'No musicians found'}
        </p>
        <Button onClick={refresh} variant="outline" className="mt-4">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Debug info toggle (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4">
          <Button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            variant="outline"
            size="sm"
          >
            {showDebugInfo ? 'Hide' : 'Show'} Debug Info
          </Button>
        </div>
      )}

      {/* Debug info */}
      {showDebugInfo && (
        <LoadingStats
          itemsCount={musicians.length}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          cacheStats={cacheStats}
          loadingState={loadingState}
        />
      )}

      {/* Selection controls */}
      {musicians.length > 0 && onSelectionChange && (
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedMusicianIds.size} of {musicians.length} selected
            {totalItems > musicians.length && ` (${totalItems} total)`}
          </div>
          <div className="space-x-2">
            <Button
              onClick={handleSelectAll}
              size="sm"
              variant="outline"
              disabled={selectedMusicianIds.size === musicians.length}
            >
              Select All Visible
            </Button>
            <Button
              onClick={handleDeselectAll}
              size="sm"
              variant="outline"
              disabled={selectedMusicianIds.size === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Musician list */}
      <div
        ref={controls.enableInfiniteScroll ? infiniteScrollRef : undefined}
        className="space-y-3 max-h-[600px] overflow-y-auto"
      >
        {musicians.map((musician: Musician) => (
          <MusicianCard
            key={musician.id}
            musician={musician}
            isSelected={selectedMusicianIds.has(musician.id)}
            onSelect={handleMusicianSelect}
            onEdit={onMusicianEdit}
          />
        ))}

        {/* Loading more indicator for infinite scroll */}
        {isLoadingMore && controls.enableInfiniteScroll && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>

      {/* Load more button */}
      {controls.showLoadMore && !controls.enableInfiniteScroll && (
        <LoadMoreButton
          onLoadMore={loadNextPage}
          hasNextPage={hasNextPage}
          isLoading={isLoadingMore}
          itemsCount={musicians.length}
          totalItems={totalItems}
        />
      )}

      {/* Pagination */}
      {controls.showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={loadPage}
          isLoading={isLoading}
        />
      )}

      {/* Error message for load more failures */}
      {error && musicians.length > 0 && (
        <div className="mt-4">
          <ErrorMessage
            message={error}
            onRetry={() => loadNextPage()}
            variant="warning"
          />
        </div>
      )}

      {/* Cache management controls (development only) */}
      {process.env.NODE_ENV === 'development' && showDebugInfo && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium mb-2">Cache Management</h4>
          <div className="space-x-2">
            <Button onClick={clearCache} size="sm" variant="outline">
              Clear Cache
            </Button>
            <Button onClick={refresh} size="sm" variant="outline">
              Refresh Data
            </Button>
            <Button onClick={reset} size="sm" variant="outline">
              Reset List
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveMusicianList; 