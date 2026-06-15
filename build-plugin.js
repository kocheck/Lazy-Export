const { build } = require('esbuild');
const path = require('path');

build({
  entryPoints: [path.resolve(__dirname, 'src/plugin/main.ts')],
  bundle: true,
  outfile: path.resolve(__dirname, 'dist/code.js'),
  platform: 'node',
  // The Figma plugin sandbox cannot parse ES2020 syntax (optional chaining `?.`,
  // nullish coalescing `??`). Target es2017 so esbuild lowers those to compatible
  // code while keeping async/await (which the sandbox supports). Do NOT raise this
  // to es2019+ without re-testing in Figma — `?.`/`??` would ship unlowered again.
  target: 'es2017',
  logLevel: 'info',
  minify: process.env.NODE_ENV === 'production',
}).catch(() => process.exit(1));
