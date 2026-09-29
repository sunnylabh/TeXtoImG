// Server-side handler shared by the Cloudflare Pages and Vercel functions: turns
// a plain-English description into LaTeX via the Gemini API. The API key stays
// on the server (GEMINI_API_KEY) and is never shipped to the browser.

const MAX_PROMPT_LENGTH = 500;

const SYSTEM_PROMPT = `You are a LaTeX expert. Convert the user's natural-language description of a mathematical formula or equation into valid, clean LaTeX that KaTeX can render.

Rules:
1. Return ONLY the raw LaTeX code.
2. Do not wrap the code in markdown blocks.
3. Do not add any explanation or conversational text.
4. Prefer the 'aligned' environment for multi-line equations.
5. Use high-quality notation (e.g. \\mathbf for vectors where implied).
6. Do not wrap the output in delimiters like \\[ ... \\], $$ ... $$ or $ ... $.

Example input: "Maxwell's equations"
Example output: \\begin{aligned} \\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\ ... \\end{aligned}`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export interface GenerateEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export async function handleGenerate(request: Request, env: GenerateEnv): Promise<Response> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: 'AI generation is not configured on this server.' }, 503);
  }

  let prompt: unknown;
  try {
    ({ prompt } = await request.json());
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return json({ error: 'Please describe a formula.' }, 400);
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return json({ error: `Description is too long (max ${MAX_PROMPT_LENGTH} characters).` }, 400);
  }

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    },
  );

  if (res.status === 429) {
    return json({ error: 'The free AI quota is used up for now. Please try again in a minute.' }, 429);
  }
  if (!res.ok) {
    console.error('Gemini API error', res.status, await res.text());
    return json({ error: 'The AI service returned an error. Please try again.' }, 502);
  }

  const data = await res.json();
  const text: string = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('');
  if (!text.trim()) {
    return json({ error: 'The AI returned no LaTeX. Try rephrasing.' }, 502);
  }

  // Strip markdown fences in case the model ignores the instructions
  const latex = text.replace(/```(latex)?/g, '').trim();
  return json({ latex });
}
