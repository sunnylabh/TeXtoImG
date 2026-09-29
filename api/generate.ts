// Vercel serverless function: POST /api/generate
import { handleGenerate } from '../lib/generateLatex';

export function POST(request: Request): Promise<Response> {
  return handleGenerate(request, {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
}
