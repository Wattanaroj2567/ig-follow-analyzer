import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom/client'] },
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/.taste-skill/**', '**/.hallmark/**', '**/shots/**'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.taste-skill/**', '**/.hallmark/**'],
  },
});
