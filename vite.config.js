import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin pour copier sw.js à la racine du build
    {
      name: 'copy-sw',
      closeBundle() {
        try {
          copyFileSync('public/sw.js', 'dist/sw.js')
          console.log('✅ sw.js copié dans dist/')
        } catch (e) {
          console.warn('⚠️ Impossible de copier sw.js:', e.message)
        }
      }
    }
  ],
  
  // Configuration pour le build
  build: {
    outDir: 'dist',
    sourcemap: false,
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