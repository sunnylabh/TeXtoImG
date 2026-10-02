# TexToImg

Render LaTeX equations in the browser and export them as high-resolution PNG or JPEG images, for slides, posters and documents, or as short GIF/MP4 animations made with [Manim](https://www.manim.community/). Optionally, describe an equation in plain English and let Gemini write the LaTeX.

**Live demo:** https://teximg.pages.dev

## Features

- Live KaTeX preview as you type
- Export to PNG or JPEG at 1x–5x scale
- Light or dark theme, adjustable padding, transparent background (PNG)
- Natural-language to LaTeX generation (Gemini API, free tier)
- Animated GIF or MP4 of the same equation, rendered with Manim (write, line-by-line, fade-in or highlight styles; 480p to 1080p)

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

## Animations (Manim)

The Animation panel sends the LaTeX to a small Python server in `manim-server/`. Manim needs Python, a LaTeX distribution and ffmpeg, so this server runs separately from the static site and its serverless functions.

Requirements: Python 3.10+, a LaTeX install (MacTeX, TeX Live or MiKTeX), ffmpeg, and the [system libraries Manim needs](https://docs.manim.community/en/stable/installation.html) (Cairo, Pango).

```bash
cd manim-server
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python server.py     # http://localhost:8000
```

With the server running, `npm run dev` proxies `/api/animate` to it, so the Animation panel works locally. When you describe a formula with the AI prompt, the animation is rendered automatically as well.

To use animations on a deployed site, run the server somewhere that supports containers (Render, Fly.io, Railway, Hugging Face Spaces, ...) using `manim-server/Dockerfile`, then build the frontend with its URL:

```bash
VITE_MANIM_API_URL=https://your-manim-server.example.com npm run build
```

Server options (environment variables): `ALLOWED_ORIGINS` (CORS, default `*`), `MANIM_CONCURRENCY` (parallel renders, default 2), `MANIM_RENDER_TIMEOUT` (seconds, default 120), `PORT` (default 8000). Rendered files are cached by content, and LaTeX commands that read or write files are rejected.

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
components/AnimationArea  Manim animation panel
components/Controls       export settings
components/GeminiInput    natural-language prompt
services/geminiService.ts client for /api/generate
services/manimService.ts  client for /api/animate
lib/generateLatex.ts      server-side Gemini call
functions/api/generate.ts Cloudflare Pages Function
api/generate.ts           Vercel function
manim-server/             Python (FastAPI + Manim) animation server
```

## Tech stack

React 18, TypeScript, Vite, KaTeX, html-to-image, Tailwind CSS; Python, FastAPI and Manim for animations.
