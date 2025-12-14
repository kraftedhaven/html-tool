/**
 * Vite configuration — use loadEnv and import.meta.env instead of referencing process.env
 * This avoids TypeScript errors like "Cannot find name 'process'" during tsc in CI
 * and exposes a stringified `process.env` object for any legacy code that expects it.
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default ({ mode }: { mode: string }) => {
  // Use '.' instead of process.cwd() to avoid referencing the `process` global in this file.
  // loadEnv returns an object where keys are the env var names and values are strings.
  const env = loadEnv(mode, '.', '');

  // Convert env values into a plain object we can inject into the client bundle.
  // Vite already exposes import.meta.env to client code, so prefer using that in source files.
  // We still provide a stringified `process.env` for libraries that expect it.
  const processEnv = Object.fromEntries(Object.entries(env));

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    // Replace occurrences of `process.env` in built code with the actual values.
    // This is a compatibility bridge. In your app source, prefer import.meta.env.VITE_... instead.
    define: {
      'process.env': JSON.stringify(processEnv),
    },

    server: {
      port: Number(env.VITE_DEV_PORT) || 5173,
    },

    build: {
      outDir: env.VITE_OUT_DIR || 'dist',
    },
  });
};