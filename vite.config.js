import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  },
  server: {
    port: 3003
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normalizedId = id.replace(/\\/g, '/');
            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/react-router/') ||
              normalizedId.includes('/node_modules/react-router-dom/') ||
              normalizedId.includes('/node_modules/@remix-run/router/') ||
              normalizedId.includes('/node_modules/react-helmet-async/')
            ) {
              return 'vendor-react';
            }
            if (
              normalizedId.includes('/node_modules/@tanstack/react-query/') ||
              normalizedId.includes('/node_modules/@tanstack/query-core/')
            ) {
              return 'vendor-query';
            }
            if (
              normalizedId.includes('/node_modules/swiper/') ||
              normalizedId.includes('/node_modules/photoswipe/')
            ) {
              return 'vendor-ui';
            }
            if (normalizedId.includes('/node_modules/bootstrap/')) {
              return 'vendor-bootstrap';
            }
          }
        }
      }
    }
  }
});
