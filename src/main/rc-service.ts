import {exec} from 'child_process';
import {promisify} from 'util'
import {ipcMain} from "electron";
// import {Notification} from "electron";


// Simple function to mimic RClone's time format for logging
export function getLogDateTime(): string {
  const now = new Date();

  // Get date components
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(now.getDate()).padStart(2, '0');

  // Get time components
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Format the string as YYYY/MM/DD HH:MM:SS
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

export function registerRcServiceHandlers(): void {
  // Register the handlers for thr rc-service

  ipcMain.handle('get-vfs-stats-channel', async (): Promise<any> => {
    // console.log('Main process received getVfsStats request on channel "get-vfs-stats-channel"');

    const execAsync = promisify(exec); // Promisify it
    try {
      const {stdout, stderr} = await execAsync('rclone rc vfs/stats')

      if (stderr) {
        console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone rc vfs/stats command returned STDERR: ', stderr.trim());
      }

      if (!stdout) {
        console.error('RC_GUI:', getLogDateTime(), 'ERROR : Rclone rc vfs/stats command returned empty STDOUT.');
        throw new Error('Rclone rc vfs/stats command returned empty STDOUT.');
      }

      const stats = JSON.parse(stdout);

      // console.log('RC_GUI:', getLogDateTime(), 'INFO  : Rclone VFS Statistics:');
      // console.log(JSON.stringify(stats, null, 2)); // Pretty print the JSON

      return stats;

    } catch (error) {
      if (error instanceof SyntaxError) {
        // This will catch errors from the JSON Parsing
        console.error('RC_GUI:', getLogDateTime(), 'ERROR : Failed to parse rclone rc vfs/stats output as JSON:', error.message);
        throw new Error('Failed to parse rclone rc vfs/stats output as JSON: ' + error.message);
      } else if (error instanceof Error) {
        // This will catch errors from execAsync etc.
        console.error('RC_GUI:', getLogDateTime(), 'ERROR : Rclone rc vfs/stats command failed:', error.message);
      } else {
        // Catch anything else unexpected
        console.error('RC_GUI:', getLogDateTime(), 'ERROR : Rclone rc vfs/stats command failed due to unknown error:', error);
      }
      throw error;

    }

  });
}

