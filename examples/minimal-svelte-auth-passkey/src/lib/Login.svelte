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

<div class="login">
	{#if authState.state === 'loading'}
		<p>Loading...</p>
	{:else if authState.state === 'ready'}
		<h1>Login</h1>
		<form onsubmit={signUp}>
			<input type="text" name="name" placeholder="John Doe" bind:value={name} />
			<input type="submit" value="Create account" />
			<button onclick={logIn}>I have an account</button>
		</form>
	{:else if authState.state === 'signedIn'}
		<h1>You're logged in</h1>
		<!-- <p>Welcome back, {me?.profile?.name}</p> -->
		<button onclick={authState.logOut}>Log out</button>
	{/if}
</div>


<style>
	.login {
		margin-bottom: 2rem;
		padding-top: 2rem;
		max-width: 480px;
		margin: 0 auto;
	}
	.login input, .login button {
		padding: 0.3rem 0.5rem;
	}
</style>