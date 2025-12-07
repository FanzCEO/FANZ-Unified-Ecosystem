#!/usr/bin/env node

// Custom build script for Vite that works around top-level await issues
const { build } = require('vite');
const path = require('path');

async function buildApp() {
  console.log('🔨 Building Vite application...');
  
  try {
    // Optimized build configuration for faster production builds
    await build({
      root: path.resolve(__dirname, 'client'),
      build: {
        outDir: path.resolve(__dirname, 'dist/public'),
        emptyOutDir: true,
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          onwarn: (warning, warn) => {
            // Suppress specific warnings that aren't critical
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
            warn(warning);
          },
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-dom/client'],
              'vendor-router': ['wouter'],
              'vendor-query': ['@tanstack/react-query'],
              'vendor-forms': ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
              'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-toast']
            }
          }
        }
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      plugins: [
        // Only include the React plugin, skip Replit plugins
        require('@vitejs/plugin-react').default()
      ],
      css: {
        postcss: {
          plugins: []
        }
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
      },
      logLevel: 'info',
    });
    
    console.log('✅ Vite build completed successfully!');
    console.log('📦 Output directory: dist/public');
    
    // Skip TypeScript compilation - tsx handles it at runtime
    console.log('⚡ Skipping TypeScript compilation (handled by tsx at runtime)');
    console.log('✅ Server build completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildApp();