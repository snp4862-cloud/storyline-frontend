<!-- src/components/CategoryPieCharts.vue -->
<template>
  <section class="charts">
    <h2>🥧 월간 카테고리별 파이차트</h2>
    <div class="grid">
      <div class="card">
        <h3>수입(이번 달)</h3>
        <canvas ref="incomeCanvas" height="140"></canvas>
      </div>
      <div class="card">
        <h3>지출(이번 달)</h3>
        <canvas ref="expenseCanvas" height="140"></canvas>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart,
  PieController, ArcElement,
  Tooltip, Legend
} from 'chart.js'
import { toDate, startOfMonthKST } from '../utils/date.js'

Chart.register(PieController, ArcElement, Tooltip, Legend)

const props = defineProps({
  /** items: { amount, flow:'income'|'expense'|..., category?, created_at/date/ts? }[] */
  items: { type: Array, default: () => [] }
})
const emit = defineEmits(['select']) // { flow, category } 내보냄

const incomeCanvas = ref(null)
const expenseCanvas = ref(null)
let incomeChart = null
let expenseChart = null

function inThisMonth(dateLike){
  const d = toDate(dateLike)
  const start = startOfMonthKST(new Date())
  return d >= start && d.getMonth() === start.getMonth() && d.getFullYear() === start.getFullYear()
}

function groupByCategory(items, flowKey){
  const map = new Map()
  for (const it of items){
    if (it?.flow !== flowKey) continue
    const raw = it.created_at ?? it.date ?? it.ts
    if (!raw) continue
    if (!inThisMonth(raw)) continue
    const cat = (it.category ?? '기타').toString()
    const amt = Number(it.amount ?? 0)
    map.set(cat, (map.get(cat) ?? 0) + amt)
  }
  const labels = Array.from(map.keys())
  const data = Array.from(map.values())
  return { labels, data }
}

function drawPie(canvasEl, prevChart, dataset, title, flowKey){
  if (prevChart) prevChart.destroy()
  if (!canvasEl) return null

  const chart = new Chart(canvasEl.getContext('2d'), {
    type: 'pie',
    data: {
      labels: dataset.labels,
      datasets: [{ data: dataset.data }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed || 0
              return `${ctx.label}: ${new Intl.NumberFormat('ko-KR').format(val)}`
            }
          }
        },
        title: { display: false, text: title }
      }
    }
  })
  // 클릭 → 카테고리 선택 emit
  canvasEl.onclick = (evt) => {
    const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)
    if (!points?.length) return
    const idx = points[0].index
    const category = chart.data.labels[idx]
    emit('select', { flow: flowKey, category })
  }
  return chart
}

function redraw(){
  const incomeData = groupByCategory(props.items, 'income')
  const expenseData = groupByCategory(props.items, 'expense')

  incomeChart = drawPie(incomeCanvas.value, incomeChart, incomeData, '수입', 'income')
  expenseChart = drawPie(expenseCanvas.value, expenseChart, expenseData, '지출', 'expense')
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
