import * as esbuild from 'esbuild';
import path from 'node:path';
const v = '02_barbados_own_goal';
await esbuild.build({
  entryPoints: ['src/phone/entry.tsx'], bundle: true, format: 'esm', outfile: 'out/web/episode.js', minify: true, target: 'es2022', jsx: 'transform', platform: 'browser',
  external: ['three'], alias: {'@story': path.resolve('src/videos', v)}, define: {'process.env.NODE_ENV': '"production"'}, logLevel: 'info', treeShaking: true,
  loader: {'.tsx': 'tsx'},
});
