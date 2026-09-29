// Cloudflare Pages Function: POST /api/generate
import { handleGenerate, GenerateEnv } from '../../lib/generateLatex';

export const onRequestPost = ({ request, env }: { request: Request; env: GenerateEnv }) =>
  handleGenerate(request, env);
