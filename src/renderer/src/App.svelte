<script lang="ts">
  import {Button} from "$lib/components/ui/button";
  import Versions from "./components/Versions.svelte";

  let vfsStats: any | null = $state(null)
  let coreStats: any | null = $state(null)


  const ipcHandle = async (): Promise<void> => {
    try {
      vfsStats = await window.api.getVfsStats();
      coreStats = await window.api.getCoreStats();
    } catch (error) {
      console.error('Error fetching stats:', error);
      coreStats = {error: "Failed to fetch stats"}; // Indicate error in UI
    }

  }

  function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    // Determine the appropriate unit by calculating the log
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Format the number with the appropriate unit
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
</script>

<div class="min-h-screen flex flex-col">
  <div class="p-16 flex justify-center gap-8">
    <Button variant="default" onmousedown={ipcHandle} class="justify-center">Get Stats</Button>
  </div>

  <!-- Display the extracted information -->
  {#if vfsStats && typeof vfsStats === 'object' && !vfsStats.error}
    <div class="p-4">

      <h2>VFS Statistics:</h2>
      <p><strong>Connected FS:</strong> {vfsStats.fs}</p>
      <p><strong>Uploads in progress:</strong> {vfsStats.diskCache?.uploadsInProgress ?? 'N/A'}</p>
      <p><strong>Uploads Queued:</strong> {vfsStats.diskCache?.uploadsQueued ?? 'N/A'}</p>
      <p><strong>Bytes used by
        cache:</strong> {vfsStats.diskCache?.bytesUsed !== undefined ? formatBytes(vfsStats.diskCache.bytesUsed) : 'N/A'}
      </p>

      {#if coreStats && typeof coreStats === 'object'}
        <h2 class="mt-4">Transfer Statistics:</h2>
        <p><strong>ETA:</strong> {coreStats.eta !== null ? coreStats.eta : 'N/A'} seconds</p>
        <p><strong>Speed:</strong> {coreStats.speed !== undefined ? `${formatBytes(coreStats.speed)}/s` : 'N/A'}</p>
      {/if}

    </div>
  {:else if vfsStats && vfsStats.error}
    <p class="p-4">Error: {vfsStats.error}</p>
  {:else}
    <p class="p-4">Click the button to load RClone stats.</p>
  {/if}

  <div class="p-4 mt-auto">
    <Versions/>
  </div>
</div>
