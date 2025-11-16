<script setup>
const emit = defineEmits(['create'])
let title = $ref('')
function submit() {
  if (!title.trim()) return
  emit('create', title.trim())
  title = ''
}
</script>

<template>
  <div class="cb-wrap">
    <input v-model="title" placeholder="무엇을 기록할까요? (Enter 저장)" @keydown.enter.prevent="submit" />
    <button @click="submit">추가</button>
  </div>
</template>

<style scoped>
.cb-wrap {
  position: sticky; bottom: 0; left: 0; right: 0;
  display: grid; grid-template-columns: 1fr auto; gap: 8px;
  padding: 10px; background: var(--c-bg, #0f172a); border-top: 1px solid rgba(255,255,255,.08);
}
.cb-wrap input {
  padding: 10px; border-radius: 12px; border:1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04); color: var(--c-fg,#e5e7eb);
}
.cb-wrap button {
  padding: 10px 14px; border-radius: 12px; border: none; cursor: pointer;
}
</style>
