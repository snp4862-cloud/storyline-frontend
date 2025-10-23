<script setup>
defineProps({
  user: Object,
});
const emit = defineEmits(['login', 'logout']);
</script>

<template>
  <header class="header">
    <h1>My Storyline</h1>
    <div class="auth">
      <template v-if="user">
        <img :src="user.photoURL" alt="프로필" />
        <span>{{ user.displayName }}</span>
        <button @click="emit('logout')">로그아웃</button>
      </template>
      <button v-else @click="emit('login')" class="login">Google 로그인</button>
    </div>
  </header>
</template>

<style scoped>
.header { padding:16px 0; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border);}
.header h1 { margin: 0; font-size: 1.5rem; }
.auth { display:flex; align-items:center; gap:10px; }
.auth img { width:32px; height:32px; border-radius:50%; vertical-align:middle; }
.auth button { border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:700; }
.auth .login { background:var(--g); color:#fff; }
</style>