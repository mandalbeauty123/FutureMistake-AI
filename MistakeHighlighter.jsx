import React from 'react';

/**
 * MistakeHighlighter Component
 * 
 * Displays text with highlighted mistakes of different types.
 * 
 * @param {string} text - The text to display and highlight
 * @param {Array<Object>} mistakes - Array of mistake objects with:
 *   - type: "logical" | "factual" | "grammar"
 *   - startIndex: number (character position where mistake starts)
 *   - endIndex: number (character position where mistake ends)
 *   - message: string (tooltip text to show on hover)
 */
export const MistakeHighlighter = ({ text = '', mistakes = [] }) => {
  if (!text) return null;

  // Sort mistakes by startIndex to process them in order
  const sortedMistakes = [...mistakes].sort((a, b) => a.startIndex - b.startIndex);

  // Build segments of text and mistakes
  const segments = [];
  let lastIndex = 0;

  for (const mistake of sortedMistakes) {
    // Add normal text before this mistake
    if (lastIndex < mistake.startIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, mistake.startIndex),
      });
    }

    // Add the mistake highlight
    segments.push({
      type: 'mistake',
      content: text.substring(mistake.startIndex, mistake.endIndex),
      mistakeType: mistake.type,
      message: mistake.message,
    });

    lastIndex = mistake.endIndex;
  }

  // Add remaining text after last mistake
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  const getColorClasses = (mistakeType) => {
    switch (mistakeType) {
      case 'logical':
        return 'bg-red-700 text-white';        // 🔴 Red
      case 'factual':
        return 'bg-yellow-600 text-gray-900';  // 🟡 Yellow
      case 'grammar':
        return 'bg-blue-700 text-white';       // 🔵 Blue
      case 'math':
        return 'bg-green-700 text-white';      // 🟢 Green
      case 'science':
        return 'bg-purple-700 text-white';     // 🟣 Purple
      case 'history':
        return 'bg-orange-700 text-white';     // 🟠 Orange
      case 'health':
        return 'bg-gray-600 text-white';       // ⚪ Gray/White
      case 'technology':
        return 'bg-cyan-700 text-white';       // 🔵 Cyan
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="bg-gray-950 text-white p-4 rounded-lg">
      <p className="text-base leading-relaxed">
        {segments.map((segment, idx) =>
          segment.type === 'text' ? (
            <span key={idx}>{segment.content}</span>
          ) : (
            <span
              key={idx}
              className={`${getColorClasses(
                segment.mistakeType
              )} rounded px-1.5 py-0.5 cursor-help font-medium transition-opacity hover:opacity-90`}
              title={segment.message}
            >
              {segment.content}
            </span>
          )
        )}
      </p>
    </div>
  );
};

export default MistakeHighlighter;
