import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useClipboard } from './useClipboard';

// Mock the dependencies
vi.mock('./useClipboardError', () => ({
  validateClipboardInput: vi.fn(),
  analyzeClipboardError: vi.fn(),
  retryClipboardOperation: vi.fn(),
  logClipboardError: vi.fn(),
  getErrorDisplayMessage: vi.fn(),
  ClipboardErrorType: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    NOT_SUPPORTED: 'NOT_SUPPORTED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    GENERIC_ERROR: 'GENERIC_ERROR',
    SECURITY_ERROR: 'SECURITY_ERROR',
  },
}));

vi.mock('./useBrowserCompat', () => ({
  detectBrowserCapabilities: vi.fn(),
  ClipboardFallbacks: vi.fn().mockImplementation(() => ({
    getBestFallbackMethod: vi.fn(() => 'execCommand'),
    attemptAllFallbacks: vi.fn(),
  })),
}));

// Import mocked functions for type safety
import {
  validateClipboardInput,
  analyzeClipboardError,
  retryClipboardOperation,
  logClipboardError,
  getErrorDisplayMessage,
} from './useClipboardError';
import {
  detectBrowserCapabilities,
  ClipboardFallbacks,
} from './useBrowserCompat';

describe('useClipboard', () => {
  const mockNavigatorClipboard = {
    writeText: vi.fn(),
  };

  const mockBrowserCapabilities = {
    hasClipboardAPI: true,
    supportsAsyncClipboard: true,
    isSecureContext: true,
    browserInfo: {
      name: 'Chrome',
      version: '100.0.0',
      isMobile: false,
    },
    fallbackMethods: ['execCommand', 'selection'],
  };

  const mockFallbacks = {
    getBestFallbackMethod: vi.fn(() => 'execCommand'),
    attemptAllFallbacks: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    Object.defineProperty(navigator, 'clipboard', {
      value: mockNavigatorClipboard,
      writable: true,
    });

    (detectBrowserCapabilities as Mock).mockReturnValue(
      mockBrowserCapabilities
    );
    (ClipboardFallbacks as Mock).mockImplementation(() => mockFallbacks);
    (validateClipboardInput as Mock).mockReturnValue(null);
    (retryClipboardOperation as Mock).mockImplementation(fn => fn());
    (getErrorDisplayMessage as Mock).mockReturnValue('Generic error message');
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current.isSupported).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastCopiedText).toBe(null);
      expect(result.current.detailedError).toBe(null);
      expect(result.current.browserCapabilities).toEqual(
        mockBrowserCapabilities
      );
      expect(result.current.fallbackMethod).toBe('execCommand');
    });

    it('should detect browser capabilities on initialization', () => {
      renderHook(() => useClipboard());

      expect(detectBrowserCapabilities).toHaveBeenCalledTimes(1);
    });

    it('should initialize fallbacks system', () => {
      renderHook(() => useClipboard());

      expect(ClipboardFallbacks).toHaveBeenCalledTimes(1);
      expect(mockFallbacks.getBestFallbackMethod).toHaveBeenCalled();
    });

    it('should set isSupported to false when clipboard API not available', () => {
      (detectBrowserCapabilities as Mock).mockReturnValue({
        ...mockBrowserCapabilities,
        hasClipboardAPI: false,
      });

      const { result } = renderHook(() => useClipboard());

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('copyToClipboard', () => {
    it('should successfully copy text using modern Clipboard API', async () => {
      mockNavigatorClipboard.writeText.mockResolvedValue(undefined);
      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('test text');
      });

      expect(copyResult!).toBe(true);
      expect(mockNavigatorClipboard.writeText).toHaveBeenCalledWith(
        'test text'
      );
      expect(result.current.lastCopiedText).toBe('test text');
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should use fallback when modern API not available', async () => {
      (detectBrowserCapabilities as Mock).mockReturnValue({
        ...mockBrowserCapabilities,
        supportsAsyncClipboard: false,
      });
      mockFallbacks.attemptAllFallbacks.mockResolvedValue(true);

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('test text');
      });

      expect(copyResult!).toBe(true);
      expect(mockNavigatorClipboard.writeText).not.toHaveBeenCalled();
      expect(mockFallbacks.attemptAllFallbacks).toHaveBeenCalledWith(
        'test text'
      );
      expect(result.current.lastCopiedText).toBe('test text');
    });

    it('should use fallback when not in secure context', async () => {
      (detectBrowserCapabilities as Mock).mockReturnValue({
        ...mockBrowserCapabilities,
        isSecureContext: false,
      });
      mockFallbacks.attemptAllFallbacks.mockResolvedValue(true);

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('test text');
      });

      expect(copyResult!).toBe(true);
      expect(mockNavigatorClipboard.writeText).not.toHaveBeenCalled();
      expect(mockFallbacks.attemptAllFallbacks).toHaveBeenCalledWith(
        'test text'
      );
    });

    it('should set loading state during operation', async () => {
      let resolveClipboard: (value: any) => void;
      mockNavigatorClipboard.writeText.mockImplementation(() => {
        return new Promise(resolve => {
          resolveClipboard = resolve;
        });
      });

      const { result } = renderHook(() => useClipboard());

      act(() => {
        result.current.copyToClipboard('test text');
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveClipboard!(undefined);
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        type: 'VALIDATION_ERROR',
        message: 'Text is too long',
        originalError: null,
      };
      (validateClipboardInput as Mock).mockReturnValue(validationError);
      (getErrorDisplayMessage as Mock).mockReturnValue('Text is too long');

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('invalid text');
      });

      expect(copyResult!).toBe(false);
      expect(result.current.error).toBe('Text is too long');
      expect(result.current.detailedError).toEqual(validationError);
      expect(mockNavigatorClipboard.writeText).not.toHaveBeenCalled();
      expect(logClipboardError).toHaveBeenCalledWith(validationError, {
        text: 'invalid text',
      });
    });

    it('should handle clipboard API errors', async () => {
      const clipboardError = new Error('Permission denied');
      mockNavigatorClipboard.writeText.mockRejectedValue(clipboardError);

      const analyzedError = {
        type: 'PERMISSION_DENIED',
        message: 'Permission denied',
        originalError: clipboardError,
      };
      (analyzeClipboardError as Mock).mockReturnValue(analyzedError);
      (getErrorDisplayMessage as Mock).mockReturnValue(
        'Permission denied to access clipboard'
      );

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('test text');
      });

      expect(copyResult!).toBe(false);
      expect(result.current.error).toBe(
        'Permission denied to access clipboard'
      );
      expect(result.current.detailedError).toEqual(analyzedError);
      expect(result.current.isLoading).toBe(false);
      expect(analyzeClipboardError).toHaveBeenCalledWith(clipboardError);
    });

    it('should use retry mechanism', async () => {
      const retryOptions = { maxRetries: 3, delay: 100 };
      mockNavigatorClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyToClipboard('test text', retryOptions);
      });

      expect(retryClipboardOperation).toHaveBeenCalledWith(
        expect.any(Function),
        retryOptions
      );
    });

    it('should clear previous errors before new operation', async () => {
      const { result } = renderHook(() => useClipboard());

      // First, set an error state
      act(() => {
        result.current.clearError();
      });

      mockNavigatorClipboard.writeText.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.copyToClipboard('test text');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.detailedError).toBe(null);
    });

    it('should handle empty text input', async () => {
      mockNavigatorClipboard.writeText.mockResolvedValue(undefined);
      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('');
      });

      expect(copyResult!).toBe(true);
      expect(mockNavigatorClipboard.writeText).toHaveBeenCalledWith('');
      expect(result.current.lastCopiedText).toBe('');
    });

    it('should log errors with context', async () => {
      const clipboardError = new Error('Network error');
      mockNavigatorClipboard.writeText.mockRejectedValue(clipboardError);

      const analyzedError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        originalError: clipboardError,
      };
      (analyzeClipboardError as Mock).mockReturnValue(analyzedError);

      const { result } = renderHook(() => useClipboard());
      const retryOptions = { maxRetries: 2 };

      await act(async () => {
        await result.current.copyToClipboard('test text', retryOptions);
      });

      expect(logClipboardError).toHaveBeenCalledWith(analyzedError, {
        text: 'test text',
        retryOptions,
        browserInfo: mockBrowserCapabilities.browserInfo,
        fallbackMethod: 'execCommand',
      });
    });

    it('should truncate long text in error logs', async () => {
      const longText = 'a'.repeat(200);
      const truncatedText = longText.substring(0, 100);

      const validationError = {
        type: 'VALIDATION_ERROR',
        message: 'Text too long',
        originalError: null,
      };
      (validateClipboardInput as Mock).mockReturnValue(validationError);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyToClipboard(longText);
      });

      expect(logClipboardError).toHaveBeenCalledWith(validationError, {
        text: truncatedText,
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useClipboard());

      // Manually set error state to test clearing
      act(() => {
        (result.current as any).setState({
          error: 'Some error',
          detailedError: { type: 'GENERIC_ERROR', message: 'Error' },
        });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.detailedError).toBe(null);
    });

    it('should not affect other state properties', () => {
      const { result } = renderHook(() => useClipboard());

      // Set some state first
      act(() => {
        (result.current as any).setState({
          lastCopiedText: 'previous text',
          isLoading: false,
          error: 'Some error',
        });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.lastCopiedText).toBe('previous text');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('reset', () => {
    it('should reset all mutable state to initial values', () => {
      const { result } = renderHook(() => useClipboard());

      // Set some state first
      act(() => {
        (result.current as any).setState({
          isLoading: true,
          error: 'Some error',
          lastCopiedText: 'previous text',
          detailedError: { type: 'GENERIC_ERROR', message: 'Error' },
        });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastCopiedText).toBe(null);
      expect(result.current.detailedError).toBe(null);
    });

    it('should not affect immutable state properties', () => {
      const { result } = renderHook(() => useClipboard());

      const originalCapabilities = result.current.browserCapabilities;
      const originalFallbackMethod = result.current.fallbackMethod;
      const originalIsSupported = result.current.isSupported;

      act(() => {
        result.current.reset();
      });

      expect(result.current.browserCapabilities).toBe(originalCapabilities);
      expect(result.current.fallbackMethod).toBe(originalFallbackMethod);
      expect(result.current.isSupported).toBe(originalIsSupported);
    });
  });

  describe('function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useClipboard());

      const initialCopy = result.current.copyToClipboard;
      const initialClear = result.current.clearError;
      const initialReset = result.current.reset;

      rerender();

      expect(result.current.copyToClipboard).toBe(initialCopy);
      expect(result.current.clearError).toBe(initialClear);
      expect(result.current.reset).toBe(initialReset);
    });

    it('should maintain function stability across state changes', () => {
      const { result } = renderHook(() => useClipboard());

      const initialFunctions = {
        copyToClipboard: result.current.copyToClipboard,
        clearError: result.current.clearError,
        reset: result.current.reset,
      };

      act(() => {
        result.current.clearError();
      });

      expect(result.current.copyToClipboard).toBe(
        initialFunctions.copyToClipboard
      );
      expect(result.current.clearError).toBe(initialFunctions.clearError);
      expect(result.current.reset).toBe(initialFunctions.reset);
    });
  });

  describe('browser compatibility edge cases', () => {
    it('should handle missing navigator.clipboard gracefully', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      });

      (detectBrowserCapabilities as Mock).mockReturnValue({
        ...mockBrowserCapabilities,
        hasClipboardAPI: false,
        supportsAsyncClipboard: false,
      });

      mockFallbacks.attemptAllFallbacks.mockResolvedValue(true);

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('test text');
      });

      expect(copyResult!).toBe(true);
      expect(mockFallbacks.attemptAllFallbacks).toHaveBeenCalledWith(
        'test text'
      );
    });

    it('should handle fallback failures', async () => {
      (detectBrowserCapabilities as Mock).mockReturnValue({
        ...mockBrowserCapabilities,
        supportsAsyncClipboard: false,
      });

      const fallbackError = new Error('Fallback failed');
      mockFallbacks.attemptAllFallbacks.mockRejectedValue(fallbackError);

      const analyzedError = {
        type: 'NOT_SUPPORTED',
        message: 'Clipboard not supported',
        originalError: fallbackError,
      };
      (analyzeClipboardError as Mock).mockReturnValue(analyzedError);

      const { result } = renderHook(() => useClipboard());

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyToClipboard('test text');
      });

      expect(copyResult!).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.detailedError).toEqual(analyzedError);
    });
  });

  describe('memory management', () => {
    it('should not cause memory leaks with multiple instances', () => {
      const hooks = [];

      for (let i = 0; i < 10; i++) {
        const { result } = renderHook(() => useClipboard());
        hooks.push(result);
      }

      // All hooks should have independent state
      hooks.forEach(hook => {
        expect(hook.current.error).toBe(null);
        expect(hook.current.lastCopiedText).toBe(null);
      });

      // Browser capabilities should be detected for each instance
      expect(detectBrowserCapabilities).toHaveBeenCalledTimes(10);
    });
  });
});
