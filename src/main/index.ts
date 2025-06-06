import {app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, shell, Tray} from 'electron'
import path, {join} from 'path'
import {electronApp, is, optimizer} from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {getLogDateTime, getRcloneVfsStats, registerRcServiceHandlers} from "./rc-service";
import {ChildProcessWithoutNullStreams, exec, spawn} from "child_process";
import {promisify} from 'util'
import log from 'electron-log/main';
import type {AppConfig} from './config';
import {enforceConfigFileExists, loadConfig} from './config';

// Start logging
log.initialize();
Object.assign(console, log.functions); //  Make console.log, console.error, etc. use electron-log

// Enum for the state of connection
enum ConnectionState {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Syncing = 'syncing',
  Error = 'error',
}

let rcloneProcess: ChildProcessWithoutNullStreams | null = null;
let state: ConnectionState = ConnectionState.Disconnected;
let vfsStatusPollingId: NodeJS.Timeout | null = null;

// Objects for Tray Icon and Main Windows
let tray: Tray;
let mainWindow: BrowserWindow;

let appConfig: AppConfig | null = null;

const iconConnected = nativeImage.createFromPath(path.join(app.isPackaged ? process.resourcesPath : 'resources', 'cloud-check.png'))
const iconDisconnected = nativeImage.createFromPath(path.join(app.isPackaged ? process.resourcesPath : 'resources', 'cloud-disabled.png'))
const iconSync = nativeImage.createFromPath(path.join(app.isPackaged ? process.resourcesPath : 'resources', 'cloud-back-up.png'))
const iconError = nativeImage.createFromPath(path.join(app.isPackaged ? process.resourcesPath : 'resources', 'thunderstorm-risk.png'))

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

function startRcloneProcess(config: AppConfig): ChildProcessWithoutNullStreams {

  // const command = 'rclone';
  // const args = [
  //   'mount',
  //   'Hetzner_Box_Encrypted:',
  //   'X:',
  //   '--vfs-cache-mode', 'full',
  //   '--vfs-cache-max-size', '2G',
  //   '--vfs-refresh',
  //   '--dir-cache-time', '1m',
  //   '--buffer-size', '256M',
  //   '--attr-timeout', '30s',
  //   '--transfers', '9',
  //   '--rc',
  //   '-v'
  // ];

  const child = spawn(config.command, config.args, {shell: false});

  // Handle stdout
  child.stdout.on('data', (data: Buffer) => {
    const output = data.toString();
    console.log('STDOUT:', output);
    // You can process or store the output here
  });

  // Handle stderr
  child.stderr.on('data', (data: Buffer) => {
    const errorOutput = data.toString();
    console.error('STDERR:', errorOutput);
  });


  // Handle possible error
  child.on('error', (err) => {
    console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone process error. Is RClone configured properly? Error Message: ', err.message);
    new Notification({title: 'RClone process threw an error', body: 'Open app to see logs'}).show();
    state = ConnectionState.Error;
    tray.setImage(iconError);
    rcloneProcess = null;
  })

  // Handle exit
  child.on('exit', (code: number) => {
    console.log('RC_GUI:', getLogDateTime(), 'INFO  : RClone exited with code', code);

    // Stop the vfs status polling, if it was still running
    if (vfsStatusPollingId) {
      clearInterval(vfsStatusPollingId);
      vfsStatusPollingId = null;
      // console.log('Stopped periodic task');
    }

    // state should be set to Disconnected before RClone process exits, if not, go to error and notify user
    if (state !== ConnectionState.Disconnected) {
      console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone process exited unexpectedly.');
      new Notification({title: 'RClone process exited unexpectedly', body: 'Open app to see logs'}).show();
      state = ConnectionState.Error;
      tray.setImage(iconError);
    }

    rcloneProcess = null;

  });

  // Start the vfs status polling
  if (!vfsStatusPollingId) {
    vfsStatusPollingId = setInterval(updateSyncStatus, 1000);
    // console.log('Started periodic task');
  }

  return child
}

async function stopRcloneProcess(): Promise<void> {
  // Creating an async version of exec
  const execAsync = promisify(exec); // Promisify it

  if (rcloneProcess !== null) {
    // Stop the vfs status polling
    // Need to clear the interval before setting the state to disconnected
    if (vfsStatusPollingId) {
      clearInterval(vfsStatusPollingId);
      vfsStatusPollingId = null;
      // console.log('Stopped periodic task');
    }

    state = ConnectionState.Disconnected; // only place this should be set to Disconnected
    tray.setImage(iconDisconnected);

    try {
      const {stdout, stderr} = await execAsync('rclone rc core/quit')
      if (stderr) {
        console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone rc core/quit command returned STDERR: ', stderr.trim());
      }
      if (stdout) {
        console.log('RC_GUI:', getLogDateTime(), 'INFO  : RClone rc core/quit command returned STDOUT: ', stdout.trim());
      }
    } catch (error) {
      // Should never happen
      console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone rc core/quit command filed. Message: ', error);
      new Notification({title: 'RClone rc core/quit command filed', body: 'Open app to see logs'}).show();
      state = ConnectionState.Error;
      tray.setImage(iconError);
      // do net set rcloneProcess to null, as to not be able to start ot again
      return;
    }
  }
}

async function updateSyncStatus() {

  try {
    let info = await getRcloneVfsStats();

    if (info.diskCache?.uploadsInProgress !== undefined && info.diskCache?.uploadsInProgress !== 0) {
      state = ConnectionState.Syncing;
      tray.setImage(iconSync);
    }
    if (info.diskCache?.uploadsInProgress !== undefined && info.diskCache?.uploadsInProgress == 0) {
      state = ConnectionState.Connected;
      tray.setImage(iconConnected);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Error was caught in getRcloneVfsInfo and logged
    } else {
      console.error('RC_GUI:', getLogDateTime(), 'ERROR : Could not update Sync Status: ', error);
    }
  }
  // See when an update was made
  // console.log('VFS Status update made at', new Date().toISOString());
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

  // Register IPC Handlers for rc-service
  registerRcServiceHandlers();

  // Register IPC Handler for opening the config and log location
  ipcMain.handle('open-config-folder-channel', (): void => {
    shell.openPath(app.getPath('userData')).then(() => {
      console.log('RC_GUI:', getLogDateTime(), 'INFO  : Opened config folder at', app.getPath('userData'));
    });
  });

  ipcMain.handle('open-log-folder-channel', (): void => {
    shell.openPath(path.dirname(log.transports.file.getFile().path)).then(() => {
      console.log('RC_GUI:', getLogDateTime(), 'INFO  : Opened log folder at', app.getPath('userData'));
    });
  });

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
        try {
          appConfig = loadConfig();
        } catch (error) {
          new Notification({title: 'Could not read config', body: 'Open app to see logs'}).show();
          appConfig = null;
        }


        if (rcloneProcess == null && appConfig != null) {
          rcloneProcess = startRcloneProcess(appConfig);

          state = ConnectionState.Connected;
          tray.setImage(iconConnected);

        } else if (rcloneProcess != null && appConfig != null) {
          new Notification({title: 'RClone process already started', body: 'Open app to see logs'}).show();
        }
      }
    },
    {
      id: 'disconnect', label: 'Disconnect', type: 'normal', click: () => {
        stopRcloneProcess().catch((err) => {
          console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone closing process failed: ', err.message);
        })
      }
    },
    {
      id: 'quit', label: 'Quit', type: 'normal', click: async () => {
        await stopRcloneProcess().catch((err) => {
          console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone closing process failed: ', err.message);
        })
        while (rcloneProcess !== null) {
          await new Promise(r => setTimeout(r, 100));
        }
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

  try {
    if (enforceConfigFileExists()) {
      appConfig = loadConfig();
    } else {
      new Notification({
        title: 'rc-mount-gui needs configuration',
        body: 'Edit the config file in the userData folder of your system'
      }).show();
    }

  } catch (error) {
    new Notification({title: 'Could not read config', body: 'Open app to see logs'}).show();
    appConfig = null;
  }

  if(appConfig != null){

    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: [],
      enabled: appConfig.autoStartOnLogin
    });

    if (rcloneProcess == null && appConfig.startRcloneOnAppStart) {
      rcloneProcess = startRcloneProcess(appConfig);

      state = ConnectionState.Connected;
      tray.setImage(iconConnected);
    }
  }


})



