import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const banner = `/*!
 * pixcarousel v${pkg.version}
 * MIT License
 */`;

const postcssPlugin = postcss({
  extract: 'style.css',
  minimize: true,
});

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/pixcarousel.esm.js',
        format: 'esm',
        banner,
        sourcemap: true,
      },
      {
        file: 'dist/pixcarousel.cjs.js',
        format: 'cjs',
        banner,
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [resolve(), postcssPlugin, terser({ format: { comments: /^!/ } })],
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/pixcarousel.umd.js',
      format: 'umd',
      name: 'PixCarousel',
      banner,
      sourcemap: true,
      exports: 'named',
    },
    plugins: [resolve(), postcssPlugin, terser({ format: { comments: /^!/ } })],
  },
];
