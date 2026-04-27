import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub project Pages: https://<user>.github.io/<repo>/
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.CI && repo ? `/${repo}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5179",
        changeOrigin: true,
      },
    },
  },
})
