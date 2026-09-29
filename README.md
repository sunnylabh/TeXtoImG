# TexToImg

Render LaTeX equations in the browser and export them as high-resolution PNG or JPEG images, for slides, posters and documents. Optionally, describe an equation in plain English and let Gemini write the LaTeX.

**Live demo:** https://textoimg-alpha.vercel.app (AI generation is disabled in the demo)

## Features

- Live KaTeX preview as you type
- Export to PNG or JPEG at 1x–5x scale
- Light or dark theme, adjustable padding, transparent background (PNG)
- Optional natural-language to LaTeX generation (Gemini API)

## Getting started

Requires Node.js 18 or later.

```bash
git clone https://github.com/sunnylabh/TeXtoImG.git
cd TeXtoImG
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # output in dist/
npm run preview    # serve the build locally
```

## AI generation (optional)

The editor and export work without any configuration. To enable the "describe an equation" feature, create `.env.local`:

```
VITE_API_KEY=your-gemini-api-key
# VITE_GEMINI_MODEL=gemini-2.5-flash   (optional override)
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). Note that `VITE_` variables are embedded in the client bundle, so do not deploy a build containing your key to a public site.

## Project structure

```
App.tsx                   layout and state
components/LatexEditor    source editor
components/PreviewArea    KaTeX rendering and image export
components/Controls       export settings
components/GeminiInput    natural-language prompt
services/geminiService.ts Gemini API call
```

## Tech stack

React 18, TypeScript, Vite, KaTeX, html-to-image, Tailwind CSS.
