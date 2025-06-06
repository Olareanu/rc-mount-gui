import {contextBridge, ipcRenderer} from 'electron';
import {electronAPI} from '@electron-toolkit/preload'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', {
      getVfsStats: (): Promise<any> => ipcRenderer.invoke('get-vfs-stats-channel'),
      getCoreStats: (): Promise<any> => ipcRenderer.invoke('get-core-stats-channel'),
      getRcloneRunning: (): Promise<boolean> => ipcRenderer.invoke('get-rclone-running-channel'),
      openConfigFolder: (): Promise<any> => ipcRenderer.invoke('open-config-folder-channel'),
      openLogFolder: (): Promise<any> => ipcRenderer.invoke('open-log-folder-channel')


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
