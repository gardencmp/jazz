<script lang="ts">
  import { PasskeyAuthBasicUI, usePasskeyAuth } from 'jazz-svelte';
  import { Toaster } from 'svelte-sonner';
  import '../app.css';
  import { Provider } from '$lib/jazz';

  let { children } = $props();
  const auth = usePasskeyAuth({
    appName: 'File Share'
  });
</script>

<svelte:head>
  <title>File Share</title>
</svelte:head>

<Toaster richColors />

<div class="fixed bottom-4 right-4">
  <PasskeyAuthBasicUI state={auth.state} />
</div>

{#if auth.current}
  <Provider auth={auth.current} peer="wss://cloud.jazz.tools/?key=file-share-example@gcmp.io">
    <div class="min-h-screen bg-gray-100">
      {@render children()}
    </div>
  </Provider>
{/if}
