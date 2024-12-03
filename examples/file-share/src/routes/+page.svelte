<script lang="ts">
  import { useAccount, useCoState } from '$lib/jazz';
  import { SharedFile, ListOfSharedFiles } from '$lib/schema';
  import { createInviteLink } from 'jazz-svelte';
  import { FileStream } from 'jazz-tools';

  const { me, logOut } = useAccount();

  const mySharedFilesId = me?.root?._refs.sharedFiles.id;
  const sharedFiles = $derived(
    useCoState(ListOfSharedFiles, mySharedFilesId, [{}])
  );
  
  let fileInput: HTMLInputElement;

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || !files.length || !me?.root?.sharedFiles) return;

    const file = files[0];
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
        updatedAt: Date.now()
      },
      ownership
    );

    // Add the file to the user's files list
    me.root.sharedFiles.push(sharedFile);
  }

  async function shareFile(file: SharedFile) {
    const inviteLink = createInviteLink(file, 'reader');
    await navigator.clipboard.writeText(inviteLink);
    alert('Share link copied to clipboard!');
  }

  async function deleteFile(file: SharedFile) {
    if (!me?.root?.sharedFiles) return;

    const index = me.root.sharedFiles.indexOf(file);
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

  <div class="mb-8">
    <input
      type="file"
      bind:this={fileInput}
      onchange={handleFileUpload}
      class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none"
    />
  </div>

  <div class="grid gap-4">
    <pre class="text-xs text-gray-500">Debug - Files ID: {mySharedFilesId}</pre>
    {#if sharedFiles.current}
      {#each sharedFiles.current as file (file?.id)}
        <div class="flex items-center justify-between rounded-lg border p-4 shadow-sm">
          <div>
            <h3 class="font-semibold">{file?.name}</h3>
            <p class="text-sm text-gray-500">
              Uploaded {new Date(file?.createdAt || 0).toLocaleDateString()}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              onclick={() => shareFile(file)}
              class="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
            >
              Share
            </button>
            <button
              onclick={() => deleteFile(file)}
              class="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    {:else}
      <p class="text-center text-gray-500">No files yet</p>
    {/if}
  </div>
</div>
