import { defineConfig } from 'vite';

// Default config - builds everything for development
export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: {
        index: 'src/index.ts',
        browser: 'src/browser/index.ts',
        cli: 'src/cli.ts'
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: ['fs', 'path', 'process', 'stream', 'util', 'crypto', 'sax'],
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'cli') {
            return 'cli.js';
          }
          return '[name].js';
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ["sax", "xmllint-wasm"],
  },
});