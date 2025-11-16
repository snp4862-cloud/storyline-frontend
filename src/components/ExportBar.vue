<!-- src/components/ExportBar.vue -->
<template>
  <div class="export-bar">
    <button @click="$emit('json')">JSON 내보내기</button>
    <button @click="$emit('csv')">CSV 내보내기</button>
  </div>
</template>

<script setup>
</script>

<style scoped>
.export-bar {
  display: flex;
  gap: 8px;
  margin: 8px 0 16px;
}
button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}
button:hover {
  background: #f6f6f6;
}
</style>
