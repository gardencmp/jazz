<script lang="ts">
  import { useAccount } from "../Jazz.svelte.js";

	const app = useAccount({
		root: {
			issues: []
		}
	});
</script>
