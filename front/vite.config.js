import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le front tourne sur :5173 et parle au back Express (:3000) via le proxy /api.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
