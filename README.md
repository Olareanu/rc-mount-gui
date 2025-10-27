# rc-mount-gui

A simple GUI / Tray app for monitoring and mounting RClone remotes through a virtual file system (VFS)

# Prerequisites

- **RClone must be installed** and configured with at least one remote
  - Follow installation instructions from [rclone.org](https://rclone.org)
  - Add RClone to your system PATH, as the app calls "rclone"
  - Configure your remotes using `rclone config` before using this app

# Installation

Currently, no releases are available. You can build the application from source:

1. Clone the repository
2. Install dependencies: `pnpm install` (or `npm install`)
3. Build the app: `pnpm run build:win` (or `build:mac`, `build:linux`)
4. The executable will be in `dist/win-unpacked/rc-mount-gui.exe` (Windows) or equivalent for other platforms
5. Optionally create a start menu shortcut manually

The app is portable and doesn't require other installation - just run the executable.

# Usage

**System Tray:**
- **Right-click** the tray icon to access the menu:
  - **Connect**: Starts the RClone mount process
  - **Disconnect**: Safely unmounts and stops RClone
  - **Quit**: Disconnects and exits the application
- **Left-click** the tray icon to show/hide the main window
- The tray icon changes to indicate connection status:
  - Cloud with X: Disconnected
  - Cloud with checkmark: Connected
  - Cloud with arrows: Syncing/uploading
  - Cloud with lightning: Error state

**Main Window:**
- Displays real-time VFS and transfer statistics
- Provides buttons to open the config and log folders
- Automatically updates stats when visible

# Configuration

**Important:** RClone must be configured with remotes before using this app. Run `rclone config` to set up your cloud storage remotes first.

When starting rc-mount-gui for the first time, a configuration file is created in the app's appdata folder.
You can open this folder through the button provided in the app GUI.

### Configuration Settings

The `config.json` file supports the following settings:

- **`command`** (string): The command to execute RClone. Defaults to `"rclone"`.

- **`args`** (array of strings): The arguments passed to the RClone command. This includes the mount command, remote
  name, mount point, and all RClone flags. Example:
  ```json
  [
    "mount",
    "Your_Remote:",
    "X:",
    "--vfs-cache-mode", "full",
    "--vfs-cache-max-size", "16G",
    "--rc",
    "-v"
  ]
  ```
  Customize these arguments according to your RClone remote configuration and desired mount options. Read the RClone documentation for more information on avalable arguments.

  **Note:** The `--rc` flag is **required** for the app to communicate with RClone. The `-v` flag enables verbose logging - RClone output is written to the app's log file, so this flag controls the verbosity of RClone logs for troubleshooting.

- **`startRcloneOnAppStart`** (boolean): When set to `true`, automatically starts the RClone mount process when the
  application launches. When `false`, you must manually connect using the tray menu. Defaults to `false`.

- **`addToStartupApps`** (boolean): When set to `true`, adds rc-mount-gui to your system's startup applications so it
  launches automatically when you log in. When `false`, removes it from startup. Defaults to `false`.

# Logs

The app logs to a file located in the app's appdata folder, which you can open through the button in the GUI.

**Note:** RClone logs are also written to this log file. The verbosity of RClone logs depends on the `-v` flag in your config (use `-vv` for more detailed logs, or omit for minimal logging).

# Uninstallation

1. Remove the ec-mount-gui app from the startup apps before uninstalling (set `addToStartupApps` to `false` and restart the app)
2. Delete the executable from the `dist` folder (or wherever you placed it)
3. Delete any start menu shortcuts you created
4. Optionally, delete the appdata folder (`%APPDATA%\rc-mount-gui` on Windows) to remove configuration and log files

# Notes

**Don't force-quit** the app while syncing (when the tray shows the sync icon) to avoid potential data loss or corruption.

**Configuration changes** require restarting the app to take effect.

**The `--rc` flag** must be present in your RClone args for the app to function - it enables RClone's remote control API.
