import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig(() => ({
  plugins: [react(), viteSingleFile()],
  root: path.resolve(__dirname, 'src/ui'),
  publicDir: path.resolve(__dirname, 'public'), // Ensure manifest.json is copied
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false, // Don't delete code.js from previous build step
    rollupOptions: {
      input: {
        ui: path.resolve(__dirname, 'src/ui/index.html'),
      },
      output: {
        entryFileNames: 'ui.js',
        assetFileNames: 'ui.[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@plugin': path.resolve(__dirname, 'src/plugin'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    root: path.resolve(__dirname, 'src'),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/coverage/**',
        '**/*.css',
        'ui/main.tsx', // Entry point
      ],
    },
  },
}));
