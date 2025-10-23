<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { auth, provider } from "./firebaseConfig.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { apiFetch } from "./api";

// 1. 새로 만든 모든 '전문 직원'(컴포넌트)들을 불러옵니다.
import Header from './components/Header.vue';
import SummaryCard from './components/SummaryCard.vue';
import InputCard from './components/InputCard.vue';
import Timeline from './components/Timeline.vue';

// 2. 모든 데이터 상태(state)와 함수(API 호출, 로직 등)는 
//    '사장님' 컴포넌트인 이곳에서 중앙 관리합니다.
const user = ref(null);
const isLoading = ref(false);
const errorMsg = ref("");
const newMessage = ref("");
const allItems = ref([]);
const summaryData = ref(null);
const editingItemId = ref(null);
const editingText = ref("");
const searchTerm = ref("");

// --- 모든 함수들은 변경 없이 그대로 이곳에 남아있습니다. ---
const login = () => signInWithPopup(auth, provider).catch((e) => (errorMsg.value = e.message));
const logout = () => signOut(auth).catch((e) => (errorMsg.value = e.message));

const groupedByDate = computed(() => {
  const buckets = new Map();
  for (const it of allItems.value) {
    const date = it.date || new Date().toISOString().split('T')[0];
    if (!buckets.has(date)) buckets.set(date, { todos: [], txns: [] });
    if (it.type === "todo") buckets.get(date).todos.push(it);
    else buckets.get(date).txns.push(it);
  }
  const sortedDates = Array.from(buckets.keys()).sort((a, b) => (a < b ? 1 : -1));
  return sortedDates.map((date) => {
    const { todos, txns } = buckets.get(date);
    return { date, todos, txns };
  });
});

async function fetchSummary() {
  if (!auth.currentUser) return;
  try {
    const now = new Date();
    const data = await apiFetch(`/summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
    if (data.status === "success") summaryData.value = data;
  } catch (e) { errorMsg.value = e.message; }
}

async function loadItems() {
  if (!auth.currentUser) return;
  isLoading.value = true;
  searchTerm.value = "";
  try {
    const data = await apiFetch("/items");
    if (data.status === "success") allItems.value = data.items || [];
    await fetchSummary();
  } catch (e) { errorMsg.value = e.message; }
  finally { isLoading.value = false; }
}

async function addItem() {
  if (!newMessage.value.trim() || isLoading.value) return;
  isLoading.value = true;
  try {
    await apiFetch("/add", { method: "POST", body: JSON.stringify({ text: newMessage.value }) });
    newMessage.value = "";
    await loadItems();
  } catch (e) { errorMsg.value = e.message; }
  finally { isLoading.value = false; }
}

async function deleteItem(id) {
  if (isLoading.value || !confirm("정말로 이 항목을 삭제하시겠습니까?")) return;
  isLoading.value = true;
  try {
    await apiFetch(`/items/${id}`, { method: "DELETE" });
    await loadItems();
  } catch (e) { errorMsg.value = e.message; }
  finally { isLoading.value = false; }
}

async function updateItem(id, payload) {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    await apiFetch(`/items/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    await loadItems();
  } catch (e) { errorMsg.value = e.message; }
  finally { isLoading.value = false; }
}

function toggleEditMode(item) {
  if (editingItemId.value === item.id) {
    editingItemId.value = null;
    editingText.value = "";
  } else {
    editingItemId.value = item.id;
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

async function runSearchOrFilter(params = {}) {
  if (!auth.currentUser) return;
  const query = new URLSearchParams();
  const term = searchTerm.value.trim();
  if (term) query.set('term', term);
  for (const key in params) {
    if (params[key]) query.set(key, params[key]);
  }
  if (Array.from(query.keys()).length === 0) {
    return loadItems();
  }
  isLoading.value = true;
  try {
    const data = await apiFetch(`/search?${query.toString()}`);
    allItems.value = data.items || [];
  } catch (e) {
    errorMsg.value = e.message;
    allItems.value = [];
  } finally {
    isLoading.value = false;
  }
}

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
onUnmounted(() => { if (unsubAuth) unsubAuth(); });
</script>

<template>
  <div class="app">
    <Header :user="user" @login="login" @logout="logout" />

    <main v-if="user" class="main">
      <SummaryCard :summaryData="summaryData" />
      
      <InputCard 
        v-model:newMessage="newMessage"
        v-model:searchTerm="searchTerm"
        :isLoading="isLoading"
        @add-item="addItem"
        @run-search="runSearchOrFilter"
        @load-items="loadItems"
      />
      
      <Timeline 
        v-for="group in groupedByDate" 
        :key="group.date"
        :group="group"
        :editingItemId="editingItemId"
        v-model:editingText="editingText"
        @toggle-edit="toggleEditMode"
        @save-edit="saveItemEdit"
        @cancel-edit="cancelEdit"
        @toggle-status="updateItemStatus"
        @delete-item="deleteItem"
      />

      <p v-if="errorMsg" class="error">⚠ {{ errorMsg }}</p>
    </main>

    <div v-else class="login-prompt">
      <p>서비스를 이용하려면 로그인해주세요.</p>
    </div>
  </div>
</template>

<style>
/* 4. 앱 전체에 적용되는 전역 스타일(글꼴, 배경색 등)만 이곳에 남겨둡니다. */
:root { --border:#e0e0e0; --bg:#fff; --text:#2c3e50; --muted:#888; --g:#42b983; --b:#3498db; --r:#e74c3c; --y:#f39c12; }
body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto; background:#f4f5f7; color:var(--text); }
.app { max-width: 1200px; margin:0 auto; padding: 0 16px 32px; }
.main { display:flex; flex-direction:column; gap:24px; }
.login-prompt { text-align:center; color:var(--muted); padding:24px; }
.error { color:#b00020; text-align:center; }
</style>