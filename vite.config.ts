import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
  resolve: {
    alias: {
      webmidi: path.resolve(__dirname, 'src/shims/webmidi.ts'),
    },
  },
});
