import React from 'react';

export interface ClipboardToastProps {
  /** Toast visibility */
  isVisible: boolean;
  /** Operation type */
  type: 'loading' | 'success' | 'error';
  /** Main message */
  message: string;
  /** Optional subtitle or details */
  subtitle?: string;
  /** Progress percentage for loading state (0-100) */
  progress?: number;
  /** Duration in ms before auto-dismiss */
  duration?: number;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Position of the toast */
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  /** Animation variant */
  animation?: 'slide' | 'fade' | 'bounce';
}

/**
 * Enhanced toast component specifically designed for clipboard operations
 * Features smooth animations, progress indicators, and clipboard-specific styling
 */
export function ClipboardToast({
  isVisible,
  type,
  message,
  subtitle,
  progress = 0,
  duration = 3000,
  onDismiss,
  position = 'top-right',
  animation = 'slide',
}: ClipboardToastProps): JSX.Element | null {
  const [isExiting, setIsExiting] = React.useState(false);

  // Auto-dismiss functionality
  React.useEffect(() => {
    if (isVisible && type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onDismiss?.();
          setIsExiting(false);
        }, 300); // Allow exit animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, type, duration, onDismiss]);

  if (!isVisible && !isExiting) return null;

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Animation classes
  const animationClasses = {
    slide: isExiting
      ? 'transform translate-x-full opacity-0'
      : 'transform translate-x-0 opacity-100',
    fade: isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
    bounce: isExiting
      ? 'opacity-0 scale-95'
      : 'opacity-100 scale-100 animate-bounce',
  };

  // Type-specific styling
  const typeStyles = {
    loading: {
      bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500',
    },
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-500',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full px-4`}>
      <div
        className={`
          ${styles.bg} ${styles.border}
          border-2 rounded-xl shadow-xl backdrop-blur-sm
          transition-all duration-300 ease-in-out
          ${animationClasses[animation]}
          hover:shadow-2xl
        `}
      >
        {/* Progress bar for loading state */}
        {type === 'loading' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-200 rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {type === 'loading' ? (
                <div className="relative">
                  <div className={`animate-spin h-5 w-5 ${styles.icon}`}>
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
                  {/* Clipboard icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </div>
                </div>
              ) : type === 'success' ? (
                <div className="relative">
                  <svg className={`h-5 w-5 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {/* Success pulse animation */}
                  <div className="absolute inset-0 animate-ping">
                    <svg className={`h-5 w-5 ${styles.icon} opacity-30`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <svg className={`h-5 w-5 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${styles.text}`}>
                {message}
              </div>
              {subtitle && (
                <div className={`mt-1 text-xs ${styles.text} opacity-75`}>
                  {subtitle}
                </div>
              )}
            </div>

            {/* Close button */}
            {type !== 'loading' && onDismiss && (
              <button
                onClick={() => {
                  setIsExiting(true);
                  setTimeout(() => {
                    onDismiss();
                    setIsExiting(false);
                  }, 300);
                }}
                className={`
                  flex-shrink-0 ${styles.icon} opacity-50 hover:opacity-75 
                  focus:outline-none focus:opacity-75 transition-opacity duration-200
                  p-1 rounded-full hover:bg-white hover:bg-opacity-20
                `}
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className={`h-1 ${type === 'loading' ? 'bg-blue-300' : type === 'success' ? 'bg-green-300' : 'bg-red-300'} rounded-b-xl`} />
      </div>
    </div>
  );
}

/**
 * Clipboard-specific toast variants with pre-configured styling
 */
export const ClipboardToastVariants = {
  /**
   * Loading state for copy operations
   */
  copyLoading: (progress?: number) => ({
    type: 'loading' as const,
    message: 'Copying to clipboard...',
    subtitle: 'Preparing phone numbers',
    progress,
    animation: 'slide' as const,
  }),

  /**
   * Success state for successful copy
   */
  copySuccess: (count: number, preview?: string) => ({
    type: 'success' as const,
    message: `📋 Copied ${count} phone number${count !== 1 ? 's' : ''}`,
    subtitle: preview ? `${preview.substring(0, 30)}${preview.length > 30 ? '...' : ''}` : undefined,
    animation: 'bounce' as const,
    duration: 4000,
  }),

  /**
   * Error state for failed copy operations
   */
  copyError: (errorMessage: string, suggestion?: string) => ({
    type: 'error' as const,
    message: '❌ Copy failed',
    subtitle: suggestion || errorMessage,
    animation: 'fade' as const,
    duration: 5000,
  }),

  /**
   * Permission denied specific error
   */
  permissionDenied: () => ({
    type: 'error' as const,
    message: '🔒 Clipboard access denied',
    subtitle: 'Please allow clipboard permissions in your browser',
    animation: 'fade' as const,
    duration: 6000,
  }),

  /**
   * Browser not supported error
   */
  notSupported: () => ({
    type: 'error' as const,
    message: '🌐 Browser not supported',
    subtitle: 'Please use a modern browser or copy manually',
    animation: 'fade' as const,
    duration: 7000,
  }),
};

/**
 * Hook for managing clipboard toast notifications
 */
export function useClipboardToast() {
  const [toast, setToast] = React.useState<{
    isVisible: boolean;
    props: Partial<ClipboardToastProps>;
  }>({
    isVisible: false,
    props: {},
  });

  const showToast = React.useCallback((props: Partial<ClipboardToastProps>) => {
    setToast({
      isVisible: true,
      props,
    });
  }, []);

  const hideToast = React.useCallback(() => {
    setToast(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showCopyLoading = React.useCallback((progress?: number) => {
    showToast(ClipboardToastVariants.copyLoading(progress));
  }, [showToast]);

  const showCopySuccess = React.useCallback((count: number, preview?: string) => {
    showToast(ClipboardToastVariants.copySuccess(count, preview));
  }, [showToast]);

  const showCopyError = React.useCallback((errorMessage: string, suggestion?: string) => {
    showToast(ClipboardToastVariants.copyError(errorMessage, suggestion));
  }, [showToast]);

  const showPermissionDenied = React.useCallback(() => {
    showToast(ClipboardToastVariants.permissionDenied());
  }, [showToast]);

  const showNotSupported = React.useCallback(() => {
    showToast(ClipboardToastVariants.notSupported());
  }, [showToast]);

  return {
    ...toast,
    showToast,
    hideToast,
    showCopyLoading,
    showCopySuccess,
    showCopyError,
    showPermissionDenied,
    showNotSupported,
  };
} 