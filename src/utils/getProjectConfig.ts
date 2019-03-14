import {existsSync, readFileSync} from 'fs';


/**
 * Shape of the configuration file which is implemented in an extending project.
 */
interface ConfigFile {
    SERVICE_NAME: string;
    PORT: number;
    CDN_LOCATION: string;
}

/**
 * Given name for the projects local configuration file needed for our operations.
 */
const CONFIG_FILE_PATH = './config.json';

let config: ConfigFile|null = null;

/**
 * Returns the config json for the extending project.
 */
export function getProjectConfig(): ConfigFile {
    if (config) {
        return config;
    }

    // Check that the file exists locally
    if (!existsSync(CONFIG_FILE_PATH)) {
        throw new Error(`Config file not found in project root.  Please check ${CONFIG_FILE_PATH} exists.`);
    }

    return config = JSON.parse(readFileSync(CONFIG_FILE_PATH, 'utf8'));
}