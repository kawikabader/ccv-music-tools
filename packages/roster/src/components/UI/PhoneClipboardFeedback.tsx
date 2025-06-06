import React from 'react';
import { ClipboardToast, useClipboardToast, type ClipboardToastProps } from './ClipboardToast';
import { CopyConfirmation, useCopyConfirmation, type CopyConfirmationProps } from './CopyConfirmation';

export interface PhoneClipboardFeedbackProps {
  /** Whether to use toast notifications (default: true) */
  useToast?: boolean;
  /** Whether to use inline confirmation (default: false) */
  useInlineConfirmation?: boolean;
  /** Toast position */
  toastPosition?: ClipboardToastProps['position'];
  /** Toast animation */
  toastAnimation?: ClipboardToastProps['animation'];
  /** Custom toast duration */
  toastDuration?: number;
  /** Custom confirmation duration */
  confirmationDuration?: number;
}

/**
 * Integrated feedback component for phone clipboard operations
 * Provides both toast notifications and inline confirmations
 */
export function PhoneClipboardFeedback({
  useToast = true,
  useInlineConfirmation = false,
  toastPosition = 'top-right',
  toastAnimation = 'slide',
  toastDuration = 3000,
  confirmationDuration = 3000,
}: PhoneClipboardFeedbackProps): JSX.Element {
  const toast = useClipboardToast();
  const confirmation = useCopyConfirmation();

  return (
    <>
      {/* Toast Notification */}
      {useToast && (
        <ClipboardToast
          isVisible={toast.isVisible}
          type={toast.props.type || 'success'}
          message={toast.props.message || ''}
          subtitle={toast.props.subtitle}
          progress={toast.props.progress}
          position={toastPosition}
          animation={toastAnimation}
          duration={toastDuration}
          onDismiss={toast.hideToast}
        />
      )}

      {/* Inline Confirmation */}
      {useInlineConfirmation && (
        <CopyConfirmation
          show={confirmation.show}
          success={confirmation.success}
          phoneCount={confirmation.phoneCount}
          errorMessage={confirmation.errorMessage}
          preview={confirmation.preview}
          isLoading={confirmation.isLoading}
          duration={confirmationDuration}
          onDismiss={confirmation.hide}
        />
      )}
    </>
  );
}

/**
 * Hook that provides integrated feedback control for phone clipboard operations
 * Manages both toast and confirmation states together
 */
export function usePhoneClipboardFeedback(options: PhoneClipboardFeedbackProps = {}) {
  const toast = useClipboardToast();
  const confirmation = useCopyConfirmation();

  const showLoading = React.useCallback((progress?: number) => {
    if (options.useToast !== false) {
      toast.showCopyLoading(progress);
    }
    if (options.useInlineConfirmation) {
      confirmation.showLoading();
    }
  }, [toast, confirmation, options.useToast, options.useInlineConfirmation]);

  const showSuccess = React.useCallback((phoneCount: number, preview?: string) => {
    if (options.useToast !== false) {
      toast.showCopySuccess(phoneCount, preview);
    }
    if (options.useInlineConfirmation) {
      confirmation.showSuccess(phoneCount, preview);
    }
  }, [toast, confirmation, options.useToast, options.useInlineConfirmation]);

  const showError = React.useCallback((errorMessage: string, suggestion?: string) => {
    if (options.useToast !== false) {
      toast.showCopyError(errorMessage, suggestion);
    }
    if (options.useInlineConfirmation) {
      confirmation.showError(errorMessage);
    }
  }, [toast, confirmation, options.useToast, options.useInlineConfirmation]);

  const showPermissionDenied = React.useCallback(() => {
    if (options.useToast !== false) {
      toast.showPermissionDenied();
    }
    if (options.useInlineConfirmation) {
      confirmation.showError('Clipboard access denied');
    }
  }, [toast, confirmation, options.useToast, options.useInlineConfirmation]);

  const showNotSupported = React.useCallback(() => {
    if (options.useToast !== false) {
      toast.showNotSupported();
    }
    if (options.useInlineConfirmation) {
      confirmation.showError('Browser not supported');
    }
  }, [toast, confirmation, options.useToast, options.useInlineConfirmation]);

  const hideAll = React.useCallback(() => {
    toast.hideToast();
    confirmation.hide();
  }, [toast, confirmation]);

  const resetAll = React.useCallback(() => {
    confirmation.reset();
  }, [confirmation]);

  return {
    // State
    isVisible: toast.isVisible || confirmation.show,
    isLoading: confirmation.isLoading,

    // Actions
    showLoading,
    showSuccess,
    showError,
    showPermissionDenied,
    showNotSupported,
    hideAll,
    resetAll,

    // Individual controls
    toast,
    confirmation,

    // Component
    FeedbackComponent: () => <PhoneClipboardFeedback {...options} />,
  };
}

/**
 * Higher-order component that wraps components with clipboard feedback
 */
export function withPhoneClipboardFeedback<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feedbackOptions: PhoneClipboardFeedbackProps = {}
) {
  const WithFeedbackComponent = (props: P) => {
    return (
      <>
        <WrappedComponent {...props} />
        <PhoneClipboardFeedback {...feedbackOptions} />
      </>
    );
  };

  WithFeedbackComponent.displayName = `withPhoneClipboardFeedback(${WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

  return WithFeedbackComponent;
}

/**
 * React Context for phone clipboard feedback
 * Allows components to access feedback functionality throughout the component tree
 */
const PhoneClipboardFeedbackContext = React.createContext<ReturnType<typeof usePhoneClipboardFeedback> | null>(null);

export function PhoneClipboardFeedbackProvider({
  children,
  options = {}
}: {
  children: React.ReactNode;
  options?: PhoneClipboardFeedbackProps;
}) {
  const feedback = usePhoneClipboardFeedback(options);

  return (
    <PhoneClipboardFeedbackContext.Provider value={feedback}>
      {children}
      <feedback.FeedbackComponent />
    </PhoneClipboardFeedbackContext.Provider>
  );
}

export function usePhoneClipboardFeedbackContext() {
  const context = React.useContext(PhoneClipboardFeedbackContext);
  if (!context) {
    throw new Error('usePhoneClipboardFeedbackContext must be used within a PhoneClipboardFeedbackProvider');
  }
  return context;
} 