import React, { useState } from 'react';
import { Trash2, Download, Upload, RotateCcw, BarChart3 } from 'lucide-react';
import useMistakeStorage from '../hooks/useMistakeStorage';
import Dashboard from './Dashboard';

export const MistakeHistory = () => {
  const { logs, removeLog, clearLogs, exportLogs, importLogs, getStats, isLoading } = useMistakeStorage();
  const [selectedLog, setSelectedLog] = useState(null);
  const [importError, setImportError] = useState(null);
  const [view, setView] = useState('history'); // 'history' or 'analytics'
  const stats = getStats();

  const handleExport = () => {
    const jsonData = exportLogs();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonData));
    element.setAttribute('download', `mistake-logs-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        const result = importLogs(content);
        if (result.success) {
          setImportError(null);
          alert(`Successfully imported ${result.count} logs`);
        } else {
          setImportError(result.error);
        }
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading history...</div>;
  }

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  const getMistakeColor = (type) => {
    switch (type) {
      case 'logical':
        return 'text-red-400';
      case 'factual':
        return 'text-yellow-400';
      case 'grammar':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            view === 'history'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📋 History
        </button>
        <button
          onClick={() => setView('analytics')}
          disabled={logs.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            view === 'analytics'
              ? 'bg-cyan-600 text-white'
              : logs.length === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <BarChart3 size={20} />
          Analytics
        </button>
      </div>

      {/* Analytics View */}
      {view === 'analytics' ? (
        <Dashboard mistakeHistory={logs} />
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Logs</div>
          <div className="text-3xl font-bold text-cyan-400">{stats.totalLogs}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Words</div>
          <div className="text-3xl font-bold text-cyan-400">{stats.totalWords}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Risk Score</div>
          <div className="text-3xl font-bold text-cyan-400">{stats.avgRiskScore}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Issues</div>
          <div className="text-3xl font-bold text-cyan-400">{stats.totalMistakes}</div>
        </div>
      </div>

      {/* Mistake types breakdown */}
      {stats.totalMistakes > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-cyan-400 mb-3">Issues by Type</h3>
          <div className="flex gap-4">
            {stats.mistakesByType.logical > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-300">Logical: {stats.mistakesByType.logical}</span>
              </div>
            )}
            {stats.mistakesByType.factual > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                <span className="text-sm text-gray-300">Factual: {stats.mistakesByType.factual}</span>
              </div>
            )}
            {stats.mistakesByType.grammar > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-300">Grammar: {stats.mistakesByType.grammar}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <label className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold cursor-pointer transition-colors">
          <Upload size={20} />
          Import
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          <Download size={20} />
          Export
        </button>
        <button
          onClick={() => clearLogs()}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          <RotateCcw size={20} />
          Clear All
        </button>
      </div>

      {importError && (
        <div className="bg-red-900 border border-red-700 p-4 rounded-lg text-red-200">
          ❌ {importError}
        </div>
      )}

      {/* History list */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-cyan-400">History</h3>
        {logs.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center text-gray-400">
            <p className="text-lg">📝 No analysis history yet</p>
            <p className="text-sm mt-2">Start analyzing text to build your history</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-700 transition-colors">
                <button
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  className="w-full text-left"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-gray-200 font-medium line-clamp-1">
                        {log.originalText.substring(0, 60)}
                        {log.originalText.length > 60 ? '...' : ''}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className={`text-sm font-bold ${log.riskScore > 70 ? 'text-red-400' : log.riskScore > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {log.riskScore}%
                      </div>
                      <div className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {log.mistakes.length} issue{log.mistakes.length !== 1 ? 's' : ''}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLog(log.id);
                        }}
                        className="p-1 hover:bg-red-900 rounded transition-colors"
                        title="Delete this log"
                      >
                        <Trash2 size={18} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {selectedLog?.id === log.id && log.mistakes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                    {log.mistakes.map((mistake, idx) => (
                      <div key={idx} className="bg-gray-900 p-3 rounded text-sm">
                        <div className={`font-semibold ${getMistakeColor(mistake.type)}`}>
                          {mistake.type}
                        </div>
                        <div className="text-gray-300 mt-1">{mistake.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Position: {mistake.startIndex}–{mistake.endIndex}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default MistakeHistory;
