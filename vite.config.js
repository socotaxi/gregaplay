import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure Vite with a proxy so API requests reach the Express server
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env,
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
