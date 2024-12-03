<script lang="ts">
  import { page } from '$app/stores';
  import { useAccount, useCoState } from '$lib/jazz';
  import { SharedFile, FileShareAccount } from '$lib/schema';
  import { File, Link2, FileDown } from 'lucide-svelte';
  import { FileStream, type ID } from 'jazz-tools';
  import { formatFileSize } from '$lib/utils';
  import { toast } from 'svelte-sonner';

  const { me } = useAccount();
  const fileId = $page.params.fileId;
  const ownerId = $page.params.ownerId;

  const file = $state(useCoState(SharedFile, fileId as ID<SharedFile>, {}));

  const isOwner = $derived(me?.id === file.current?._owner?.id);
  const hasAccess = $derived(!!file.current?.file);

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
      toast.error('Failed to create share link');
    }
  }
</script>

{#if !hasAccess}
  <div class="flex min-h-[50vh] flex-col items-center justify-center gap-4">
    <File class="h-16 w-16 text-gray-400" />
    <h2 class="text-xl font-semibold text-gray-700">File Not Found</h2>
    <p class="text-gray-600">This file could not be found or you may not have access to it.</p>
  </div>
{:else if file.current}
  <div class="container mx-auto max-w-4xl px-4 py-8">
    <div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex items-center space-x-4">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
        >
          <File size={24} />
        </div>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">{file.current.name}</h1>
          <p class="text-sm text-gray-500">
            {#if file.current._owner?.profile?.name}
              {isOwner ? 'Owned by you' : `Shared by ${file.current._owner.profile.name}`} •
            {/if}
            {formatFileSize(file.current.size)}
          </p>
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
            <Link2 size={20} />
            <span>Share</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="container mx-auto max-w-4xl px-4 py-8">
    <div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">Loading...</div>
  </div>
{/if}
