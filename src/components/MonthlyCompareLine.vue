<!-- src/components/MonthlyCompareLine.vue -->
<template>
  <section class="charts">
    <h2>📉 이번 달 vs 지난 달 (일별 합계)</h2>
    <div class="grid">
      <div class="card">
        <h3>수입</h3>
        <canvas ref="incomeCanvas" height="140"></canvas>
      </div>
      <div class="card">
        <h3>지출</h3>
        <canvas ref="expenseCanvas" height="140"></canvas>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  Chart,
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale,
  Tooltip, Legend
} from 'chart.js'
import { toDate } from '../utils/date.js'

// Chart.js 등록
Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  // items: { amount, flow:'income'|'expense', created_at/date/ts, ... }
  items: { type: Array, default: () => [] }
  , filter: { type: Object, default: null } // { flow, category } | null
})

const incomeCanvas = ref(null)
const expenseCanvas = ref(null)
let incomeChart = null
let expenseChart = null

function ym(d){ return [d.getFullYear(), d.getMonth()] } // [YYYY, MM]
function firstDayOfMonth(year, month){ return new Date(year, month, 1, 0,0,0,0) }
function lastDayOfMonth(year, month){ return new Date(year, month + 1, 0, 23,59,59,999) }

function monthDays(year, month){
  return new Date(year, month + 1, 0).getDate()
}

function bucketMonth(items, year, month, flowKey){
  const days = monthDays(year, month)
  const labels = Array.from({length: days}, (_,i)=> String(i+1))
  const sums = Array(days).fill(0)

  for (const it of items){
    if (it?.flow !== flowKey) continue
    // 카테고리 필터가 있다면 일치하는 것만 집계
    if (props.filter?.category && (it.category ?? '기타') !== props.filter.category) continue
    // (선택) filter.flow가 지정되어 있고 flowKey와 다르면 사실상 0이지만, 위 조건으로 걸러짐
    const raw = it.created_at ?? it.date ?? it.ts
    if (!raw) continue
    const d = toDate(raw)
    if (d < firstDayOfMonth(year, month) || d > lastDayOfMonth(year, month)) continue
    const idx = d.getDate() - 1
    sums[idx] += Number(it.amount ?? 0)
  }
  return { labels, sums }
}

function makeLineConfig(labels, thisMonthData, prevMonthData){
  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '이번 달', data: thisMonthData, borderWidth: 2, tension: 0.25, pointRadius: 2 },
        { label: '지난 달', data: prevMonthData, borderWidth: 2, tension: 0.25, pointRadius: 2 },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${new Intl.NumberFormat('ko-KR').format(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => new Intl.NumberFormat('ko-KR').format(v)
          }
        }
      }
    }
  }
}

function redraw(){
  const now = new Date()
  const [y, m] = ym(now)                    // 이번 달
  const prevY = m === 0 ? y - 1 : y
  const prevM = m === 0 ? 11 : m - 1        // 지난 달

  // 수입
  const thisIncome = bucketMonth(props.items, y, m, 'income')
  const prevIncome = bucketMonth(props.items, prevY, prevM, 'income')
  const incomeLabels = thisIncome.labels.length >= prevIncome.labels.length ? thisIncome.labels : prevIncome.labels
  if (incomeChart) incomeChart.destroy()
  incomeChart = new Chart(incomeCanvas.value.getContext('2d'),
    makeLineConfig(incomeLabels, thisIncome.sums, prevIncome.sums)
  )

  // 지출
  const thisExpense = bucketMonth(props.items, y, m, 'expense')
  const prevExpense = bucketMonth(props.items, prevY, prevM, 'expense')
  const expenseLabels = thisExpense.labels.length >= prevExpense.labels.length ? thisExpense.labels : prevExpense.labels
  if (expenseChart) expenseChart.destroy()
  expenseChart = new Chart(expenseCanvas.value.getContext('2d'),
    makeLineConfig(expenseLabels, thisExpense.sums, prevExpense.sums)
  )
}

onMounted(() => redraw())
onBeforeUnmount(() => { incomeChart?.destroy(); expenseChart?.destroy() })
watch(() => props.items, () => redraw(), { deep: true })
</script>

<style scoped>
.charts { margin: 16px 0; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.card {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,.04);
}
h3 { margin: 0 0 8px; }
</style>
