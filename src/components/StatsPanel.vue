<!-- src/components/StatsPanel.vue -->
<template>
  <section class="stats">
    <h2>📊 요약</h2>
    <div class="cards">
      <div class="card">
        <h3>이번 주</h3>
        <p>수입: {{ fmt(week.income) }}</p>
        <p>지출: {{ fmt(week.expense) }}</p>
        <p><strong>순이익: {{ fmt(week.net) }}</strong></p>
      </div>
      <div class="card">
        <h3>이번 달</h3>
        <p>수입: {{ fmt(month.income) }}</p>
        <p>지출: {{ fmt(month.expense) }}</p>
        <p><strong>순이익: {{ fmt(month.net) }}</strong></p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
// 별칭(@)이 없으면 "../utils/date.js"로 바꿔도 됩니다.
import { toDate, startOfWeekKST, startOfMonthKST } from "../utils/date.js";

const props = defineProps({
  // 각 item 예시: { amount:number|string, flow:'income'|'expense', created_at|date|ts }
  items: { type: Array, default: () => [] }
});

// 문자열 금액도 합산 가능하도록 보강
const num = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// flow → kind → type 순으로 보고, 한글도 허용
const isIncome = (it) => {
  const f = (it.flow || it.kind || it.type || '').toString().toLowerCase();
  return f === 'income' || f === '수입';
};
const isExpense = (it) => {
  const f = (it.flow || it.kind || it.type || '').toString().toLowerCase();
  return f === 'expense' || f === '지출';
};

const within = (it, since) => {
  const raw = it.ts ?? it.date ?? it.created_at ?? it.createdAt;
  const d = toDate(raw);
  return d instanceof Date && !isNaN(d) && d >= since;
};

const sumBy = (arr, pred) => arr.filter(pred).reduce((a, b) => a + num(b.amount), 0);

const week = computed(() => {
  const from = startOfWeekKST(new Date());
  const w = props.items.filter((it) => within(it, from));
  const income = sumBy(w, isIncome);
  const expense = sumBy(w, isExpense);
  return { income, expense, net: income - expense };
});

const month = computed(() => {
  const from = startOfMonthKST(new Date());
  const m = props.items.filter((it) => within(it, from));
  const income = sumBy(m, isIncome);
  const expense = sumBy(m, isExpense);
  return { income, expense, net: income - expense };
});

const fmt = (n) => `${(Number(n) || 0).toLocaleString("ko-KR")}원`;
</script>

<style scoped>
.stats { margin: 16px 0; }
.cards { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; }
.card { padding: 12px; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,.04); }
.card h3 { margin: 0 0 8px; }
</style>
