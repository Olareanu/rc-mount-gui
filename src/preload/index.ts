import {contextBridge, ipcRenderer} from 'electron';
import {electronAPI} from '@electron-toolkit/preload'

// // Custom APIs for renderer
// const api = {
//   getVfsStats: () => ipcRenderer.invoke('get-vfs-stats-channel'),
// };


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      getVfsStats: (): Promise<any> => ipcRenderer.invoke('get-vfs-stats-channel')
    });
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

// // Declare the exposed custom API on the Window interface for TypeScript in the renderer
// // This makes `window.api` type-safe in your renderer code
// declare global {
//   interface Window {
//     electron: typeof electronAPI; // Assuming you expose electronAPI
//     api: typeof api; // <-- Add/Update this line to use your CustomApi interface
//   }
// }
