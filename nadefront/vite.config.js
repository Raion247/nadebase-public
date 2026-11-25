import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      allow: ['..', '../../src/C'], // Allow access to src/C
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'chunk-[hash].js',
        entryFileNames: 'entry-[hash].js',
        assetFileNames: 'assets/[hash][extname]',
      },
    },
  },
});
