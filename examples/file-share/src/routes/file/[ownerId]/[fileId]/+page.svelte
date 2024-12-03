<script lang="ts">
  import { page } from '$app/stores';
  import { useAccount, useCoState } from '$lib/jazz';
  import { SharedFile, FileShareAccount } from '$lib/schema';
  import { FileText, Share, FileDown } from 'lucide-svelte';
  import { FileStream, type ID } from 'jazz-tools';
  import { formatFileSize } from '$lib/utils';

  const { me } = useAccount();
  const fileId = $page.params.fileId;
  const ownerId = $page.params.ownerId;

console.log(fileId, ownerId);
  // const ownerAccount = $state(useCoState(FileShareAccount, ownerId as ID<FileShareAccount>, {}));
  const file = $state(useCoState(SharedFile, fileId as ID<SharedFile>, {}));

    $inspect('file', file.current?.file)


  const isOwner = $derived(me?.id === file.current?._owner?.id);
  const hasAccess = $derived(!!file.current?.file);

  async function downloadFile() {
    try {
      const blob = await FileStream.loadAsBlob(file.current?._refs.file.id, me, {});
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.current?.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  }

  async function shareFile() {
    if (!file.current || !isOwner) return;
    try {
      const fileUrl = `${window.location.origin}/file/${file.current._owner?.id}/${file.current.id}`;
      await navigator.clipboard.writeText(fileUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing file:', error);
      alert('Failed to create share link. Please try again.');
    }
  }
</script>

{#if !hasAccess}
  <div class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <FileText class="w-16 h-16 text-gray-400" />
    <h2 class="text-xl font-semibold text-gray-700">File Not Found</h2>
    <p class="text-gray-600">This file could not be found or you may not have access to it.</p>
  </div>
{:else if file.current}
  <div class="container mx-auto max-w-4xl px-4 py-8">
    <div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex items-center space-x-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <FileText size={24} />
        </div>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">{file.current.name}</h1>
          <p class="text-sm text-gray-500">{formatFileSize(file.current.size)}</p>
        </div>
      </div>

      <div class="flex space-x-4">
        <button
          onclick={downloadFile}
          class="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FileDown size={20} />
          <span>Download</span>
        </button>

        {#if isOwner}
          <button
            onclick={shareFile}
            class="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <Share size={20} />
            <span>Share</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="container mx-auto max-w-4xl px-4 py-8">
    <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
      <p class="text-gray-500">Loading file...</p>
    </div>
  </div>
{/if}
