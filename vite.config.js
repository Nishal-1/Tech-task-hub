import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Use relative paths so Electron can load the built files via file:// protocol
  base: './',

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5220',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Output to dist/ folder (default)
    outDir: 'dist',
    emptyOutDir: true,
  },
})
