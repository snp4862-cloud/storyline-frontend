// src/api.js (최종본)

// (이 파일은 storyline-frontend/src/api.js 입니다)

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig.js"; // ./firebaseConfig.js 경로는 실제 파일 위치에 맞게 수정하세요.

// Vite 환경 변수를 사용하여 API 기본 URL을 동적으로 설정합니다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const DEFAULT_HEADERS = { "Content-Type": "application/json" };

// --- 인증 상태 리스너 (App.vue에서 사용) ---
export function listenToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

// --- 내부 헬퍼 함수 ---

function waitForUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      if (u) resolve(u);
      else reject(new Error("로그인이 필요합니다. (waitForUser)"));
    });
  });
}

async function getIdTokenSafe(forceRefresh = false) {
  const user = await waitForUser();
  return user.getIdToken(forceRefresh);
}

function buildUrl(endpoint) {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${path}`;
}

function normalizeOptions(options = {}) {
  const out = { ...options };
  out.headers = { ...DEFAULT_HEADERS, ...(options.headers || {}) };

  const method = (options.method || "GET").toUpperCase();
  if (options.body != null && typeof options.body === "object" && method !== "GET" && method !== "HEAD") {
    out.body = JSON.stringify(options.body);
  }
  return out;
}

async function parseResponse(response) {
  if (response.status === 204) return { status: "success" };

  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const text = await response.text();
    return text ? JSON.parse(text) : { status: "success" };
  }
  return await response.text();
}

// --- 핵심 API Fetch 함수 ---

/**
 * 인증 토큰을 포함하여 API를 호출하는 메인 함수
 * (이 함수는 여기에 "딱 한 번"만 선언되어야 합니다)
 */
export async function apiFetch(endpoint, options = {}) {
  let token;
  try {
    token = await getIdTokenSafe(false);
  } catch (err) {
    console.error("apiFetch: 인증 토큰을 가져올 수 없습니다.", err);
    throw err;
  }

  const fetchOptions = {
    ...normalizeOptions(options),
    headers: {
      ...normalizeOptions(options).headers,
      Authorization: `Bearer ${token}`,
    },
  };

  let res = await fetch(buildUrl(endpoint), fetchOptions);

  if (res.status === 401) {
    console.warn("apiFetch: 401 응답. 토큰을 갱신하고 재시도합니다.");
    token = await getIdTokenSafe(true); // 강제 갱신
    fetchOptions.headers.Authorization = `Bearer ${token}`;
    res = await fetch(buildUrl(endpoint), fetchOptions);
  }

  if (!res.ok) {
    let message = "API 요청에 실패했습니다.";
    try {
      const maybeJson = await parseResponse(res);
      if (maybeJson && typeof maybeJson === "object" && maybeJson.detail) {
        message = maybeJson.detail;
      } else if (typeof maybeJson === "string" && maybeJson.trim()) {
        message = maybeJson;
      }
    } catch {
      // ignore
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return parseResponse(res);
}