/**
 * Enhanced error handling for clipboard operations
 * Provides specific error types, retry mechanisms, and error recovery
 */

export enum ClipboardErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  SECURITY_ERROR = 'SECURITY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  FALLBACK_FAILED = 'FALLBACK_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ClipboardError {
  type: ClipboardErrorType;
  message: string;
  originalError?: Error;
  canRetry: boolean;
  suggestedAction?: string;
  timestamp: Date;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

/**
 * Creates a standardized clipboard error object
 */
export function createClipboardError(
  type: ClipboardErrorType,
  message: string,
  originalError?: Error,
  canRetry: boolean = false,
  suggestedAction?: string
): ClipboardError {
  return {
    type,
    message,
    originalError,
    canRetry,
    suggestedAction,
    timestamp: new Date(),
  };
}

/**
 * Analyzes an error and categorizes it into specific clipboard error types
 */
export function analyzeClipboardError(error: unknown): ClipboardError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return createClipboardError(
          ClipboardErrorType.PERMISSION_DENIED,
          'Clipboard access denied. Please allow clipboard permissions.',
          error,
          true,
          'Click the permission icon in your browser address bar and allow clipboard access.'
        );

      case 'NotSupportedError':
        return createClipboardError(
          ClipboardErrorType.NOT_SUPPORTED,
          'Clipboard API not supported in this browser.',
          error,
          false,
          'Please use a modern browser or manually copy the text.'
        );

      case 'SecurityError':
        return createClipboardError(
          ClipboardErrorType.SECURITY_ERROR,
          'Clipboard access blocked by security policy.',
          error,
          false,
          'Clipboard access is only available on secure (HTTPS) connections.'
        );

      default:
        return createClipboardError(
          ClipboardErrorType.UNKNOWN_ERROR,
          `Browser error: ${error.message}`,
          error,
          true
        );
    }
  }

  if (error instanceof TypeError) {
    return createClipboardError(
      ClipboardErrorType.NOT_SUPPORTED,
      'Clipboard API not available.',
      error,
      false,
      "Your browser doesn't support the clipboard API."
    );
  }

  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('execCommand')) {
      return createClipboardError(
        ClipboardErrorType.FALLBACK_FAILED,
        'Both modern and fallback clipboard methods failed.',
        error,
        true,
        'Please manually select and copy the text.'
      );
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createClipboardError(
        ClipboardErrorType.NETWORK_ERROR,
        'Network error during clipboard operation.',
        error,
        true,
        'Check your internet connection and try again.'
      );
    }

    return createClipboardError(
      ClipboardErrorType.UNKNOWN_ERROR,
      error.message || 'An unknown error occurred.',
      error,
      true
    );
  }

  return createClipboardError(
    ClipboardErrorType.UNKNOWN_ERROR,
    'An unexpected error occurred during clipboard operation.',
    undefined,
    true
  );
}

/**
 * Validates input before clipboard operations
 */
export function validateClipboardInput(text: string): ClipboardError | null {
  if (!text || typeof text !== 'string') {
    return createClipboardError(
      ClipboardErrorType.INVALID_INPUT,
      'No text provided to copy.',
      undefined,
      false,
      'Please select some text to copy.'
    );
  }

  if (text.trim().length === 0) {
    return createClipboardError(
      ClipboardErrorType.INVALID_INPUT,
      'Cannot copy empty text.',
      undefined,
      false,
      'Please select some non-empty text to copy.'
    );
  }

  // Check for extremely large text (potential performance issue)
  if (text.length > 1000000) {
    // 1MB limit
    return createClipboardError(
      ClipboardErrorType.INVALID_INPUT,
      'Text is too large to copy to clipboard.',
      undefined,
      false,
      'Please try copying smaller portions of text.'
    );
  }

  return null;
}

/**
 * Implements retry logic with exponential backoff
 */
export async function retryClipboardOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 100,
    exponentialBackoff = true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Don't retry certain error types
      const clipboardError = analyzeClipboardError(error);
      if (!clipboardError.canRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Logs clipboard errors for debugging and analytics
 */
export function logClipboardError(
  error: ClipboardError,
  context?: Record<string, any>
): void {
  const logData = {
    type: error.type,
    message: error.message,
    timestamp: error.timestamp.toISOString(),
    canRetry: error.canRetry,
    suggestedAction: error.suggestedAction,
    userAgent: navigator.userAgent,
    context,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Clipboard Error');
    console.error('Error details:', logData);
    if (error.originalError) {
      console.error('Original error:', error.originalError);
    }
    console.groupEnd();
  }

  // In production, you might want to send to an error reporting service
  // Example: sendErrorToService(logData);
}

/**
 * Provides user-friendly error messages for different error types
 */
export function getErrorDisplayMessage(error: ClipboardError): string {
  switch (error.type) {
    case ClipboardErrorType.PERMISSION_DENIED:
      return 'Clipboard access denied. Please allow clipboard permissions in your browser.';

    case ClipboardErrorType.NOT_SUPPORTED:
      return "Your browser doesn't support copying to clipboard. Please manually copy the text.";

    case ClipboardErrorType.SECURITY_ERROR:
      return 'Clipboard access requires a secure connection (HTTPS).';

    case ClipboardErrorType.INVALID_INPUT:
      return 'Cannot copy empty or invalid text.';

    case ClipboardErrorType.FALLBACK_FAILED:
      return 'Unable to copy to clipboard. Please manually select and copy the text.';

    case ClipboardErrorType.NETWORK_ERROR:
      return 'Network error. Please check your connection and try again.';

    default:
      return 'Failed to copy to clipboard. Please try again.';
  }
}
