import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import externals from 'rollup-plugin-node-externals'
import { terser } from 'rollup-plugin-terser'
import serve from 'rollup-plugin-serve'
import filesize from 'rollup-plugin-filesize'

import livereload from 'rollup-plugin-livereload'

import pkg from './package.json'

const plugins = [
  svelte(),
  resolve({
    dedupe: ['svelte'],
    extensions: ['.svelte', '.mjs', '.js', '.cjs', '.json', '.node'],
  }),
]

export default process.env.ROLLUP_WATCH
  ? {
      input: './src/example/main.js',
      output: {
        format: 'esm',
        dir: './public/build',
        sourcemap: true,
      },
      plugins: [
        ...plugins,

        commonjs(),

        serve({
          contentBase: 'public',
          port: 5000,
          historyApiFallback: true,
        }),

        livereload(),
      ],
    }
  : [
      {
        input: pkg.source,
        output: [
          {
            format: 'esm',
            file: pkg.module,
            sourcemap: true,
            plugins: [filesize({ showBeforeSizes: 'build' })],
          },
          {
            format: 'cjs',
            file: pkg.main,
            sourcemap: true,
          },
        ],
        plugins: [
          externals({ deps: true }),
          ...plugins,
          babel({
            babelHelpers: 'runtime',
            exclude: 'node_modules/**',
          }),
        ],
      },
      {
        input: pkg.source,
        output: {
          format: 'umd',
          name: 'svelteFormup',
          file: pkg.unpkg,
          sourcemap: true,
        },

        plugins: [
          ...plugins,
          commonjs(),
          terser(),
          babel({
            babelHelpers: 'runtime',
            exclude: 'node_modules/**',
          }),
        ],
      },
    ]
