import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VueDevTools(),
    monacoEditorPlugin({
      languageWorkers: ['json'],
      customWorkers: [],
      customDistPath: (root) => resolve(root, 'dist/assets/monaco-editor')
    }),
    {
      name: 'utools-plugin-copy-files',
      closeBundle() {
        // 确保dist目录存在
        if (!existsSync('dist')) {
          mkdirSync('dist')
        }
        
        // 复制plugin.json和preload.js文件到dist目录
        copyFileSync('plugin.json', resolve('dist', 'plugin.json'))
        copyFileSync('preload.js', resolve('dist', 'preload.js'))
        
        // 复制logo到dist目录
        if (existsSync('logo.png')) {
          copyFileSync('logo.png', resolve('dist', 'logo.png'))
        }
        
        console.log('uTools插件文件已复制到dist目录')
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173 // 保持与plugin.json中development.main一致
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: false, // 避免清空dist目录删除已复制的插件文件
    // 使用相对路径
    base: './',
    // 优化打包配置
    rollupOptions: {
      output: {
        // 移除手动分块，由 monaco-editor 插件处理
        manualChunks: {
          // 保留其他手动分块(如有)，但移除 monaco-editor 的配置
        }
      }
    },
    // 减小 chunk 大小阈值，优化加载性能
    chunkSizeWarningLimit: 5000
  },
  // 移除 optimizeDeps 配置，让插件处理
  optimizeDeps: {}
})
