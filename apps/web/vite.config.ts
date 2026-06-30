import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/beta': { target: 'http://localhost:3000', changeOrigin: true },
      '/tools': { target: 'http://localhost:3000', changeOrigin: true },
      '/cockpit': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
