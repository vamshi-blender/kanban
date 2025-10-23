import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'src/public',
  base: '/kanban/', // GitHub Pages base path
  server: {
    host: true, // Listen on all local IPs
    port: 5180,
    strictPort: false, // Allow fallback to next available port
    open: true, // Automatically open in default browser
  }
});