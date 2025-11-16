// src/api/ai.js (새 파일)

// (이 파일은 storyline-frontend/src/api/ai.js 입니다)

// api.js 파일에서 핵심 apiFetch 함수를 "가져옵니다(import)".
import { apiFetch } from "../api.js";

const AI_ENDPOINT = "/ai";

/**
 * [AI] 일상 언어 텍스트를 백엔드로 보내 분석(parse)을 요청합니다.
 * @param {string} text (예: "내일 3시 OOO님 미팅")
 * @returns {Promise<object>} AI가 분석한 JSON 객체 (예: { type: "schedule", data: {...} })
 */
export const parseText = (text) => {
  return apiFetch(`${AI_ENDPOINT}/parse`, {
    method: "POST",
    body: { text: text }, // { "text": "..." } 형식으로 전송
  });
};