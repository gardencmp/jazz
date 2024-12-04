<script lang="ts">
  import { slide } from 'svelte/transition';
  import { SharedFile } from '$lib/schema';
  import { FileStream } from 'jazz-tools';
  import { File, FileDown, Trash2, Link2 } from 'lucide-svelte';
  import { useAccount } from '$lib/jazz';
  import { toast } from 'svelte-sonner';
  import { formatFileSize } from '$lib/utils';

  const {
    file,
    loading = false,
    onDelete
  }: {
    file: SharedFile;
    loading?: boolean;
    onDelete: (file: SharedFile) => void;
  } = $props();

  const { me } = useAccount();
  const isAdmin = $derived(me && file._owner?.myRole() === 'admin');

  async function downloadFile() {
    if (!file._refs.file?.id || !me) {
      toast.error('Failed to download file');
      return;
    }

    try {
      const fileId = file._refs.file.id;

      // Load the file as a blob, can take a while
      const blob = await FileStream.loadAsBlob(fileId, me, {});
      if (!blob) {
        toast.error('Failed to download file');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  }

  async function shareFile() {
    try {
      const fileUrl = `${window.location.origin}/file/${file.id}`;
      await navigator.clipboard.writeText(fileUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to create share link');
    }
  }
</script>

<div
  class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
  transition:slide={{ duration: 200 }}
>
  <div class="flex items-center space-x-4">
    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
      <File class="h-6 w-6" />
    </div>
    <div>
      <a href="/file/{file.id}" class="hover:text-blue-600 hover:underline">
        <h3 class="font-medium text-gray-900">{file.name}</h3>
      </a>
      <p class="text-sm text-gray-500">
        {isAdmin ? 'Owned by you' : ''} • Uploaded {new Date(
          file.createdAt || 0
        ).toLocaleDateString()} •
        {formatFileSize(file.size || 0)}
      </p>
    </div>
  </div>

  <div class="flex items-center space-x-2">
    {#if loading}
      <div class="text-sm text-gray-500">Uploading...</div>
    {:else}
      <button
        onclick={downloadFile}
        class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Download file"
      >
        <FileDown class="h-5 w-5" />
      </button>

      {#if isAdmin}
        <button
          onclick={shareFile}
          class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Share file"
        >
          <Link2 class="h-5 w-5" />
        </button>

        <button
          onclick={() => onDelete(file)}
          class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
          aria-label="Delete file"
        >
          <Trash2 class="h-5 w-5" />
        </button>
      {/if}
    {/if}
  </div>
</div>
