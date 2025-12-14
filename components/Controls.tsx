import React from 'react';
import { ExportSettings } from '../types';
import { Settings, Moon, Sun, Check } from 'lucide-react';

interface ControlsProps {
  settings: ExportSettings;
  onChange: (s: ExportSettings) => void;
}

export const Controls: React.FC<ControlsProps> = ({ settings, onChange }) => {
  
  const update = (key: keyof ExportSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-zinc-100 font-medium mb-2">
        <Settings size={18} />
        <span>Export Settings</span>
      </div>

      {/* Theme Toggle */}
      <div className="space-y-2">
         <label className="text-xs text-zinc-500 uppercase font-semibold">Appearance</label>
         <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button 
                onClick={() => update('theme', 'light')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-colors ${settings.theme === 'light' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                <Sun size={14} /> Light
            </button>
            <button 
                onClick={() => update('theme', 'dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-colors ${settings.theme === 'dark' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                <Moon size={14} /> Dark
            </button>
         </div>
      </div>

      {/* Format */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500 uppercase font-semibold">Format</label>
        <div className="grid grid-cols-2 gap-2">
            {(['png', 'jpeg'] as const).map(fmt => (
                <button
                    key={fmt}
                    onClick={() => update('format', fmt)}
                    className={`px-3 py-2 rounded border text-sm font-mono uppercase transition-all ${
                        settings.format === fmt 
                        ? 'bg-zinc-100 text-black border-transparent' 
                        : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
                    }`}
                >
                    {fmt}
                </button>
            ))}
        </div>
      </div>

      {/* Scale/Quality */}
      <div className="space-y-2">
        <div className="flex justify-between">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Quality (Scale)</label>
            <span className="text-xs text-zinc-300 font-mono">{settings.scale}x</span>
        </div>
        <input 
            type="range" 
            min="1" 
            max="5" 
            step="0.5"
            value={settings.scale}
            onChange={(e) => update('scale', parseFloat(e.target.value))}
            className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        />
      </div>

       {/* Padding */}
      <div className="space-y-2">
        <div className="flex justify-between">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Padding</label>
            <span className="text-xs text-zinc-300 font-mono">{settings.padding}px</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={settings.padding}
            onChange={(e) => update('padding', parseInt(e.target.value))}
             className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Transparent Toggle (Only for PNG) */}
      <div className={`flex items-center justify-between p-2 rounded border border-zinc-800 ${settings.format === 'jpeg' ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <label className="text-sm text-zinc-300">Transparent Background</label>
        <button
            disabled={settings.format === 'jpeg'}
            onClick={() => update('transparent', !settings.transparent)}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                settings.transparent && settings.format !== 'jpeg'
                ? 'bg-white border-white text-black' 
                : 'bg-transparent border-zinc-600'
            }`}
        >
            {settings.transparent && <Check size={14} />}
        </button>
      </div>
      {settings.format === 'jpeg' && settings.transparent && (
        <p className="text-[10px] text-zinc-500 mt-[-10px]">Transparency not supported in JPEG</p>
      )}

    </div>
  );
};