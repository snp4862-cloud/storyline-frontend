// src/utils/export.js
import { toDate } from './date.js';

// 프런트 목록 형태를 저장용 표준 형태로 정리
const sanitize = (items) =>
  (items ?? []).map((it) => {
    const rawDate = it.created_at ?? it.date ?? it.ts ?? null;
    const d = rawDate ? toDate(rawDate) : null;
    return {
      id: it.id ?? '',
      title: it.title ?? '',
      flow: it.flow ?? '',               // income | expense | pending_*
      amount: Number(it.amount ?? 0),
      memo: it.memo ?? it.note ?? '',
      date: d ? d.toISOString() : '',
    };
  });

export const downloadJSON = (items, filename = 'items.json') => {
  const blob = new Blob([JSON.stringify(sanitize(items), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const downloadCSV = (items, filename = 'items.csv') => {
  const rows = sanitize(items);
  const headers = ['id', 'title', 'flow', 'amount', 'memo', 'date'];
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = (r[h] ?? '').toString().replace(/"/g, '""');
          return `"${v}"`; // 콤마/개행/따옴표 안전 처리
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
