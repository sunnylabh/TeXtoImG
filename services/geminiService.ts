// Calls the /api/generate serverless function, which holds the Gemini API key.
export const generateLatexFromPrompt = async (prompt: string): Promise<string> => {
  let res: Response;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new Error('Could not reach the AI service. Check your connection.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.latex) {
    throw new Error(data?.error || 'AI generation is unavailable here (run with `vercel dev` locally).');
  }
  return data.latex;
};
