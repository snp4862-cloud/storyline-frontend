// src/api/schedules.js (오류 수정 최종본)

// (이 파일은 storyline-frontend/src/api/schedules.js 입니다)

// api.js 파일에서 핵심 apiFetch 함수를 "가져옵니다(import)".
// (주의: api.js 파일의 경로가 정확해야 합니다)
//
// 가정:
// - api.js 파일 위치: src/api.js
// - 이 파일 위치: src/api/schedules.js
//
// 위 가정이 맞다면, 경로는 "../api.js"가 맞습니다.
import { apiFetch } from "../api.js";


const SCHEDULES_ENDPOINT = "/schedules/";

/**
 * [R] 모든 일정을 조회합니다.
 */
export const getSchedules = () => {
  return apiFetch(SCHEDULES_ENDPOINT, {
    method: "GET",
  });
};

/**
 * [C] 새 일정을 생성합니다.
 */
export const createSchedule = (scheduleData) => {
  return apiFetch(SCHEDULES_ENDPOINT, {
    method: "POST",
    body: scheduleData,
  });
};

/**
 * [U] 기존 일정을 부분 수정합니다.
 */
export const updateSchedule = (scheduleId, updateData) => {
  return apiFetch(`${SCHEDULES_ENDPOINT}${scheduleId}`, {
    method: "PATCH",
    body: updateData,
  });
};

/**
 * [D] 특정 일정을 삭제합니다.
 */
export const deleteSchedule = (scheduleId) => {
  return apiFetch(`${SCHEDULES_ENDPOINT}${scheduleId}`, {
    method: "DELETE",
  });
};

// (중요)
// 이 파일에는 'export async function apiFetch...' 코드가
// 절대로! 절대로! 있으면 안 됩니다.