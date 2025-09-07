import { defineConfig, type UserConfig, loadEnv } from 'vite';

// Common external dependencies
export const NODE_EXTERNALS = ['fs', 'path', 'process', 'stream', 'util', 'crypto', 'sax', 'events', 'string_decoder', 'node:fs', 'node:path', 'node:process', 'node:stream', 'node:util', 'node:crypto', 'node:events', 'node:string_decoder'];

// Build targets
export const BUILD_TARGETS = {
  node: 'node18',
  browser: 'esnext'
} as const;

// Base configuration
const baseConfig = {
  optimizeDeps: {
    exclude: ["sax", "xmllint-wasm"],
  },
  build: {
    sourcemap: true,
    minify: 'esbuild',
    target: 'node18',
  },
} as const;

// Factory function
export const createViteConfig = (overrides: Partial<UserConfig> = {}) => {
  return defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    const config = {
      ...baseConfig,
      ...overrides
    };

    // Dev server configuration
    if (command === 'serve') {
      return {
        ...config,
        server: {
          port: env.VITE_DEV_PORT ? Number(env.VITE_DEV_PORT) : 3000,
          open: false,
          cors: true
        }
      };
    }

    // Build configuration
    if (command === 'build') {
      return {
        ...config,
        build: {
          ...config.build,
          minify: mode === 'production' ? 'esbuild' : false,
          sourcemap: mode !== 'production',
        },
        define: {
          __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
          __BUILD_MODE__: JSON.stringify(mode),
          __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0')
        }
      };
    }

    return config;
  });
};