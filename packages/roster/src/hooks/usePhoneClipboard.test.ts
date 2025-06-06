import { renderHook, act, waitFor } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  afterEach,
} from 'vitest';
import { usePhoneClipboard } from './usePhoneClipboard';
import type { Musician } from '../types/supabase';

// Mock the dependencies
vi.mock('./useClipboard', () => ({
  useClipboard: vi.fn(),
}));

vi.mock('../utils/phoneFormatter', () => ({
  formatPhoneNumbersFromObjects: vi.fn(),
  getPhoneFormatStats: vi.fn(),
}));

vi.mock('../components/UI/ClipboardToast', () => ({
  useClipboardToast: vi.fn(),
  ClipboardToastVariants: {
    copySuccess: vi.fn((count, text) => ({
      type: 'copySuccess',
      count,
      text,
    })),
  },
}));

vi.mock('./useClipboardError', () => ({
  ClipboardErrorType: {
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    NOT_SUPPORTED: 'NOT_SUPPORTED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    GENERIC_ERROR: 'GENERIC_ERROR',
    SECURITY_ERROR: 'SECURITY_ERROR',
  },
}));

// Import mocked modules
import { useClipboard } from './useClipboard';
import {
  formatPhoneNumbersFromObjects,
  getPhoneFormatStats,
} from '../utils/phoneFormatter';
import {
  useClipboardToast,
  ClipboardToastVariants,
} from '../components/UI/ClipboardToast';

describe('usePhoneClipboard', () => {
  const mockClipboard = {
    copyToClipboard: vi.fn(),
    isSupported: true,
    isLoading: false,
    error: null,
    detailedError: null,
    clearError: vi.fn(),
    reset: vi.fn(),
  };

  const mockToast = {
    isVisible: false,
    showCopyLoading: vi.fn(),
    showCopySuccess: vi.fn(),
    showCopyError: vi.fn(),
    showPermissionDenied: vi.fn(),
    showNotSupported: vi.fn(),
    hideToast: vi.fn(),
    showToast: vi.fn(),
  };

  const sampleMusicians: Musician[] = [
    {
      id: '1',
      name: 'John Doe',
      phone: '555-123-4567',
      instrument: 'Guitar',
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '555-987-6543',
      instrument: 'Piano',
    },
    {
      id: '3',
      name: 'Bob Wilson',
      phone: null,
      instrument: 'Drums',
    },
    {
      id: '4',
      name: 'Alice Brown',
      phone: '123', // invalid
      instrument: 'Bass',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    (useClipboard as Mock).mockReturnValue(mockClipboard);
    (useClipboardToast as Mock).mockReturnValue(mockToast);
    (formatPhoneNumbersFromObjects as Mock).mockReturnValue(
      '+15551234567, +15559876543'
    );
    (getPhoneFormatStats as Mock).mockReturnValue({
      total: 4,
      valid: 2,
      invalid: 2,
      validPercentage: 50,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const selectedIds = new Set(['1', '2']);
      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      expect(result.current.selectedMusicians).toHaveLength(2);
      expect(result.current.formattedPhoneNumbers).toBe(
        '+15551234567, +15559876543'
      );
      expect(result.current.phoneStats).toEqual({
        totalSelected: 2,
        validPhones: 2,
        invalidPhones: 2,
        validPercentage: 50,
      });
      expect(result.current.canCopy).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSupported).toBe(true);
    });

    it('should handle empty selection', () => {
      const selectedIds = new Set<string>();
      (formatPhoneNumbersFromObjects as Mock).mockReturnValue('');
      (getPhoneFormatStats as Mock).mockReturnValue({
        total: 0,
        valid: 0,
        invalid: 0,
        validPercentage: 0,
      });

      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      expect(result.current.selectedMusicians).toHaveLength(0);
      expect(result.current.formattedPhoneNumbers).toBe('');
      expect(result.current.canCopy).toBe(false);
    });

    it('should apply format options to phone formatting', () => {
      const selectedIds = new Set(['1', '2']);
      const options = {
        includeCountryCode: false,
        separator: ' | ',
      };

      renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds, undefined, options)
      );

      expect(formatPhoneNumbersFromObjects).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' }),
        ]),
        expect.objectContaining({
          includeCountryCode: false,
          separator: ' | ',
        })
      );
    });
  });

  describe('copyPhoneNumbers', () => {
    it('should successfully copy phone numbers', async () => {
      const selectedIds = new Set(['1', '2']);
      mockClipboard.copyToClipboard.mockResolvedValue(true);

      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      let copyResult: any;
      await act(async () => {
        copyResult = await result.current.copyPhoneNumbers();
      });

      expect(copyResult).toEqual({
        success: true,
        message: 'Copied 2 phone numbers to clipboard',
        phoneCount: 2,
      });
      expect(mockClipboard.copyToClipboard).toHaveBeenCalledWith(
        '+15551234567, +15559876543'
      );
      expect(mockToast.showCopyLoading).toHaveBeenCalled();
      expect(mockToast.showCopySuccess).toHaveBeenCalledWith(
        2,
        '+15551234567, +15559876543'
      );
    });

    it('should handle no musicians selected', async () => {
      const selectedIds = new Set<string>();
      (formatPhoneNumbersFromObjects as Mock).mockReturnValue('');
      (getPhoneFormatStats as Mock).mockReturnValue({
        total: 0,
        valid: 0,
        invalid: 0,
        validPercentage: 0,
      });

      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      let copyResult: any;
      await act(async () => {
        copyResult = await result.current.copyPhoneNumbers();
      });

      expect(copyResult).toEqual({
        success: false,
        message: 'No musicians selected',
        phoneCount: 0,
      });
      expect(mockToast.showCopyError).toHaveBeenCalledWith(
        'No musicians selected',
        'Please select some musicians first'
      );
      expect(mockClipboard.copyToClipboard).not.toHaveBeenCalled();
    });

    it('should handle clipboard failure with permission denied', async () => {
      const selectedIds = new Set(['1', '2']);
      mockClipboard.copyToClipboard.mockResolvedValue(false);
      const mockError = 'Permission denied';
      const mockDetailedError = {
        type: 'PERMISSION_DENIED',
        message: 'Permission denied',
        originalError: null,
      };

      (useClipboard as Mock).mockReturnValue({
        ...mockClipboard,
        error: mockError,
        detailedError: mockDetailedError,
      });

      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      let copyResult: any;
      await act(async () => {
        copyResult = await result.current.copyPhoneNumbers();
      });

      expect(copyResult).toEqual({
        success: false,
        message: mockError,
        phoneCount: 0,
      });
      expect(mockToast.showPermissionDenied).toHaveBeenCalled();
    });

    it('should auto-clear selection when enabled', async () => {
      const selectedIds = new Set(['1', '2']);
      const clearSelection = vi.fn();
      mockClipboard.copyToClipboard.mockResolvedValue(true);

      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds, clearSelection, {
          autoClearSelection: true,
        })
      );

      await act(async () => {
        await result.current.copyPhoneNumbers();
      });

      expect(clearSelection).toHaveBeenCalled();
    });
  });

  describe('auto-update functionality', () => {
    it('should auto-update when enabled and conditions met', async () => {
      const selectedIds = new Set(['1', '2']);
      mockClipboard.copyToClipboard.mockResolvedValue(true);
      (ClipboardToastVariants.copySuccess as Mock).mockReturnValue({
        type: 'copySuccess',
        count: 2,
        text: '+15551234567, +15559876543',
      });

      renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds, undefined, {
          autoUpdateClipboard: true,
          autoUpdateDebounce: 100,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(mockClipboard.copyToClipboard).toHaveBeenCalledWith(
        '+15551234567, +15559876543'
      );
      expect(mockToast.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'copySuccess',
          duration: 2000,
          animation: 'fade',
        })
      );
    });

    it('should not auto-update when below minimum selection', async () => {
      const selectedIds = new Set(['1']);

      renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds, undefined, {
          autoUpdateClipboard: true,
          autoUpdateMinSelection: 2,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockClipboard.copyToClipboard).not.toHaveBeenCalled();
    });

    it('should debounce auto-updates correctly', async () => {
      const selectedIds = new Set(['1']);
      mockClipboard.copyToClipboard.mockResolvedValue(true);

      const { rerender } = renderHook(
        ({ ids }) =>
          usePhoneClipboard(sampleMusicians, ids, undefined, {
            autoUpdateClipboard: true,
            autoUpdateDebounce: 200,
          }),
        { initialProps: { ids: selectedIds } }
      );

      // Change selection multiple times quickly
      rerender({ ids: new Set(['1', '2']) });
      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      rerender({ ids: new Set(['1', '2', '3']) });
      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Should not have called clipboard yet due to debouncing
      expect(mockClipboard.copyToClipboard).not.toHaveBeenCalled();

      // Now wait for debounce to complete
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Should only be called once with the final selection
      expect(mockClipboard.copyToClipboard).toHaveBeenCalledTimes(1);
    });
  });

  describe('utility functions', () => {
    it('should provide preview functionality', () => {
      const selectedIds = new Set(['1', '2']);
      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      expect(result.current.getPreview()).toBe('+15551234567, +15559876543');
      expect(result.current.getPreview(20)).toBe('+15551234567, +1555...');
    });

    it('should handle empty preview', () => {
      const selectedIds = new Set<string>();
      (formatPhoneNumbersFromObjects as Mock).mockReturnValue('');

      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      expect(result.current.getPreview()).toBe('');
    });

    it('should calculate canCopy correctly', () => {
      const selectedIds = new Set(['1', '2']);
      const { result } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );

      expect(result.current.canCopy).toBe(true);

      // Test with loading state
      mockClipboard.isLoading = true;
      const { result: loadingResult } = renderHook(() =>
        usePhoneClipboard(sampleMusicians, selectedIds)
      );
      expect(loadingResult.current.canCopy).toBe(false);
    });
  });
});
