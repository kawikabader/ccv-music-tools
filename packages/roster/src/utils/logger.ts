/**
 * Development-only logging utility
 * Provides structured logging with categories, colors, and performance tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogCategory {
  COMPONENT = 'COMPONENT',
  HOOK = 'HOOK',
  AUTH = 'AUTH',
  DATA = 'DATA',
  USER_ACTION = 'USER_ACTION',
  PERFORMANCE = 'PERFORMANCE',
  CLIPBOARD = 'CLIPBOARD',
  MULTI_SELECT = 'MULTI_SELECT',
  NAVIGATION = 'NAVIGATION',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  component?: string;
  message: string;
  data?: any;
  duration?: number;
}

class Logger {
  private logs: LogEntry[] = [];
  private timers: Map<string, number> = new Map();
  private isEnabled: boolean;
  private minLogLevel: LogLevel;

  constructor() {
    // Enable minimal logging for debugging auth/loading issues
    this.isEnabled = import.meta.env.DEV;
    // Only show warnings and errors to reduce noise
    this.minLogLevel = LogLevel.WARN;
  }

  private formatMessage(
    level: LogLevel,
    category: LogCategory,
    component: string | undefined,
    message: string
  ): string {
    const timestamp = new Date().toLocaleTimeString();
    const levelStr = LogLevel[level];
    const componentStr = component ? `[${component}]` : '';
    return `🚀 ${timestamp} ${levelStr} ${category} ${componentStr} ${message}`;
  }

  private getStyleForCategory(category: LogCategory): string {
    const styles = {
      [LogCategory.COMPONENT]: 'color: #3B82F6; font-weight: bold',
      [LogCategory.HOOK]: 'color: #10B981; font-weight: bold',
      [LogCategory.AUTH]: 'color: #F59E0B; font-weight: bold',
      [LogCategory.DATA]: 'color: #8B5CF6; font-weight: bold',
      [LogCategory.USER_ACTION]: 'color: #EF4444; font-weight: bold',
      [LogCategory.PERFORMANCE]: 'color: #6B7280; font-weight: bold',
      [LogCategory.CLIPBOARD]: 'color: #EC4899; font-weight: bold',
      [LogCategory.MULTI_SELECT]: 'color: #14B8A6; font-weight: bold',
      [LogCategory.NAVIGATION]: 'color: #F97316; font-weight: bold',
      [LogCategory.ERROR]: 'color: #DC2626; font-weight: bold',
    };
    return styles[category] || 'color: #000';
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    component?: string
  ): void {
    if (!this.isEnabled || level < this.minLogLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      component,
      message,
      data,
    };

    this.logs.push(logEntry);

    const formattedMessage = this.formatMessage(
      level,
      category,
      component,
      message
    );
    const style = this.getStyleForCategory(category);

    switch (level) {
      case LogLevel.DEBUG:
        console.log(`%c${formattedMessage}`, style, data);
        break;
      case LogLevel.INFO:
        console.info(`%c${formattedMessage}`, style, data);
        break;
      case LogLevel.WARN:
        console.warn(`%c${formattedMessage}`, style, data);
        break;
      case LogLevel.ERROR:
        console.error(`%c${formattedMessage}`, style, data);
        break;
    }
  }

  // Convenience methods
  debug(
    category: LogCategory,
    message: string,
    data?: any,
    component?: string
  ): void {
    this.log(LogLevel.DEBUG, category, message, data, component);
  }

  info(
    category: LogCategory,
    message: string,
    data?: any,
    component?: string
  ): void {
    this.log(LogLevel.INFO, category, message, data, component);
  }

  warn(
    category: LogCategory,
    message: string,
    data?: any,
    component?: string
  ): void {
    this.log(LogLevel.WARN, category, message, data, component);
  }

  error(
    category: LogCategory,
    message: string,
    data?: any,
    component?: string
  ): void {
    this.log(LogLevel.ERROR, category, message, data, component);
  }

  // Performance tracking
  startTimer(timerName: string): void {
    if (!this.isEnabled) return;
    this.timers.set(timerName, performance.now());
    // Don't log timer starts anymore to reduce noise
  }

  endTimer(timerName: string, message?: string): number | null {
    if (!this.isEnabled) return null;

    const startTime = this.timers.get(timerName);
    if (!startTime) {
      this.warn(LogCategory.PERFORMANCE, `⚠️ Timer ${timerName} not found`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(timerName);

    // Only log slow operations (>100ms) as warnings
    if (duration > 100) {
      const logMessage = message
        ? `⏱️ SLOW: ${message} (${duration.toFixed(2)}ms)`
        : `⏱️ SLOW: Timer ${timerName} completed in ${duration.toFixed(2)}ms`;
      this.warn(LogCategory.PERFORMANCE, logMessage, { duration });
    }

    return duration;
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: any): void {
    this.info(
      LogCategory.COMPONENT,
      `🔄 Component mounted`,
      props,
      componentName
    );
  }

  componentUnmount(componentName: string): void {
    this.info(
      LogCategory.COMPONENT,
      `❌ Component unmounted`,
      undefined,
      componentName
    );
  }

  componentUpdate(componentName: string, changes: any): void {
    this.debug(
      LogCategory.COMPONENT,
      `🔄 Component updated`,
      changes,
      componentName
    );
  }

  // User action logging
  userAction(action: string, target: string, data?: any): void {
    this.info(LogCategory.USER_ACTION, `👆 ${action} on ${target}`, data);
  }

  // Hook lifecycle logging
  hookCall(hookName: string, params?: any): void {
    this.debug(LogCategory.HOOK, `🎣 Hook called`, params, hookName);
  }

  hookResult(hookName: string, result?: any): void {
    this.debug(LogCategory.HOOK, `🎯 Hook result`, result, hookName);
  }

  // Data operations
  dataFetch(operation: string, params?: any): void {
    this.info(LogCategory.DATA, `📥 Fetching ${operation}`, params);
  }

  dataSuccess(operation: string, result?: any): void {
    this.info(LogCategory.DATA, `✅ ${operation} successful`, result);
  }

  dataError(operation: string, error: any): void {
    this.error(LogCategory.DATA, `❌ ${operation} failed`, error);
  }

  // Multi-select operations
  selectionChange(
    action: 'add' | 'remove' | 'clear',
    target?: string,
    newCount?: number
  ): void {
    this.info(
      LogCategory.MULTI_SELECT,
      `🔲 Selection ${action}${target ? ` - ${target}` : ''}`,
      { newCount }
    );
  }

  // Clipboard operations
  clipboardCopy(count: number, format: string): void {
    this.info(
      LogCategory.CLIPBOARD,
      `📋 Copied ${count} items in ${format} format`
    );
  }

  clipboardError(error: string): void {
    this.error(LogCategory.CLIPBOARD, `📋 Clipboard error: ${error}`);
  }

  // Get all logs (for debugging)
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports with proper binding
export const debug = (
  category: LogCategory,
  message: string,
  data?: any,
  component?: string
) => logger.debug(category, message, data, component);

export const info = (
  category: LogCategory,
  message: string,
  data?: any,
  component?: string
) => logger.info(category, message, data, component);

export const warn = (
  category: LogCategory,
  message: string,
  data?: any,
  component?: string
) => logger.warn(category, message, data, component);

export const error = (
  category: LogCategory,
  message: string,
  data?: any,
  component?: string
) => logger.error(category, message, data, component);

export const startTimer = (timerName: string) => logger.startTimer(timerName);

export const endTimer = (timerName: string, message?: string) =>
  logger.endTimer(timerName, message);

export const componentMount = (componentName: string, props?: any) =>
  logger.componentMount(componentName, props);

export const componentUnmount = (componentName: string) =>
  logger.componentUnmount(componentName);

export const componentUpdate = (componentName: string, changes: any) =>
  logger.componentUpdate(componentName, changes);

export const userAction = (action: string, target: string, data?: any) =>
  logger.userAction(action, target, data);

export const hookCall = (hookName: string, params?: any) =>
  logger.hookCall(hookName, params);

export const hookResult = (hookName: string, result?: any) =>
  logger.hookResult(hookName, result);

export const dataFetch = (operation: string, params?: any) =>
  logger.dataFetch(operation, params);

export const dataSuccess = (operation: string, result?: any) =>
  logger.dataSuccess(operation, result);

export const dataError = (operation: string, error: any) =>
  logger.dataError(operation, error);

export const selectionChange = (
  action: 'add' | 'remove' | 'clear',
  target?: string,
  newCount?: number
) => logger.selectionChange(action, target, newCount);

export const clipboardCopy = (count: number, format: string) =>
  logger.clipboardCopy(count, format);

export const clipboardError = (error: string) => logger.clipboardError(error);
