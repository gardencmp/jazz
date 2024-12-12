<script lang="ts">
  import { createJazzApp } from '../jazz.svelte';

  const { Provider } = createJazzApp();
  const {auth} = $props();
</script>

<div data-testid="provider-test">
  <Provider {auth} peer="wss://cloud.jazz.tools/?key=jazz-svelte-test">
  {#if auth}
    <span data-testid="provider-auth-test">{JSON.stringify(auth)}</span>
  {/if}
</Provider>
</div>
