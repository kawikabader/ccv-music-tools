import { useState, useCallback, useMemo } from 'react';
import {
  analyzeClipboardError,
  validateClipboardInput,
  retryClipboardOperation,
  logClipboardError,
  getErrorDisplayMessage,
  type ClipboardError,
  type RetryOptions,
} from './useClipboardError';
import {
  detectBrowserCapabilities,
  ClipboardFallbacks,
  type BrowserCapabilities,
} from './useBrowserCompat';

export interface ClipboardState {
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  lastCopiedText: string | null;
  detailedError: ClipboardError | null;
  browserCapabilities: BrowserCapabilities;
  fallbackMethod: string;
}

export interface ClipboardActions {
  copyToClipboard: (
    text: string,
    retryOptions?: RetryOptions
  ) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom hook for managing clipboard operations using modern Clipboard API
 * Provides fallback support for older browsers and comprehensive error handling
 */
export function useClipboard(): ClipboardState & ClipboardActions {
  // Detect browser capabilities once
  const browserCapabilities = useMemo(() => detectBrowserCapabilities(), []);
  const fallbacks = useMemo(() => new ClipboardFallbacks(), []);

  const [state, setState] = useState<ClipboardState>({
    isSupported: browserCapabilities.hasClipboardAPI,
    isLoading: false,
    error: null,
    lastCopiedText: null,
    detailedError: null,
    browserCapabilities,
    fallbackMethod: fallbacks.getBestFallbackMethod(),
  });

  /**
   * Copy text to clipboard using modern Clipboard API with enhanced error handling
   * Returns true if successful, false if failed
   */
  const copyToClipboard = useCallback(
    async (text: string, retryOptions?: RetryOptions): Promise<boolean> => {
      // Validate input
      const validationError = validateClipboardInput(text);
      if (validationError) {
        const errorMessage = getErrorDisplayMessage(validationError);
        setState(prev => ({
          ...prev,
          error: errorMessage,
          detailedError: validationError,
        }));
        logClipboardError(validationError, { text: text?.substring(0, 100) });
        return false;
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        detailedError: null,
      }));

      try {
        // Use retry mechanism for the entire operation
        const success = await retryClipboardOperation(async () => {
          // Try modern Clipboard API first
          if (
            browserCapabilities.supportsAsyncClipboard &&
            browserCapabilities.isSecureContext
          ) {
            await navigator.clipboard.writeText(text);
            return true;
          }

          // Use comprehensive fallback system
          return await fallbacks.attemptAllFallbacks(text);
        }, retryOptions);

        setState(prev => ({
          ...prev,
          isLoading: false,
          lastCopiedText: text,
          error: null,
          detailedError: null,
        }));
        return success;
      } catch (error) {
        const clipboardError = analyzeClipboardError(error);
        const errorMessage = getErrorDisplayMessage(clipboardError);

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          detailedError: clipboardError,
        }));

        logClipboardError(clipboardError, {
          text: text?.substring(0, 100),
          retryOptions,
          browserInfo: browserCapabilities.browserInfo,
          fallbackMethod: fallbacks.getBestFallbackMethod(),
        });

        return false;
      }
    },
    [browserCapabilities, fallbacks]
  );

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      detailedError: null,
    }));
  }, []);

  /**
   * Reset the clipboard state to initial values
   */
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
      detailedError: null,
      lastCopiedText: null,
    }));
  }, []);

  return {
    ...state,
    copyToClipboard,
    clearError,
    reset,
  };
}
