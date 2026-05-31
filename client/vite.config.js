import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─── Vite config with proxy ────────────────────────────────────────────────
// The proxy forwards /api/jobs/* → http://localhost:3001/*
// This bypasses CORS entirely — browser thinks it's talking to the same origin.
//
// In your React app, requests to /api/jobs/match go to localhost:3001/match
// The JOB_SERVICE_URL in nexus-chat.jsx should be set to: /api/jobs
// (or keep localhost:3001 and add CORS headers to your Express server instead)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All requests to /api/jobs/* → forwarded to your backend
      '/api/jobs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jobs/, ''),
        // e.g. POST /api/jobs/match → POST http://localhost:3001/match
      },
    },
  },
})