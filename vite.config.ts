import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    dts({ include: ['src'], outDir: 'dist/types', rollupTypes: true })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PixCarousel',
      formats: ['es', 'umd'],
      fileName: (fmt) => `pixcarousel.${fmt}.js`
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      output: { assetFileNames: 'style.css' }
    }
  }
})
