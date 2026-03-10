// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,         // binds 0.0.0.0
    port: 5173,
    strictPort: true,   // ensures Docker maps the same port
    hmr: {
      host: 'jitsi-client', // Docker container hostname for HMR
      port: 5173,
    }
  }
})