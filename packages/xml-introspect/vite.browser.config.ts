import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/browser/index.ts',
      formats: ['es'],
      fileName: 'browser'
    },
    rollupOptions: {
      external: ['fs', 'path', 'process', 'stream', 'util', 'crypto'],
      output: {
        entryFileNames: 'browser.js'
      }
    }
  },
  optimizeDeps: {
    exclude: ["sax", "xmllint-wasm"],
  },
});
