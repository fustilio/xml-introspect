import { createViteConfig, BUILD_TARGETS, NODE_EXTERNALS } from './vite.base.config';

// Browser build
export default createViteConfig({
  build: {
    target: BUILD_TARGETS.browser,
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/browser/index.ts',
      formats: ['es'],
      fileName: 'browser'
    },
    rollupOptions: {
      external: NODE_EXTERNALS,
      output: {
        format: 'es',
        entryFileNames: 'browser.js'
      }
    }
  }
});
