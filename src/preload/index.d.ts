import {ElectronAPI} from '@electron-toolkit/preload'
import {ipcRenderer} from "electron";

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getVfsStats(): Promise<any>; // You can replace `any` with a better type if you have one
      getCoreStats(): Promise<any>;
      getRcloneRunning(): Promise<boolean>;
      openConfigFolder(): Promise<any>;
      openLogFolder(): Promise<any>;
    };
  }
}
