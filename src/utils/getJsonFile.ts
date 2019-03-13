import * as fs from 'fs';
import * as path from 'path';

/**
 * Returns the contents of the provided JSON file.
 */
export function getJsonFile<T>(filePath: string): Promise<T> {
    // Check that the file exists locally
    if (!fs.existsSync(filePath)) {
        throw new Error(`${filePath} file not found in project root.  Please check ${filePath} exists.`);
    }

    // Check it is a .json file
    if (!path.extname(filePath).length || path.extname(filePath) !== '.json') {
        throw new Error(`${filePath} is not a .json file`);
    }

    return new Promise((resolve, reject) => {
        fs.readFile(path.normalize(filePath), 'utf8', (error, data) => {
            if (error) {
                reject(error);
            } else {
                try {
                    const config = JSON.parse(data);

                    if (config) {
                        resolve(config);
                    } else {
                        throw new Error(`No data found in ${filePath}`);
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}
