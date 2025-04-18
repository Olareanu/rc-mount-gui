import {exec} from 'child_process';
import {promisify} from 'util'
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

export async function getRcloneVfsStats(): Promise<void> {
  const execAsync = promisify(exec); // Promisify it

  try {
    const {stdout, stderr} = await execAsync('rclone rc vfs/stats')

    if (stderr) {
      console.error('RC_GUI:', getLogDateTime(), 'ERROR : RClone rc vfs/stats command returned STDERR: ', stderr.trim());
    }
    if (stdout) {
      try {
        // Parse the JSON output from rclone
        const stats = JSON.parse(stdout);
        console.log('RC_GUI:', getLogDateTime(), 'INFO  : Rclone VFS Statistics:');
        console.log(JSON.stringify(stats, null, 2)); // Pretty print the JSON
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error('RC_GUI:', getLogDateTime(), 'ERROR : Failed to parse rclone rc vfs/stats output as JSON:');
          console.error(error.message);
          console.log('Raw output:');
          console.log(stdout);
          return;
        } else {
          console.error('RC_GUI:', getLogDateTime(), 'ERROR : Failed to parse rclone rc vfs/stats output as JSON:', error);
        }
      }
    }

  } catch (error) {
    // Should never happen
    console.error('RC_GUI:', getLogDateTime(), 'ERROR : rc vfs/stats command failed with error: ', error);
    return;
  }


}
