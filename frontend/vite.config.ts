import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Security hardening
  build: {
    minify: 'esbuild', // Use esbuild instead of terser to avoid eval paths
    sourcemap: process.env.CI ? 'hidden' : true, // Hidden sourcemaps for CI, dev maps for local
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk splitting for better caching
          vendor: ['react', 'react-dom'],
          babylon: ['@babylonjs/core', '@babylonjs/gui', '@babylonjs/loaders', '@babylonjs/materials'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          utils: ['zod', 'zustand', 'axios', 'clsx']
        }
      }
    }
  },

  // Environment variables with strict typing
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: process.env.NODE_ENV === 'development'
  },

  // Optimization settings for security
  optimizeDeps: {
    // Exclude WASM modules that need special loading
    exclude: [
      '@mediapipe/tasks-vision',
      '@dimforge/rapier3d'
    ],
    // Include commonly used ESM-only packages
    include: [
      'react-dom/client',
      'react-router-dom',
      '@headlessui/react'
    ]
  },

  // Asset handling for WASM and models
  assetsInclude: [
    '**/*.wasm',
    '**/*.model',
    '**/*.tflite',
    '**/*.bin',
    '**/*.hdr',
    '**/*.gltf',
    '**/*.glb'
  ],

  // Worker configuration
  worker: {
    format: 'es' // Use ES modules for workers
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@config': path.resolve(__dirname, './src/config'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@security': path.resolve(__dirname, './src/security')
    }
  },

  // Development server settings
  server: {
    host: true,
    port: 3000,
    headers: {
      // Security headers for development
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https:;
        connect-src 'self' ws: wss: https:;
        font-src 'self' data:;
        object-src 'none';
        base-uri 'self';
        frame-ancestors 'none';
        worker-src 'self' blob:;
        child-src 'self' blob:;
      `.replace(/\s+/g, ' ').trim()
    }
  },

  // Preview server (production-like)
  preview: {
    headers: {
      // Stricter CSP for preview/production
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self';
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data:;
        connect-src 'self' https: wss:;
        font-src 'self' data:;
        object-src 'none';
        base-uri 'self';
        frame-ancestors 'none';
        worker-src 'self' blob:;
        child-src 'self' blob:;
        manifest-src 'self';
      `.replace(/\s+/g, ' ').trim(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
})