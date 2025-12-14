import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import html2canvas from 'html2canvas';
import { ExportSettings } from '../types';
import { Download, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';

interface PreviewAreaProps {
  latex: string;
  settings: ExportSettings;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({ latex, settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    try {
      // Clean up common delimiters that users or AI might include but KaTeX renderToString 
      // treats as errors when displayMode is true (because it expects raw math content).
      let cleanLatex = latex.trim();
      
      // Strip \[ ... \]
      if (cleanLatex.startsWith('\\[') && cleanLatex.endsWith('\\]')) {
        cleanLatex = cleanLatex.slice(2, -2).trim();
      }
      // Strip $$ ... $$
      else if (cleanLatex.startsWith('$$') && cleanLatex.endsWith('$$')) {
        cleanLatex = cleanLatex.slice(2, -2).trim();
      }
      // Strip $ ... $ (if single line)
      else if (cleanLatex.startsWith('$') && cleanLatex.endsWith('$')) {
         cleanLatex = cleanLatex.slice(1, -1).trim();
      }

      // Use renderToString to avoid "quirks mode" errors
      const html = katex.renderToString(cleanLatex, {
        throwOnError: true,
        displayMode: true,
        output: 'html',
        strict: false,
        trust: true, 
      });
      setHtmlContent(html);
      setError(null);
    } catch (err: any) {
      // Make error message more user friendly
      const msg = err.message.replace('KaTeX parse error: ', '');
      setError(msg || "Invalid LaTeX syntax");
      setHtmlContent('');
    }
  }, [latex]);

  const handleDownload = async () => {
    if (!renderRef.current) return;

    try {
      // Wait for fonts and styles to fully load
      await document.fonts.ready;
      
      // Longer delay to ensure KaTeX rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(renderRef.current, {
        backgroundColor: settings.transparent ? null : (settings.theme === 'dark' ? '#000000' : '#ffffff'),
        scale: settings.scale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 0,
        windowWidth: renderRef.current.scrollWidth,
        windowHeight: renderRef.current.scrollHeight,
        y: 0,
        scrollY: 0,
        scrollX: 0,
        onclone: (clonedDoc) => {
          // Force layout recalculation and add CSS fixes for better rendering
          const clonedElement = clonedDoc.querySelector('[data-render-target]') as HTMLElement;
          if (clonedElement) {
            // Add CSS to improve vertical alignment of fraction bars
            const style = clonedDoc.createElement('style');
            style.textContent = `
              .katex-render-container * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              .katex .frac-line {
                transform: translateY(0px) !important;
                position: relative !important;
              }
              .katex .vlist-t {
                vertical-align: baseline !important;
              }
            `;
            clonedDoc.head.appendChild(style);
            
            // Trigger reflow to ensure all styles are applied
            void clonedElement.offsetHeight;
          }
        }
      });

      const link = document.createElement('a');
      link.download = `latex_export_${Date.now()}.${settings.format}`;
      link.href = canvas.toDataURL(`image/${settings.format}`, 1.0);
      link.click();
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export image.");
    }
  };

  const isDarkTheme = settings.theme === 'dark';

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden relative group">
       <div className="bg-zinc-850 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preview</span>
        <div className="flex gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 hover:bg-zinc-700 rounded text-zinc-400">
                <ZoomOut size={14} />
            </button>
            <span className="text-xs text-zinc-500 min-w-[3rem] text-center self-center">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1 hover:bg-zinc-700 rounded text-zinc-400">
                <ZoomIn size={14} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-950/50">
        {error ? (
           <div className="flex flex-col items-center justify-center text-red-400 gap-2 bg-red-900/10 px-6 py-4 rounded-lg border border-red-900/30 max-w-md text-center">
             <AlertCircle size={24} />
             <span className="text-sm font-mono break-all">{error}</span>
           </div>
        ) : (
          <div 
            ref={containerRef}
            className="shadow-2xl transition-all duration-200"
            style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
            }}
          >
            <div
                ref={renderRef}
                data-render-target
                className={`inline-block katex-render-container`}
                style={{
                    padding: `${settings.padding}px`,
                    backgroundColor: settings.transparent ? 'transparent' : (isDarkTheme ? 'black' : 'white'),
                    color: isDarkTheme ? 'white' : 'black',
                    minWidth: '100px',
                    textAlign: 'center',
                    verticalAlign: 'baseline',
                    lineHeight: '1',
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </div>

        {/* Floating Action Button for Download */}
        <div className="absolute bottom-6 right-6">
            <button
                onClick={handleDownload}
                disabled={!!error}
                className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-full font-bold shadow-lg shadow-white/10 transition-all transform hover:scale-105 active:scale-95"
            >
                <Download size={20} />
                <span>Download {settings.format.toUpperCase()}</span>
            </button>
        </div>
    </div>
  );
};