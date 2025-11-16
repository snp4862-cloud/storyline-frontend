// src/utils/date.js
export function toDate(v) {
  if (!v) return new Date(0);
  if (v instanceof Date) return v;
  // "YYYY-MM-DD" 또는 ISO 문자열 지원
  return new Date(v);
}

const KST_OFFSET_MIN = 9 * 60; // 9시간

function toKST(d) {
  // 입력 date를 KST 기준 시각으로 변환한 Date 객체 반환(값 비교용)
  const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  return new Date(utc.getTime() + KST_OFFSET_MIN * 60000);
}

export function startOfWeekKST(d) {
  const k = toKST(d);
  const day = k.getDay() || 7; // 월=1, ... 일=7로 보기 위함
  k.setHours(0, 0, 0, 0);
  k.setDate(k.getDate() - (day - 1)); // 월요일 시작
  return k;
}

export function startOfMonthKST(d) {
  const k = toKST(d);
  k.setHours(0, 0, 0, 0);
  k.setDate(1);
  return k;
}
