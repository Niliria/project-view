import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [vue(), {
    name: 'copy-prototype',
    closeBundle() {
      // 在构建完成后复制 prototype/ 文件到 dist/
      const src = path.resolve(__dirname, 'prototype')
      const dest = path.resolve(__dirname, 'dist', 'prototype')
      
      if (fs.existsSync(src)) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true })
        }
        // 复制所有文件和子目录
        fs.cpSync(src, dest, { recursive: true })
      }
    }
  }],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
})
