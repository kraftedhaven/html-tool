import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }: { mode?: string } = {}) => {
  // Load .env files based on the current mode
  const env = loadEnv(mode || process.env.NODE_ENV || 'development', process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:7071'

  return defineConfig({
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsDir: 'assets',
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    base: '/',
    publicDir: 'public',
  })
}
