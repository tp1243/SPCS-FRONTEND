import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5175',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          motion: ['framer-motion'],
          pdf: ['jspdf'],
          utils: ['html2canvas', 'dompurify'],
          icons: ['react-icons'],
        },
      },
    },
    sourcemap: false,
  },
})
