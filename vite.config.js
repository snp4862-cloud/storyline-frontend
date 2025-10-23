import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Storyline',
        short_name: 'Storyline',
        description: '대화형 AI 개인 비서',
        theme_color: '#42b983', // 앱 상단 바 색상
        icons: [
          {
            src: 'icon-192x192.png', // <- 이 이름 확인
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png', // <- 이 이름 확인
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})