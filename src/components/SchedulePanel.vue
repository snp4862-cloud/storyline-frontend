<template>
  <section class="card">
    <h3 class="section-title">🗓️ 일정</h3>

    <!-- 상단: 월 선택 -->
    <div class="flex items-center gap-2 mb-3">
      <label class="text-sm text-zinc-600">월 선택</label>
      <input type="month" v-model="month" class="input" />
      <button class="btn-outline" @click="reload" :disabled="loading">
        새로고침
      </button>
      <span v-if="loading" class="text-zinc-500 text-sm">불러오는 중…</span>
    </div>

    <!-- 인라인 작성/수정 폼 (모달 지양) -->
    <div class="border rounded-lg p-3 mb-4">
      <h4 class="font-semibold mb-2">
        {{ editingId ? '일정 수정' : '새 일정' }}
      </h4>

      <div class="grid md:grid-cols-2 gap-3">
        <label class="text-sm">
          제목
          <input v-model.trim="form.title" class="input w-full" placeholder="예: 행복마을 CCTV 설치" />
        </label>

        <label class="text-sm">
          날짜
          <input type="date" v-model="form.date" class="input w-full" />
        </label>

        <label class="text-sm">
          시작 시간
          <input type="time" v-model="form.start_time" class="input w-full" />
        </label>

        <label class="text-sm">
          종료 시간
          <input type="time" v-model="form.end_time" class="input w-full" />
        </label>

        <label class="text-sm md:col-span-2">
          장소
          <input v-model.trim="form.location" class="input w-full" placeholder="예: 대구 행복마을 안지사거리" />
        </label>

        <label class="text-sm md:col-span-2">
          메모
          <textarea v-model.trim="form.notes" rows="2" class="input w-full" placeholder="참고사항"></textarea>
        </label>
      </div>

      <div class="mt-3 flex gap-2">
        <button class="btn" @click="save" :disabled="saving || !canSave">
          {{ saving ? '저장 중…' : (editingId ? '수정 저장' : '추가') }}
        </button>
        <button class="btn-outline" @click="resetForm" :disabled="saving">초기화</button>
      </div>
    </div>

    <!-- 목록 -->
    <div v-if="filtered.length === 0" class="text-zinc-500">
      선택한 월에 해당하는 일정이 없습니다.
    </div>

    <ul v-else class="divide-y">
      <li v-for="it in filtered" :key="it.id" class="py-3 flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold">{{ it.title }}</div>
          <div class="text-xs text-zinc-500">
            {{ formatKST(it.start_dt || it.start_at || it.date) }}
            <template v-if="it.end_dt || it.end_at">
              ~ {{ formatKST(it.end_dt || it.end_at) }}
            </template>
            <template v-if="it.location"> · {{ it.location }}</template>
          </div>
          <div class="text-xs text-zinc-500" v-if="it.notes">{{ it.notes }}</div>
        </div>

        <div class="flex gap-2 shrink-0">
          <button class="btn-outline" @click="beginEdit(it)">편집</button>
          <button class="btn-outline" @click="remove(it.id)" :disabled="saving">삭제</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// ✅ 상대경로 사용(별칭 @ 미설정 환경에서 안전)
import { listSchedules, createSchedule, updateSchedule, deleteSchedule } from '../api.js'
import { getAuth } from 'firebase/auth'

/* 상태 */
const month = ref(new Date().toISOString().slice(0,7)) // "YYYY-MM"
const items = ref([])     // 서버에서 받은 전체 일정
const loading = ref(false)
const saving = ref(false)

const editingId = ref(null)
const form = ref({
  title: '',
  date: new Date().toISOString().slice(0,10), // YYYY-MM-DD
  start_time: '',
  end_time: '',
  location: '',
  notes: '',
})

/* 유틸 */
function formatKST(x) {
  try {
    // x가 ISO이거나 날짜 문자열일 때
    return new Date(x).toLocaleString('ko-KR')
  } catch { return '-' }
}
function resetForm() {
  editingId.value = null
  form.value = {
    title: '',
    date: new Date().toISOString().slice(0,10),
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
  }
}
const canSave = computed(() => !!form.value.title?.trim())

/* 목록 불러오기 */
async function reload() {
  // ✅ 로그인 가드: 로그인 안 되어 있으면 불러오지 않음
  if (!getAuth().currentUser) return
  loading.value = true
  try {
    const data = await listSchedules()
    items.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[schedules] load fail:', e)
  } finally {
    loading.value = false
  }
}

/* 월 필터링: start_dt(또는 date) 기준 */
const filtered = computed(() => {
  const ym = month.value // 'YYYY-MM'
  return (items.value || []).filter(it => {
    const s = String(it.start_dt || it.start_at || it.date || '')
    return s.startsWith(ym)
  })
})

async function save() {
  error.value = '';
  const text = inputSentence.value?.trim();   // 자연어 한 줄 입력창
  try {
    let created;
    if (text) {
      // 문장 파싱 경로
      created = await api.addItemFromSentence(text);
      inputSentence.value = '';
    } else {
      // 직접 폼 입력 경로(폼 변수 예시)
      const payload = {
        title: form.title,
        date: form.date,            // 'YYYY-MM-DD'
        amount: form.amount,        // number
        flow: form.flow,            // 'income' | 'expense'
        category: form.category || null,
        notes: form.notes || null,
        is_done: !!form.is_done,
      };
      created = await api.addItem(payload);
      // 필요 시 폼 초기화
    }

    // 목록/요약 즉시 반영
    items.value = [created, ...items.value];
    recomputeSummary();             // 아래 3) 참고
  } catch (e) {
    error.value = e.message || String(e);
  }
}

/* 편집 */
function beginEdit(it) {
  editingId.value = it.id
  // 서버 필드명(start_dt / start_at / date 등) → 폼으로 역주입
  const start = it.start_dt || it.start_at || it.date
  const end = it.end_dt || it.end_at || ''
  const d = start ? new Date(start) : null
  form.value = {
    title: it.title ?? '',
    date: d ? d.toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    start_time: d ? d.toISOString().slice(11,16) : '',
    end_time: end ? new Date(end).toISOString().slice(11,16) : '',
    location: it.location ?? '',
    notes: it.notes ?? '',
  }
}

/* 삭제 */
async function remove(id) {
  if (!confirm('정말 삭제할까요?')) return
  saving.value = true
  try {
    await deleteSchedule(id)
    await reload()
  } catch (e) {
    console.error('[schedules] delete fail:', e)
    alert('삭제에 실패했어요.')
  } finally {
    saving.value = false
  }
}


onMounted(reload) // ✅ 우리가 만든 목록 불러오기 함수 이름은 reload
;
</script>

<style scoped>
.schedule-panel { display: grid; gap: 12px; }
header { justify-content: space-between; }
.btn, button { padding: 6px 10px; border-radius: 8px; border: 1px solid #ddd; }
.btn.primary, .primary { border-color: transparent; background: #2b6cb0; color: white; }
.danger { color: #b00020; }
.day-group { background: var(--panel-bg, #fff); padding: 10px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.done { text-decoration: line-through; opacity: .7; }
.tag { margin-left: 6px; background: #eef2ff; padding: 1px 6px; border-radius: 6px; }
.notes { max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
dialog { border: none; border-radius: 12px; padding: 0; }
dialog form { padding: 16px; display: grid; gap: 10px; min-width: 360px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
table { border-collapse: collapse; }
th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
.empty { color: #666; padding: 12px; }
</style>
