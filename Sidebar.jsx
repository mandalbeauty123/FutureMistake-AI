import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const Sidebar = ({ mistakes = [], onMistakeClick = () => {} }) => {
  const [expandedCategories, setExpandedCategories] = useState({
    logical: true,
    factual: true,
    grammar: true
  });

  // Categorize mistakes
  const categorized = {
    logical: mistakes.filter(m => m.type === 'logical'),
    factual: mistakes.filter(m => m.type === 'factual'),
    grammar: mistakes.filter(m => m.type === 'grammar')
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const categoryConfig = {
    logical: {
      label: 'Logical Errors',
      color: 'text-red-400',
      bgColor: 'bg-red-900',
      borderColor: 'border-red-700',
      hoverBg: 'hover:bg-red-800',
      badge: 'bg-red-600'
    },
    factual: {
      label: 'Factual Errors',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900',
      borderColor: 'border-yellow-700',
      hoverBg: 'hover:bg-yellow-800',
      badge: 'bg-yellow-600'
    },
    grammar: {
      label: 'Grammar Errors',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900',
      borderColor: 'border-blue-700',
      hoverBg: 'hover:bg-blue-800',
      badge: 'bg-blue-600'
    }
  };

  const CategorySection = ({ category, label, mistakes }) => {
    const config = categoryConfig[category];
    const isExpanded = expandedCategories[category];

    return (
      <div className="border border-gray-700 rounded-lg overflow-hidden mb-4">
        <button
          onClick={() => toggleCategory(category)}
          className={`w-full p-3 flex items-center justify-between ${config.bgColor} ${config.hoverBg} transition-colors`}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown size={20} className="text-cyan-400" />
            ) : (
              <ChevronRight size={20} className="text-cyan-400" />
            )}
            <span className="font-semibold text-white">{label}</span>
          </div>
          <span className={`${config.badge} text-white px-3 py-1 rounded-full text-sm font-bold`}>
            {mistakes.length}
          </span>
        </button>

        {isExpanded && mistakes.length > 0 && (
          <div className="bg-gray-800 border-t border-gray-700">
            {mistakes.map((mistake, idx) => (
              <button
                key={idx}
                onClick={() => onMistakeClick(mistake)}
                className={`w-full text-left p-3 border-b border-gray-700 last:border-b-0 ${config.hoverBg} transition-colors`}
              >
                <div className={`text-sm font-medium ${config.color} truncate`}>
                  {mistake.message}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Position: {mistake.startIndex}–{mistake.endIndex}
                </div>
              </button>
            ))}
          </div>
        )}

        {isExpanded && mistakes.length === 0 && (
          <div className="bg-gray-800 p-4 text-center text-gray-400 text-sm">
            No {category} errors found
          </div>
        )}
      </div>
    );
  };

  const totalMistakes = Object.values(categorized).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 p-4 flex flex-col h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-2">📋 Mistakes</h2>
        <div className="text-sm text-gray-400">
          Found <span className={totalMistakes > 0 ? 'text-cyan-400 font-bold' : 'text-gray-500'}>{totalMistakes}</span> total{' '}
          {totalMistakes === 1 ? 'issue' : 'issues'}
        </div>
      </div>

      <div className="space-y-2">
        <CategorySection
          category="logical"
          label="Logical Errors"
          mistakes={categorized.logical}
        />
        <CategorySection
          category="factual"
          label="Factual Errors"
          mistakes={categorized.factual}
        />
        <CategorySection
          category="grammar"
          label="Grammar Errors"
          mistakes={categorized.grammar}
        />
      </div>

      {totalMistakes === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg">✨</p>
            <p className="text-sm font-medium">No errors!</p>
            <p className="text-xs mt-1">Your text looks great.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
