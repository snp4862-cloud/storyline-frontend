// (이 내용은 "vite.config.js" 파일입니다)

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// (수정!) PostCSS 수동 import를 "삭제"합니다.
// import postcssConfig from './postcss.config.js' // <-- 이 줄 삭제

export default defineConfig({
  
  // (수정!) Vite가 자동으로 찾도록 css: {} 블록을 "삭제"합니다.
  // css: {
  //   postcss: postcssConfig
  // },

  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Storyline',
        short_name: 'Storyline',
        description: '대화형 AI 개인 비서',
        theme_color: '#42b983', 
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})