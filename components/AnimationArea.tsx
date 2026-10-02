import React, { useEffect, useRef, useState } from 'react';
import { AnimationSettings, ExportSettings } from '../types';
import { renderAnimation } from '../services/manimService';
import { AlertCircle, Clapperboard, Download, Loader2, Play, RefreshCw } from 'lucide-react';

interface AnimationAreaProps {
  latex: string;
  theme: ExportSettings['theme'];
  /** Incremented by the parent to request a render (e.g. after AI generation). */
  renderToken: number;
}

const STYLES: { value: AnimationSettings['style']; label: string }[] = [
  { value: 'write', label: 'Write' },
  { value: 'lines', label: 'Line by line' },
  { value: 'fade', label: 'Fade in' },
  { value: 'highlight', label: 'Highlight' },
];
const ALL_QUALITIES: { value: AnimationSettings['quality']; label: string }[] = [
  { value: 'low', label: '480p' },
  { value: 'medium', label: '720p' },
  { value: 'high', label: '1080p' },
];
// Builds for a small render host set VITE_MANIM_MAX_QUALITY to hide what it can't do
const maxQualityIndex = ALL_QUALITIES.findIndex(q => q.value === import.meta.env.VITE_MANIM_MAX_QUALITY);
const QUALITIES = maxQualityIndex >= 0 ? ALL_QUALITIES.slice(0, maxQualityIndex + 1) : ALL_QUALITIES;
const DEFAULT_QUALITY = QUALITIES[Math.min(1, QUALITIES.length - 1)].value;

interface Result {
  url: string;
  format: AnimationSettings['format'];
  key: string;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
            value === o.value ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const AnimationArea: React.FC<AnimationAreaProps> = ({ latex, theme, renderToken }) => {
  const [settings, setSettings] = useState<AnimationSettings>({
    style: 'write',
    format: 'gif',
    quality: DEFAULT_QUALITY,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentKey = JSON.stringify({ latex, theme, settings });
  const isStale = result !== null && result.key !== currentKey;

  const handleRender = async () => {
    if (!latex.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const blob = await renderAnimation(latex, settings, theme, controller.signal);
      setResult({ url: URL.createObjectURL(blob), format: settings.format, key: currentKey });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError((e as Error).message || 'Failed to render animation.');
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  // Render automatically when the parent asks (new LaTeX from the AI prompt)
  useEffect(() => {
    if (renderToken > 0) handleRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderToken]);

  // A sleeping free-tier server can take a while to answer the first request
  useEffect(() => {
    setSlow(false);
    if (!loading) return;
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Cancel in-flight requests on unmount; release each object URL once replaced
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.download = `latex_animation_${Date.now()}.${result.format}`;
    link.href = result.url;
    link.click();
  };

  const update = <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden relative">
      <div className="bg-zinc-850 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Animation</span>
        <span className="text-[10px] text-zinc-600 font-mono">Manim</span>
      </div>

      {/* Animation settings */}
      <div className="px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center gap-2">
        <Segmented options={STYLES} value={settings.style} onChange={v => update('style', v)} />
        <Segmented
          options={[{ value: 'gif', label: 'GIF' }, { value: 'mp4', label: 'MP4' }]}
          value={settings.format}
          onChange={v => update('format', v)}
        />
        {QUALITIES.length > 1 && (
          <Segmented options={QUALITIES} value={settings.quality} onChange={v => update('quality', v)} />
        )}
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-8 pb-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-950/50 relative">
        {error ? (
          <div className="flex flex-col items-center justify-center text-red-400 gap-2 bg-red-900/10 px-6 py-4 rounded-lg border border-red-900/30 max-w-md text-center">
            <AlertCircle size={24} />
            <span className="text-sm font-mono break-words">{error}</span>
          </div>
        ) : result ? (
          <div className={`shadow-2xl transition-opacity ${loading || isStale ? 'opacity-50' : ''}`}>
            {result.format === 'gif' ? (
              <img src={result.url} alt="Animated equation" className="max-w-full max-h-[50vh] block" />
            ) : (
              <video src={result.url} autoPlay loop muted playsInline controls className="max-w-full max-h-[50vh] block" />
            )}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500 text-center max-w-xs">
            <Clapperboard size={32} strokeWidth={1.5} />
            <p className="text-sm">
              Turn the equation into a short animation. Pick a style and press <span className="text-zinc-300">Animate</span>.
            </p>
          </div>
        ) : null}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-300">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-xs text-zinc-400">Rendering with Manim…</span>
            {slow && (
              <span className="text-[11px] text-zinc-500 max-w-[16rem] text-center">
                The render server may be waking up. The first animation can take a minute or two.
              </span>
            )}
          </div>
        )}

        {isStale && !loading && !error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] bg-zinc-800/90 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">
            Out of date — animate again to update
          </div>
        )}
      </div>

      <div className="absolute bottom-6 right-6 flex gap-3">
        {result && !error && (
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 px-5 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            <Download size={20} />
            <span>{result.format.toUpperCase()}</span>
          </button>
        )}
        <button
          onClick={handleRender}
          disabled={loading || !latex.trim()}
          className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-full font-bold shadow-lg shadow-white/10 transition-all transform hover:scale-105 active:scale-95"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : result ? <RefreshCw size={20} /> : <Play size={20} />}
          <span>{result ? 'Re-animate' : 'Animate'}</span>
        </button>
      </div>
    </div>
  );
};
