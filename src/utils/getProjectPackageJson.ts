import {existsSync, readFileSync} from 'fs';
import {Node} from 'webpack';

/**
 * Returns the package json for the extending project.
 */
export function getProjectPackageJson() {
    // Check that the file exists locally
    if (!existsSync('./package.json')) {
        throw new Error(`Package.json file not found in project root.  Please check ./package.json exists.`);
    }

    return JSON.parse(readFileSync('./package.json', 'utf8'));
}