<script lang="ts">
	import { JazzProvider, usePasskeyAuth, PasskeyAuthBasicUI } from 'jazz-svelte';

	let { children } = $props();

	let auth = usePasskeyAuth({ appName: 'minimal-svelte-auth-passkey' });

	$inspect(auth.state);
</script>

<PasskeyAuthBasicUI state={auth.state} />

{#if auth.current}
	<JazzProvider
		auth={auth.current}
		peer="wss://cloud.jazz.tools/?key=minimal-svelte-auth-passkey@gcmp.io"
	>
		{@render children?.()}
	</JazzProvider>
{/if}