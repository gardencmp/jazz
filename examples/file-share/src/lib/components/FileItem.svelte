<script lang="ts">
  import { formatFileSize } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import { SharedFile } from '$lib/schema';
  import { type Account, FileStream } from 'jazz-tools';
  import { FileText, Share, FileDown, Trash2 } from 'lucide-svelte';
  import { useAccount } from '$lib/jazz';
  import { goto } from '$app/navigation';

  export let file: SharedFile;
  export let loading = false;
  export let onShare: (file: SharedFile) => void;
  export let onDelete: (file: SharedFile) => void;

  const { me } = useAccount();
  const isOwner = me?.id === file._owner?.id;

  async function downloadFile() {
    try {
      const blob = await FileStream.loadAsBlob(file._refs.file.id, file._owner as Account, {});
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  async function shareFile() {
    try {
      const fileUrl = `${window.location.origin}/file/${file._owner?.id}/${file.id}`;
      await navigator.clipboard.writeText(fileUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing file:', error);
      alert('Failed to create share link. Please try again.');
    }
  }

  function goToFileDetail() {
    goto(`/file/${file._owner?.id}/${file.id}`);
  }
</script>

<div
  class="group relative flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
  transition:slide|local={{ duration: 200 }}
>
  <div class="flex items-center space-x-4">
    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
      <FileText class="h-6 w-6" />
    </div>
    <div>
      <h3 class="font-medium text-gray-900">{file.name}</h3>
      <p class="text-sm text-gray-500">
        {#if file._owner?.profile?.name}
          {isOwner ? 'Owned by you' : `Shared by ${file._owner.profile.name}`} •
        {/if}
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
        on:click={downloadFile}
        class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Download file"
      >
        <FileDown class="h-5 w-5" />
      </button>

      {#if isOwner}
        <button
          on:click={shareFile}
          class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Share file"
        >
          <Share class="h-5 w-5" />
        </button>

        <button
          on:click={() => onDelete(file)}
          class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
          aria-label="Delete file"
        >
          <Trash2 class="h-5 w-5" />
        </button>
      {:else}
        <button
          on:click={() => onShare(file)}
          class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Share file"
        >
          <Share class="h-5 w-5" />
        </button>
      {/if}
    {/if}
  </div>
</div>
