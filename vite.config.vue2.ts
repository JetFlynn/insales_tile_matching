import { resolve } from 'path';
import vue from '@vitejs/plugin-vue2';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist/vue2',
    lib: {
      entry: resolve(__dirname, 'wrappers/vue2/vue2.ts'),
      name: 'Match3PreloaderVue2',
      fileName: (format) => `match3preloader.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    emptyOutDir: false,
  },
});