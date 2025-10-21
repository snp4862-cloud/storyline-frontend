// Firebase 라이브러리
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

/**
 * .env에서 주입 (Vite 규칙: VITE_ 접두사 필수)
 * - 위치: storyline-frontend/.env
 * - 예시:
 *   VITE_FIREBASE_API_KEY=...
 *   VITE_FIREBASE_AUTH_DOMAIN=storyline-app-7befe.firebaseapp.com
 *   VITE_FIREBASE_PROJECT_ID=storyline-app-7befe
 *   VITE_FIREBASE_APP_ID=1:577234317689:web:ca1f49fdaa2c99663fffa8
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=577234317689
 */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // storageBucket, measurementId는 필요할 때만 추가하세요
};

// HMR/재로딩 시 중복 초기화 방지
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 인증 객체
export const auth = getAuth(app);

// Google 로그인 제공자
export const provider = new GoogleAuthProvider();
// 로그인 시 계정 선택을 강제(사용자 전환 편의)
provider.setCustomParameters({ prompt: "select_account" });

// 브라우저에 로그인 상태 유지 + 디바이스 언어 사용
auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* 일부 환경에서 Persistence 설정이 실패해도 동작엔 큰 문제 없음 */
});

// ❌ 보안/권한 일관성을 위해 프론트에서 Firestore를 직접 쓰지 않습니다.
//    모든 데이터 읽기/쓰기는 FastAPI REST API를 통해 수행하세요.
//    정말 필요할 때만 아래 주석을 해제하세요.
// import { getFirestore } from "firebase/firestore";
// export const db = getFirestore(app);
