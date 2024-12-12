<script lang="ts">
  import { createJazzApp } from '../jazz.svelte';
  import type { Account, CoValueClass, DepthsIn, ID } from 'jazz-tools';

  const { schema, id = undefined, depth = {} } = $props<{
    schema: CoValueClass<any>;
    id?: ID<Account>;
    depth?: DepthsIn<Account>;
  }>();
  
  const app = createJazzApp();
  const result = $derived(app.useCoState(schema, id, depth));
</script>

<div data-testid="test-component">
  <div data-testid="current-value">{JSON.stringify(result.current)}</div>
</div>