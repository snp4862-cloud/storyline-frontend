// src/composables/useFilters.js
import { computed, ref } from "vue";

// 기본 필터 값
export const makeDefaultFilters = () => ({
  // 기간
  dateFrom: "",   // 'YYYY-MM-DD'
  dateTo: "",     // 'YYYY-MM-DD'
  // 유형/상태
  types: [],      // ['income','expense','task','schedule'] 중 다중선택
  paid: "any",    // 'any' | 'paid' | 'unpaid'  (income/expense에만 적용)
  // 범주/금액/검색
  categories: [], // 다중선택
  amountMin: "",  // 숫자 또는 빈 값
  amountMax: "",
  query: "",      // 텍스트 검색 (title/notes/category 에서 포함)
  // 정렬
  sortBy: "date", // 'date' | 'amount' | 'category' | 'type'
  sortDir: "desc" // 'asc' | 'desc'
});

// 개별 아이템이 필터 조건을 통과하는지
function matchItem(item, f) {
  // 날짜
  if (f.dateFrom) {
    const from = new Date(f.dateFrom + "T00:00:00");
    if (new Date(item.date) < from) return false;
  }
  if (f.dateTo) {
    const to = new Date(f.dateTo + "T23:59:59");
    if (new Date(item.date) > to) return false;
  }

  // 유형
  if (Array.isArray(f.types) && f.types.length > 0) {
    if (!f.types.includes(item.type)) return false;
  }

  // 결제상태(수입/지출일 때만 의미)
  if (f.paid !== "any" && (item.type === "income" || item.type === "expense")) {
    const isPaid = !!item.isPaid;
    if (f.paid === "paid" && !isPaid) return false;
    if (f.paid === "unpaid" && isPaid) return false;
  }

  // 카테고리
  if (Array.isArray(f.categories) && f.categories.length > 0) {
    if (!f.categories.includes(item.category || "")) return false;
  }

  // 금액
  if (f.amountMin !== "" && Number.isFinite(+f.amountMin)) {
    if (+item.amount < +f.amountMin) return false;
  }
  if (f.amountMax !== "" && Number.isFinite(+f.amountMax)) {
    if (+item.amount > +f.amountMax) return false;
  }

  // 텍스트 검색
  if (f.query && f.query.trim()) {
    const q = f.query.trim().toLowerCase();
    const hay = [
      item.title || "",
      item.notes || "",
      item.category || "",
      item.type || ""
    ].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

function sortItems(items, sortBy, sortDir) {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    let va, vb;

    switch (sortBy) {
      case "amount":
        va = +a.amount || 0; vb = +b.amount || 0;
        break;
      case "category":
        va = (a.category || "").localeCompare ? a.category : String(a.category || "");
        vb = (b.category || "").localeCompare ? b.category : String(b.category || "");
        return va.localeCompare(vb) * dir;
      case "type":
        return String(a.type || "").localeCompare(String(b.type || "")) * dir;
      case "date":
      default:
        va = new Date(a.date).getTime();
        vb = new Date(b.date).getTime();
    }

    if (va === vb) return 0;
    return va > vb ? dir : -dir;
  });
}

export function useFilters(sourceItemsRef) {
  const filters = ref(makeDefaultFilters());

  const filteredItems = computed(() => {
    const f = filters.value;
    const items = sourceItemsRef.value || [];
    const passed = items.filter((it) => matchItem(it, f));
    return sortItems(passed, f.sortBy, f.sortDir);
  });

  return {
    filters,
    filteredItems
  };
}

