<!-- src/components/IncomeExpenseCharts.vue -->
<template>
  <section class="charts">
    <h2>📈 주/월 수입·지출 그래프</h2>
    <div class="grid">
      <div class="card">
        <h3>이번 주</h3>
        <canvas ref="weekCanvas" height="120"></canvas>
      </div>
      <div class="card">
        <h3>이번 달</h3>
        <canvas ref="monthCanvas" height="120"></canvas>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart,
  BarController, BarElement,
  CategoryScale, LinearScale,
  Tooltip, Legend,
} from 'chart.js'
import { toDate, startOfWeekKST, startOfMonthKST } from '../utils/date.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  /** items: 백엔드 목록 그대로 (title, amount, flow, created_at/ts 등) */
  items: { type: Array, default: () => [] }
  , filter: { type: Object, default: null } // { flow, category } | null
})

const weekCanvas = ref(null)
let weekChart = null

const monthCanvas = ref(null)
let monthChart = null

function matchFilter(it){
  if (!props.filter) return true
  // category는 일치해야 하고, flow는 있으면 일치 (둘 다 지정됨)
  const okCat = (it.category ?? '기타') === props.filter.category
  const okFlow = props.filter.flow ? it.flow === props.filter.flow : true
  return okCat && okFlow
}
function isIncome(it){ return it?.flow === 'income' && matchFilter(it) }
function isExpense(it){ return it?.flow === 'expense' && matchFilter(it) }

function getKSTDate(d){
  // KST 기준 날짜 객체 생성 (그룹핑 안정화)
  // 문자열 변환 후 재파싱 방식은 브라우저 지역설정 영향을 받을 수 있지만,
  // KST 환경에서 실사용 문제 없어 간단화.
  return new Date(
    new Date(d).toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  )
}

function bucketWeek(items){
  const start = startOfWeekKST(new Date())  // 월요일 00:00
  const labels = ['월','화','수','목','금','토','일']
  const income = Array(7).fill(0)
  const expense = Array(7).fill(0)

  for (const it of items){
    const raw = it.created_at ?? it.date ?? it.ts
    if (!raw) continue
    const d = getKSTDate(toDate(raw))
    if (d < start) continue
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1  // 월=0 … 일=6
    const amt = Number(it.amount ?? 0)
    if (isIncome(it)) income[day] += amt
    else if (isExpense(it)) expense[day] += amt
  }
  return { labels, income, expense }
}

function bucketMonth(items){
  const start = startOfMonthKST(new Date())  // 1일 00:00
  const year = start.getFullYear()
  const month = start.getMonth() // 0-11
  const last = new Date(year, month + 1, 0).getDate()
  const labels = Array.from({length: last}, (_,i)=> String(i+1))
  const income = Array(last).fill(0)
  const expense = Array(last).fill(0)

  for (const it of items){
    const raw = it.created_at ?? it.date ?? it.ts
    if (!raw) continue
    const d = getKSTDate(toDate(raw))
    if (d < start) continue
    if (d.getMonth() !== month || d.getFullYear() !== year) continue
    const day = d.getDate() - 1
    const amt = Number(it.amount ?? 0)
    if (isIncome(it)) income[day] += amt
    else if (isExpense(it)) expense[day] += amt
  }
  return { labels, income, expense }
}

function makeBarConfig({ labels, income, expense }, title){
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '수입', data: income, borderWidth: 1 },
        { label: '지출', data: expense, borderWidth: 1 },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
        title: { display: false, text: title },
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { stacked: false },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v)=> new Intl.NumberFormat('ko-KR').format(v)
          }
        }
      }
    }
  }
}

function redraw(){
  // 주간
  const w = bucketWeek(props.items)
  if (weekChart) weekChart.destroy()
  weekChart = new Chart(weekCanvas.value.getContext('2d'), makeBarConfig(w, '이번 주'))

  // 월간
  const m = bucketMonth(props.items)
  if (monthChart) monthChart.destroy()
  monthChart = new Chart(monthCanvas.value.getContext('2d'), makeBarConfig(m, '이번 달'))
}

onMounted(() => { redraw() })
onBeforeUnmount(() => {
  weekChart?.destroy()
  monthChart?.destroy()
})
watch(() => props.items, () => redraw(), { deep: true })
</script>

<style scoped>
.charts { margin: 16px 0; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(280px,1fr));
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
