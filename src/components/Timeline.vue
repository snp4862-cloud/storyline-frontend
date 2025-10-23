<script setup>
// 자식 컴포넌트인 ItemCard를 이 파일 안에서 사용하겠다고 선언합니다.
import ItemCard from './ItemCard.vue';

// 이 컴포넌트가 부모(App.vue)로부터 받을 데이터를 정의합니다.
// 'group'은 { date, todos, txns } 형태의 객체입니다.
defineProps({
  group: Object,
  editingItemId: String,
  editingText: String,
});

// 자식(ItemCard)에게서 받은 신호를 그대로 부모(App.vue)에게 전달(pass-through)하기 위해
// 모든 이벤트를 정의합니다.
const emit = defineEmits([
  'update:editingText',
  'toggle-edit',
  'save-edit',
  'cancel-edit',
  'toggle-status',
  'delete-item',
]);
</script>

<template>
  <section class="date-section">
    <h3 class="date-title">{{ group.date }}</h3>
    <div class="grid">
      <div class="col">
        <h4>할 일</h4>
        <ul class="list">
          <ItemCard
            v-for="item in group.todos"
            :key="item.id"
            :item="item"
            :editingItemId="editingItemId"
            :editingText="editingText"
            @update:editingText="(value) => emit('update:editingText', value)"
            @toggle-edit="(item) => emit('toggle-edit', item)"
            @save-edit="(id) => emit('save-edit', id)"
            @cancel-edit="emit('cancel-edit')"
            @toggle-status="(item) => emit('toggle-status', item)"
            @delete-item="(id) => emit('delete-item', id)"
          />
          <li v-if="group.todos.length === 0" class="empty">할 일이 없습니다.</li>
        </ul>
      </div>

      <div class="col">
        <h4>지출 / 수입</h4>
        <ul class="list">
          <ItemCard
            v-for="item in group.txns"
            :key="item.id"
            :item="item"
            :editingItemId="editingItemId"
            :editingText="editingText"
            @update:editingText="(value) => emit('update:editingText', value)"
            @toggle-edit="(item) => emit('toggle-edit', item)"
            @save-edit="(id) => emit('save-edit', id)"
            @cancel-edit="emit('cancel-edit')"
            @toggle-status="(item) => emit('toggle-status', item)"
            @delete-item="(id) => emit('delete-item', id)"
          />
          <li v-if="group.txns.length === 0" class="empty">거래 내역이 없습니다.</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 이 스타일은 Timeline.vue 안에서만 적용됩니다. */
.date-section { margin-top: 8px; }
.date-title { margin: 8px 0; color:#111; font-size:1.05rem; font-weight:800; }
.grid { display:grid; grid-template-columns: 1fr 1fr; gap:24px; }
.col h4 { margin:0 0 8px; border-bottom:2px solid var(--border); padding-bottom:6px; }
.list { margin:0; padding:0; list-style:none; }
.empty { text-align:center; color:var(--muted); padding:24px; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>