const { build } = require('esbuild');
const path = require('path');

build({
  entryPoints: [path.resolve(__dirname, 'src/plugin/main.ts')],
  bundle: true,
  outfile: path.resolve(__dirname, 'dist/code.js'),
  platform: 'node',
  target: 'es2020',
  logLevel: 'info',
  minify: process.env.NODE_ENV === 'production',
}).catch(() => process.exit(1));
