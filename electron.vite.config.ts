import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  main: {},
  preload: {},
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
    plugins: [
      react(),
      {
        name: 'react-devtools',
        transformIndexHtml(html, ctx) {
          if (!ctx.server) return html;
          return html.replace(
            '<script type="module" src="/src/main.tsx"></script>',
            '<script src="http://localhost:8097"></script>\n    <script type="module" src="/src/main.tsx"></script>'
          );
        }
      }
    ]
  }
})
