import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      webmidi: path.resolve(__dirname, 'src/shims/webmidi.ts'),
    },
  },
});
