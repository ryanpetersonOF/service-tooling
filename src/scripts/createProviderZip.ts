import * as archiver from 'archiver';
import {createWriteStream} from 'fs';
import {resolve} from 'path';

import {getProjectConfig} from '../utils/getProjectConfig';
import {getRootDirectory} from '../utils/getRootDirectory';

export function createZipProvider() {
    const {SERVICE_NAME} = getProjectConfig();
    const output = createWriteStream(resolve(getRootDirectory(), 'dist', 'provider', `${SERVICE_NAME}-service.zip`));
    const archive = archiver('zip', {zlib: {level: 9}});

    output.on('close', () => {
        console.log(`Zip file created at '${output.path}'`);
        console.log(`${archive.pointer()} total bytes written`);
    });

    archive.pipe(output);

    // Include all provider res files except app.json (which is also in dist)
    archive.glob('**/!(app.json)', {cwd: resolve(getRootDirectory(), 'res', 'provider')});
    // Include all provider dist files except the zip itself
    archive.glob('**/*.!(zip)', {cwd: resolve(getRootDirectory(), 'dist', 'provider')});

    archive.finalize();
}
