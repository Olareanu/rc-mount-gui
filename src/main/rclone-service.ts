import {spawn} from 'child_process';
import {ChildProcessWithoutNullStreams} from "node:child_process";

export function startRC(): ChildProcessWithoutNullStreams {
  const command = 'rclone';
  const args = [
    'mount',
    'Hetzner_Box_Encrypted:',
    'X:',
    '--vfs-cache-mode', 'full',
    '--vfs-cache-max-size', '2G',
    '--vfs-refresh',
    '--dir-cache-time', '2m',
    '--buffer-size', '256M',
    '--attr-timeout', '30s',
    '--transfers', '9',
    '-v',
    '--rc'
  ];

  const child = spawn(command, args, {shell: false});

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

// Handle exit
  child.on('close', (code: number) => {
    console.log(`Process exited with code ${code}`);
  });

  return child;
}

