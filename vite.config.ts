import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import crypto from 'crypto';

// Plugin to calculate SHA256 hashes of inlined scripts and styles and update CSP
function cspHashPlugin(): PluginOption {
  // Helper function to normalize CSP directive tokens
  const normalizeTokens = (existingValues: string, hashes: string[]): string => {
    const existingTokens = existingValues
      .split(/\s+/)
      .filter((token) => token.length > 0 && token !== `'unsafe-inline'`);
    const finalTokens = [...existingTokens, ...hashes];
    return finalTokens.join(' ');
  };

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
      const styleHashes: string[] = [];

      // Find all script tags and generate hashes
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      while ((match = scriptRegex.exec(html)) !== null) {
        const content = match[1];
        if (content && content.trim()) {
          const hash = crypto.createHash('sha256').update(content).digest('base64');
          scriptHashes.push(`'sha256-${hash}'`);
        }
      }

      // Find all inline style tags and generate hashes
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let styleMatch;
      while ((styleMatch = styleRegex.exec(html)) !== null) {
        const content = styleMatch[1];
        if (content && content.trim()) {
          const hash = crypto.createHash('sha256').update(content).digest('base64');
          styleHashes.push(`'sha256-${hash}'`);
        }
      }

      // Update CSP to include hashes
      if (scriptHashes.length > 0 || styleHashes.length > 0) {
        // Look for CSP meta tag with flexible attribute order and quote styles
        // Pattern explanation:
        // - <meta\b[^>]*\b - matches opening <meta tag with word boundary
        // - http-equiv=(?:"Content-Security-Policy"|'Content-Security-Policy') - matches http-equiv attribute with either quote style
        // - [^>]*\b - matches any other attributes
        // - content=(["']) - matches content attribute, capturing the quote character
        // - ([\s\S]*?)\1 - captures content value and ensures matching closing quote
        // - [^>]*> - matches rest of tag to closing >
        const cspRegex =
          /<meta\b[^>]*\bhttp-equiv=(?:"Content-Security-Policy"|'Content-Security-Policy')[^>]*\bcontent=(["'])([\s\S]*?)\1[^>]*>/i;
        html = html.replace(
          cspRegex,
          (fullMatch: string, _quote: string, content: string) => {
            let newContent = content;
            
            // Replace script-src directive with normalized tokens
            if (scriptHashes.length > 0) {
              newContent = newContent.replace(
                /script-src\s+([^;]*)/,
                (_directiveMatch: string, existingValues: string) => {
                  return `script-src ${normalizeTokens(existingValues, scriptHashes)}`;
                }
              );
            }
            
            // Replace style-src directive with normalized tokens
            if (styleHashes.length > 0) {
              newContent = newContent.replace(
                /style-src\s+([^;]*)/,
                (_directiveMatch: string, existingValues: string) => {
                  return `style-src ${normalizeTokens(existingValues, styleHashes)}`;
                }
              );
            }
            
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
