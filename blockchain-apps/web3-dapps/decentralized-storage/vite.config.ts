import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@contracts': resolve(__dirname, './src/contracts'),
      '@ai': resolve(__dirname, './src/ai'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    exclude: ['@anthropic-ai/sdk'],
  },
  build: {
    target: 'esnext',
  },
  server: {
    port: 5174,
    open: true,
  },
});
