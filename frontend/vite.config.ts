import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_API_BASE_URL allows redirecting API calls to any backend host, both in
// dev (Vite proxy) and in production builds that use an absolute URL.
const backendUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/uploads': {
        target: backendUrl,
        changeOrigin: true,
      }
    }
  }
})
