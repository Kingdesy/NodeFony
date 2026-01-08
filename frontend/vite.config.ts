// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Port du Front
    proxy: {
      // Toutes les requêtes commençant par /api iront vers NodeFony
      '/api': {
        target: 'http://localhost:8000', // Port de ton Kernel
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../public/dist',
    emptyOutDir: true
  }
});