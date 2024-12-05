<script lang="ts">
  import { useAccount, useCoState } from '$lib/jazz';
  import { SharedFile, ListOfSharedFiles } from '$lib/schema';
  import { createInviteLink } from 'jazz-svelte';
  import { FileStream } from 'jazz-tools';
  import FileItem from '$lib/components/FileItem.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { generateTempFileId } from '$lib/utils';
  import { CloudUpload } from 'lucide-svelte';

  const { me, logOut } = useAccount();

  const mySharedFilesId = me?.root?._refs.sharedFiles.id;
  const sharedFiles = $derived(useCoState(ListOfSharedFiles, mySharedFilesId, [{}]));

  let fileInput: HTMLInputElement;

  type PendingSharedFile = {
    name: string;
    id: string;
    createdAt: Date;
  };

  // Track files that are currently uploading
  const uploadingFiles = new SvelteMap<string, PendingSharedFile>();

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || !files.length || !me?.root?.sharedFiles || !me.root.publicGroup) return;

    const file = files[0];
    const fileName = file.name;
    const createdAt = new Date();
    const fileId = generateTempFileId(fileName, createdAt);

    const tempFile: PendingSharedFile = {
      name: fileName,
      id: fileId,
      createdAt
    };

    // Add to uploading files
    uploadingFiles.set(fileId, tempFile);

    try {
      const ownership = { owner: me.root.publicGroup };

      // Create a FileStream from the uploaded file
      const fileStream = await FileStream.createFromBlob(file, ownership);

      // Create the shared file entry
      const sharedFile = SharedFile.create(
        {
          name: fileName,
          file: fileStream,
          createdAt,
          uploadedAt: new Date(),
          size: file.size
        },
        ownership
      );

      // Add the file to the user's files list
      me.root.sharedFiles.push(sharedFile);
    } finally {
      uploadingFiles.delete(fileId);
      fileInput.value = ''; // reset input
    }
  }

  async function shareFile(file: SharedFile) {
    const inviteLink = createInviteLink(file, 'reader');
    await navigator.clipboard.writeText(inviteLink);
    alert('Share link copied to clipboard!');
  }

  async function deleteFile(file: SharedFile) {
    if (!me?.root?.sharedFiles || !sharedFiles.current) return;

    const index = sharedFiles.current.indexOf(file);
    if (index > -1) {
      me.root.sharedFiles.splice(index, 1);
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="container mx-auto max-w-4xl px-4 py-8">
    <div class="mb-12 flex items-center justify-between">
      <div>
        <h1 class="mb-2 text-4xl font-bold text-gray-900">File Share</h1>
        <h2 class="text-xl text-gray-600">Welcome back, {me?.profile?.name}</h2>
      </div>

      <button
        onclick={logOut}
        class="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Log Out
      </button>
    </div>

    <!-- Upload Section -->
    <div class="mb-8 rounded-xl bg-white p-6 shadow-sm">
      <div
        class="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center hover:border-blue-500 hover:bg-blue-50"
        onclick={() => fileInput.click()}
        onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
        role="button"
        tabindex="0"
      >
        <CloudUpload class="mb-2 h-8 w-8 text-gray-400 group-hover:text-blue-600" />
        <h3 class="mb-1 text-lg font-medium text-gray-900">Upload a new file</h3>
        <p class="text-sm text-gray-500">Click to select a file from your computer</p>
        <input
          type="file"
          bind:this={fileInput}
          onchange={handleFileUpload}
          class="hidden"
          accept="*/*"
        />
      </div>
    </div>

    <!-- Files List -->
    <div class="space-y-4">
      {#if sharedFiles.current}
        {#if !(sharedFiles.current.length === 0 && uploadingFiles.size === 0)}
          {#each [...sharedFiles.current, ...uploadingFiles.values()] as file (generateTempFileId(file?.name, file?.createdAt))}
            <FileItem
              {file}
              loading={uploadingFiles.has(generateTempFileId(file?.name, file?.createdAt))}
              onShare={shareFile}
              onDelete={deleteFile}
            />
          {/each}
        {:else}
          <p class="text-center text-gray-500">No files yet</p>
        {/if}
      {/if}
    </div>
  </div>
</div>
