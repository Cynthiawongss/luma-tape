import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone by default; override the base for subdirectory hosting.
export default defineConfig({
  base: process.env.LUMA_TAPE_BASE || '/',
  plugins: [react()],
  server: { host: '127.0.0.1' },
});
