<script lang="ts">
	import { useAccount } from '../Jazz.svelte.js';

	const { logOut } = useAccount({
		root: {}
	});
</script>

<div class="container">
	<h1>Welcome back</h1>
	<button on:click={() => logOut()}>Log out</button>
</div>

<style>
	.container {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: start;
	}

	button {
		background: #000;
		color: #fff;
		padding: 6px 12px;
		border: none;
		border-radius: 6px;
    min-height: 38px;
		cursor: pointer;
	}
</style>
