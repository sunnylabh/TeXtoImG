// Calls the Manim render server (manim-server/). In development Vite proxies
// /api/animate to it; in production set VITE_MANIM_API_URL to where it runs.
import { AnimationSettings, ExportSettings } from '../types';

const BASE_URL = (import.meta.env.VITE_MANIM_API_URL ?? '').replace(/\/$/, '');

// A free-tier host may be asleep or restarting; give it a few chances
const RETRY_DELAYS_MS = [5000, 15000];
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });

export const renderAnimation = async (
  latex: string,
  options: AnimationSettings,
  theme: ExportSettings['theme'],
  signal?: AbortSignal,
): Promise<Blob> => {
  let res: Response | null = null;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(`${BASE_URL}/api/animate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex, theme, ...options }),
        signal,
      });
      if (!RETRYABLE_STATUS.has(res.status)) break;
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      res = null; // network error, or a proxy error page without CORS headers
    }
    if (attempt >= RETRY_DELAYS_MS.length) break;
    await sleep(RETRY_DELAYS_MS[attempt], signal);
  }
  if (!res || RETRYABLE_STATUS.has(res.status)) {
    throw new Error(
      BASE_URL
        ? 'The animation server is not responding (it may be starting up). Please try again in a minute.'
        : 'Could not reach the animation server. Is manim-server running?',
    );
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
