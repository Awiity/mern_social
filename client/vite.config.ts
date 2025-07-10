import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.BASE_URL': JSON.stringify(env.BASE_URL),
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
    },
    plugins: [react()],
  }
})