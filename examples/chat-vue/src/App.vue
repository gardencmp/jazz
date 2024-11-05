<template>
  <AppContainer>
    <TopBar v-if="me">
      <p>{{ me.profile?.name }}</p>
      <button @click="logOut">Log out</button>
    </TopBar>
    <router-view />
  </AppContainer>
</template>

<script setup lang="ts">
import { useAccount } from './main';
import AppContainer from './components/AppContainer.vue';
import TopBar from './components/TopBar.vue';

const { me, logOut } = useAccount();
</script>
