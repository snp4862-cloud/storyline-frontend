<template>
  <!-- 헤더 영역 -->
  <header class="bg-white dark:bg-[#0f1b33] dark:border-b dark:border-[#1e2a44] shadow p-4 flex justify-between items-center print:hidden sticky top-0 z-40">
    <h1 class="text-2xl font-bold">Storyline</h1>
    <div class="flex items-center space-x-3">
      
      <!-- 다크 모드 토글 버튼 -->
      <button @click="toggleDarkMode" class="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1e2a44] transition-colors duration-200">
        <!-- 라이트 모드일 때 (달 아이콘) -->
        <svg v-if="!isDarkMode" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 008.25-4.998z" />
        </svg>
        <!-- 다크 모드일 때 (해 아이콘) -->
        <svg v-if="isDarkMode" class="w-6 h-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12H.75m.386-6.364l1.591 1.591M12 6.75A5.25 5.25 0 006.75 12a5.25 5.25 0 005.25 5.25a5.25 5.25 0 005.25-5.25A5.25 5.25 0 0012 6.75z" />
        </svg>
      </button>

      <button 
        v-if="!isLoggedIn" 
        @click="handleLogin" 
        class="btn"
      >
        Google 로그인
      </button>
      <div v-if="isLoggedIn && userProfile" class="flex items-center space-x-3">
        <img :src="userProfile.photoURL" alt="Profile" class="w-10 h-10 rounded-full border-2 border-gray-300">
        <span class="font-medium hidden sm:inline">{{ userProfile.displayName }}</span>
        <button 
          @click="handleLogout" 
          class="btn-outline"
        >
          로그아웃
        </button>
      </div>
    </div>
  </header>

  <!-- 메인 컨텐츠 영역 -->
  <main class="p-4 md:p-8 max-w-7xl mx-auto">
    
    <!-- 로그아웃 상태일 때 -->
    <div v-if="!isLoggedIn" class="card text-center max-w-lg mx-auto mt-10">
      <h2 class="text-2xl font-semibold mb-4">Storyline에 오신 것을 환영합니다.</h2>
      <p class="mb-6">AI 비서가 일정을 관리해 드립니다. 먼저 로그인해 주세요.</p>
      <button @click="handleLogin" class="btn text-lg px-6 py-3">
        Google 계정으로 시작하기
      </button>
    </div>

    <!-- 로그인 상태일 때 (대시보드) -->
    <div v-if="isLoggedIn" class="space-y-8">

      <!-- 
        ↓↓↓ [순서 변경!] 1. AI 입력창이 맨 위로 이동 ↓↓↓ 
      -->
      <section class="card">
        <h2 class="section-title">AI비서</h2>
        <form @submit.prevent="handleAIParse" class="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            v-model="aiInputText"
            :disabled="isParsing"
            placeholder="예: 내일 OOO님 미팅 / 오늘 점심 12000원 지출 / 다음주 OO업체 대금 50만원"
            class="input-base flex-grow w-full py-3"
            required
          >
          <button 
            type="submit" 
            :disabled="isParsing"
            class="btn-indigo w-full sm:w-auto"
          >
            <span v-if="isParsing">분석 중...</span>
            <span v-else>입력</span>
          </button>
        </form>
        
        <!-- AI 오류/답변 메시지 -->
        <p v-if="aiError" class="text-red-600 mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          {{ aiError }}
        </p>
        <p v-if="aiAnswerText" class="text-indigo-800 dark:text-indigo-300 mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <span class="font-bold">AI 비서:</span> {{ aiAnswerText }}
        </p>
      </section>
      <!-- 
        ↑↑↑ [순서 변경!] 1. AI 입력창이 맨 위로 이동 ↑↑↑ 
      -->

      <!-- 
        ↓↓↓ [순서/크기 변경!] 2. 총 잔액 요약 + 작게 수정 ↓↓↓ 
      -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- 총 수입 카드 (p-6 -> p-4, text-3xl -> text-xl, 아이콘 w-6 h-6 -> w-4 h-4) -->
        <div class="card flex items-center space-x-3 !p-3">
          <div class="flex-shrink-0 bg-green-100 rounded-full p-2">
            <svg class="w-4 h-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
            </svg>
          </div>
          <div>
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">총 수입 (확정)</h2>
            <p class="mt-1 text-xl font-semibold text-green-600">₩{{ totalIncome.toLocaleString() }}</p>
          </div>
        </div>
        
        <!-- 총 지출 카드 (p-6 -> p-4, text-3xl -> text-xl, 아이콘 w-6 h-6 -> w-4 h-4) -->
        <div class="card flex items-center space-x-3 !p-3">
          <div class="flex-shrink-0 bg-red-100 rounded-full p-2">
            <svg class="w-4 h-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m0 0l-6.75-6.75M12 19.5l6.75-6.75" />
            </svg>
          </div>
          <div>
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">총 지출 (확정)</h2>
            <p class="mt-1 text-xl font-semibold text-red-600">₩{{ totalExpense.toLocaleString() }}</p>
          </div>
        </div>

        <!-- 미수금 카드 (p-6 -> p-4, text-3xl -> text-xl, 아이콘 w-6 h-6 -> w-4 h-4) -->
        <div class="card flex items-center space-x-3 !p-3">
          <div class="flex-shrink-0 bg-yellow-100 rounded-full p-2">
            <svg class="w-4 h-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">미수금 (예정)</h2>
            <p class="mt-1 text-xl font-semibold text-yellow-600">₩{{ totalReceivable.toLocaleString() }}</p>
          </div>
        </div>
        
        <!-- 미지출금 카드 (p-6 -> p-4, text-3xl -> text-xl, 아이콘 w-6 h-6 -> w-4 h-4) -->
        <div class="card flex items-center space-x-3 !p-3">
          <div class="flex-shrink-0 bg-orange-100 rounded-full p-2">
            <svg class="w-4 h-4 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">미지출 (예정)</h2>
            <p class="mt-1 text-xl font-semibold text-orange-600">₩{{ totalPayable.toLocaleString() }}</p>
          </div>
        </div>

      </section>
      <!-- 
        ↑↑↑ [순서/크기 변경!] 2. 총 잔액 요약 + 작게 수정 ↑↑↑ 
      -->

      <!-- 3. 달력 (변경 없음) -->
      <section class="card">
        <!-- 달력 헤더 (월 이동) -->
        <div class="flex justify-between items-center mb-4">
          <button @click="prevMonth" class="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#0f1b33] transition-colors duration-200">
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 class="text-2xl font-semibold font-sans">{{ currentMonthYear }}</h2>
          <button @click="nextMonth" class="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#0f1b33] transition-colors duration-200">
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <!-- 요일 -->
        <div class="grid grid-cols-7 gap-px text-center font-semibold text-gray-600 dark:text-gray-400 border-b border-zinc-200 dark:border-[#1e2a44]">
          <div class="py-2 text-red-500">일</div>
          <div class="py-2">월</div>
          <div class="py-2">화</div>
          <div class="py-2">수</div>
          <div class="py-2">목</div>
          <div class="py-2">금</div>
          <div class="py-2 text-blue-500">토</div>
        </div>
        <!-- 날짜 그리드 -->
        <div class="grid grid-cols-7 gap-px">
          <div 
            v-for="day in calendarGrid" 
            :key="day.date.toISOString()"
            @click="openDayModal(day)"
            class="relative pt-2 px-2 pb-16 min-h-[120px] border border-gray-100 dark:border-[#1e2a44] transition-colors duration-200 cursor-pointer group"
            :class="{ 
              'bg-white dark:bg-[#0f1b33]': day.isCurrentMonth, 
              'bg-gray-50 text-gray-400 dark:bg-[#0b1324] dark:text-gray-600': !day.isCurrentMonth,
              'hover:bg-indigo-50 dark:hover:bg-[#1d3b73]/20': day.isCurrentMonth
            }"
          >
            <!-- 날짜 숫자 -->
            <div class="flex justify-center items-center h-7">
              <span 
                class="font-medium w-7 h-7 flex items-center justify-center rounded-full"
                :class="{ 
                  'bg-[#0b3b70] text-white dark:bg-[#1d3b73]': day.isToday,
                  'text-red-500': !day.isCurrentMonth && day.date.getDay() === 0,
                  'text-blue-500': !day.isCurrentMonth && day.date.getDay() === 6
                }"
              >
                {{ day.date.getDate() }}
              </span>
            </div>
            
            <!-- 이벤트 칩 (빗금 기능 적용됨) -->
            <div class="mt-1 space-y-1 overflow-hidden">
              <!-- 일정 칩 -->
              <div 
                v-for="schedule in day.schedules" 
                :key="schedule.id" 
                class="text-xs font-semibold px-2 py-0.5 rounded-full truncate group-hover:opacity-80"
                :class="getScheduleChipClass(schedule)"
              >
                {{ schedule.title }}
              </div>
              <!-- 거래 칩 -->
              <div 
                v-for="tx in day.transactions" 
                :key="tx.id" 
                class="text-xs font-semibold px-2 py-0.5 rounded-full truncate group-hover:opacity-80"
                :class="{ 
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200': tx.type === 'income', 
                  'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200': tx.type === 'expense' 
                }"
              >
                {{ tx.description }}
              </div>
            </div>
            
          </div>
        </div>
      </section>

    </div> <!-- v-if="isLoggedIn" 끝 -->
  </main>

  <!--
  ==================================================
  MODALS (팝업창)
  ==================================================
  -->

  <!-- 1. '상세 내역' 모달 -->
  <Transition name="modal-fade">
    <div v-if="selectedDay" @click="closeDayModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <!-- 모달 컨텐츠 -->
      <div @click.stop class="bg-white dark:bg-[#0b1324] rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <!-- 모달 헤더 -->
        <div class="bg-gray-100 dark:bg-[#0f1b33] p-4 flex justify-between items-center border-b border-gray-200 dark:border-[#1e2a44]">
          <h3 class="text-2xl font-semibold">{{ selectedDayFormatted }}</h3>
          <button @click="closeDayModal" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        
        <!-- 모달 바디 (스크롤) -->
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          
          <!-- 왼쪽: 일정 상세 -->
          <section>
            <h4 class="text-xl font-semibold mb-3 border-b pb-2 dark:border-gray-700">일정 ({{ selectedDay.schedules.length }})</h4>
            <div v-if="selectedDay.schedules.length === 0" class="text-gray-500 py-4">
              해당 날짜에 일정이 없습니다.
            </div>
            <ul v-else class="space-y-3">
              <!-- "지출 예정" 칩 추가 -->
              <li 
                v-for="schedule in selectedDay.schedules" 
                :key="schedule.id" 
                class="bg-gray-50 dark:bg-[#0f1b33]/60 p-3 rounded-lg group relative"
                :class="{ 'opacity-60': schedule.is_completed }"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h5 
                      class="font-semibold"
                      :class="{ 'line-through text-gray-600 dark:text-gray-400': schedule.is_completed }"
                    >
                      {{ schedule.title }}
                    </h5>
                    <p 
                      class="text-sm text-gray-600 dark:text-gray-400"
                      :class="{ 'line-through': schedule.is_completed }"
                    >
                      {{ formatDisplayDate(schedule.date).display }}
                    </p>
                  </div>
                  <!-- 수정/삭제 버튼 -->
                  <div class="flex-shrink-0 flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button @click="openScheduleEditModal(schedule)" class="btn-edit-outline">수정</button>
                    <button @click="handleDeleteSchedule(schedule.id)" class="btn-danger-outline">삭제</button>
                  </div>
                </div>
                <p 
                  v-if="schedule.notes" 
                  class="text-sm mt-2 whitespace-pre-wrap border-l-2 border-gray-300 dark:border-gray-600 pl-2"
                  :class="{ 'line-through': schedule.is_completed }"
                >
                  {{ schedule.notes }}
                </p>
                <div class="mt-2 flex items-center space-x-2 flex-wrap gap-y-1">
                  <span 
                    v-if="schedule.quote_amount" 
                    class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-200"
                    :class="{ 'line-through': schedule.is_completed }"
                  >
                    견적: ₩{{ schedule.quote_amount.toLocaleString() }}
                  </span>
                  <!-- (새 기능!) 지출 예정 칩 -->
                  <span 
                    v-if="schedule.payable_amount" 
                    class="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-orange-900/50 dark:text-orange-200"
                    :class="{ 'line-through': schedule.is_completed }"
                  >
                    지출 예정: ₩{{ schedule.payable_amount.toLocaleString() }}
                  </span>
                  
                  <!-- '입금 확인' 칩 -->
                  <span v-if="schedule.payment_confirmed" class="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-green-900/50 dark:text-green-200">
                    입금 확인
                  </span>
                  <!-- (새 기능!) '지급 완료' 칩 -->
                  <span v-if="schedule.payment_paid" class="bg-gray-400 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-gray-600 dark:text-gray-100">
                    지급 완료
                  </span>
                </div>
              </li>
            </ul>
          </section>

          <!-- 오른쪽: 지출/수입 상세 -->
          <section>
            <h4 class="text-xl font-semibold mb-3 border-b pb-2 dark:border-gray-700">수입/지출 ({{ selectedDay.transactions.length }})</h4>
            <div v-if="selectedDay.transactions.length === 0" class="text-gray-500 py-4">
              해당 날짜에 거래 내역이 없습니다.
            </div>
            <ul v-else class="space-y-3">
              <li v-for="tx in selectedDay.transactions" :key="tx.id" class="flex justify-between items-center bg-gray-50 dark:bg-[#0f1b33]/60 p-3 rounded-lg group">
                <div>
                  <p class="font-medium">{{ tx.description }}</p>
                  <span 
                    class="font-semibold" 
                    :class="{ 'text-green-600': tx.type === 'income', 'text-red-600': tx.type === 'expense' }"
                  >
                    {{ tx.type === 'income' ? '+' : '-' }} ₩{{ tx.amount.toLocaleString() }}
                  </span>
                </div>
                <!-- 수정/삭제 버튼 -->
                <div class="flex-shrink-0 flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button @click="openTransactionEditModal(tx)" class="btn-edit-outline">수정</button>
                  <button @click="handleDeleteTransaction(tx.id)" class="btn-danger-outline">삭제</button>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 2. '일정 수정' 모달 (수정됨!) -->
  <Transition name="modal-fade">
    <div v-if="editingSchedule" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div @click.stop class="bg-white dark:bg-[#0b1324] rounded-lg shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <form @submit.prevent="handleUpdateSchedule">
          <!-- 모달 헤더 -->
          <div class="bg-gray-100 dark:bg-[#0f1b33] p-4 flex justify-between items-center border-b border-gray-200 dark:border-[#1e2a44]">
            <h3 class="text-2xl font-semibold">일정 수정</h3>
            <button type="button" @click="closeEditModals" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
          </div>
          <!-- 모달 바디 -->
          <div class="p-6 space-y-4">
            <div>
              <label for="edit-sch-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목:</label>
              <input type="text" id="edit-sch-title" v-model="editFormSchedule.title" class="input-base w-full" required>
            </div>
            <div>
              <label for="edit-sch-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">날짜 및 시간:</label>
              <input type="datetime-local" id="edit-sch-date" v-model="editFormSchedule.date" class="input-base w-full" required>
            </div>
            <div>
              <label for="edit-sch-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">회의록 / 메모:</label>
              <textarea id="edit-sch-notes" v-model="editFormSchedule.notes" rows="4" class="input-base w-full" placeholder="미팅 내용을 요약해 보세요."></textarea>
            </div>
            
            <!-- (새 기능!) '지출 예정'과 '수입 예정'을 분리 -->
            <div>
              <label for="edit-sch-quote" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">견적 금액 (원):</label>
              <input type="number" id="edit-sch-quote" v-model.number="editFormSchedule.quote_amount" class="input-base w-full" placeholder="받을 돈(미수금)">
            </div>
            <div>
              <label for="edit-sch-payable" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">지출 예정 금액 (원):</label>
              <input type="number" id="edit-sch-payable" v-model.number="editFormSchedule.payable_amount" class="input-base w-full" placeholder="내보낼 돈(미지출)">
            </div>
            
            <!-- (새 기능!) 체크박스 3개로 분리 -->
            <div class="space-y-2">
              <div class="flex items-center">
                <input type="checkbox" id="edit-sch-completed" v-model="editFormSchedule.is_completed" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <label for="edit-sch-completed" class="ml-2 block text-sm font-medium">할 일 완료 (빗금)</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="edit-sch-payment" v-model="editFormSchedule.payment_confirmed" class="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                <label for="edit-sch-payment" class="ml-2 block text-sm font-medium">입금 확인 (총 수입에 자동 반영)</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="edit-sch-paid" v-model="editFormSchedule.payment_paid" class="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500">
                <label for="edit-sch-paid" class="ml-2 block text-sm font-medium">지급 완료 (총 지출에 자동 반영)</label>
              </div>
            </div>

            <div v-if="editError" class="text-sm text-red-600">{{ editError }}</div>
          </div>
          <!-- 모달 푸터 -->
          <div class="bg-gray-50 dark:bg-[#0f1b33] px-6 py-4 flex justify-end space-x-3">
            <button type="button" @click="closeEditModals" class="btn-outline">취소</button>
            <button type="submit" class="btn">저장</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>

  <!-- 3. '거래 수정' 모달 -->
  <Transition name="modal-fade">
    <div v-if="editingTransaction" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div @click.stop class="bg-white dark:bg-[#0b1324] rounded-lg shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <form @submit.prevent="handleUpdateTransaction">
          <!-- 모달 헤더 -->
          <div class="bg-gray-100 dark:bg-[#0f1b33] p-4 flex justify-between items-center border-b border-gray-200 dark:border-[#1e2a44]">
            <h3 class="text-2xl font-semibold">거래 내역 수정</h3>
            <button type="button" @click="closeEditModals" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
          </div>
          <!-- 모달 바디 -->
          <div class="p-6 space-y-4">
            <div class="flex justify-around">
              <label class="flex items-center space-x-2 p-3 rounded-lg border dark:border-[#1e2a44] cursor-pointer" :class="{ 'bg-green-100 dark:bg-green-900/30 border-green-400': editFormTransaction.type === 'income' }">
                <input type="radio" v-model="editFormTransaction.type" value="income" name="txTypeEdit" class="form-radio text-green-600 focus:ring-green-500">
                <span class="text-lg font-semibold text-green-700">수입</span>
              </label>
              <label class="flex items-center space-x-2 p-3 rounded-lg border dark:border-[#1e2a44] cursor-pointer" :class="{ 'bg-red-100 dark:bg-red-900/30 border-red-400': editFormTransaction.type === 'expense' }">
                <input type="radio" v-model="editFormTransaction.type" value="expense" name="txTypeEdit" class="form-radio text-red-600 focus:ring-red-500">
                <span class="text-lg font-semibold text-red-700">지출</span>
              </label>
            </div>
            <div>
              <label for="edit-tx-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">내역:</label>
              <input type="text" id="edit-tx-desc" v-model="editFormTransaction.description" class="input-base w-full" required>
            </div>
            <div>
              <label for="edit-tx-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">금액 (원):</label>
              <input type="number" id="edit-tx-amount" v-model.number="editFormTransaction.amount" class="input-base w-full" required>
            </div>
            <div>
              <label for="edit-tx-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">거래 날짜:</label>
              <input type="date" id="edit-tx-date" v-model="editFormTransaction.date" class="input-base w-full" required>
            </div>
            <div v-if="editError" class="text-sm text-red-600">{{ editError }}</div>
          </div>
          <!-- 모달 푸터 -->
          <div class="bg-gray-50 dark:bg-[#0f1b33] px-6 py-4 flex justify-end space-x-3">
            <button type="button" @click="closeEditModals" class="btn-outline">취소</button>
            <button type="submit" class="btn">저장</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>



<script setup>
// App.vue (JavaScript 로직) - "미지출" 기능 + "자동 지출" 기능 추가

import { ref, onMounted, computed, watchEffect } from 'vue'

// --- API 임포트 ---
import { listenToAuthChanges } from './api.js' 
import { auth } from './firebaseConfig.js' 
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from './api/schedules.js'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from './api/transactions.js'
import { parseText } from './api/ai.js'


// --- 시간대(Timezone) 헬퍼 함수 ---
const getLocalDateStr = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatDisplayDate = (isoString) => {
  if (!isoString) return { display: "", value: "" };
  try {
    const date = new Date(isoString); 
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const display = `${year}. ${month}. ${day}. ${hours}:${minutes}`;
    const value = `${year}-${month}-${day}T${hours}:${minutes}`; 
    return { display, value };
  } catch (e) {
    return { display: "날짜 오류", value: "" };
  }
};
const formatTxDate = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return getLocalDateStr(date); // "YYYY-MM-DD"
  } catch(e) {
    return "날짜 오류";
  }
};


// --- 다크 모드 관리 ---
const isDarkMode = ref(false);

const applyDarkMode = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  try {
    localStorage.setItem('storyline-theme', isDark ? 'dark' : 'light');
  } catch (e) {
    console.warn('localStorage is not available for saving theme.');
  }
};

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  applyDarkMode(isDarkMode.value);
};


// --- 로그인 상태 ---
const isLoggedIn = ref(false)
const userProfile = ref(null)
const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
const handleLogout = () => signOut(auth);


// --- 데이터 상태 ---
const schedules = ref([])
const transactions = ref([])
const scheduleloadError = ref(null)
const txLoadError = ref(null)


// --- 1. 요약 (Summary) (수정됨!) ---
const totalIncome = computed(() => {
  // 'Transactions' 장부에서 "실제" 입금된 돈의 합계
  return transactions.value
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
});
const totalExpense = computed(() => {
  // 'Transactions' 장부에서 "실제" 지출된 돈의 합계
  return transactions.value
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
});
const totalReceivable = computed(() => {
  // (미수금) 'Schedules' 장부에서, "견적"이 있고 "입금 확인"이 '안 된' 것들의 합계
  return schedules.value
    .filter(s => (s.quote_amount || 0) > 0 && !s.payment_confirmed)
    .reduce((sum, s) => sum + (s.quote_amount || 0), 0);
});
// (새 기능!) "미지출금" 계산
const totalPayable = computed(() => {
  // (미지출) 'Schedules' 장부에서, "지출 예정"이 있고 "지급 완료"가 '안 된' 것들의 합계
  return schedules.value
    .filter(s => (s.payable_amount || 0) > 0 && !s.payment_paid)
    .reduce((sum, s) => sum + (s.payable_amount || 0), 0);
});


// --- 2. AI 입력창 ---
const aiInputText = ref("")
const isParsing = ref(false)
const aiError = ref(null)
const aiAnswerText = ref("") // AI "답변"

const handleAIParse = async () => {
  if (!aiInputText.value) return;
  isParsing.value = true;
  aiError.value = null;
  aiAnswerText.value = ""; // 답변 초기화

  try {
    const result = await parseText(aiInputText.value);
    
    if (result.type === 'schedule') {
      const newSchedule = await createSchedule(result.data);
      schedules.value.push(newSchedule);
    } else if (result.type === 'transaction') {
      const newTransaction = await createTransaction(result.data);
      transactions.value.push(newTransaction);
    } else if (result.type === 'answer') {
      aiAnswerText.value = result.data.message;
    } else {
      throw new Error(result.message || "AI가 텍스트를 이해하지 못했습니다.");
    }
    
    aiInputText.value = ""; 
    
  } catch (error) {
    aiError.value = `오류: ${error.detail || error.message}`;
  } finally {
    isParsing.value = false;
  }
};


// --- 3. 달력 (Calendar) ---
const currentDate = ref(new Date()); 

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleString('ko-KR', { year: 'numeric', month: 'long' });
});

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};
const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const getSchedulesForDate = (date) => {
  const localCalendarDateStr = getLocalDateStr(date);
  return schedules.value.filter(s => {
    const itemLocalDateStr = getLocalDateStr(new Date(s.date));
    return itemLocalDateStr === localCalendarDateStr;
  });
};
const getTransactionsForDate = (date) => {
  const localCalendarDateStr = getLocalDateStr(date);
  return transactions.value.filter(t => {
    const itemLocalDateStr = getLocalDateStr(new Date(t.date));
    return itemLocalDateStr === localCalendarDateStr;
  });
};

// (새 기능!) 일정 칩의 CSS 클래스를 동적으로 반환
const getScheduleChipClass = (schedule) => {
  if (schedule.is_completed) {
    return 'bg-gray-200 text-gray-500 line-through dark:bg-gray-700 dark:text-gray-400';
  }
  // (수정!) "지출 예정" (payable_amount)이 있으면 주황색
  if ((schedule.payable_amount || 0) > 0 && !schedule.payment_paid) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
  }
  // "견적" (quote_amount)이 있거나, 아무것도 없으면 녹색
  return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
};

const calendarGrid = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth(); 
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate(); 
  const days = [];
  const todayStr = getLocalDateStr(new Date());

  const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, lastDayOfPrevMonth - i);
    days.push({
      date: date, isCurrentMonth: false, isToday: false,
      schedules: getSchedulesForDate(date),
      transactions: getTransactionsForDate(date)
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateStr = getLocalDateStr(date); 
    days.push({
      date: date, isCurrentMonth: true, isToday: dateStr === todayStr,
      schedules: getSchedulesForDate(date),
      transactions: getTransactionsForDate(date)
    });
  }

  const remainingDays = 42 - days.length; 
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date: date, isCurrentMonth: false, isToday: false,
      schedules: getSchedulesForDate(date),
      transactions: getTransactionsForDate(date)
    });
  }
  return days;
});


// --- 4. '상세 내역' 모달 ---
const selectedDay = ref(null); 
const selectedDayFormatted = computed(() => {
  if (!selectedDay.value) return "";
  return selectedDay.value.date.toLocaleString('ko-KR', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  });
});
const openDayModal = (day) => {
  selectedDay.value = day;
};
const closeDayModal = () => {
  selectedDay.value = null;
};


// --- 5. '수정/삭제' 로직 (수정됨!) ---

const editingSchedule = ref(null);      
const editingTransaction = ref(null);   
const editFormSchedule = ref({});     
const editFormTransaction = ref({});  
const editError = ref(null);            

const closeEditModals = () => {
  editingSchedule.value = null;
  editingTransaction.value = null;
  editError.value = null;
};

// --- (일정) 수정 ---
const openScheduleEditModal = (schedule) => {
  closeDayModal(); 
  editError.value = null;
  editFormSchedule.value = { 
    ...schedule, 
    // (수정!) 모든 새 필드에 대한 기본값 처리
    is_completed: schedule.is_completed || false,
    payment_confirmed: schedule.payment_confirmed || false,
    quote_amount: schedule.quote_amount || 0,
    payable_amount: schedule.payable_amount || 0,
    payment_paid: schedule.payment_paid || false,
    date: formatDisplayDate(schedule.date).value 
  };
  editingSchedule.value = schedule.id; 
};

// (수정!) "자동 지출" 로직 추가
const handleUpdateSchedule = async () => {
  editError.value = null;
  if (!editingSchedule.value) return;

  try {
    // 1. 수정 "전"의 원본 데이터
    const originalSchedule = schedules.value.find(s => s.id === editingSchedule.value);
    if (!originalSchedule) throw new Error("원본 일정을 찾을 수 없습니다.");
    
    // 2. 수정 "전"과 "후"의 상태 비교
    // (수입)
    const wasConfirmed = originalSchedule.payment_confirmed || false;
    const isNowConfirmed = editFormSchedule.value.payment_confirmed;
    const quoteAmount = parseFloat(editFormSchedule.value.quote_amount) || 0;
    // (지출)
    const wasPaid = originalSchedule.payment_paid || false;
    const isNowPaid = editFormSchedule.value.payment_paid;
    const payableAmount = parseFloat(editFormSchedule.value.payable_amount) || 0;


    // 3. 전송할 일정 데이터 (Update)
    const updateData = {
      title: editFormSchedule.value.title,
      date: new Date(editFormSchedule.value.date).toISOString(), 
      notes: editFormSchedule.value.notes,
      is_completed: editFormSchedule.value.is_completed,
      
      quote_amount: quoteAmount,
      payment_confirmed: isNowConfirmed,
      
      payable_amount: payableAmount,
      payment_paid: isNowPaid
    };

    // 4. 일정 수정 API 호출
    const updatedSchedule = await updateSchedule(editingSchedule.value, updateData);

    // 5. (새 기능!) "입금 확인" 자동화
    if (isNowConfirmed && !wasConfirmed && quoteAmount > 0) {
      console.log("견적 입금 자동화 실행! -> 수입 항목 생성");
      const newTransactionData = {
        type: 'income',
        description: `${updatedSchedule.title} (견적 입금)`,
        amount: updatedSchedule.quote_amount,
        date: new Date(updatedSchedule.date).toISOString(), 
        related_schedule_id: updatedSchedule.id 
      };
      const newTransaction = await createTransaction(newTransactionData);
      transactions.value.unshift(newTransaction);
    }
    
    // 6. (새 기능!) "지급 완료" 자동화
    if (isNowPaid && !wasPaid && payableAmount > 0) {
      console.log("지출 예정 자동화 실행! -> 지출 항목 생성");
      const newTransactionData = {
        type: 'expense',
        description: `${updatedSchedule.title} (대금 지급)`,
        amount: updatedSchedule.payable_amount,
        date: new Date(updatedSchedule.date).toISOString(), 
        related_schedule_id: updatedSchedule.id 
      };
      const newTransaction = await createTransaction(newTransactionData);
      transactions.value.unshift(newTransaction);
    }

    // 7. 메인 일정 데이터(schedules) 갱신
    const index = schedules.value.findIndex(s => s.id === editingSchedule.value);
    if (index !== -1) {
      schedules.value[index] = updatedSchedule;
    }
    
    closeEditModals(); 

  } catch (error) {
    console.error("일정 수정 실패 (또는 자동화 실패):", error);
    editError.value = `저장에 실패했습니다: ${error.detail || error.message}`;
  }
};

// --- (일정) 삭제 ---
const handleDeleteSchedule = async (scheduleId) => {
  if (!confirm("정말 이 일정을 삭제하시겠습니까?")) return;
  try {
    await deleteSchedule(scheduleId);
    schedules.value = schedules.value.filter(s => s.id !== scheduleId);
    if (selectedDay.value) {
      selectedDay.value.schedules = selectedDay.value.schedules.filter(s => s.id !== scheduleId);
    }
  } catch (error) {
    console.error("일정 삭제 실패:", error);
  }
};

// --- (거래) 수정 ---
const openTransactionEditModal = (tx) => {
  closeDayModal(); 
  editError.value = null;
  editFormTransaction.value = { 
    ...tx, 
    date: formatTxDate(tx.date) 
  };
  editingTransaction.value = tx.id; 
};

const handleUpdateTransaction = async () => {
  editError.value = null;
  if (!editingTransaction.value) return;

  try {
    const updateData = {
      type: editFormTransaction.value.type,
      description: editFormTransaction.value.description,
      amount: parseFloat(editFormTransaction.value.amount) || 0,
      date: new Date(editFormTransaction.value.date).toISOString() 
    };
    
    if (updateData.amount <= 0) {
      editError.value = "금액은 0보다 커야 합니다.";
      return;
    }

    const updatedTransaction = await updateTransaction(editingTransaction.value, updateData);

    const index = transactions.value.findIndex(t => t.id === editingTransaction.value);
    if (index !== -1) {
      transactions.value[index] = updatedTransaction;
    }
    
    closeEditModals(); 

  } catch (error) {
    console.error("거래 수정 실패:", error);
    editError.value = `저장에 실패했습니다: ${error.detail || error.message}`;
  }
};

// --- (거래) 삭제 ---
const handleDeleteTransaction = async (txId) => {
  if (!confirm("정말 이 거래 내역을 삭제하시겠습니까?")) return;
  try {
    await deleteTransaction(txId);
    transactions.value = transactions.value.filter(t => t.id !== txId);
    if (selectedDay.value) {
      selectedDay.value.transactions = selectedDay.value.transactions.filter(t => t.id !== txId);
    }
  } catch (error) {
    console.error("거래 삭제 실패:", error);
  }
};


// --- 데이터 로딩 (라이프사이클) ---
const fetchAllData = async () => {
  scheduleloadError.value = null;
  txLoadError.value = null;
  try {
    const [schData, txData] = await Promise.all([
      getSchedules(),
      getTransactions()
    ]);
    schedules.value = schData;
    transactions.value = txData;
  } catch (error) {
    console.error("데이터 로드 실패:", error);
    scheduleloadError.value = "데이터를 불러오는 데 실패했습니다.";
    txLoadError.value = "데이터를 불러오는 데 실패했습니다.";
  }
};

onMounted(() => {
  // 앱 로드 시, 사용자의 다크 모드 설정을 확인합니다.
  try {
    const savedTheme = localStorage.getItem('storyline-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      isDarkMode.value = true;
      applyDarkMode(true);
    } else {
      isDarkMode.value = false;
      applyDarkMode(false);
    }
  } catch (e) {
    console.warn('localStorage is not available for loading theme.');
    isDarkMode.value = false; // 기본값
  }


  // 인증 상태 리스너
  listenToAuthChanges((user) => {
    if (user) {
      isLoggedIn.value = true;
      userProfile.value = {
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      fetchAllData();
    } else {
      isLoggedIn.value = false;
      userProfile.value = null;
      schedules.value = [];
      transactions.value = [];
      scheduleloadError.value = null;
      txLoadError.value = null;
    }
  });
});
</script>

<style>
/* 앱의 실제 배경색(라이트/다크)은 
  `src/index.css` 파일의 `@layer base`에서 제어합니다.
*/
html, body {
  height: 100%;
}

/* 모달이 나타나고 사라질 때 부드러운 애니메이션 */
.modal-fade-enter-active {
  transition: all 0.2s ease-out;
}
.modal-fade-leave-active {
  transition: all 0.1s ease-in;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>