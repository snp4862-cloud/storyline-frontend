// (이 내용은 src/main.js 파일입니다)
import { createApp } from 'vue'
import App from './App.vue'
import { auth } from './firebaseConfig.js'

// 방금 만든 Tailwind CSS 파일을 앱 전체에 적용합니다.
import './index.css' 

const app = createApp(App)
app.mount('#app')