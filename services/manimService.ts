// Calls the Manim render server (manim-server/). In development Vite proxies
// /api/animate to it; in production set VITE_MANIM_API_URL to where it runs.
import { AnimationSettings, ExportSettings } from '../types';

const BASE_URL = (import.meta.env.VITE_MANIM_API_URL ?? '').replace(/\/$/, '');

export const renderAnimation = async (
  latex: string,
  options: AnimationSettings,
  theme: ExportSettings['theme'],
  signal?: AbortSignal,
): Promise<Blob> => {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/animate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex, theme, ...options }),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new Error('Could not reach the animation server. Is manim-server running?');
  }

  const type = res.headers.get('Content-Type') ?? '';
  if (res.ok && (type.startsWith('image/gif') || type.startsWith('video/mp4'))) {
    return res.blob();
  }

  const data = await res.json().catch(() => null);
  if (typeof data?.detail === 'string') throw new Error(data.detail);
  if (res.status === 422) throw new Error('Invalid animation settings.');
  throw new Error('The animation server is not available here (see manim-server/ in the README).');
};
