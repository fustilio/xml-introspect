import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['fs', 'path', 'process', 'stream', 'util', 'crypto', 'sax'],
      output: {
        entryFileNames: 'index.js'
      }
    }
  },
  optimizeDeps: {
    exclude: ["sax", "xmllint-wasm"],
  },
});
