<script lang="ts">
  import { type PasskeyAuthState } from 'jazz-svelte';

  let { state: authState }: { state: PasskeyAuthState } = $props();

  let name = $state('');

  function signUp(e: Event) {
    e.preventDefault();
    if (!name.trim() || authState.state !== 'ready') return;
    authState.signUp(name);
  }

  function logIn(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    if (authState.state !== 'ready') return;
    authState.logIn();
  }
</script>

<div style="max-width: 18rem; display: flex; flex-direction: column; gap: 2rem;">
  {#if authState.state === 'loading'}
    <div>Loading...</div>
  {:else if authState.state === 'ready'}
    {#if authState.errors?.length > 0}
      <div style="color: red;">
        {#each authState.errors as error}
          <div>{error}</div>
        {/each}
      </div>
    {/if}
    <form onsubmit={signUp}>
      <input type="text" placeholder="Display name" bind:value={name} autocomplete="name" />
      <input type="submit" value="Sign up" />
    </form>
    <button onclick={logIn}> Log in with existing account </button>
  {/if}
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  button,
  input[type='submit'] {
    background: #000;
    color: #fff;
	padding: 6px 12px;
    border: none;
    border-radius: 6px;
	min-height: 38px;
    cursor: pointer;
  }

  input[type='text'] {
    border: 2px solid #000;
	padding: 6px 12px;
    border-radius: 6px;
	min-height: 24px;
  }
</style>
