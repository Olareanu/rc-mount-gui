<script lang="ts">
  import {Button} from "$lib/components/ui/button";
  import Versions from "./components/Versions.svelte";

  let info: any | null = $state(null)

  const ipcHandle = async (): Promise<void> => {
    try {
      info = await window.api.getVfsStats();
      console.log('Received info:', info); // Log the received object
      console.log('Type of received info:', typeof (info)); // Should be 'object' now
    } catch (error) {
      console.error('Error fetching VFS stats:', error);
      info = {error: "Failed to fetch stats"}; // Indicate error in UI
    }

  }
</script>

<div class="min-h-screen flex flex-col">
  <div class="p-16 flex justify-center gap-8">
    <Button variant="default" onmousedown={ipcHandle} class="justify-center">Send IPC</Button>
  </div>

  <!-- Display the extracted information -->
  {#if info && typeof info === 'object' && !info.error}
    <div class="p-4">
      <h2>VFS Statistics:</h2>
      <p><strong>Connected FS:</strong> {info.fs}</p>
      <p><strong>Uploads in progress:</strong> {info.diskCache?.uploadsInProgress ?? 'N/A'}</p>
      <p><strong>Uploads Queued:</strong> {info.diskCache?.uploadsQueued ?? 'N/A'}</p>
      <p><strong>Bytes used by cache:</strong> {info.diskCache?.bytesUsed ?? 'N/A'} bytes</p>
    </div>
  {:else if info && info.error}
    <p class="p-4">Error: {info.error}</p>
  {:else}
    <p class="p-4">Click the button to load VFS stats.</p>
  {/if}

  <div class="p-4 mt-auto">
    <Versions/>
  </div>
</div>
