# TexToImg

Render LaTeX equations in the browser and export them as high-resolution PNG or JPEG images, for slides, posters and documents. Optionally, describe an equation in plain English and let Gemini write the LaTeX.

**Live demo:** https://teximg.pages.dev

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

The "describe a formula" feature runs server-side (`lib/generateLatex.ts`) and calls the Gemini API, so the API key never reaches the browser. The editor and export work without it.

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Store it as the `GEMINI_API_KEY` secret on your host (see below).
3. Optionally set `GEMINI_MODEL` (default `gemini-2.5-flash`).

## Deployment

**Cloudflare Pages** (used for the live demo):

```bash
npm run build
npx wrangler pages deploy dist --project-name teximg
npx wrangler pages secret put GEMINI_API_KEY --project-name teximg
```

To test locally with AI, put `GEMINI_API_KEY=...` in `.dev.vars` and run `npx wrangler pages dev dist`.

**Vercel** also works: `api/generate.ts` is picked up automatically. Set the key with `vercel env add GEMINI_API_KEY production`.

## Project structure

```
App.tsx                   layout and state
components/LatexEditor    source editor
components/PreviewArea    KaTeX rendering and image export
components/Controls       export settings
components/GeminiInput    natural-language prompt
services/geminiService.ts client for /api/generate
lib/generateLatex.ts      server-side Gemini call
functions/api/generate.ts Cloudflare Pages Function
api/generate.ts           Vercel function
```

## Tech stack

React 18, TypeScript, Vite, KaTeX, html-to-image, Tailwind CSS.
