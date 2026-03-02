import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    publicDir: resolve('public'),
    resolve: {
      alias: {
        components: resolve('src/renderer/src/components'),
        containers: resolve('src/renderer/src/containers'),
        services: resolve('src/renderer/src/services'),
        lib: resolve('src/renderer/src/lib'),
      }
    },
    plugins: [react()]
  }
})
