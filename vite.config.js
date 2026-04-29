import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // App-Shell (JS/CSS/Icons) aus Cache laden → sofortiger Start auch offline
        // Supabase-API-Calls gehen immer ans Netz (Daten liegen im localStorage-Cache)
        runtimeCaching: [
          {
            // Supabase API: immer vom Netz, nie vom SW-Cache
            urlPattern: /^https:\/\/wsdkmglkqxszyvomrfim\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Statische Assets (Fonts, externe CDNs): Cache-First
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      manifest: {
        name: 'Goldeimer Festival Hub',
        short_name: 'Goldeimer Hub',
        description: 'Dein Festival-Begleiter von Goldeimer',
        theme_color: '#ffe500',
        background_color: '#fff4e0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // Große Libs in eigene Chunks → Browser cached sie separat
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
