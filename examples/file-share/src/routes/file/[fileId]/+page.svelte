<script lang="ts">
  import { page } from '$app/stores';
  import { useAccount, useCoState } from '$lib/jazz';
  import { SharedFile } from '$lib/schema';
  import { File, FileDown, Link2 } from 'lucide-svelte';
  import type { ID } from 'jazz-tools';
  import { FileStream } from 'jazz-tools';
  import { toast } from 'svelte-sonner';

  const { me } = useAccount();
  const fileId = $page.params.fileId;

  const file = $state(useCoState(SharedFile, fileId as ID<SharedFile>, {}));
  const isAdmin = $derived(me && file.current?._owner?.myRole() === 'admin');

  async function downloadFile() {
    if (!file.current?._refs.file?.id || !me) {
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
    try {
      const fileUrl = `${window.location.origin}/file/${file.current?.id}`;
      await navigator.clipboard.writeText(fileUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to copy share link');
    }
  }
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
          {#if isAdmin}
            <button
              onclick={shareFile}
              class="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              <Link2 class="h-4 w-4" />
              Share
            </button>
          {/if}
          {#if file.current._refs.file}
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

      <p class="text-gray-600">
        {isAdmin ? 'You own this file' : 'Shared with you'} • Uploaded {new Date(
          file.current.createdAt || 0
        ).toLocaleDateString()}
      </p>
    </div>
  </div>
{:else}
  <div class="container mx-auto max-w-3xl p-4">
    <div class="rounded-lg bg-white p-6 shadow-md">
      <p class="text-gray-600">Loading file...</p>
    </div>
  </div>
{/if}
