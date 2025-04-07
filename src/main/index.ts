import {app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage} from 'electron'
import {join} from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Objects for Tray Icon and Main Windows
let tray: Tray
let mainWindow: BrowserWindow


function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? {icon} : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })


  // Prevent window from closing (just hide it)
  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  const disconnected_icon = nativeImage.createFromPath('src/main/assets/cloud-disabled.png')
  // const sync_icon = nativeImage.createFromPath('src/main/assets/cloud-back-up.png')
  // const completed_icon = nativeImage.createFromPath('src/main/assets/cloud-check.png')
  // const error_icon = nativeImage.createFromPath('src/main/assets/thunderstorm-risk.png')

  // Make the tray and initialise with icon corresponding to disconnected state
  tray = new Tray(disconnected_icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      id: 'connect', label: 'Connect', type: 'normal', click: () => {
        console.log('Connect')
      }
    },
    {
      id: 'disconnect', label: 'Disconnect', type: 'normal', click: () => {
        console.log('Disconnect')
      }
    },
    {
      id: 'quit', label: 'Quit', type: 'normal', click: () => {
        mainWindow.removeAllListeners('close') // Allow the window to actually close
        app.quit()
      }
    }
  ])

  tray.setToolTip('RClone Mount GUI')
  tray.setContextMenu(contextMenu)


  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })


})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mainWindow.removeAllListeners('close') // Allow the window to actually close
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
