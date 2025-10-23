<script setup>
// 이 컴포넌트가 부모(App.vue)로부터 받을 데이터(props)와
// 부모에게 보낼 신호(emits)를 정의합니다.
defineProps({
  newMessage: String,
  searchTerm: String,
  isLoading: Boolean,
});

const emit = defineEmits([
  'update:newMessage',
  'update:searchTerm',
  'add-item',
  'run-search',
  'load-items',
]);
</script>

<template>
  <section class="card">
    <input
      type="search"
      class="search"
      placeholder="검색..."
      :value="searchTerm"
      @input="$emit('update:searchTerm', $event.target.value)"
      @keyup.enter="emit('run-search')"
    />
    
    <div class="filters">
      <button @click="emit('load-items')">전체 보기</button>
      <button @click="emit('run-search', { status: '미결' })">미결 항목</button>
      <button @click="emit('run-search', { type_: '업무-수입', status: '미결' })">미수입</button>
      <button @click="emit('run-search', { type_: 'todo', status: '미결' })">미완료 할 일</button>
    </div>

    <div class="add">
      <input
        type="text"
        :value="newMessage"
        @input="$emit('update:newMessage', $event.target.value)"
        placeholder="예: 내일 회의 준비하기 / 점심 15000원"
        @keyup.enter="emit('add-item')"
        :disabled="isLoading"
      />
      <button @click="emit('add-item')" :disabled="isLoading">
        {{ isLoading ? "추가중..." : "추가" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
/* 이 스타일은 InputCard.vue 안에서만 적용됩니다. */
.card { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:16px; }
.search { width:100%; padding:12px; border:1px solid var(--border); border-radius:6px; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.filters button { padding: 8px 12px; border: 1px solid var(--border); background: #f5f5f5; border-radius: 6px; cursor: pointer; }
.filters button:hover { background: #e0e0e0; }
.add { display:flex; gap:8px; margin-top: 12px; }
.add input { flex:1; padding:12px; border:1px solid var(--border); border-radius:6px; }
.add button { padding:12px 16px; border:none; border-radius:6px; background:var(--g); color:#fff; font-weight:700; }
</style>