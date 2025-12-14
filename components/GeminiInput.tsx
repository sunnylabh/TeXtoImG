import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { generateLatexFromPrompt } from '../services/geminiService';

interface GeminiInputProps {
  onGenerate: (latex: string) => void;
}

export const GeminiInput: React.FC<GeminiInputProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const latex = await generateLatexFromPrompt(prompt);
      onGenerate(latex);
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message || 'Failed to generate latex'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-full flex items-center shadow-lg shadow-black/50 max-w-2xl mx-auto mb-6">
      <div className="pl-4 pr-2 text-zinc-400">
        <Sparkles size={18} className={loading ? "animate-pulse text-indigo-400" : ""} />
      </div>
      <form onSubmit={handleSubmit} className="flex-1 flex">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a formula (e.g. 'Quadratic Formula' or 'Schrodinger Equation')..."
          className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:ring-0 focus:outline-none py-3 px-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-full p-2 m-1 transition-colors"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  );
};