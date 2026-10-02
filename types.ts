export interface ExportSettings {
  format: 'png' | 'jpeg';
  scale: number;
  transparent: boolean;
  theme: 'light' | 'dark';
  padding: number;
}

export interface AnimationSettings {
  style: 'write' | 'lines' | 'fade' | 'highlight';
  format: 'gif' | 'mp4';
  quality: 'low' | 'medium' | 'high';
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
}

export const DEFAULT_LATEX = `\\begin{aligned}
\\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\
\\nabla \\cdot \\mathbf{B} &= 0 \\\\
\\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
\\nabla \\times \\mathbf{B} &= \\mu_0\\mathbf{J} + \\mu_0\\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{aligned}`;
