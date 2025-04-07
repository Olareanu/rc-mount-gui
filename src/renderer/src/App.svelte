<script lang="ts">
  import {Button} from "$lib/components/ui/button";
  import Versions from "./components/Versions.svelte";


  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
</script>



<div class="p-16 flex justify-center gap-8" >
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions a11y-missing-attribute-->
<!--  <a target="_blank" rel="noreferrer" on:click={ipcHandle}>Send IPC</a>-->

  <Button variant="default" onmousedown={ipcHandle} class="justify-center">Send IPC</Button>

</div>


<Versions/>
