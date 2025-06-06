import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useMultiSelect } from './useMultiSelect';

describe('useMultiSelect', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useMultiSelect());

    expect(result.current.selectedIds).toEqual(new Set());
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.getSelectedIds()).toEqual([]);
  });

  describe('toggleSelection', () => {
    it('should add item to selection when not selected', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.selectedIds.has('item1')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.getSelectedIds()).toEqual(['item1']);
    });

    it('should remove item from selection when already selected', () => {
      const { result } = renderHook(() => useMultiSelect());

      // First add the item
      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.selectedIds.has('item1')).toBe(true);

      // Then remove it
      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.selectedIds.has('item1')).toBe(false);
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.getSelectedIds()).toEqual([]);
    });

    it('should handle multiple items correctly', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
        result.current.toggleSelection('item3');
      });

      expect(result.current.selectedCount).toBe(3);
      expect(result.current.selectedIds.has('item1')).toBe(true);
      expect(result.current.selectedIds.has('item2')).toBe(true);
      expect(result.current.selectedIds.has('item3')).toBe(true);
      expect(result.current.getSelectedIds()).toEqual([
        'item1',
        'item2',
        'item3',
      ]);
    });

    it('should handle toggle operations in any order', () => {
      const { result } = renderHook(() => useMultiSelect());

      // Add items
      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
        result.current.toggleSelection('item3');
      });

      // Remove middle item
      act(() => {
        result.current.toggleSelection('item2');
      });

      expect(result.current.selectedCount).toBe(2);
      expect(result.current.selectedIds.has('item1')).toBe(true);
      expect(result.current.selectedIds.has('item2')).toBe(false);
      expect(result.current.selectedIds.has('item3')).toBe(true);
      expect(result.current.getSelectedIds()).toEqual(['item1', 'item3']);
    });
  });

  describe('isSelected', () => {
    it('should return false for unselected items', () => {
      const { result } = renderHook(() => useMultiSelect());

      expect(result.current.isSelected('item1')).toBe(false);
      expect(result.current.isSelected('nonexistent')).toBe(false);
    });

    it('should return true for selected items', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.isSelected('item1')).toBe(true);
      expect(result.current.isSelected('item2')).toBe(false);
    });

    it('should be reactive to selection changes', () => {
      const { result } = renderHook(() => useMultiSelect());

      // Initially not selected
      expect(result.current.isSelected('item1')).toBe(false);

      // Add to selection
      act(() => {
        result.current.toggleSelection('item1');
      });
      expect(result.current.isSelected('item1')).toBe(true);

      // Remove from selection
      act(() => {
        result.current.toggleSelection('item1');
      });
      expect(result.current.isSelected('item1')).toBe(false);
    });
  });

  describe('clearSelection', () => {
    it('should clear empty selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIds).toEqual(new Set());
      expect(result.current.selectedCount).toBe(0);
    });

    it('should clear selection with single item', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.selectedCount).toBe(1);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIds).toEqual(new Set());
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.getSelectedIds()).toEqual([]);
    });

    it('should clear selection with multiple items', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
        result.current.toggleSelection('item3');
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIds).toEqual(new Set());
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.getSelectedIds()).toEqual([]);
    });

    it('should make all items unselected after clearing', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.isSelected('item1')).toBe(false);
      expect(result.current.isSelected('item2')).toBe(false);
    });
  });

  describe('getSelectedIds', () => {
    it('should return empty array for empty selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      expect(result.current.getSelectedIds()).toEqual([]);
    });

    it('should return array with single item', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.getSelectedIds()).toEqual(['item1']);
    });

    it('should return array with multiple items in order added', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item3');
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
      });

      expect(result.current.getSelectedIds()).toEqual([
        'item3',
        'item1',
        'item2',
      ]);
    });

    it('should return new array on each call (immutability)', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
      });

      const firstCall = result.current.getSelectedIds();
      const secondCall = result.current.getSelectedIds();

      expect(firstCall).toEqual(secondCall);
      expect(firstCall).not.toBe(secondCall); // Different references
    });
  });

  describe('selectedCount', () => {
    it('should be 0 initially', () => {
      const { result } = renderHook(() => useMultiSelect());

      expect(result.current.selectedCount).toBe(0);
    });

    it('should increment when items are added', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
      });
      expect(result.current.selectedCount).toBe(1);

      act(() => {
        result.current.toggleSelection('item2');
      });
      expect(result.current.selectedCount).toBe(2);

      act(() => {
        result.current.toggleSelection('item3');
      });
      expect(result.current.selectedCount).toBe(3);
    });

    it('should decrement when items are removed', () => {
      const { result } = renderHook(() => useMultiSelect());

      // Add multiple items
      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
        result.current.toggleSelection('item3');
      });
      expect(result.current.selectedCount).toBe(3);

      // Remove one item
      act(() => {
        result.current.toggleSelection('item2');
      });
      expect(result.current.selectedCount).toBe(2);

      // Remove another item
      act(() => {
        result.current.toggleSelection('item1');
      });
      expect(result.current.selectedCount).toBe(1);
    });

    it('should be 0 after clearing', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
      });
      expect(result.current.selectedCount).toBe(2);

      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedCount).toBe(0);
    });
  });

  describe('selectedIds', () => {
    it('should be a Set instance', () => {
      const { result } = renderHook(() => useMultiSelect());

      expect(result.current.selectedIds).toBeInstanceOf(Set);
    });

    it('should maintain Set properties', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
      });

      expect(result.current.selectedIds.size).toBe(2);
      expect(result.current.selectedIds.has('item1')).toBe(true);
      expect(result.current.selectedIds.has('item2')).toBe(true);
      expect(result.current.selectedIds.has('item3')).toBe(false);
    });

    it('should not allow duplicate selections', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item1'); // Try to add same item
      });

      expect(result.current.selectedCount).toBe(0); // Should be toggled off
      expect(result.current.selectedIds.has('item1')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string IDs', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('');
      });

      expect(result.current.isSelected('')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.getSelectedIds()).toEqual(['']);
    });

    it('should handle numeric string IDs', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggleSelection('123');
        result.current.toggleSelection('456');
      });

      expect(result.current.isSelected('123')).toBe(true);
      expect(result.current.isSelected('456')).toBe(true);
      expect(result.current.selectedCount).toBe(2);
    });

    it('should handle special character IDs', () => {
      const { result } = renderHook(() => useMultiSelect());

      const specialIds = ['item-1', 'item_2', 'item.3', 'item@4', 'item#5'];

      act(() => {
        specialIds.forEach(id => result.current.toggleSelection(id));
      });

      specialIds.forEach(id => {
        expect(result.current.isSelected(id)).toBe(true);
      });
      expect(result.current.selectedCount).toBe(specialIds.length);
    });

    it('should handle very long IDs', () => {
      const { result } = renderHook(() => useMultiSelect());

      const longId = 'a'.repeat(1000);

      act(() => {
        result.current.toggleSelection(longId);
      });

      expect(result.current.isSelected(longId)).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });

    it('should handle rapid successive operations', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        // Rapid add/remove operations
        for (let i = 0; i < 100; i++) {
          result.current.toggleSelection(`item${i}`);
        }
      });

      expect(result.current.selectedCount).toBe(100);

      act(() => {
        // Clear and rapid re-add
        result.current.clearSelection();
        for (let i = 0; i < 50; i++) {
          result.current.toggleSelection(`newitem${i}`);
        }
      });

      expect(result.current.selectedCount).toBe(50);
    });
  });

  describe('function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useMultiSelect());

      const initialToggle = result.current.toggleSelection;
      const initialIsSelected = result.current.isSelected;
      const initialClear = result.current.clearSelection;
      const initialGetIds = result.current.getSelectedIds;

      // Force rerender
      rerender();

      expect(result.current.toggleSelection).toBe(initialToggle);
      expect(result.current.isSelected).toBe(initialIsSelected);
      expect(result.current.clearSelection).toBe(initialClear);
      expect(result.current.getSelectedIds).toBe(initialGetIds);
    });

    it('should maintain function stability across state changes', () => {
      const { result } = renderHook(() => useMultiSelect());

      const initialFunctions = {
        toggleSelection: result.current.toggleSelection,
        isSelected: result.current.isSelected,
        clearSelection: result.current.clearSelection,
        getSelectedIds: result.current.getSelectedIds,
      };

      // Change state
      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.toggleSelection).toBe(
        initialFunctions.toggleSelection
      );
      expect(result.current.isSelected).toBe(initialFunctions.isSelected);
      expect(result.current.clearSelection).toBe(
        initialFunctions.clearSelection
      );
      expect(result.current.getSelectedIds).toBe(
        initialFunctions.getSelectedIds
      );
    });
  });
});
