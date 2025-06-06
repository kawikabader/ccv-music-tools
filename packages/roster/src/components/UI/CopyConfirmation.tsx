import React from 'react';
import { useNotification } from '../../context/NotificationContext';

export interface CopyConfirmationProps {
  /** Whether to show the confirmation */
  show: boolean;
  /** Success state of the copy operation */
  success: boolean;
  /** Number of phone numbers copied */
  phoneCount?: number;
  /** Error message if copy failed */
  errorMessage?: string;
  /** Optional preview of copied content */
  preview?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Custom duration in ms (default: 3000) */
  duration?: number;
  /** Callback when confirmation is dismissed */
  onDismiss?: () => void;
}

/**
 * Specialized confirmation component for clipboard copy operations
 * Provides visual feedback for phone number copying with progress and status indicators
 */
export function CopyConfirmation({
  show,
  success,
  phoneCount = 0,
  errorMessage,
  preview,
  isLoading = false,
  duration = 3000,
  onDismiss,
}: CopyConfirmationProps): JSX.Element | null {
  const { addNotification } = useNotification();

  // Use the notification system for persistent messages
  React.useEffect(() => {
    if (show && !isLoading) {
      if (success) {
        const message = phoneCount > 0
          ? `📋 Copied ${phoneCount} phone number${phoneCount !== 1 ? 's' : ''} to clipboard`
          : '📋 Copied to clipboard';
        addNotification('success', message);
      } else if (errorMessage) {
        addNotification('error', `❌ Copy failed: ${errorMessage}`);
      }

      if (onDismiss) {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [show, success, isLoading, phoneCount, errorMessage, duration, onDismiss, addNotification]);

  // Show inline feedback for loading states and immediate feedback
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`
        rounded-lg shadow-lg p-4 transition-all duration-300 transform
        ${isLoading
          ? 'bg-blue-50 border border-blue-200'
          : success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }
      `}>
        <div className="flex items-start space-x-3">
          {/* Status Icon */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="animate-spin h-5 w-5 text-blue-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : success ? (
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${isLoading
              ? 'text-blue-800'
              : success
                ? 'text-green-800'
                : 'text-red-800'
              }`}>
              {isLoading ? (
                'Copying to clipboard...'
              ) : success ? (
                phoneCount > 0
                  ? `Copied ${phoneCount} phone number${phoneCount !== 1 ? 's' : ''}`
                  : 'Copied to clipboard'
              ) : (
                'Copy failed'
              )}
            </div>

            {/* Preview or error message */}
            {!isLoading && (
              <div className={`mt-1 text-xs ${success ? 'text-green-600' : 'text-red-600'
                }`}>
                {success && preview ? (
                  <div className="bg-white bg-opacity-50 rounded px-2 py-1 font-mono">
                    {preview.length > 40 ? `${preview.substring(0, 40)}...` : preview}
                  </div>
                ) : errorMessage ? (
                  errorMessage
                ) : null}
              </div>
            )}
          </div>

          {/* Close button */}
          {!isLoading && onDismiss && (
            <button
              onClick={onDismiss}
              className={`flex-shrink-0 ${success
                ? 'text-green-400 hover:text-green-500'
                : 'text-red-400 hover:text-red-500'
                } focus:outline-none`}
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing copy confirmation state
 * Provides convenient methods for showing copy feedback
 */
export function useCopyConfirmation() {
  const [state, setState] = React.useState({
    show: false,
    success: false,
    phoneCount: 0,
    errorMessage: '',
    preview: '',
    isLoading: false,
  });

  const showLoading = React.useCallback(() => {
    setState({
      show: true,
      success: false,
      phoneCount: 0,
      errorMessage: '',
      preview: '',
      isLoading: true,
    });
  }, []);

  const showSuccess = React.useCallback((phoneCount: number, preview?: string) => {
    setState({
      show: true,
      success: true,
      phoneCount,
      errorMessage: '',
      preview: preview || '',
      isLoading: false,
    });
  }, []);

  const showError = React.useCallback((errorMessage: string) => {
    setState({
      show: true,
      success: false,
      phoneCount: 0,
      errorMessage,
      preview: '',
      isLoading: false,
    });
  }, []);

  const hide = React.useCallback(() => {
    setState(prev => ({ ...prev, show: false }));
  }, []);

  const reset = React.useCallback(() => {
    setState({
      show: false,
      success: false,
      phoneCount: 0,
      errorMessage: '',
      preview: '',
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    showLoading,
    showSuccess,
    showError,
    hide,
    reset,
  };
} 