import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import crypto from 'crypto';

// Plugin to calculate SHA256 hashes of inlined scripts and update CSP
function cspHashPlugin(): PluginOption {
  return {
    name: 'csp-hash-plugin',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlFile = bundle['index.html'];
      // @ts-ignore - type definition mismatch for OutputAsset
      if (!htmlFile) return;

      // Cast to any or check type to satisfy TS
      const htmlAsset = htmlFile as unknown as { source: string | Uint8Array };
      if (typeof htmlAsset.source !== 'string') return;

      let html = htmlAsset.source;
      const scriptHashes: string[] = [];

      // Find all script tags and generate hashes
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      while ((match = scriptRegex.exec(html)) !== null) {
        const content = match[1];
        if (content) {
          const hash = crypto.createHash('sha256').update(content).digest('base64');
          scriptHashes.push(`'sha256-${hash}'`);
        }
      }

      // Update CSP to include hashes
      if (scriptHashes.length > 0) {
        // Look for CSP meta tag, handling potential newlines
        const cspRegex = /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["']([\s\S]*?)["']\s*\/?>/i;
        html = html.replace(
          cspRegex,
          (fullMatch: string, content: string) => {
            // Replace script-src directive
            const newContent = content.replace(
              /script-src\s+([^;]*)/,
              (_directiveMatch: string, existingValues: string) => {
                 // Remove 'unsafe-inline' if present and add hashes
                 const cleanedValues = existingValues
                   .replace(/'unsafe-inline'/g, '')
                   .trim();
                 return `script-src ${cleanedValues} ${scriptHashes.join(' ')}`;
              }
            );
            return fullMatch.replace(content, newContent);
          }
        );
      }

      // @ts-ignore - write back to source
      htmlAsset.source = html;
    }
  };
}

export default defineConfig(() => ({
  plugins: [react(), viteSingleFile(), cspHashPlugin()],
  root: path.resolve(__dirname, 'src/ui'),
  publicDir: path.resolve(__dirname, 'public'), // Ensure manifest.json is copied
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false, // Don't delete code.js from previous build step
    rollupOptions: {
      input: {
        ui: path.resolve(__dirname, 'src/ui/index.html'),
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
