import { createViteConfig, BUILD_TARGETS } from './vite.base.config';

// CDN build configuration
export default createViteConfig({
  build: {
    target: BUILD_TARGETS.browser,
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/browser/cdn.ts',
      name: 'XMLIntrospect',
      formats: ['umd', 'iife'],
      fileName: (format) => {
        if (format === 'umd') return 'xml-introspect.umd.js';
        if (format === 'iife') return 'xml-introspect.iife.js';
        return 'xml-introspect.js';
      }
    },
    rollupOptions: {
      // Bundle all dependencies for CDN, but exclude Node.js modules
      external: ['fs', 'path', 'os'],
      output: {
        format: 'umd',
        name: 'XMLIntrospect',
        globals: {},
        // Ensure proper global variable exposure
        extend: true,
        // Inline all assets for single file distribution
        inlineDynamicImports: true
      }
    },
    // Optimize for CDN delivery
    minify: 'esbuild',
    // Add source map for debugging
    sourcemap: true
  },
  // Optimize dependencies for CDN
  optimizeDeps: {
    include: ['sax', 'xmllint-wasm']
  },
  define: {
    // Ensure proper global access
    global: 'globalThis',
    // Add CDN-specific build markers
    __CDN_BUILD__: JSON.stringify(true),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0')
  }
});
