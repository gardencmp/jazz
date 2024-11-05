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
import AppContainer from "./components/AppContainer.vue";
import TopBar from "./components/TopBar.vue";
import { useAccount } from "./main";

const { me, logOut } = useAccount();
</script>
