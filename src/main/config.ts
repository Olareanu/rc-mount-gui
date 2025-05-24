import {app} from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {getLogDateTime} from "./rc-service";


export type AppConfig = {
  command: string,
  args: string[],
  autoStart: boolean,
};

export function enforceConfigFileExists(): boolean {
  const configPath = path.join(app.getPath('userData'), 'config.json');

  // Create a config file if it does not exist, do nothing if it does
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), {recursive: true});

    const dummyConfig: AppConfig = {
      command: "rclone",
      args: [
        "mount",
        "Your_Remote:",
        "X:",
        "--vfs-cache-mode", "full",
        "--vfs-cache-max-size", "16G",
        "--dir-cache-time", "1m",
        "--buffer-size", "128M",
        "--attr-timeout", "30s",
        "--transfers", "4",
        "--rc",
        "-v"
      ],
      autoStart: false
    };

    fs.writeFileSync(configPath, JSON.stringify(dummyConfig, null, 2), 'utf-8');
    console.log('RC_GUI:', getLogDateTime(), 'INFO  : Dummy config file created at ', configPath);
    return false;
  } else {
    return true;
  }
}

export function loadConfig(): AppConfig {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');

    const content = fs.readFileSync(configPath, 'utf-8');
    let config: AppConfig;

    config = JSON.parse(content);
    return config;

  } catch (error) {
    if (error instanceof SyntaxError) {
      // This will catch errors from the JSON Parsing
      console.error('RC_GUI:', getLogDateTime(), 'ERROR : Failed to parse config file as JSON:', error.message);
      throw new Error('Failed to parse config file output as JSON: ' + error.message);
    } else if (error instanceof Error) {
      // This will catch errors from execAsync etc.
      console.error('RC_GUI:', getLogDateTime(), 'ERROR : reading config file failed:', error.message);
    } else {
      // Catch anything else unexpected
      console.error('RC_GUI:', getLogDateTime(), 'ERROR : reading config file failed due to unknown error:', error);
    }

    throw error;

  }
}
