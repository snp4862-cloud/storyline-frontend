import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAyV2UUVwaNKjKIjjIQD3y5xKtfQeLlnm4",
  authDomain: "my-assistant-ngyp-4471a.firebaseapp.com",
  projectId: "my-assistant-ngyp-4471a",
  storageBucket: "my-assistant-ngyp-4471a.firebasestorage.app",
  messagingSenderId: "701646171739",
  appId: "1:701646171739:web:c31845f8746e7763d7d97e"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// top-level await 쓰지 말기
setPersistence(auth, browserLocalPersistence).catch(e =>
  console.warn("Auth persistence set failed:", e)
);

export { app, auth };
