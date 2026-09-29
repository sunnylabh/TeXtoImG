import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateLatexFromPrompt = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  
  if (!apiKey) {
    throw new Error("AI generation is disabled: no Gemini API key configured (VITE_API_KEY).");
  }

  try {
    // Initialize on demand to avoid crashes at module load time
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash"
    });
    
    const systemPrompt = `You are a helpful LaTeX expert assistant. 
Your task is to convert the user's natural language description of a mathematical formula or equation into valid, clean LaTeX code.

Rules:
1. Return ONLY the raw LaTeX code. 
2. Do not wrap the code in markdown blocks (like \`\`\`latex ... \`\`\`). 
3. Do not add any explanation or conversational text.
4. Prefer 'aligned' environments for multi-line equations.
5. Ensure high-quality notation (e.g., use \\mathbf for vectors if implied).
6. Do not wrap the output in delimiters like \\[ ... \\] or $$ ... $$ or $ ... $.

Example Input: "Maxwell's equations"
Example Output: \\begin{aligned} \\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\ ... \\end{aligned}`;
    
    const result = await model.generateContent(`${systemPrompt}\n\nUser request: ${prompt}`);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("No response from AI");
    }

    // Cleanup in case the model ignores instructions and adds markdown
    return text.replace(/```latex/g, '').replace(/```/g, '').trim();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    console.error("Error details:", error.response?.data || error.message);
    // Return a clear error message
    throw new Error(error.message || "Failed to generate LaTeX.");
  }
};