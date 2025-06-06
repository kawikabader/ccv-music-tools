import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useClipboard } from './useClipboard';
import {
  formatPhoneNumbersFromObjects,
  getPhoneFormatStats,
  type PhoneFormatOptions,
} from '../utils/phoneFormatter';
import type { Musician } from '../types/supabase';

export interface UsePhoneClipboardOptions extends PhoneFormatOptions {
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
}

export interface PhoneClipboardStats {
  totalSelected: number;
  validPhones: number;
  invalidPhones: number;
  validPercentage: number;
}

/**
 * Custom hook that combines clipboard functionality with phone number formatting
 * Specifically designed for copying comma-separated phone numbers from selected musicians
 */
export function usePhoneClipboard(
  musicians: Musician[],
  selectedIds: Set<string>,
  clearSelection?: () => void,
  options: UsePhoneClipboardOptions = {}
) {
  const clipboard = useClipboard();

  const {
    autoClearSelection = false,
    successMessage = (count: number) =>
      `Copied ${count} phone number${count !== 1 ? 's' : ''} to clipboard`,
    autoUpdateClipboard = false,
    autoUpdateMinSelection = 1,
    autoUpdateDebounce = 300,
    ...formatOptions
  } = options;

  /**
   * Get selected musicians based on selectedIds
   */
  const selectedMusicians = useMemo(() => {
    return musicians.filter(musician => selectedIds.has(musician.id));
  }, [musicians, selectedIds]);

  /**
   * Get formatted phone numbers from selected musicians
   */
  const formattedPhoneNumbers = useMemo(() => {
    return formatPhoneNumbersFromObjects(selectedMusicians, formatOptions);
  }, [selectedMusicians, formatOptions]);

  /**
   * Get statistics about the phone numbers in current selection
   */
  const phoneStats = useMemo((): PhoneClipboardStats => {
    const phones = selectedMusicians.map(m => m.phone);
    const stats = getPhoneFormatStats(phones);

    return {
      totalSelected: selectedMusicians.length,
      validPhones: stats.valid,
      invalidPhones: stats.invalid,
      validPercentage: stats.validPercentage,
    };
  }, [selectedMusicians]);

  // Ref to track the debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdatedRef = useRef<string>('');

  /**
   * Auto-update clipboard when selection changes (if enabled)
   */
  useEffect(() => {
    if (!autoUpdateClipboard || !clipboard.isSupported) {
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Don't auto-update if below minimum selection threshold
    if (selectedMusicians.length < autoUpdateMinSelection) {
      return;
    }

    // Don't auto-update if no valid phone numbers
    if (!formattedPhoneNumbers || phoneStats.validPhones === 0) {
      return;
    }

    // Don't update if the formatted string hasn't changed
    if (lastUpdatedRef.current === formattedPhoneNumbers) {
      return;
    }

    // Debounce the clipboard update
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await clipboard.copyToClipboard(formattedPhoneNumbers);
        if (success) {
          lastUpdatedRef.current = formattedPhoneNumbers;
        }
      } catch (error) {
        // Silent fail for auto-updates to avoid spamming errors
        console.warn('Auto-update clipboard failed:', error);
      }
    }, autoUpdateDebounce);

    // Cleanup timeout on unmount
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
  ]);

  /**
   * Copy formatted phone numbers to clipboard
   * Returns success status and any error message
   */
  const copyPhoneNumbers = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    phoneCount: number;
  }> => {
    if (selectedMusicians.length === 0) {
      return {
        success: false,
        message: 'No musicians selected',
        phoneCount: 0,
      };
    }

    if (!formattedPhoneNumbers) {
      return {
        success: false,
        message: 'No valid phone numbers found in selection',
        phoneCount: 0,
      };
    }

    const success = await clipboard.copyToClipboard(formattedPhoneNumbers);

    if (success) {
      const phoneCount = phoneStats.validPhones;

      // Auto-clear selection if enabled
      if (autoClearSelection && clearSelection) {
        clearSelection();
      }

      return {
        success: true,
        message: successMessage(phoneCount),
        phoneCount,
      };
    } else {
      return {
        success: false,
        message: clipboard.error || 'Failed to copy to clipboard',
        phoneCount: 0,
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
  ]);

  /**
   * Check if copying is currently possible
   */
  const canCopy = useMemo(() => {
    return (
      selectedMusicians.length > 0 &&
      phoneStats.validPhones > 0 &&
      !clipboard.isLoading
    );
  }, [selectedMusicians.length, phoneStats.validPhones, clipboard.isLoading]);

  /**
   * Get preview of what will be copied
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

    // Utilities
    getPreview,
    clearError: clipboard.clearError,
    reset: clipboard.reset,
  };
}
