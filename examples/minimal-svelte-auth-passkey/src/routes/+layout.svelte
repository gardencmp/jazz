<script lang="ts">
	import Login from '$lib/Login.svelte';
	import { JazzProvider, usePasskeyAuth } from 'jazz-svelte';

	let { children } = $props();

	let auth = usePasskeyAuth({ appName: 'minimal-svelte-auth-passkey' });

	$inspect(auth.state);
</script>

<Login state={auth.state} />

{#if auth.current}
	<JazzProvider
		auth={auth.current}
		peer="wss://cloud.jazz.tools/?key=minimal-svelte-auth-passkey@gcmp.io"
	>
		{@render children?.()}
	</JazzProvider>
{/if}