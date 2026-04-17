import React from 'react';

export default function ErrorCards({ analysisResult, mistakes }) {
  if (!analysisResult) return null;

  const categoryConfig = [
    { 
      key: 'logical', 
      label: 'Logical Errors', 
      color: 'bg-red-950 border-red-500', 
      badge: 'bg-red-500',
      icon: '🔴'
    },
    { 
      key: 'factual', 
      label: 'Factual Errors', 
      color: 'bg-yellow-950 border-yellow-500', 
      badge: 'bg-yellow-500',
      icon: '🟡'
    },
    { 
      key: 'grammar', 
      label: 'Grammar Errors', 
      color: 'bg-blue-950 border-blue-500', 
      badge: 'bg-blue-500',
      icon: '🔵'
    },
    { 
      key: 'math', 
      label: 'Math Errors', 
      color: 'bg-green-950 border-green-500', 
      badge: 'bg-green-500',
      icon: '🟢'
    },
    { 
      key: 'science', 
      label: 'Science Facts', 
      color: 'bg-purple-950 border-purple-500', 
      badge: 'bg-purple-500',
      icon: '🟣'
    },
    { 
      key: 'history', 
      label: 'History Facts', 
      color: 'bg-orange-950 border-orange-500', 
      badge: 'bg-orange-500',
      icon: '🟠'
    },
    { 
      key: 'health', 
      label: 'Health Myths', 
      color: 'bg-gray-850 border-gray-400', 
      badge: 'bg-gray-400',
      icon: '⚪'
    },
    { 
      key: 'technology', 
      label: 'Tech Facts', 
      color: 'bg-cyan-950 border-cyan-400', 
      badge: 'bg-cyan-400',
      icon: '🔵'
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categoryConfig.map(({ key, label, color, badge, icon }) => {
        const categoryMistakes = analysisResult[key] || [];
        
        if (categoryMistakes.length === 0) return null;

        return (
          <div 
            key={key} 
            className={`${color} border-2 rounded-lg p-4 shadow-lg hover:shadow-xl transition`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {icon} {label}
              </h3>
              <span className={`${badge} text-gray-900 font-bold px-3 py-1 rounded-full text-sm`}>
                {categoryMistakes.length}
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categoryMistakes.slice(0, 3).map((mistake, idx) => (
                <div key={idx} className="text-sm text-gray-200 bg-gray-950 bg-opacity-50 p-2 rounded border border-gray-700">
                  <p className="font-semibold text-white truncate">
                    {mistake.match || mistake.message.substring(0, 30)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {mistake.message.substring(0, 80)}...
                  </p>
                </div>
              ))}
              {categoryMistakes.length > 3 && (
                <p className="text-xs text-gray-400 italic">
                  +{categoryMistakes.length - 3} more {label.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
