<script lang="ts">
  import { usePasskeyAuth, PasskeyAuthBasicUI } from 'jazz-svelte';
  import { Provider } from '$lib/jazz';

  let { children } = $props();

  let auth = usePasskeyAuth({ appName: 'minimal-svelte-auth-passkey' });

  $inspect(auth.state);
</script>

<div
  style="width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center;"
>
  <PasskeyAuthBasicUI state={auth.state} />

  {#if auth.current}
    <Provider
      auth={auth.current}
      peer="wss://cloud.jazz.tools/?key=minimal-svelte-auth-passkey@garden.co"
    >
      {@render children?.()}
    </Provider>
  {/if}
</div>

<style>
  :global(html, body) {
    margin: 0;
  }
</style>
