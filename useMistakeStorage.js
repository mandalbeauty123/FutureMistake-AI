import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing mistake logs with localStorage persistence
 * 
 * Each log entry has:
 * - id: unique identifier (UUID)
 * - timestamp: ISO 8601 timestamp
 * - originalText: the text that was analyzed
 * - mistakes: array of mistake objects
 * - riskScore: 0-100 risk assessment
 * 
 * @returns {Object} {
 *   logs: Array<LogEntry>,
 *   addLog: (originalText, mistakes, riskScore) => void,
 *   removeLog: (id) => void,
 *   clearLogs: () => void,
 *   exportLogs: () => string (JSON),
 *   importLogs: (jsonString) => void,
 *   isLoading: boolean
 * }
 * 
 * @example
 * const { logs, addLog, removeLog, clearLogs } = useMistakeStorage();
 * 
 * // Add a new log
 * addLog("Some text...", [{ type: 'grammar', startIndex: 0, endIndex: 5, message: 'Error' }], 45);
 * 
 * // Remove by ID
 * removeLog("log-id-123");
 * 
 * // Clear all logs
 * clearLogs();
 */
export const useMistakeStorage = (storageKey = 'mistakeLogs') => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Load logs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLogs(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading logs from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Persist logs to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(logs));
      } catch (error) {
        console.error('Error saving logs to localStorage:', error);
      }
    }
  }, [logs, storageKey, isLoading]);

  // Add a new log entry
  const addLog = useCallback((originalText, mistakes = [], riskScore = 0) => {
    const newLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      originalText: originalText || '',
      mistakes: Array.isArray(mistakes) ? mistakes : [],
      riskScore: Math.min(100, Math.max(0, riskScore || 0))
    };

    setLogs(prev => [newLog, ...prev]);
    return newLog.id;
  }, [generateId]);

  // Remove a log entry by ID
  const removeLog = useCallback((id) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  }, []);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Export logs as JSON string
  const exportLogs = useCallback(() => {
    return JSON.stringify(logs, null, 2);
  }, [logs]);

  // Import logs from JSON string
  const importLogs = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        // Validate structure
        const validLogs = imported.filter(log => 
          log.id && log.timestamp && log.originalText !== undefined && Array.isArray(log.mistakes) && log.riskScore >= 0
        );
        setLogs(validLogs);
        return { success: true, count: validLogs.length };
      }
      return { success: false, error: 'Invalid format: expected array' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Get statistics about logs
  const getStats = useCallback(() => {
    const totalLogs = logs.length;
    const totalWords = logs.reduce((sum, log) => sum + (log.originalText?.split(/\s+/).length || 0), 0);
    const avgRiskScore = totalLogs > 0 ? (logs.reduce((sum, log) => sum + log.riskScore, 0) / totalLogs).toFixed(2) : 0;
    const totalMistakes = logs.reduce((sum, log) => sum + (log.mistakes?.length || 0), 0);

    return {
      totalLogs,
      totalWords,
      avgRiskScore: parseFloat(avgRiskScore),
      totalMistakes,
      mistakesByType: logs.reduce((acc, log) => {
        log.mistakes?.forEach(mistake => {
          acc[mistake.type] = (acc[mistake.type] || 0) + 1;
        });
        return acc;
      }, {})
    };
  }, [logs]);

  return {
    logs,
    addLog,
    removeLog,
    clearLogs,
    exportLogs,
    importLogs,
    getStats,
    isLoading
  };
};

export default useMistakeStorage;
