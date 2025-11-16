// src/api.js
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const BASE = API_BASE_URL.replace(/\/$/, "");   // ✅ 새로 추가

// ===== 공통 헤더 =====
const JSON_HEADERS = { "Content-Type": "application/json" };

// ===== 토큰 =====
export async function getIdToken(force = false) {
  const a = getAuth();
  if (a.currentUser) return a.currentUser.getIdToken(force);

  const user = await new Promise((resolve, reject) => {
    const off = onAuthStateChanged(a, (u) => { off(); resolve(u); }, reject);
    setTimeout(() => { off(); resolve(null); }, 5000);
  });
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken(force);
}

// ===== 공용 요청 헬퍼 (JSON 파싱 + 에러 메시지 보강) =====
async function authed(url, init = {}) {
  const t = await getIdToken();
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${t}` },
  });
  const text = await res.text();
  if (!res.ok) {
    // 호출자가 상태코드가 필요하면 여기서 던집니다
    const err = new Error(`${res.status} ${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

/* =========================
 *          ITEMS
 * ========================= */

// 목록
export const listItems = (q = {}) => {
  const url = new URL(`${API_BASE_URL}/items`);
  Object.entries(q).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, v);
  });
  return authed(url.toString());
};


// === 상단 공통 유틸/상수는 그대로 두고, addItem만 교체하세요 ===

// 간단 파서: "5만원", "57,000", "20000" 인식 + 수입/지출 키워드
function quickParse(text) {
  const t = (text || '').trim();

  // 금액
  const hasManwon = /만원/.test(t);
  // "5만원" 형태 or 일반 숫자 추출
  let raw = null;
  const m1 = t.match(/([+-]?\d+(?:[.,]\d+)?)(?=\s*만원)/);        // 5만원, 5.5만원
  const m2 = t.match(/([+-]?\d{1,3}(?:[.,]\d{3})+)/);            // 57,000 등
  const m3 = t.match(/([+-]?\d+(?:[.,]\d+)?)/);                   // 마지막 보루
  if (m1) raw = m1[1];
  else if (m2) raw = m2[1];
  else if (m3) raw = m3[1];

  let amount = 0;
  if (raw != null) {
    const n = Number(String(raw).replace(/[^\d.-]/g, ''));
    amount = Number.isFinite(n) ? n : 0;
    if (hasManwon) amount *= 10000;
  }

  // 수입/지출
  // (입금/수입/매출/판매 → income, 지출/비용/구매/결제 → expense)
  let flow = 'expense';
  if (/(수입|입금|매출|판매|받[았음았다]|들어옴)/.test(t)) flow = 'income';
  if (/(지출|비용|구매|결제|나감|출금)/.test(t)) flow = 'expense';

  // 제목은 원문 그대로(원하면 금액/키워드 제거 가능)
  const title = t;

  return { title, amount, flow };
}

// 인증 포함 fetch (당신의 파일에 이미 있는 authed를 그대로 사용)
async function postItems(body) {
  return authed(`${API_BASE_URL}/items`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

// 최종 addItem: text 있으면 파싱 → /items 로 전송
export async function addItem(body = {}) {
  try {
    if (typeof body.text === 'string' && body.text.trim()) {
      const parsed = quickParse(body.text);
      // 서버 스키마(title/amount/flow/created_at 등)에 맞춰 추가 필드가 필요하면 여기서 넣으세요.
      return await postItems(parsed);
    }
    // text가 아니라 이미 title/amount/flow로 온 경우 그대로 보냄
    return await postItems(body);
  } catch (e) {
    // 서버가 /items만 있는 구성이므로 그대로 에러 전달
    // (원한다면 여기서 /add 재시도 로직을 추가할 수도 있습니다)
    throw e;
  }
}


/* ==== 클라이언트 내보내기 유틸(서버 /export 없을 때 사용) ==== */
export function exportJSONClient(data, filename = 'storyline.json') {
  const blob = new Blob([JSON.stringify(data ?? [], null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export function exportCSVClient(data, filename = 'storyline.csv') {
  const rows = Array.isArray(data) ? data : [];
  const cols = ['id','title','amount','flow','category','created_at','date','notes','location'];
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const lines = [
    cols.join(','),
    ...rows.map(r => cols.map(c => esc(r[c])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* =========================
 *        SCHEDULES
 * ========================= */

// 조회: ?month=YYYY-MM 지원
export function fetchSchedules(query = {}) {
  const url = new URL(`${API_BASE_URL}/schedules`);
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, v);
  });
  return authed(url.toString());
}

// 생성: 문자열 기반(백엔드와 키 일치)
export function createSchedule(body) {
  // body: { title, date:'YYYY-MM-DD', start_time?, end_time?, location?, notes?, category?, is_done? }
  return authed(`${API_BASE_URL}/schedules`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function updateSchedule(id, body) {
  return authed(`${API_BASE_URL}/schedules/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function deleteSchedule(id) {
  return authed(`${API_BASE_URL}/schedules/${id}`, { method: "DELETE" });
}
