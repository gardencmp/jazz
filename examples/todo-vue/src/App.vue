<template>
  <div class="app-container">
    <header v-if="me" class="app-header">
      <h1>Todo App</h1>
      <div class="user-section">
        <span>{{ me.profile?.name }}</span>
        <button class="logout-btn" @click="logOut">Log out</button>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background-color: #fff;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.5rem;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background-color: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #dc3545;
  color: white;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>

<script setup lang="ts">
import { useAccount } from "./main";

const { me, logOut } = useAccount();
</script>
