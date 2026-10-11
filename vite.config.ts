import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Local dev: forward API calls to the Django server.
    proxy: { '/api': { target: process.env.VITE_DEV_API ?? 'http://localhost:8000', changeOrigin: true } },
  },
  build: {
    sourcemap: false,
    rollupOptions: { output: { manualChunks: { leaflet: ['leaflet', 'react-leaflet'] } } },
  },
});
