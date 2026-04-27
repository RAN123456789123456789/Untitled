import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// - 默认: GitHub 项目页 `https://<user>.github.io/<repo>/` → base `/<repo>/`
// - 自定义域名在域名根: 在 CI 设 GH_PAGES_BASE=/ (否则 /Untitled/ 会指向错误路径, 页面空白)
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const explicit = process.env.GH_PAGES_BASE?.trim()
const base =
  explicit
    ? explicit.endsWith('/')
      ? explicit
      : `${explicit}/`
    : process.env.CI && repo
      ? `/${repo}/`
      : '/'

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
