import { exec} from 'child_process';
import { promisify } from 'util';


//
// const execAsync = promisify(exec);
//
// export function checkVFS(): void {
//   console.log('Checking VFS...');
//   try {
//     // Run the 'rclone rc vfs/stats' command
//     const {stdout, stderr} = await execAsync('rclone rc vfs/stats');
//
//     // Handle any errors from stderr
//     if (stderr) {
//       console.error('stderr:', stderr);
//     }
//
//     // Parse the JSON output from stdout
//     const result = JSON.parse(stdout);
//
//     // Log the result or handle it as needed
//     console.log('rclone VFS Stats:', result);
//
//     return result; // You can use the result as needed
//   } catch (err) {
//     console.error('Failed to execute rclone rc vfs/stats:', err);
//     throw err; // Rethrow or handle error as needed
//   }
// }


