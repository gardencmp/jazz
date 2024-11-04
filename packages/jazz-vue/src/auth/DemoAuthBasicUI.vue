<template>
    <div
      :style="containerStyle"
    >
      <div v-if="state.state === 'loading'">Loading...</div>
      <template v-else-if="state.state === 'ready'">
        <h1 :style="{ color: darkMode ? '#fff' : '#000', textAlign: 'center' }">
          {{ appName }}
        </h1>
        <div v-for="error in state.errors" :key="error" style="color: red">
          {{ error }}
        </div>
        <form
          @submit.prevent="signUp"
          style="display: flex; flex-direction: column; gap: 0.5rem;"
        >
          <input
            v-model="username"
            placeholder="Display name"
            autoComplete="webauthn"
            :style="inputStyle"
          />
          <input
            type="submit"
            value="Sign up"
            :style="buttonStyle"
          />
        </form>
        <div
          v-if="state.existingUsers.length > 0"
          style="display: flex; flex-direction: column; gap: 0.5rem;"
        >
          <p
            :style="{
              color: darkMode ? '#e2e2e2' : '#000',
              textAlign: 'center',
              paddingTop: '0.5rem',
              borderTop: '1px solid',
              borderColor: darkMode ? '#111' : '#e2e2e2',
            }"
          >
            Log in as
          </p>
          <button
            v-for="user in state.existingUsers"
            :key="user"
            @click="logInAs(user)"
            type="button"
            :aria-label="`Log in as ${user}`"
            :style="loginButtonStyle"
          >
            {{ user }}
          </button>
        </div>
      </template>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { DemoAuthState } from './useDemoAuth.js';

  const props = defineProps<{
    appName: string;
    state: DemoAuthState;
  }>();

  console.log(props.state);

  const username = ref('');
  const darkMode = computed(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const containerStyle = computed(() => ({
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '1rem',
    maxWidth: '100vw',
    gap: '2rem',
    margin: '0',
    ...(darkMode.value ? { background: '#000' } : {}),
  }));

  const inputStyle = computed(() => ({
    border: darkMode.value ? '2px solid #444' : '2px solid #ddd',
    padding: '11px 8px',
    borderRadius: '6px',
    background: darkMode.value ? '#000' : '#fff',
    color: darkMode.value ? '#fff' : '#000',
  }));

  const buttonStyle = computed(() => ({
    padding: '13px 5px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: darkMode.value ? '#444' : '#ddd',
    color: darkMode.value ? '#fff' : '#000',
  }));

  const loginButtonStyle = computed(() => ({
    background: darkMode.value ? '#0d0d0d' : '#eee',
    color: darkMode.value ? '#fff' : '#000',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '6px',
  }));

  const signUp = () => {
    (props.state as DemoAuthState & { state: "ready" }).signUp(username.value);
    username.value = '';
  };

  const logInAs = (user: string) => {
    (props.state as DemoAuthState & { state: "ready" }).logInAs(user);
  };
</script>
  