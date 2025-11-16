// src/api/transactions.js (수정 기능 추가 최종본)

// (이 파일은 storyline-frontend/src/api/transactions.js 입니다)

// api.js 파일에서 핵심 apiFetch 함수를 "가져옵니다(import)".
import { apiFetch } from "../api.js";

const TRANSACTIONS_ENDPOINT = "/transactions/";

/**
 * [R] 모든 거래(수입/지출)를 조회합니다.
 */
export const getTransactions = () => {
  return apiFetch(TRANSACTIONS_ENDPOINT, {
    method: "GET",
  });
};

/**
 * [C] 새 거래를 생성합니다.
 */
export const createTransaction = (transactionData) => {
  return apiFetch(TRANSACTIONS_ENDPOINT, {
    method: "POST",
    body: transactionData,
  });
};

/**
 * (새 기능!)
 * [U] 기존 거래를 부분 수정합니다.
 * @param {string} transactionId 수정할 거래의 ID
 * @param {object} updateData (예: { description: "수정된 내역", amount: 12000 })
 * @returns {Promise<object>} 수정된 거래 객체
 */
export const updateTransaction = (transactionId, updateData) => {
  return apiFetch(`${TRANSACTIONS_ENDPOINT}${transactionId}`, {
    method: "PATCH",
    body: updateData,
  });
};

/**
 * [D] 특정 거래를 삭제합니다.
 */
export const deleteTransaction = (transactionId) => {
  return apiFetch(`${TRANSACTIONS_ENDPOINT}${transactionId}`, {
    method: "DELETE",
  });
};