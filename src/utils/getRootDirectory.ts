
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

    rootDirectory = process.cwd();
    return rootDirectory;
}
