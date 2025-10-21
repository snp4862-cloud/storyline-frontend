<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { auth, provider } from "./firebaseConfig.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { apiFetch } from "./api";

// --- 상태 ---
const user = ref(null);
const isLoading = ref(false);
const errorMsg = ref("");
const newMessage = ref("");
const allItems = ref([]);
const summaryData = ref(null);
// ✅ 여기 추가
const bizIncome = computed(() => summaryData.value?.business?.income ?? 0);
const bizExpense = computed(() => summaryData.value?.business?.expense ?? 0);
const bizPendingIncome = computed(() => summaryData.value?.business?.pending_income ?? 0);
const bizPendingExpense = computed(() => summaryData.value?.business?.pending_expense ?? 0);
const perIncome = computed(() => summaryData.value?.personal?.income ?? 0);
const perExpense = computed(() => summaryData.value?.personal?.expense ?? 0);

const editingItemId = ref(null);
const editingText = ref("");
const searchTerm = ref("");

// --- 인증 ---
const login = () => signInWithPopup(auth, provider).catch((e) => (errorMsg.value = e.message));
const logout = () => signOut(auth).catch((e) => (errorMsg.value = e.message));

// --- 유틸 ---
function toISODate(d) {
  // 백엔드가 date="YYYY-MM-DD"로 주므로 그대로 사용. 없으면 오늘 날짜.
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

// 날짜별 그룹: [{ date, todos:[...], txns:[...] }]
const groupedByDate = computed(() => {
  const buckets = new Map(); // date -> { todos, txns }
  for (const it of allItems.value) {
    const date = toISODate(it.date);
    if (!buckets.has(date)) buckets.set(date, { todos: [], txns: [] });
    if (it.type === "todo") buckets.get(date).todos.push(it);
    else buckets.get(date).txns.push(it);
  }
  // 최신 날짜가 위로
  const sortedDates = Array.from(buckets.keys()).sort((a, b) => (a < b ? 1 : -1));
  return sortedDates.map((date) => {
    const { todos, txns } = buckets.get(date);
    const byCreatedDesc = (x, y) => (x.created_at > y.created_at ? -1 : 1);
    return { date, todos: todos.slice().sort(byCreatedDesc), txns: txns.slice().sort(byCreatedDesc) };
  });
});

// --- API ---
async function fetchSummary() {
  if (!auth.currentUser) return;
  try {
    const now = new Date();
    const data = await apiFetch(
      `/summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
    );
    if (data.status === "success") summaryData.value = data;
  } catch (e) {
    errorMsg.value = e.message;
  }
}

// (변경) loadItems 함수가 검색 결과 초기화 역할도 하도록 수정
async function loadItems() {
  if (!auth.currentUser) return;
  isLoading.value = true;
  searchTerm.value = ""; // 검색어 초기화
  try {
    const data = await apiFetch("/items");
    if (data.status === "success") allItems.value = data.items || [];
    await fetchSummary();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

async function addItem() {
  if (!newMessage.value.trim() || isLoading.value) return;
  isLoading.value = true;
  try {
    const data = await apiFetch("/add", {
      method: "POST",
      body: JSON.stringify({ text: newMessage.value }),
    });
    if (data.status !== "success") throw new Error(data.message || "항목 추가 실패");
    newMessage.value = "";
    await loadItems();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

async function deleteItem(id) {
  if (isLoading.value) return;
  if (!confirm("정말로 이 항목을 삭제하시겠습니까?")) return;
  isLoading.value = true;
  try {
    await apiFetch(`/items/${id}`, { method: "DELETE" });
    await loadItems();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

async function updateItem(id, payload) {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    await apiFetch(`/items/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    await loadItems();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

// --- 편집/상태 토글 ---
function toggleEditMode(item) {
  if (editingItemId.value === item.id) {
    editingItemId.value = null;
    editingText.value = "";
  } else {
    editingItemId.value = item.id;
    // 단위 포함 입력 → 서버가 재파싱
    editingText.value = `${item.content} ${item.amount > 0 ? item.amount + "원" : ""}`.trim();
  }
}
function saveItemEdit(id) {
  if (!editingText.value.trim()) return;
  updateItem(id, { content: editingText.value });
  editingItemId.value = null;
  editingText.value = "";
}
function cancelEdit() {
  editingItemId.value = null;
  editingText.value = "";
}
function updateItemStatus(item) {
  const newStatus = item.status === "완료" ? "미결" : "완료";
  updateItem(item.id, { status: newStatus });
}

// --- (변경) 검색 및 필터링 로직 ---
async function runSearchOrFilter(params = {}) {
  if (!auth.currentUser) return;

  const query = new URLSearchParams();
  
  // 텍스트 검색어가 있으면 'term' 파라미터 추가
  const term = searchTerm.value.trim();
  if (term) {
    query.set('term', term);
  }

  // 필터 버튼으로 들어온 파라미터들(status, type_) 추가
  for (const key in params) {
    if (params[key]) {
      query.set(key, params[key]);
    }
  }

  // 아무 조건도 없으면 검색 취소 (전체 목록 보기)
  if (Array.from(query.keys()).length === 0) {
    return loadItems();
  }

  isLoading.value = true;
  try {
    const data = await apiFetch(`/search?${query.toString()}`);
    if (data.status === "success") {
      allItems.value = data.items || [];
    } else {
      allItems.value = [];
    }
  } catch (e) {
    errorMsg.value = e.message;
    allItems.value = [];
  } finally {
    isLoading.value = false;
  }
}

// --- 라이프사이클 ---
let unsubAuth = null;
onMounted(() => {
  unsubAuth = onAuthStateChanged(auth, (u) => {
    user.value = u;
    errorMsg.value = "";
    if (u) loadItems();
    else {
      allItems.value = [];
      summaryData.value = null;
    }
  });
});
onUnmounted(() => {
  if (unsubAuth) unsubAuth();
});
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>My Storyline</h1>
      <div class="auth">
        <template v-if="user">
          <img :src="user.photoURL" alt="프로필" />
          <span>{{ user.displayName }}</span>
          <button @click="logout">로그아웃</button>
        </template>
        <button v-else @click="login" class="login">Google 로그인</button>
      </div>
    </header>

    <main v-if="user" class="main">
      <!-- 요약 -->
      <section class="card">
        <h2>이번 달 요약</h2>
        <div v-if="summaryData" class="summary">
          <div>
            <p class="label">업무 수입</p>
            <p class="val income">{{ bizIncome.toLocaleString() }}원</p>
          </div>
          <div>
            <p class="label">업무 지출</p>
            <p class="val expense">{{ bizExpense.toLocaleString() }}원</p>
          </div>
          <div v-if="bizPendingIncome > 0">
            <p class="label">업무 미수입</p>
            <p class="val pending">{{ bizPendingIncome.toLocaleString() }}원</p>
          </div>
          <div v-if="bizPendingExpense > 0">
            <p class="label">업무 미결 지출</p>
            <p class="val pending">{{ bizPendingExpense.toLocaleString() }}원</p>
          </div>
        </div>

        <!-- ⬇️ 추가: 개인 소계(작게) -->
        <div v-if="summaryData" class="subtotals subtotals--small">
          <div class="line">
            <span class="pill pill-personal">개인</span>
            <span> +{{ perIncome.toLocaleString() }}원</span>
            <span> / -{{ perExpense.toLocaleString() }}원</span>
          </div>
        </div>

        <p v-else>요약 정보를 불러오는 중...</p>
      </section>


      <!-- 입력/검색 -->
      <section class="card">
        <input
          type="search"
          class="search"
          placeholder="검색..."
          v-model="searchTerm"
          @keyup.enter="runSearchOrFilter()"
        />
        
        
        <div class="filters">
          <button @click="loadItems()">전체 보기</button>
          <button @click="runSearchOrFilter({ status: '미결' })">미결 항목</button>
          <button @click="runSearchOrFilter({ type_: '업무-수입', status: '미결' })">미수입</button>
          <button @click="runSearchOrFilter({ type_: 'todo', status: '미결' })">미완료 할 일</button>
        </div>

        <div class="add">
          <input
            type="text"
            v-model="newMessage"
            placeholder="예: 내일 회의 준비하기 / 점심 15000원"
            @keyup.enter="addItem"
            :disabled="isLoading"
          />
          <button @click="addItem" :disabled="isLoading">
            {{ isLoading ? "추가중..." : "추가" }}
          </button>
        </div>
      </section>

      <!-- 날짜별 그룹: 좌/우 컬럼 -->
      <section v-for="group in groupedByDate" :key="group.date" class="date-section">
        <h3 class="date-title">{{ group.date }}</h3>
        <div class="grid">
          <div class="col">
            <h4>할 일</h4>
            <ul class="list">
              <li v-for="item in group.todos" :key="item.id" :class="['item','todo', { completed: item.status === '완료' }]" @dblclick="toggleEditMode(item)">
                <div v-if="editingItemId === item.id" class="edit">
                  <input type="text" v-model="editingText" @keyup.enter="saveItemEdit(item.id)" @keyup.esc="cancelEdit" class="edit-input" autofocus />
                  <div class="actions"><button @click="saveItemEdit(item.id)" :disabled="isLoading" title="저장">✔</button><button @click="cancelEdit" :disabled="isLoading" title="취소">✖</button></div>
                </div>
                <div v-else class="row">
                  <div class="content"><p class="title">{{ item.content }}</p><p class="meta">{{ item.date }}<span v-if="item.due_date"> · 마감: {{ item.due_date }}</span><span> · {{ item.status }}</span></p></div>
                  <div class="actions"><button @click="updateItemStatus(item)" :disabled="isLoading" class="btn-toggle" title="상태 변경">✔</button><button @click="toggleEditMode(item)" :disabled="isLoading" class="btn-edit" title="수정">✎</button><button @click="deleteItem(item.id)" :disabled="isLoading" class="btn-delete" title="삭제">✖</button></div>
                </div>
              </li>
              <li v-if="!isLoading && group.todos.length === 0" class="empty">할 일이 없습니다.</li>
            </ul>
          </div>
          <div class="col">
            <h4>지출 / 수입</h4>
            <ul class="list">
              <li v-for="item in group.txns" :key="item.id" :class="['item', item.type, { pending: item.status === '미결' }]" @dblclick="toggleEditMode(item)">
                <div v-if="editingItemId === item.id" class="edit">
                  <input type="text" v-model="editingText" @keyup.enter="saveItemEdit(item.id)" @keyup.esc="cancelEdit" class="edit-input" autofocus />
                  <div class="actions"><button @click="saveItemEdit(item.id)" :disabled="isLoading" title="저장">✔</button><button @click="cancelEdit" :disabled="isLoading" title="취소">✖</button></div>
                </div>
                <div v-else class="row">
                  <div class="content"><p class="title">{{ item.content }}</p><p class="amount">{{ (item.amount || 0).toLocaleString() }}원</p><p class="meta">{{ item.status }}</p></div>
                  <div class="actions"><button @click="updateItemStatus(item)" :disabled="isLoading" class="btn-toggle" title="상태 변경">✔</button><button @click="toggleEditMode(item)" :disabled="isLoading" class="btn-edit" title="수정">✎</button><button @click="deleteItem(item.id)" :disabled="isLoading" class="btn-delete" title="삭제">✖</button></div>
                </div>
              </li>
              <li v-if="!isLoading && group.txns.length === 0" class="empty">거래 내역이 없습니다.</li>
            </ul>
          </div>
        </div>
      </section>
      <p v-if="errorMsg" class="error">⚠ {{ errorMsg }}</p>
    </main>
    <div v-else class="login"><p>서비스를 이용하려면 로그인해주세요.</p></div>
  </div>
</template>

<style>
:root { --border:#e0e0e0; --bg:#fff; --text:#2c3e50; --muted:#888; --g:#42b983; --b:#3498db; --r:#e74c3c; --y:#f39c12; }
body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto; background:#f4f5f7; color:var(--text); }
.app { max-width: 1200px; margin:0 auto; padding: 0 16px 32px; }
.header { padding:16px 0; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border);}
.header img { width:32px; height:32px; border-radius:50%; margin-right:8px; vertical-align:middle; }
.header .login, .header button { border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:700; }
.header .login { background:var(--g); color:#fff; }
.main { display:flex; flex-direction:column; gap:24px; }
.card { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:16px; }
.summary { display:grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap:12px; text-align:center; }
.label { color:var(--muted); margin:0 0 4px; }
.val { margin:0; font-weight:700; font-size:1.2rem; }
.val.income { color:var(--g); }
.val.expense { color:var(--r); }
.val.pending { color:var(--y); }
.search { width:100%; padding:12px; border:1px solid var(--border); border-radius:6px; margin-bottom:12px; }
.add { display:flex; gap:8px; }
.add input { flex:1; padding:12px; border:1px solid var(--border); border-radius:6px; }
.add button { padding:12px 16px; border:none; border-radius:6px; background:var(--g); color:#fff; font-weight:700; }

.date-section { margin-top: 8px; }
.date-title { margin: 8px 0; color:#111; font-size:1.05rem; font-weight:800; }
.grid { display:grid; grid-template-columns: 1fr 1fr; gap:24px; }

.col h4 { margin:0 0 8px; border-bottom:2px solid var(--border); padding-bottom:6px; }
.list { margin:0; padding:0; list-style:none; }
.item { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; margin-bottom:12px; border-left:5px solid transparent; }
.item.todo { border-left-color: var(--b); }
.item.개인-지출, .item.업무-지출 { border-left-color: var(--r); }
.item.업무-수입 { border-left-color: var(--g); }
.item.pending { opacity:.85; }
.row { display:flex; justify-content:space-between; gap:8px; align-items:center; }
.content { flex:1; }
.title { margin:0 0 6px; font-weight:700; }
.meta { margin:0; color:var(--muted); font-size:.9rem; }
.amount { margin:.25rem 0 0; font-weight:700; }
.actions { display:flex; gap:6px; }
.actions button { width:30px; height:30px; border:1px solid var(--border); border-radius:50%; background:#fff; cursor:pointer; }
/* (신규) 필터 버튼 스타일 */
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.filters button {
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
}
.filters button:hover { background: #e0e0e0; }
/* 개인 소계를 작게 표시 */
.subtotals {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.subtotals--small {
  font-size: 12px;
  color: var(--muted);
}
.subtotals .line { display: flex; gap: 6px; align-items: center; }
.pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid var(--border);
}
.pill-personal {
  background: #fff5f5;
  color: #ef4444;
  border-color: #ffd6d6;
}


/* ✅ 완료된 할 일은 취소선(빗금) + 살짝 흐림 */
.item.todo.completed .title { text-decoration: line-through; color: var(--muted); }
.item.todo.completed { opacity: 0.85; }

/* 편집 입력 스타일 */
.edit { display:flex; gap:8px; align-items:center; }
.edit-input { flex:1; padding:10px; font-size:1rem; border:1px solid var(--border); border-radius:6px; }

/* Hover 가독성 */
.actions .btn-edit:hover { background-color: #eaf4ff; color: var(--b); }
.actions .btn-toggle:hover { background-color: #e8f5e9; color: var(--g); }
.actions .btn-delete:hover { background-color: #ffebee; color: var(--r); }

.empty, .login { text-align:center; color:var(--muted); padding:24px; }
.error { color:#b00020; text-align:center; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

</style>
