<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  editingItemId: { type: [String, Number], default: '' },
  editingText: { type: String, default: '' },
});

const emit = defineEmits([
  'update:editingText',
  'toggle-edit',
  'save-edit',
  'cancel-edit',
  'toggle-status',
  'delete-item',
]);

// === 상태 계산 (가독성 ↑)
const isEditing  = computed(() => String(props.editingItemId) === String(props.item?.id));
const isTodo     = computed(() => props.item?.type === 'todo');
const isCompleted= computed(() => isTodo.value && props.item?.status === '완료');
const isPending  = computed(() => !isTodo.value && props.item?.status === '미결');

const safeAmount = computed(() => {
  const n = Number(props.item?.amount ?? 0);
  return Number.isFinite(n) ? n : 0;
});
</script>

<template>
  <li
    :class="[
      'item',
      item.type,                  /* ex) 'todo', '개인-지출', '업무-수입' ... */
      { completed: isCompleted, pending: isPending }
    ]"
    @dblclick="emit('toggle-edit', item)"
  >
    <!-- 편집 모드 -->
    <div v-if="isEditing" class="edit">
      <input
        type="text"
        :value="editingText"
        @input="emit('update:editingText', $event.target.value)"
        @keydown.enter.prevent="emit('save-edit', item.id)"
        @keydown.esc.prevent="emit('cancel-edit')"
        class="edit-input"
        autofocus
      />
      <div class="actions">
        <button type="button" @click.stop="emit('save-edit', item.id)" title="저장">✔</button>
        <button type="button" @click.stop="emit('cancel-edit')" title="취소">✖</button>
      </div>
    </div>

    <!-- 보기 모드 -->
    <div v-else class="row">
      <div class="content">
        <p class="title">{{ item.content }}</p>

        <!-- 금액: 숫자 방어 + 0 초과만 노출 -->
        <p v-if="safeAmount > 0" class="amount">{{ safeAmount.toLocaleString() }}원</p>

        <p class="meta">
          <span v-if="item.type !== 'todo'">{{ item.status }}</span>
          <span v-if="item.due_date && item.due_date !== '미정'">마감: {{ item.due_date }}</span>
        </p>
      </div>
      <div class="actions">
        <button type="button" @click.stop="emit('toggle-status', item)" class="btn-toggle" title="상태 변경">✔</button>
        <button type="button" @click.stop="emit('toggle-edit', item)" class="btn-edit" title="수정">✎</button>
        <button type="button" @click.stop="emit('delete-item', item.id)" class="btn-delete" title="삭제">✖</button>
      </div>
    </div>
  </li>
</template>

<style scoped>
.item { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; margin-bottom:12px; border-left:5px solid transparent; }
.item.todo { border-left-color: var(--b); }
.item.개인-지출, .item.업무-지출 { border-left-color: var(--r); }
.item.업무-수입 { border-left-color: var(--g); }
.item.pending { opacity:.85; }

.row, .edit { display:flex; justify-content:space-between; gap:8px; align-items:center; }
.content { flex:1; }
.title { margin:0 0 6px; font-weight:700; }
.meta { margin:0; color:var(--muted); font-size:.9rem; }
.amount { margin:.25rem 0 0; font-weight:700; }
.actions { display:flex; gap:6px; }
.actions button { width:30px; height:30px; border:1px solid var(--border); border-radius:50%; background:#fff; cursor:pointer; }

.item.todo.completed .title { text-decoration: line-through; color: var(--muted); }
.item.todo.completed { opacity: 0.85; }

.edit-input { flex:1; padding:10px; font-size:1rem; border:1px solid var(--border); border-radius:6px; }

.actions .btn-edit:hover { background-color: #eaf4ff; color: var(--b); }
.actions .btn-toggle:hover { background-color: #e8f5e9; color: var(--g); }
.actions .btn-delete:hover { background-color: #ffebee; color: var(--r); }
</style>
