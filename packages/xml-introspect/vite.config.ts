import { createViteConfig, BUILD_TARGETS, NODE_EXTERNALS } from './vite.base.config';

// Node.js library and CLI build
export default createViteConfig({
  define: {
    global: 'globalThis',
  },
  ssr: {
    noExternal: ['@xml-introspect/data-loader']
  },
  build: {
    target: BUILD_TARGETS.node,
    lib: {
      entry: {
        index: 'src/index.ts',
        cli: 'src/cli/index.ts'
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: NODE_EXTERNALS,
      output: {
        format: 'es',
        preserveModules: false,
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'cli') {
            return 'cli.js';
          }
          return '[name].js';
        }
      }
    }
  }
});