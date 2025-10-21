// src/api.js
import { getAuth } from "firebase/auth";

/** =========================
 *  공통 설정
 *  ========================= */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://storyline-backend-298752257905.asia-northeast3.run.app";

/** URL 생성 헬퍼 (쿼리 파라미터 안전하게 붙이기) */
function buildURL(path, params) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.toString();
}

/** Firebase ID 토큰을 자동으로 붙여서 fetch */
export async function apiFetch(path, options = {}) {
  const user = getAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // body가 객체면 JSON으로 직렬화
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  // 일부 엔드포인트는 빈 본문일 수 있으므로 가드
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return res.json();
}

/** =========================
 *  엔드포인트 유틸
 *  ========================= */

/** 헬스체크 */
export const health = () => apiFetch("/health");

/** 루트 메타 */
export const rootMeta = () => apiFetch("/");

/** 아이템 추가 (POST /add)
 *  @param {{text:string, amount?:number, type?:string, due_date?:string}} payload
 */
export const addItem = (payload) =>
  apiFetch("/add", { method: "POST", body: payload });

/** 아이템 목록 (GET /items)
 *  @param {{date?:string, limit?:number, cursor?:string}} q
 */
export const getItems = (q = {}) =>
  apiFetch(buildURL("/items", q).replace(API_BASE, ""));

/** 아이템 수정 (PUT /items/{id})
 *  @param {string} id
 *  @param {{content?:string, amount?:number, status?:'완료'|'미결', due_date?:string}} payload
 */
export const updateItem = (id, payload) =>
  apiFetch(`/items/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
  });

/** 아이템 삭제 (DELETE /items/{id}) */
export const deleteItem = (id) =>
  apiFetch(`/items/${encodeURIComponent(id)}`, { method: "DELETE" });

/** 검색 (GET /search)
 *  백엔드 규칙: term / date / type_ / status 중 아무 것도 없으면 [] 반환
 *  @param {{term?:string, date?:string, type_?:string, status?:string, limit?:number}} q
 */
export const search = (q = {}) =>
  apiFetch(buildURL("/search", q).replace(API_BASE, ""));

/** 접두어 검색 (GET /search_prefix)
 *  @param {{term:string, limit?:number}} q
 */
export const searchPrefix = (q) =>
  apiFetch(buildURL("/search_prefix", q).replace(API_BASE, ""));

/** 월별 요약 (GET /summary)
 *  백엔드가 business/personal 소계를 함께 반환
 *  @returns {Promise<{
 *   status:'success',
 *   year:number, month:number,
 *   total_income:number, total_expense:number,
 *   pending_income:number, pending_expense:number,
 *   business:{income:number, expense:number, pending_income:number, pending_expense:number},
 *   personal:{income:number, expense:number, pending_income:number, pending_expense:number}
 * }>}
 */
export const getSummary = ({ year, month }) =>
  apiFetch(buildURL("/summary", { year, month }).replace(API_BASE, ""));
