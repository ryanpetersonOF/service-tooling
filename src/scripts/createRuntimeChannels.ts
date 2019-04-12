import {writeFileSync} from 'fs';
import {resolve} from 'path';

import {getRootDirectory} from '../utils/getRootDirectory';

const RUNTIME_CHANNELS = ['stable', 'alpha', 'beta', 'canary'];

/**
 * Creates copies of the provider's app.json file, that each point at a different runtime release channel.
 */
export function createRuntimeChannels() {
    const rootDir = getRootDirectory();
    const manifest = require(resolve(rootDir, 'res/provider/app.json'));

    RUNTIME_CHANNELS.forEach(channel => {
        manifest.runtime.version = channel;

        const output = JSON.stringify(manifest, null, 4);
        writeFileSync(resolve(rootDir, `dist/provider/app.runtime-${channel}.json`), output, {encoding: 'utf8'});
    });
}
