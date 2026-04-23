import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/users': 'http://localhost:3001',
      '/api/catalog': 'http://localhost:3002',
      '/api/inventory': 'http://localhost:3003',
    },
  },
});
