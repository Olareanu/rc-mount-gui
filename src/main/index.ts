import {app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification} from 'electron'
import {join} from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import './rclone-service'
import {startRC} from "./rclone-service";
import {ChildProcessWithoutNullStreams} from "child_process";


// Enum for the state of connection
enum ConnectionState {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Syncing = 'syncing',
  Error = 'error',
}

let state: ConnectionState = ConnectionState.Disconnected;

// Objects for Tray Icon and Main Windows
let tray: Tray;
let mainWindow: BrowserWindow;
let rcloneProcess: ChildProcessWithoutNullStreams | null = null;


const iconConnected = nativeImage.createFromPath('resources/cloud-check.png')
const iconDisconnected = nativeImage.createFromPath('resources/cloud-disabled.png')
// const iconSync = nativeImage.createFromPath('resources/cloud-back-up.png')
const iconError = nativeImage.createFromPath('resources/thunderstorm-risk.png')

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

  // mainWindow.on('ready-to-show', () => {
  //   mainWindow.show()
  // })

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

function stopRcloneProcess(): void {
  if (rcloneProcess !== null) {
    state = ConnectionState.Disconnected; // only place this should be set to Disconnected

    let terminateSuccessfully = rcloneProcess.kill("SIGINT")
    if (terminateSuccessfully) {
      console.log('RClone process terminated successfully');
      tray.setImage(iconDisconnected);
    } else {
      // Should never happen
      console.log('Could not terminate RClone process properly');
      new Notification({title: 'Could not terminate RClone process properly', body: 'Open app to see logs'}).show();
      state = ConnectionState.Error;
      tray.setImage(iconError);
    }
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

  // Make the tray and initialise with icon corresponding to disconnected state
  tray = new Tray(iconDisconnected)
  tray.setToolTip('Open RClone Mount GUI')

  const contextMenu = Menu.buildFromTemplate([
    {
      id: 'connect', label: 'Connect', type: 'normal', click: () => {
        if (rcloneProcess == null) {
          rcloneProcess = startRC();

          // Handle possible error
          rcloneProcess.on('error', (err) => {
            console.log('RClone process threw an error. Is RClone configured properly?');
            new Notification({title: 'RClone process threw an error', body: 'Open app to see logs'}).show();
            console.log('Error message:');
            console.error(err.message);
            state = ConnectionState.Error;
            tray.setImage(iconError);
            rcloneProcess = null;
          })

          // Handle exit
          rcloneProcess.on('exit', (code: number) => {
            console.log(`RClone exited with code ${code}`);
            rcloneProcess = null;
            // state should be set to Disconnected before RClone process exits, if not, go to error and notify user
            if (state !== ConnectionState.Disconnected) {
              console.log('RClone process exited unexpectedly.');
              new Notification({title: 'RClone process exited unexpectedly', body: 'Open app to see logs'}).show();
              state = ConnectionState.Error;
              tray.setImage(iconError);
            }
          });

          state = ConnectionState.Connected;
          tray.setImage(iconConnected);


        } else {
          new Notification({title: 'RClone process already started', body: 'Open app to see logs'}).show();
        }
      }
    },
    {
      id: 'disconnect', label: 'Disconnect', type: 'normal', click: () => {
        stopRcloneProcess();
      }
    },
    {
      id: 'quit', label: 'Quit', type: 'normal', click: () => {
        stopRcloneProcess();
        mainWindow.removeAllListeners('close'); // Allow the window to actually close
        app.quit();
      }
    }
  ])

  tray.setContextMenu(contextMenu)


  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
      tray.setToolTip('Open RClone Mount GUI')
    } else {
      mainWindow.show()
      mainWindow.focus()
      tray.setToolTip('Hide RClone Mount GUI')
    }
  })


})

