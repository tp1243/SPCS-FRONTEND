import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      timeout: 30000,
      clientPort: 5173,
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        configure: (proxy) => {
          try {
            proxy.removeAllListeners('error')
            proxy.on('error', (err) => {
              const m = String((err && (err.message || '')) || '')
              const c = ((err as any)?.code) || ''
              if (c === 'ECONNABORTED' || m.includes('ECONNABORTED')) return
              console.error(m)
            })
          } catch {}
        },
      },
      '/socket.io': {
        target: 'http://localhost:5175',
        ws: true,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        configure: (proxy) => {
          try {
            proxy.removeAllListeners('error')
            proxy.on('error', (err) => {
              const m = String((err && (err.message || '')) || '')
              const c = ((err as any)?.code) || ''
              if (c === 'ECONNABORTED' || m.includes('ECONNABORTED') || m.includes('write ECONNABORTED')) return
              console.error(m)
            })
          } catch {}
        },
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
