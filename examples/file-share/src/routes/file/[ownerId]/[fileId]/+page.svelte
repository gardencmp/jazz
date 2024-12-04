<script lang="ts">
  import { page } from '$app/stores';
  import { useAccountOrGuest, useCoState } from '$lib/jazz';
  import { SharedFile } from '$lib/schema';
  import { File, Link2, FileDown } from 'lucide-svelte';
  import { FileStream, type ID } from 'jazz-tools';
  import { formatFileSize } from '$lib/utils';
  import { toast } from 'svelte-sonner';

  const { me } = useAccountOrGuest();
  const fileId = $page.params.fileId;
  const ownerId = $page.params.ownerId;

  $inspect('me',me)

  const file = $state(useCoState(SharedFile, fileId as ID<SharedFile>, {}));

  const isOwner = $derived(me?.id === file.current?._owner?.id);
  const hasAccess = $derived(!!file.current?._refs.file);

  async function downloadFile() {
    if (!file.current || !file.current._refs.file?.id || !me) {
      toast.error('Failed to download file');
      return;
    }

    try {
      const fileId = file.current._refs.file.id;
      const blob = await FileStream.loadAsBlob(fileId, me, {});
      if (!blob) {
        toast.error('Failed to download file');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.current.name;
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
    if (!file.current || !isOwner) return;
    try {
      const fileUrl = `${window.location.origin}/file/${file.current._owner?.id}/${file.current.id}`;
      await navigator.clipboard.writeText(fileUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to copy share link');
    }
  }

  $inspect('file',file)
</script>

{#if file.current}
  <div class="container mx-auto p-4 max-w-3xl">
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <File class="w-6 h-6" />
          <h1 class="text-2xl font-semibold">{file.current.name}</h1>
        </div>
        <div class="flex gap-2">
          {#if isOwner}
            <button
              onclick={shareFile}
              class="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Link2 class="w-4 h-4" />
              Share
            </button>
          {/if}
          {#if hasAccess}
            <button
              onclick={downloadFile}
              class="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <FileDown class="w-4 h-4" />
              Download
            </button>
          {/if}
        </div>
      </div>
      {#if file.current._refs.file}
        <p class="text-gray-600">Size: {formatFileSize(file.current.size)}</p>
      {:else}
        <p class="text-red-600">You don't have access to this file.</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="container mx-auto p-4 max-w-3xl">
    <div class="bg-white rounded-lg shadow-md p-6">
      <p class="text-gray-600">Loading file...</p>
    </div>
  </div>
{/if}
