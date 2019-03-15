import {normalize} from 'path';

/**
 * Cached root directory
 */
let rootDirectory: string|null = null;

/**
 * Returns the extending projects root directory (cwd)
 */
export function getRootDirectory() {
    if (rootDirectory) {
        return rootDirectory;
    }

    return rootDirectory = process.cwd();
}