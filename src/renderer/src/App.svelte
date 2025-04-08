<script lang="ts">
  import {Button} from "$lib/components/ui/button";
  import Versions from "./components/Versions.svelte";


  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
</script>



<div class="p-16 flex justify-center gap-8" >

  <Button variant="default" onmousedown={ipcHandle} class="justify-center">Send IPC</Button>

</div>


<Versions/>
