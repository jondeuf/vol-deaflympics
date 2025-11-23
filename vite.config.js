import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configuration pour le build
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimisation des chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  
  // Configuration du serveur de dev
  server: {
    port: 3000,
    open: true
  },
  
  // Important pour Vercel et GitHub Pages
  base: '/',
  
  // Copier le service worker dans le build
  publicDir: 'public'
})