import {existsSync, readFileSync} from 'fs';

// tslint:disable-next-line: no-any - Its the package.json.  We have no type for that!
let packageJson: any = null;

/**
 * Returns the package json for the extending project.
 */
export function getProjectPackageJson() {
    if (packageJson) {
        return packageJson;
    }
    // Check that the file exists locally
    if (!existsSync('./package.json')) {
        throw new Error('Package.json file not found in project root.  Please check ./package.json exists.');
    }

    packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    return packageJson;
}
