import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Analytics Dashboard Component
 * 
 * Displays mistake analysis data with interactive charts
 * 
 * @param {Array} mistakeHistory - Array of log entries with mistakes data
 * @example
 * <Dashboard mistakeHistory={logs} />
 */
export const Dashboard = ({ mistakeHistory = [] }) => {
  // Process data for BarChart (mistakes by category per day)
  const dailyData = useMemo(() => {
    const dataMap = {};

    mistakeHistory.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      if (!dataMap[date]) {
        dataMap[date] = { date, logical: 0, factual: 0, grammar: 0 };
      }

      log.mistakes?.forEach(mistake => {
        if (mistake.type === 'logical') {
          dataMap[date].logical++;
        } else if (mistake.type === 'factual') {
          dataMap[date].factual++;
        } else if (mistake.type === 'grammar') {
          dataMap[date].grammar++;
        }
      });
    });

    return Object.values(dataMap).slice(-7); // Last 7 days
  }, [mistakeHistory]);

  // Process data for LineChart (risk score trend)
  const trendData = useMemo(() => {
    return mistakeHistory
      .map(log => ({
        date: new Date(log.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        risk: log.riskScore || 0,
        timestamp: log.timestamp
      }))
      .slice(-7); // Last 7 entries
  }, [mistakeHistory]);

  // Process data for PieChart (mistake type distribution)
  const pieData = useMemo(() => {
    const counts = { logical: 0, factual: 0, grammar: 0 };

    mistakeHistory.forEach(log => {
      log.mistakes?.forEach(mistake => {
        if (mistake.type in counts) {
          counts[mistake.type]++;
        }
      });
    });

    return [
      { name: 'Logical Errors', value: counts.logical, fill: '#ef4444' },
      { name: 'Factual Errors', value: counts.factual, fill: '#eab308' },
      { name: 'Grammar Errors', value: counts.grammar, fill: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [mistakeHistory]);

  // Custom tooltip for charts with dark theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-cyan-700 p-3 rounded shadow-lg">
          <p className="text-cyan-400 font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!mistakeHistory || mistakeHistory.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400 text-lg">📊 No data available yet</p>
        <p className="text-gray-500 text-sm mt-2">Start analyzing text to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-cyan-400">📊 Analytics Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Analyses</div>
          <div className="text-3xl font-bold text-cyan-400 mt-2">{mistakeHistory.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Issues Found</div>
          <div className="text-3xl font-bold text-red-400 mt-2">
            {mistakeHistory.reduce((sum, log) => sum + (log.mistakes?.length || 0), 0)}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Risk Score</div>
          <div className="text-3xl font-bold text-yellow-400 mt-2">
            {mistakeHistory.length > 0
              ? (
                  mistakeHistory.reduce((sum, log) => sum + (log.riskScore || 0), 0) /
                  mistakeHistory.length
                ).toFixed(1)
              : '0'}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Words Analyzed</div>
          <div className="text-3xl font-bold text-cyan-400 mt-2">
            {mistakeHistory.reduce(
              (sum, log) => sum + (log.originalText?.split(/\s+/).length || 0),
              0
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart - Mistakes by Category */}
      {dailyData.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-cyan-400 mb-4">Daily Mistakes by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #4b5563',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="logical" fill="#ef4444" name="Logical Errors" radius={[8, 8, 0, 0]} />
              <Bar dataKey="factual" fill="#eab308" name="Factual Errors" radius={[8, 8, 0, 0]} />
              <Bar dataKey="grammar" fill="#3b82f6" name="Grammar Errors" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Line Chart - Risk Score Trend */}
      {trendData.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-cyan-400 mb-4">Risk Score Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #4b5563',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="risk"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 5 }}
                activeDot={{ r: 7 }}
                name="Risk Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie Chart - Mistake Type Distribution */}
      {pieData.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-cyan-400 mb-4">Mistake Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: '#06b6d4'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-2">Mistakes by Type</p>
            <div className="space-y-2">
              {pieData.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    ></div>
                    <span className="text-gray-300 text-sm">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-200">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Analysis Stats</p>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Total Texts Analyzed: <span className="font-bold text-cyan-400">{mistakeHistory.length}</span></p>
              <p>Total Issues: <span className="font-bold text-red-400">{mistakeHistory.reduce((sum, log) => sum + (log.mistakes?.length || 0), 0)}</span></p>
              <p>Avg Issues per Text: <span className="font-bold text-yellow-400">{(mistakeHistory.reduce((sum, log) => sum + (log.mistakes?.length || 0), 0) / mistakeHistory.length).toFixed(1)}</span></p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Risk Statistics</p>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Highest Risk: <span className={`font-bold ${Math.max(...mistakeHistory.map(l => l.riskScore || 0)) > 70 ? 'text-red-400' : 'text-yellow-400'}`}>{Math.max(...mistakeHistory.map(l => l.riskScore || 0))}%</span></p>
              <p>Lowest Risk: <span className="font-bold text-green-400">{Math.min(...mistakeHistory.map(l => l.riskScore || 0))}%</span></p>
              <p>Average Risk: <span className="font-bold text-cyan-400">{(mistakeHistory.reduce((sum, log) => sum + (log.riskScore || 0), 0) / mistakeHistory.length).toFixed(1)}%</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
