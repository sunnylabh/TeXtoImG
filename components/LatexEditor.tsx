import React from 'react';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const LatexEditor: React.FC<LatexEditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <div className="bg-zinc-850 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">LaTeX Source</span>
      </div>
      <textarea
        className="flex-1 w-full bg-transparent text-zinc-300 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Enter LaTeX code here..."
      />
    </div>
  );
};