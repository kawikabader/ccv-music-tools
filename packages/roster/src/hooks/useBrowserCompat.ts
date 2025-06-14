/**
 * Browser compatibility utilities for clipboard operations
 * Provides comprehensive detection and fallback mechanisms for older browsers
 */

export interface BrowserCapabilities {
  hasClipboardAPI: boolean;
  hasExecCommand: boolean;
  hasSelection: boolean;
  hasDocumentRange: boolean;
  supportsAsyncClipboard: boolean;
  isSecureContext: boolean;
  browserInfo: {
    name: string;
    version: string;
    isIOS: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    isOldIE: boolean;
  };
}

/**
 * Detects browser capabilities for clipboard operations
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  const userAgent = navigator.userAgent;

  // Basic capability checks
  const hasClipboardAPI =
    typeof navigator !== 'undefined' &&
    'clipboard' in navigator &&
    typeof navigator.clipboard?.writeText === 'function';

  const hasExecCommand =
    typeof document !== 'undefined' &&
    typeof document.execCommand === 'function';

  const hasSelection =
    typeof window !== 'undefined' && typeof window.getSelection === 'function';

  const hasDocumentRange =
    typeof document !== 'undefined' &&
    typeof document.createRange === 'function';

  const supportsAsyncClipboard =
    hasClipboardAPI && typeof navigator.clipboard.writeText === 'function';

  const isSecureContext =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      location.protocol === 'https:' ||
      location.hostname === 'localhost');

  // Browser detection
  const browserInfo = {
    name: getBrowserName(userAgent),
    version: getBrowserVersion(userAgent),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isMobile: /Mobi|Android/i.test(userAgent),
    isOldIE: /MSIE [6-9]\./.test(userAgent),
  };

  return {
    hasClipboardAPI,
    hasExecCommand,
    hasSelection,
    hasDocumentRange,
    supportsAsyncClipboard,
    isSecureContext,
    browserInfo,
  };
}

/**
 * Gets browser name from user agent
 */
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg'))
    return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
    return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident'))
    return 'Internet Explorer';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  return 'Unknown';
}

/**
 * Gets browser version from user agent
 */
function getBrowserVersion(userAgent: string): string {
  const patterns = [
    { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
    { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
    { name: 'Safari', pattern: /Version\/(\d+)/ },
    { name: 'Edge', pattern: /Edg\/(\d+)/ },
    { name: 'Internet Explorer', pattern: /(?:MSIE |rv:)(\d+)/ },
    { name: 'Opera', pattern: /(?:Opera|OPR)\/(\d+)/ },
  ];

  for (const { pattern } of patterns) {
    const match = userAgent.match(pattern);
    if (match) return match[1];
  }

  return 'Unknown';
}

/**
 * Advanced fallback clipboard methods for older browsers
 */
export class ClipboardFallbacks {
  private capabilities: BrowserCapabilities;

  constructor() {
    this.capabilities = detectBrowserCapabilities();
  }

  /**
   * Primary fallback using execCommand
   */
  async execCommandCopy(text: string): Promise<boolean> {
    if (!this.capabilities.hasExecCommand) {
      throw new Error('execCommand not supported');
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // Position off-screen but ensure it's focusable
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('tabindex', '-1');

      document.body.appendChild(textArea);

      // Focus and select text
      textArea.focus();
      textArea.select();

      // For mobile devices
      if (this.capabilities.browserInfo.isMobile) {
        textArea.setSelectionRange(0, text.length);
      }

      // Execute copy command
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (!successful) {
        throw new Error('execCommand copy returned false');
      }

      return true;
    } catch (error) {
      throw new Error(`execCommand fallback failed: ${error}`);
    }
  }

  /**
   * Selection-based fallback for older browsers
   */
  async selectionCopy(text: string): Promise<boolean> {
    if (
      !this.capabilities.hasSelection ||
      !this.capabilities.hasDocumentRange
    ) {
      throw new Error('Selection API not supported');
    }

    try {
      // Create a temporary div with the text
      const div = document.createElement('div');
      div.style.position = 'fixed';
      div.style.left = '-9999px';
      div.style.top = '-9999px';
      div.style.whiteSpace = 'pre-wrap';
      div.textContent = text;

      document.body.appendChild(div);

      // Create selection
      const selection = window.getSelection();
      const range = document.createRange();

      if (!selection) {
        throw new Error('Could not get window selection');
      }

      selection.removeAllRanges();
      range.selectNodeContents(div);
      selection.addRange(range);

      // Try to copy
      const successful = document.execCommand('copy');

      // Clean up
      selection.removeAllRanges();
      document.body.removeChild(div);

      if (!successful) {
        throw new Error('Selection copy failed');
      }

      return true;
    } catch (error) {
      throw new Error(`Selection fallback failed: ${error}`);
    }
  }

  /**
   * iOS-specific fallback
   */
  async iOSCopy(text: string): Promise<boolean> {
    if (!this.capabilities.browserInfo.isIOS) {
      throw new Error('Not an iOS device');
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);

      // iOS specific selection
      textArea.focus();
      textArea.setSelectionRange(0, text.length);

      // iOS requires user gesture context
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (!successful) {
        throw new Error('iOS copy failed');
      }

      return true;
    } catch (error) {
      throw new Error(`iOS fallback failed: ${error}`);
    }
  }

  /**
   * Legacy Internet Explorer fallback
   */
  async ieCopy(text: string): Promise<boolean> {
    if (!this.capabilities.browserInfo.isOldIE) {
      throw new Error('Not old Internet Explorer');
    }

    try {
      // IE specific clipboard access
      if ((window as any).clipboardData) {
        (window as any).clipboardData.setData('Text', text);
        return true;
      }

      throw new Error('IE clipboardData not available');
    } catch (error) {
      throw new Error(`IE fallback failed: ${error}`);
    }
  }

  /**
   * Attempts all available fallback methods in order of preference
   */
  async attemptAllFallbacks(text: string): Promise<boolean> {
    const methods = [
      { name: 'execCommand', method: () => this.execCommandCopy(text) },
      { name: 'selection', method: () => this.selectionCopy(text) },
      { name: 'iOS', method: () => this.iOSCopy(text) },
      { name: 'IE', method: () => this.ieCopy(text) },
    ];

    for (const { name, method } of methods) {
      try {
        const result = await method();
        if (result) {
          // Clipboard fallback succeeded
          return true;
        }
      } catch (error) {
        console.warn(
          `❌ Clipboard fallback failed with ${name} method:`,
          error
        );
        continue;
      }
    }

    throw new Error('All clipboard fallback methods failed');
  }

  /**
   * Gets the best fallback method for the current browser
   */
  getBestFallbackMethod(): string {
    if (this.capabilities.browserInfo.isOldIE) return 'IE';
    if (this.capabilities.browserInfo.isIOS) return 'iOS';
    if (this.capabilities.hasExecCommand) return 'execCommand';
    if (this.capabilities.hasSelection) return 'selection';
    return 'none';
  }

  /**
   * Checks if any fallback method is available
   */
  hasFallbackSupport(): boolean {
    return (
      this.capabilities.hasExecCommand ||
      this.capabilities.hasSelection ||
      this.capabilities.browserInfo.isIOS ||
      this.capabilities.browserInfo.isOldIE
    );
  }
}
