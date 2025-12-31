import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    https: true, // Required for WebXR
    host: true,  // Allow network access for mobile testing
  },
  build: {
    target: 'esnext',
  },
});
