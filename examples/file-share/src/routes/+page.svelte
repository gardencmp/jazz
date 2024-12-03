<script lang="ts">
  import { useAccount, useCoState } from '$lib/jazz';
  import { SharedFile, ListOfSharedFiles } from '$lib/schema';
  import { createInviteLink } from 'jazz-svelte';
  import { FileStream } from 'jazz-tools';
  import { formatFileSize } from '$lib/utils';
  import { SvelteSet } from 'svelte/reactivity';
  import { slide, fade } from 'svelte/transition';

  const { me, logOut } = useAccount();

  const mySharedFilesId = me?.root?._refs.sharedFiles.id;
  const sharedFiles = $derived(useCoState(ListOfSharedFiles, mySharedFilesId, [{}]));

  let fileInput: HTMLInputElement;
  const uploadingFiles = new SvelteSet<string>();

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || !files.length || !me?.root?.sharedFiles) return;

    const file = files[0];
    uploadingFiles.add(file.name);

    try {
      const ownership = { owner: me };

      // Create a FileStream from the uploaded file
      const fileStream = await FileStream.createFromBlob(file, ownership);

      // Create a new SharedFile instance
      const sharedFile = SharedFile.create(
        {
          name: file.name,
          description: '',
          file: fileStream,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: file.size
        },
        ownership
      );

      // Add the file to the user's files list
      me.root.sharedFiles.push(sharedFile);
    } finally {
      uploadingFiles.delete(file.name);
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

<div class="container mx-auto px-4 py-8">
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="mb-2 text-3xl font-bold">File Share</h1>
      <h2 class="text-xl font-semibold">Welcome back, {me?.profile?.name}</h2>
    </div>

    <button onclick={logOut} class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
      Log Out
    </button>
  </div>

  <div class="grid gap-4">
       {#if sharedFiles.current}
      {#each sharedFiles.current as file (file?.id)}
        <div
          class="flex items-center justify-between rounded-lg border p-4 shadow-sm"
          in:fade={{ duration: 300 }}
          out:slide={{ duration: 300 }}
        >
          <div>
            <h3 class="font-semibold">{file?.name}</h3>
            <p class="text-sm text-gray-500">
              Uploaded {new Date(file?.createdAt || 0).toLocaleDateString()} •
              {formatFileSize(file?.size || 0)}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              onclick={() => shareFile(file!)}
              class="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
            >
              Share
            </button>
            <button
              onclick={() => deleteFile(file!)}
              class="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
      {#if uploadingFiles.size}
      <hr />
      {/if}
      {#each [...uploadingFiles] as fileName (fileName)}
        <div
          class="flex items-center justify-between rounded-lg border bg-gray-50 p-4 shadow-sm"
          in:fade={{ duration: 300 }}
          out:slide={{ duration: 300 }}
        >
          <div>
            <h3 class="flex items-center gap-2 font-semibold">
              {fileName}
              <svg class="h-5 w-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </h3>
            <p class="text-sm text-gray-500">Uploading...</p>
          </div>
        </div>
      {/each}
    {:else}
      <p class="text-center text-gray-500">No files yet</p>
    {/if}

    <label
    class="flex cursor-pointer items-center justify-between rounded-lg border p-4 shadow-sm hover:bg-gray-50"
  >
    <div>
      <h3 class="font-semibold">Upload a new file</h3>
      <p class="text-sm text-gray-500">Click to select a file from your computer</p>
    </div>
    <input
      type="file"
      bind:this={fileInput}
      onchange={handleFileUpload}
      class="hidden"
    />
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  </label>
  </div>
</div>
