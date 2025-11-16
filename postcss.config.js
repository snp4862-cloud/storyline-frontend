// (이 내용은 "postcss.config.js" 파일입니다)
// "type": "module"에 맞는 "최신" ESM 문법입니다.

// 1. (수정!) 플러그인을 "직접" import합니다.
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// 2. (수정!) 'plugins'를 "객체(Object)"가 아닌 "배열(Array)"로 내보냅니다.
// 이것이 'plugins.slice is not a function' 오류를 해결합니다.
export default {
  plugins: [
    tailwindcss,
    autoprefixer,
  ],
}