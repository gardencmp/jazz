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

  $inspect('me', me);

  const file = $state(useCoState(SharedFile, fileId as ID<SharedFile>, {}));

  const isUploader = $derived(me?.id === file.current?.uploader?.id);
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
    if (!file.current || !isUploader) return;
    try {
      const fileUrl = `${window.location.origin}/file/${file.current._owner?.id}/${file.current.id}`;
      await navigator.clipboard.writeText(fileUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to copy share link');
    }
  }

  $inspect('file', file);
</script>

<svelte:head>
  <title>{file.current?.name} | File Share</title>
</svelte:head>

{#if file.current}
  <div class="container mx-auto max-w-3xl p-4">
    <div class="rounded-lg bg-white p-6 shadow-md">
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <File class="h-6 w-6" />
          <h1 class="text-2xl font-semibold">{file.current.name}</h1>
        </div>
        <div class="flex gap-2">
          {#if isUploader}
            <button
              onclick={shareFile}
              class="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              <Link2 class="h-4 w-4" />
              Share
            </button>
          {/if}
          {#if hasAccess}
            <button
              onclick={downloadFile}
              class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <FileDown class="h-4 w-4" />
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
  <div class="container mx-auto max-w-3xl p-4">
    <div class="rounded-lg bg-white p-6 shadow-md">
      <p class="text-gray-600">Loading file...</p>
    </div>
  </div>
{/if}
