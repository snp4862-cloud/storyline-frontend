<script setup>
defineProps({
  summaryData: Object,
});
</script>

<template>
  <section class="card">
    <h2>이번 달 요약</h2>
    <div v-if="summaryData" class="summary">
      <div>
        <p class="label">업무 수입</p>
        <p class="val income">{{ (summaryData.business?.income ?? 0).toLocaleString() }}원</p>
      </div>
      <div>
        <p class="label">업무 지출</p>
        <p class="val expense">{{ (summaryData.business?.expense ?? 0).toLocaleString() }}원</p>
      </div>
      <div v-if="summaryData.business?.pending_income > 0">
        <p class="label">업무 미수입</p>
        <p class="val pending">{{ (summaryData.business?.pending_income ?? 0).toLocaleString() }}원</p>
      </div>
      <div v-if="summaryData.business?.pending_expense > 0">
        <p class="label">업무 미결 지출</p>
        <p class="val pending">{{ (summaryData.business?.pending_expense ?? 0).toLocaleString() }}원</p>
      </div>
    </div>
    <div v-if="summaryData" class="subtotals subtotals--small">
      <div class="line">
        <span class="pill pill-personal">개인</span>
        <span> +{{ (summaryData.personal?.income ?? 0).toLocaleString() }}원</span>
        <span> / -{{ (summaryData.personal?.expense ?? 0).toLocaleString() }}원</span>
      </div>
    </div>
    <p v-else>요약 정보를 불러오는 중...</p>
  </section>
</template>

<style scoped>
.card { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:16px; }
.summary { display:grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap:12px; text-align:center; }
.label { color:var(--muted); margin:0 0 4px; }
.val { margin:0; font-weight:700; font-size:1.2rem; }
.val.income { color:var(--g); }
.val.expense { color:var(--r); }
.val.pending { color:var(--y); }
.subtotals { margin-top: 8px; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.subtotals--small { font-size: 12px; color: var(--muted); }
.subtotals .line { display: flex; gap: 6px; align-items: center; }
.pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid var(--border); }
.pill-personal { background: #fff5f5; color: #ef4444; border-color: #ffd6d6; }
</style>