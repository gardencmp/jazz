<script lang="ts">
  import { formatFileSize } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import type { SharedFile } from '$lib/schema';

  export let file: SharedFile;
  export let loading = false;
  export let onShare: (file: SharedFile) => void;
  export let onDelete: (file: SharedFile) => void;
</script>

<div
  class="group relative flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
  transition:slide|local={{ duration: 200 }}
>
  <div class="flex items-center space-x-4">
    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <div>
      <h3 class="font-medium text-gray-900">{file.name}</h3>
      <p class="text-sm text-gray-500">
        Uploaded {new Date(file.createdAt || 0).toLocaleDateString()} • 
        {formatFileSize(file.size || 0)}
      </p>
    </div>
  </div>
  
  <div class="flex items-center space-x-3">
    {#if loading}
      <div class="text-sm text-gray-500">Uploading...</div>
    {:else}
      <button
        onclick={() => onShare(file)}
        class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Share file"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      <button
        onclick={() => onDelete(file)}
        class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
        aria-label="Delete file"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    {/if}
  </div>
</div>
