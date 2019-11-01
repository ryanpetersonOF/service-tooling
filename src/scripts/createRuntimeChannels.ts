import {writeFileSync, existsSync} from 'fs';
import {resolve} from 'path';

import {getRootDirectory} from '../utils/getRootDirectory';

const RUNTIME_CHANNELS = ['stable', 'alpha', 'beta', 'canary'];

/**
 * Creates copies of the provider's app.json file, that each point at a different runtime release channel.
 */
export function createRuntimeChannels(): void {
    // eslint-disable-next-line
    const manifest = require(getProviderManifestPath());

    RUNTIME_CHANNELS.forEach((channel) => {
        manifest.runtime.version = channel;

        const rootDir = getRootDirectory();
        const output = JSON.stringify(manifest, null, 4);
        writeFileSync(resolve(rootDir, `dist/provider/app.runtime-${channel}.json`), output, {encoding: 'utf8'});
    });
}

function getProviderManifestPath(): string {
    const rootDir = getRootDirectory();
    const distPath = resolve(rootDir, 'dist/provider/app.json');
    const resPath = resolve(rootDir, 'res/provider/app.json');

    if (existsSync(distPath)) {
        return distPath;
    } else {
        return resPath;
    }
}
