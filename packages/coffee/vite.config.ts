import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
  },
  base: process.env.NODE_ENV === 'production' ? '/coffee/' : '/',
  build: {
    // Optimize build output
    target: 'esnext',
    minify: 'terser',
    sourcemap: false, // Disable sourcemaps for smaller bundle
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          maps: ['@googlemaps/js-api-loader'],
        },
        // Clean asset names
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Build performance optimizations
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false, // Faster builds
  },
  server: {
    port: 5174, // Different port from roster to avoid conflicts
    host: true,
  },
  preview: {
    port: 4174, // Different port from roster to avoid conflicts
    host: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@googlemaps/js-api-loader',
    ],
  },
});
