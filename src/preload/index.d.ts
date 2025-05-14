import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getVfsStats(): Promise<any>; // You can replace `any` with a better type if you have one
    };
  }
}
