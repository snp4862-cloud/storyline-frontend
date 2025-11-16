<template>
  <div class="card flex flex-col gap-3">
    <h3 class="section-title">🔍 필터</h3>

    <!-- 정렬 -->
    <div class="flex flex-wrap gap-2 items-center">
      <label class="text-sm">정렬 기준</label>
      <select v-model="model.sortBy" class="input">
        <option value="date">날짜</option>
        <option value="amount">금액</option>
        <option value="category">카테고리</option>
        <option value="flow">구분</option>
      </select>

      <select v-model="model.sortDir" class="input">
        <option value="desc">내림차순</option>
        <option value="asc">오름차순</option>
      </select>
    </div>

    <!-- 카테고리 (다중 선택) -->
    <div class="flex flex-col gap-1">
      <label class="text-sm">카테고리(여러개 선택 가능)</label>
      <select class="input min-h-28" multiple v-model="model.categories">
        <option
          v-for="opt in normalizedCategoryOptions"
          :key="opt"
          :value="opt"
        >
          {{ opt }}
        </option>
      </select>
      <small class="text-zinc-500">
        Ctrl/⌘ 또는 Shift로 여러 항목을 선택할 수 있어요.
      </small>
    </div>

    <!-- 태그 (선택) -->
    <div class="flex flex-col gap-1">
      <label class="text-sm">태그(선택, 여러개)</label>
      <select class="input min-h-28" multiple v-model="model.tags">
        <option v-for="tag in defaultTags" :key="tag" :value="tag">{{ tag }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'

/* v-model 지원: 부모에서 <FiltersBar v-model="filters" :category-options="..."/> */
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      sortBy: 'date',
      sortDir: 'desc',
      categories: [],  // ✅ 다중 select는 배열
      tags: [],        // ✅ 다중 select는 배열
    }),
  },
  categoryOptions: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits(['update:modelValue'])

/* 내부 편집용 상태 (reactive로 생성) */
const model = reactive({
  sortBy: props.modelValue.sortBy ?? 'date',
  sortDir: props.modelValue.sortDir ?? 'desc',
  categories: Array.isArray(props.modelValue.categories) ? [...props.modelValue.categories] : [],
  tags: Array.isArray(props.modelValue.tags) ? [...props.modelValue.tags] : [],
})

/* 내부 상태가 바뀌면 부모에게 반영 */
watch(
  model,
  (v) => emit('update:modelValue', { ...v }),
  { deep: true }
)

/* 부모가 v-model을 바꾸면 내부도 동기화 */
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    model.sortBy = v.sortBy ?? 'date'
    model.sortDir = v.sortDir ?? 'desc'
    model.categories = Array.isArray(v.categories) ? [...v.categories] : []
    model.tags = Array.isArray(v.tags) ? [...v.tags] : []
  },
  { deep: true }
)

/* 카테고리 옵션 정규화 (문자/객체 혼용 대비) */
const normalizedCategoryOptions = computed(() =>
  (props.categoryOptions || [])
    .map((o) => (typeof o === 'string' ? o : (o?.label ?? o?.value ?? '')))
    .filter(Boolean)
)

/* 데모용 태그 (원하면 수정/삭제 가능) */
const defaultTags = ['현장', '사무', '급함', '정산대기']
</script>

<style scoped>
.min-h-28 { min-height: 7rem; }
</style>
