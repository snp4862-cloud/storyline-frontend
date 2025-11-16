<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

import { listenToAuthChanges } from './api.js'; 
import { 
  getSchedules, 
  createSchedule, 
  updateSchedule,
  deleteSchedule 
} from './api/schedules.js';

const isLoggedIn = ref(false);
const userPhotoURL = ref('');
const auth = getAuth();

const schedules = ref([]);
const newScheduleTitle = ref('');
const newScheduleDate = ref('');
const isLoadingSchedules = ref(false);
const scheduleError = ref(null);

// 모달/수정
const isModalOpen = ref(false);
const scheduleToEdit = ref(null);

// ✅ datetime-local용 안전 포맷터 (로컬시간으로)
function toLocalInputValue(isoOrDate) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

let unsubscribeAuth;
onMounted(() => {
  unsubscribeAuth = listenToAuthChanges(async (user) => {
    isLoggedIn.value = !!user;
    userPhotoURL.value = user ? user.photoURL : '';
    if (user) {
      // 여기에서 axios/fetch Authorization 설정이 되어 있는지 확인 필요
      // e.g., axios.defaults.headers.common.Authorization = `Bearer ${await user.getIdToken()}`;
      fetchSchedules();
    } else {
      schedules.value = [];
    }
  });
});

// ✅ 리스너 정리
onUnmounted(() => {
  if (typeof unsubscribeAuth === 'function') {
    unsubscribeAuth();
  }
});

const login = async () => {
  const provider = new GoogleAuthProvider();
  try { await signInWithPopup(auth, provider); } 
  catch (error) { console.error("로그인 실패:", error); }
};
const logout = async () => {
  try { await signOut(auth); } 
  catch (error) { console.error("로그아웃 실패:", error); }
};

async function fetchSchedules() {
  isLoadingSchedules.value = true;
  scheduleError.value = null;
  try {
    const response = await getSchedules();
    schedules.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    console.error("일정 로드 실패:", error);
    scheduleError.value = "일정을 불러오는 데 실패했습니다.";
  } finally {
    isLoadingSchedules.value = false;
  }
}

async function handleCreateSchedule() {
  if (!newScheduleTitle.value || !newScheduleDate.value) {
    scheduleError.value = "제목과 날짜를 모두 입력하세요.";
    return;
  }
  const scheduleData = {
    title: newScheduleTitle.value,
    date: new Date(newScheduleDate.value).toISOString(), // 저장은 UTC ISO
    notes: '',
    quoteAmount: 0,
    isPaid: false,
  };

  try {
    const response = await createSchedule(scheduleData);
    // 최신 목록을 신뢰하려면 fetchSchedules() 재호출도 고려
    schedules.value.push(response.data);
    newScheduleTitle.value = '';
    newScheduleDate.value = '';
    scheduleError.value = null;
  } catch (error) {
    console.error("일정 생성 실패:", error);
    scheduleError.value = "일정 생성에 실패했습니다.";
  }
}

async function handleDeleteSchedule(id) {
  if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) return;
  try {
    await deleteSchedule(id);
    schedules.value = schedules.value.filter(s => s.id !== id);
  } catch (error) {
    console.error("일정 삭제 실패:", error);
    scheduleError.value = "일정 삭제에 실패했습니다.";
  }
}

function openEditModal(schedule) {
  // ✅ date 안전 처리 + 로컬 입력 포맷으로 변환
  scheduleToEdit.value = { 
    ...schedule,
    date: toLocalInputValue(schedule?.date),
    notes: schedule?.notes ?? '',
    quoteAmount: typeof schedule?.quoteAmount === 'number' ? schedule.quoteAmount : 0,
    isPaid: !!schedule?.isPaid,
  };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  scheduleToEdit.value = null;
}

async function handleUpdateSchedule() {
  if (!scheduleToEdit.value) return;

  const updatedData = {
    ...scheduleToEdit.value,
    date: new Date(scheduleToEdit.value.date).toISOString(), // 저장은 UTC ISO
  };

  try {
    const response = await updateSchedule(updatedData.id, updatedData);
    // Vue3에선 인덱스 대입도 반응합니다만, 안전하게 map으로 교체
    schedules.value = schedules.value.map(s => s.id === updatedData.id ? response.data : s);
    closeModal();
  } catch (error) {
    console.error("일정 업데이트 실패:", error);
    alert("일정 업데이트에 실패했습니다.");
  }
}

function formatDisplayDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date)) return '';
  return date.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}
</script>

<template>
  <div id="app" class="font-sans antialiased text-gray-900 bg-gray-100 min-h-screen">
    
    <header class="bg-white shadow-md">
      <nav class="container mx-auto px-6 py-3 flex justify-between items-center">
        <div class="text-2xl font-bold text-gray-800">Storyline</div>
        <div>
          <button v-if="!isLoggedIn" @click="login" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Google 로그인
          </button>
          <div v-if="isLoggedIn" class="flex items-center space-x-4">
            <img :src="userPhotoURL" alt="User" class="w-10 h-10 rounded-full border-2 border-gray-300">
            <button @click="logout" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              로그아웃
            </button>
          </div>
        </div>
      </nav>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div v-if="!isLoggedIn" class="text-center bg-white p-10 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-4">Storyline에 오신 것을 환영합니다</h1>
        <p class="text-gray-600">Google 계정으로 로그인하여 일정을 관리해 보세요.</p>
      </div>

      <div v-if="isLoggedIn" class="space-y-8">
        
        <section class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-semibold mb-4 border-b pb-2">새 일정 추가</h2>
          <form @submit.prevent="handleCreateSchedule" class="space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">일정 제목:</label>
              <input type="text" id="title" v-model="newScheduleTitle" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="예: OOO님 프로젝트 미팅" />
            </div>
            <div>
              <label for="date" class="block text-sm font-medium text-gray-700">날짜 및 시간:</label>
              <input type="datetime-local" id="date" v-model="newScheduleDate" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="submit" class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
              일정 생성
            </button>
            <p v-if="scheduleError" class="text-red-500 text-sm">{{ scheduleError }}</p>
          </form>
        </section>

        <section class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-semibold mb-4 border-b pb-2">내 일정 목록</h2>
          <div v-if="isLoadingSchedules" class="text-center text-gray-500">일정을 불러오는 중...</div>
          <ul v-else-if="schedules.length > 0" class="space-y-3">
            <li v-for="schedule in schedules" :key="schedule.id" class="p-4 border rounded-md hover:bg-gray-50">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div class="flex-1 mb-2 sm:mb-0">
                  <p class="font-semibold text-lg">{{ schedule.title }}</p>
                  <p class="text-sm text-gray-600">{{ formatDisplayDate(schedule.date) }}</p>
                  <div class="text-sm text-gray-500 mt-1">
                    <span>견적: {{ schedule.quoteAmount ? schedule.quoteAmount.toLocaleString() : 0 }}원</span>
                    <span class="mx-2">|</span>
                    <span :class="schedule.isPaid ? 'text-blue-600 font-semibold' : 'text-red-600'">
                      {{ schedule.isPaid ? '입금 완료' : '미입금' }}
                    </span>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button @click="handleDeleteSchedule(schedule.id)" class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">삭제</button>
                  <button @click="openEditModal(schedule)" class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200">수정</button>
                </div>
              </div>
            </li>
          </ul>
          <div v-else class="text-center text-gray-500">표시할 일정이 없습니다.</div>
        </section>
      </div>
    </main>

    <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="p-6 border-b">
          <h3 class="text-2xl font-semibold">일정 수정</h3>
        </div>
        <form @submit.prevent="handleUpdateSchedule" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">일정 제목:</label>
            <input type="text" v-model="scheduleToEdit.title" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">날짜 및 시간:</label>
            <input type="datetime-local" v-model="scheduleToEdit.date" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">회의록:</label>
            <textarea v-model="scheduleToEdit.notes" rows="4" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" placeholder="회의 내용이나 메모를 입력하세요."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">견적 금액 (원):</label>
            <input type="number" v-model.number="scheduleToEdit.quoteAmount" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="isPaid" v-model="scheduleToEdit.isPaid" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label for="isPaid" class="ml-2 block text-sm font-medium text-gray-900">입금 완료</label>
          </div>
          <div class="pt-4 flex justify-end space-x-3">
            <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">취소</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
          </div>
        </form>
      </div>
      
    </div>
  </div>
</template>

<style>
/* 별도 스타일 추가 없이 TailwindCSS로 모두 처리됩니다. */
</style>