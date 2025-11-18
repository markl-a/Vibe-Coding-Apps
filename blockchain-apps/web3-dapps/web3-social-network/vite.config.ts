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
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', 'viem', '@web3modal/wagmi'],
          ai: ['openai', '@anthropic-ai/sdk'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
