import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward animation requests to the local Manim server (manim-server/)
    proxy: {
      '/api/animate': process.env.MANIM_SERVER_URL || 'http://localhost:8000',
    },
  },
});
