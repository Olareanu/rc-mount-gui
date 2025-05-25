<script lang="ts">
  import {Button} from "$lib/components/ui/button";
  import Versions from "./components/Versions.svelte";
  import { onMount, onDestroy } from 'svelte';


  let vfsStats: any | null = $state(null);
  let coreStats: any | null = $state(null);

  let pollingId: NodeJS.Timeout | null = null;

  const ipcHandle = async (): Promise<void> => {
    // console.log('IPC Handle');
    try {
      if (await window.api.getRcloneRunning()) {
        vfsStats = await window.api.getVfsStats();
        coreStats = await window.api.getCoreStats();
      } else {
        vfsStats = null;
        coreStats = null;
      }

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

  // Helper to check visibility/focus (true if visible)
  function isWindowVisible(): boolean {
    return !document.hidden;
    // return !document.hidden && document.hasFocus();
  }

  // Start polling stats every X ms, but only when visible
  function startPolling() {
    if (!pollingId) {
      pollingId = setInterval(() => {
        if (isWindowVisible()) {
          ipcHandle();
        }
      }, 2000); // e.g., poll every 2 seconds
    }
  }

  // Stop polling
  function stopPolling() {
    if (pollingId) {
      clearInterval(pollingId);
      pollingId = null;
    }
  }

  // Visibility/focus event handlers
  function handleVisibilityChange() {
    if (isWindowVisible()) {
      startPolling();
      ipcHandle();
    } else {
      stopPolling();
    }
  }

  onMount(() => {
    // Start polling on mount if visible
    if (!document.hidden && document.hasFocus()) {
      ipcHandle();
      startPolling();
    }
    // Listen for tab/window visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange); // covers refocus
    window.addEventListener('blur', handleVisibilityChange);
  });

  onDestroy(() => {
    stopPolling();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
    window.removeEventListener('blur', handleVisibilityChange);
  });


</script>

<div class="min-h-screen flex flex-col">

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
        <p><strong>Avgreage Speed:</strong> {coreStats.speed !== undefined ? `${formatBytes(coreStats.speed)}/s` : 'N/A'}</p>
      {/if}

    </div>
  {:else if vfsStats && vfsStats.error}
    <p class="p-4">Error: {vfsStats.error}</p>
  {:else}
    <p class="p-4">Start RClone Service to see stats.</p>
  {/if}

  <div class="flex flex-row justify-center flex-wrap mt-auto">
<!--    <div class="p-2 flex justify-center">-->
<!--      <Button variant="default" onmousedown={ipcHandle} class="justify-center">Get Stats</Button>-->
<!--    </div>-->

    <div class="p-2 flex justify-center">
      <Button variant="default" onmousedown={window.api.openLogFolder} class="justify-center">Open Logs</Button>
    </div>

    <div class="p-2 flex justify-center">
      <Button variant="default" onmousedown={window.api.openConfigFolder} class="justify-center">Open Config</Button>
    </div>

  </div>



  <div class="p-4">
    <Versions/>
  </div>
</div>
