import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    // Dev proxy so the browser hits the Vite origin and Vite forwards to
    // Laravel — sidesteps CORS entirely in development. In production the
    // app talks to VITE_API_URL directly (CORS is open for api/*).
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    // Leftover agent worktrees under .claude/worktrees carry full copies of
    // src (tests + their own node_modules with a second React) — globbing them
    // yields phantom "useContext of null" failures. Keep them out of the run.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
})
