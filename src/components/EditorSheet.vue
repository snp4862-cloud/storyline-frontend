<script setup>
import { ref, watch, computed } from 'vue'
import { createItem, updateItem } from '@/api.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false }, // 열기/닫기
  editing: { type: Object, default: null }       // 편집 중 아이템(없으면 신규)
})
const emit = defineEmits(['update:modelValue', 'saved'])

const open = ref(props.modelValue)
watch(() => props.modelValue, v => { open.value = v })
watch(open, v => emit('update:modelValue', v))

// 폼 상태
const form = ref({
  id: null,
  title: '',
  date: new Date().toISOString().slice(0,10),
  start_time: '',
  end_time: '',
  location: '',
  notes: '',
  category: '',
  amount: '',     // “5만원/2만4천/24000” 등 문자열 허용 → 백엔드 파싱
  is_done: false,
})

watch(() => props.editing, (e) => {
  if (!e) {
    form.value = {
      id: null,
      title: '',
      date: new Date().toISOString().slice(0,10),
      start_time: '',
      end_time: '',
      location: '',
      notes: '',
      category: '',
      amount: '',
      is_done: false,
    }
    return
  }
  form.value = {
    id: e.id ?? null,
    title: e.title ?? '',
    date: e.date ?? new Date().toISOString().slice(0,10),
    start_time: e.start_time ?? '',
    end_time: e.end_time ?? '',
    location: e.location ?? '',
    notes: e.notes ?? '',
    category: e.category ?? '',
    amount: e.amount ?? '',
    is_done: !!e.is_done,
  }
}, { immediate: true })

const isEditing = computed(() => !!form.value.id)
const saving = ref(false)
const canSave = computed(() => !!form.value.title && !saving.value)

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    const payload = {
      title: form.value.title?.trim(),
      date: form.value.date,
      start_time: form.value.start_time || null,
      end_time: form.value.end_time || null,
      location: form.value.location?.trim() || null,
      notes: form.value.notes?.trim() || null,
      category: form.value.category || null,
      amount: form.value.amount, // 그대로 전달
      is_done: !!form.value.is_done,
    }
    const result = isEditing.value
      ? await updateItem(form.value.id, payload)
      : await createItem(payload)

    emit('saved', result)
    open.value = false
  } catch (err) {
    console.error(err)
    alert('저장에 실패했어요. 콘솔을 확인해 주세요.')
  } finally {
    saving.value = false
  }
}

function closePanel() { open.value = false }
function onKeydown(e) {
  if (e.key === 'Escape') closePanel()
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSave.value) save()
}
</script>

<template>
  <!-- 오버레이 (바깥 클릭 닫힘) -->
  <div
    v-if="open"
    class="es-overlay"
    @click.self="closePanel"
    @keydown="onKeydown"
    tabindex="0"
  >
    <!-- 패널: 모바일=바텀시트 / 데스크톱=사이드 드로어 -->
    <div class="es-panel">
      <header class="es-header">
        <h3 class="es-title">{{ isEditing ? '항목 수정' : '새 항목' }}</h3>
        <button class="es-close" @click="closePanel" aria-label="close">✕</button>
      </header>

      <form class="es-form" @submit.prevent="save">
        <label class="es-label">
          <span>제목</span>
          <input v-model.trim="form.title" placeholder="무엇을 기록할까요?" required />
        </label>

        <div class="es-row">
          <label class="es-label">
            <span>날짜</span>
            <input type="date" v-model="form.date" />
          </label>
          <label class="es-label">
            <span>시작</span>
            <input type="time" v-model="form.start_time" />
          </label>
          <label class="es-label">
            <span>종료</span>
            <input type="time" v-model="form.end_time" />
          </label>
        </div>

        <label class="es-label">
          <span>장소</span>
          <input v-model.trim="form.location" placeholder="장소(선택)" />
        </label>

        <label class="es-label">
          <span>메모</span>
          <textarea v-model.trim="form.notes" rows="3" placeholder="추가 메모(선택)"></textarea>
        </label>

        <div class="es-row">
          <label class="es-label">
            <span>카테고리</span>
            <input v-model="form.category" placeholder="예: 업무/개인/식비…" />
          </label>
          <label class="es-label">
            <span>금액</span>
            <input v-model="form.amount" placeholder="예: 5만원 / 24000 / 2만4천" />
          </label>
        </div>

        <label class="es-check">
          <input type="checkbox" v-model="form.is_done" />
          <span>완료로 표시</span>
        </label>

        <div class="es-actions">
          <button type="button" @click="closePanel">취소</button>
          <button type="submit" :disabled="!canSave">{{ saving ? '저장 중…' : '저장' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.es-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.34);
  display: flex;
  justify-content: flex-end;
  align-items: flex-end; /* 모바일 기본: 바텀시트 */
  z-index: 50;
}

/* 패널: 모바일 바텀시트 */
.es-panel {
  width: 100%;
  max-height: 92vh;
  background: var(--c-bg, #111827);
  color: var(--c-fg, #e5e7eb);
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  box-shadow: 0 -8px 24px rgba(0,0,0,.25);
  padding: 16px;
  overflow: auto;
}

/* 데스크톱 이상: 사이드 드로어 */
@media (min-width: 1024px) {
  .es-overlay { align-items: stretch; }
  .es-panel {
    height: 100%;
    max-height: 100%;
    width: 440px;
    border-radius: 0;
    border-left: 1px solid rgba(255,255,255,.08);
    box-shadow: -8px 0 24px rgba(0,0,0,.25);
  }
}

.es-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.es-title { margin: 0; font-size: 16px; font-weight: 700; }
.es-close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
}

.es-form { display: block; }
.es-label { display: block; margin: 10px 0; }
.es-label > span { display: block; font-size: 12px; opacity: .9; margin-bottom: 6px; }

.es-form input,
.es-form textarea {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: inherit;
}

.es-row {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr 1fr;
}

.es-check {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.es-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.es-actions button {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: inherit;
  cursor: pointer;
}
.es-actions button[type="submit"] {
  background: rgba(99,102,241,.9);
  border-color: transparent;
}
.es-actions button[disabled] {
  opacity: .6;
  cursor: not-allowed;
}
</style>
