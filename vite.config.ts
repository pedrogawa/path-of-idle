import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/poedb': {
        target: 'https://poedb.tw',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/poedb/, '/us/api'),
      },
    },
  },
})
