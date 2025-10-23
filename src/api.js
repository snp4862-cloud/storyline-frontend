// api.js (개선판)
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig.js";

const API_BASE_URL = "http://localhost:8000/"; // 끝 슬래시는 유지
const DEFAULT_HEADERS = { "Content-Type": "application/json" };

function waitForUser() {
  const a = getAuth();
  if (a.currentUser) return Promise.resolve(a.currentUser);
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(a, (u) => {
      unsub();
      if (u) resolve(u);
      else reject(new Error("로그인이 필요합니다."));
    });
    // (선택) 일정 시간 후 타임아웃을 주고 싶으면 여기에 타이머 추가
  });
}

async function getIdTokenSafe(forceRefresh = false) {
  const user = await waitForUser();
  return user.getIdToken(forceRefresh);
}

function buildUrl(endpoint) {
  const path = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}${path}`;
}

function normalizeOptions(options = {}) {
  const out = { ...options };
  out.headers = { ...DEFAULT_HEADERS, ...(options.headers || {}) };

  // GET/HEAD에는 body 금지
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
    // 내용이 없는 200 응답 대비
    const text = await response.text();
    return text ? JSON.parse(text) : { status: "success" };
  }
  // JSON이 아니면 텍스트로
  return await response.text();
}

export async function apiFetch(endpoint, options = {}) {
  // 1) 우선 기존 토큰으로 시도
  let token = await getIdTokenSafe(false);
  let res = await fetch(buildUrl(endpoint), {
    ...normalizeOptions(options),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
      // Content-Type은 normalizeOptions에서 기본 부여
    },
  });

  // 2) 토큰 문제일 수 있으니, 401이면 강제 갱신 후 1회 재시도
  if (res.status === 401) {
    token = await getIdTokenSafe(true);
    res = await fetch(buildUrl(endpoint), {
      ...normalizeOptions(options),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }

  // 3) 최종 판정
  if (!res.ok) {
    // JSON 우선, 실패 시 텍스트
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
