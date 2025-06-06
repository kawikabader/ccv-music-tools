import { useState, useCallback } from 'react';

/**
 * Custom hook for managing multi-selection state
 * Used for selecting multiple musicians for phone number copying
 */
export function useMultiSelect() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Toggle selection state for a given ID
   * Adds ID if not selected, removes if already selected
   */
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  /**
   * Check if a given ID is currently selected
   */
  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Get array of selected IDs
   */
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  /**
   * Get count of selected items
   */
  const selectedCount = selectedIds.size;

  return {
    selectedIds: selectedIds,
    selectedCount,
    toggleSelection,
    isSelected,
    clearSelection,
    getSelectedIds,
  };
}
