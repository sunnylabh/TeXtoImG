import { useState } from 'react';
import { LatexEditor } from './components/LatexEditor';
import { PreviewArea } from './components/PreviewArea';
import { AnimationArea } from './components/AnimationArea';
import { Controls } from './components/Controls';
import { GeminiInput } from './components/GeminiInput';
import { ExportSettings, DEFAULT_LATEX } from './types';
import { Github, Sigma } from 'lucide-react';

export default function App() {
  const [latex, setLatex] = useState<string>(DEFAULT_LATEX);
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'png',
    scale: 3, // High quality default
    transparent: false,
    theme: 'light',
    padding: 40,
  });
  // Bumped when the AI writes new LaTeX, so the animation follows the prompt too
  const [animateToken, setAnimateToken] = useState(0);

  const handleGenerated = (generated: string) => {
    setLatex(generated);
    setAnimateToken(t => t + 1);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-zinc-100 selection:bg-white/20">
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-black p-1.5 rounded-lg">
                <Sigma size={20} strokeWidth={3} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">TexToImg</h1>
            <span className="text-xs text-zinc-500 self-end mb-1">by Sunny</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-zinc-500 font-mono">
              React + Tailwind + Gemini 2.5 + Manim
            </span>
            <a
              href="https://github.com/sunnylabh/TeXtoImG"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Source code on GitHub"
              title="Source code on GitHub"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-screen-2xl mx-auto w-full flex flex-col">
        
        {/* AI Input Section */}
        <GeminiInput onGenerate={handleGenerated} />

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
          
          {/* Left Column: Editor & Settings */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            <div className="flex-1 min-h-[300px]">
                <LatexEditor value={latex} onChange={setLatex} />
            </div>
            <Controls settings={settings} onChange={setSettings} />
          </div>

          {/* Right Column: Image and Animation */}
          <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="min-h-[400px]">
              <PreviewArea latex={latex} settings={settings} />
            </div>
            <div className="min-h-[400px]">
              <AnimationArea latex={latex} theme={settings.theme} renderToken={animateToken} />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} TexToImg. Powered by Google Gemini and Manim.</p>
      </footer>

    </div>
  );
}