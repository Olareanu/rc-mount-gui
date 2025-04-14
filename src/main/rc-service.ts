import {exec} from 'child_process';

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

export function getRcloneVfsStats(): Promise<void> {
  return new Promise((resolve, reject) => {
    exec('rclone rc vfs/list', (error, stdout, stderr) => {
      if (error) {
        console.error('RC_GUI: ', getLogDateTime(), ' ERROR : rc info retrieval command failed with code: ', error.code);
        // Error message not usually shown, because RClone already writes the error to STDERR, so no need to log again.

        // console.error(`Error message: ${error.message}`);

        // if (stderr) {
        //   console.error('Command stderr output:');
        //   console.error(stderr.trim());
        // }

        reject(error);
        return;
      }

      try {
        // Parse the JSON output from rclone
        const stats = JSON.parse(stdout);
        console.log('RC_GUI: ', getLogDateTime(), ' INFO  : Rclone VFS Statistics:');
        console.log(JSON.stringify(stats, null, 2)); // Pretty print the JSON
      } catch (parseError) {
        console.error('RC_GUI: ', getLogDateTime(), ' ERROR : Failed to parse rclone output as JSON:');
        console.error(parseError);
        console.log('Raw output:');
        console.log(stdout);
        reject(parseError);
        return;
      }

      resolve();
    });
  });
}
