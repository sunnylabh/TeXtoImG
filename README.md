# TexToImg

Render LaTeX equations in the browser and export them as high-resolution PNG or JPEG images, for slides, posters and documents. Optionally, describe an equation in plain English and let Gemini write the LaTeX.

**Live demo:** https://textoimg-alpha.vercel.app

## Features

- Live KaTeX preview as you type
- Export to PNG or JPEG at 1x–5x scale
- Light or dark theme, adjustable padding, transparent background (PNG)
- Natural-language to LaTeX generation (Gemini API, free tier)

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

## AI generation

The "describe a formula" feature is served by a Vercel serverless function (`api/generate.ts`) that calls the Gemini API, so the API key never reaches the browser. The editor and export work without it.

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it to the Vercel project: `vercel env add GEMINI_API_KEY production`
3. Optionally set `GEMINI_MODEL` (default `gemini-2.5-flash`).

To use AI generation locally, put `GEMINI_API_KEY=...` in `.env.local` and run `vercel dev` instead of `npm run dev`.

## Project structure

```
App.tsx                   layout and state
components/LatexEditor    source editor
components/PreviewArea    KaTeX rendering and image export
components/Controls       export settings
components/GeminiInput    natural-language prompt
services/geminiService.ts client for /api/generate
api/generate.ts           serverless Gemini proxy
```

## Tech stack

React 18, TypeScript, Vite, KaTeX, html-to-image, Tailwind CSS.
