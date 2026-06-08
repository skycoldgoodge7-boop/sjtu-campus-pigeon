import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    assetsInlineLimit: 0, // 图片等资源作为独立文件，不内嵌 base64
  },
})
