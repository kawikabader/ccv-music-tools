import React, { useState, useEffect } from 'react';
import { logger, LogCategory, LogLevel } from '../../utils/logger';

/**
 * Development-only log viewer component
 * Shows all application logs with filtering and export capabilities
 */
export function LogViewer() {
  const [logs, setLogs] = useState(logger.getLogs());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);

  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
      return false;
    }
    if (selectedLevel !== 'ALL' && log.level !== selectedLevel) {
      return false;
    }
    return true;
  });

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roster-logs-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'text-gray-600';
      case LogLevel.INFO: return 'text-blue-600';
      case LogLevel.WARN: return 'text-yellow-600';
      case LogLevel.ERROR: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: LogCategory) => {
    const colors = {
      [LogCategory.COMPONENT]: 'bg-blue-100 text-blue-800',
      [LogCategory.HOOK]: 'bg-green-100 text-green-800',
      [LogCategory.AUTH]: 'bg-yellow-100 text-yellow-800',
      [LogCategory.DATA]: 'bg-purple-100 text-purple-800',
      [LogCategory.USER_ACTION]: 'bg-red-100 text-red-800',
      [LogCategory.PERFORMANCE]: 'bg-gray-100 text-gray-800',
      [LogCategory.CLIPBOARD]: 'bg-pink-100 text-pink-800',
      [LogCategory.MULTI_SELECT]: 'bg-teal-100 text-teal-800',
      [LogCategory.NAVIGATION]: 'bg-orange-100 text-orange-800',
      [LogCategory.ERROR]: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Development Logs"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {logs.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {logs.length > 99 ? '99+' : logs.length}
          </span>
        )}
      </button>

      {/* Log Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Development Logs</h3>
              <div className="flex space-x-1">
                <button
                  onClick={handleClear}
                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                >
                  Clear
                </button>
                <button
                  onClick={handleExport}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  Export
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 text-xs">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as LogCategory | 'ALL')}
                className="flex-1 border border-gray-300 rounded px-2 py-1"
              >
                <option value="ALL">All Categories</option>
                {Object.values(LogCategory).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'ALL')}
                className="flex-1 border border-gray-300 rounded px-2 py-1"
              >
                <option value="ALL">All Levels</option>
                <option value={LogLevel.DEBUG}>DEBUG</option>
                <option value={LogLevel.INFO}>INFO</option>
                <option value={LogLevel.WARN}>WARN</option>
                <option value={LogLevel.ERROR}>ERROR</option>
              </select>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <span>{filteredLogs.length} logs</span>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="text-blue-600"
                />
                <span>Auto-scroll</span>
              </label>
            </div>
          </div>

          {/* Logs */}
          <div className="overflow-y-auto max-h-64 p-2 space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">No logs to display</div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="text-xs border-b border-gray-100 pb-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-xs ${getCategoryColor(log.category)}`}>
                      {log.category}
                    </span>
                    <span className={getLevelColor(log.level)}>
                      {LogLevel[log.level]}
                    </span>
                    {log.component && (
                      <span className="text-gray-600 bg-gray-100 px-1 py-0.5 rounded">
                        {log.component}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-900">{log.message}</div>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        Data
                      </summary>
                      <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 