import * as express from 'express';
import {connect, launch} from 'hadouken-js-adapter';
import * as fetch from 'node-fetch';
import {platform} from 'os';

import {CLIArguments} from '../types';
import {getProjectConfig} from '../utils/getProjectConfig';
import {getProviderUrl} from '../utils/getProviderUrl';
import {getRootDirectory} from '../utils/getRootDirectory';
import {createAppJsonMiddleware, createCustomManifestMiddleware, createWebpackMiddleware} from '../webpack/middleware';

/**
 * Adds the necessary middleware to the express instance
 *
 * - Will serve static resources from the 'res' directory
 * - Will serve application code from the 'src' directory
 *   - Uses webpack middleware to first build the application
 *   - Middleware runs webpack in 'watch' mode; any changes to source files will trigger a partial re-build
 * - Any 'app.json' files within 'res' are pre-processed
 *   - Will explicitly set the provider URL for the service
 */
async function createServer(args: CLIArguments) {
    const app = express();

    // Add special route for any 'app.json' files - will re-write the contents according to the command-line arguments of this server
    app.use(/\/?(.*app\.json)/, createAppJsonMiddleware(args.providerVersion));

    // Add endpoint for creating new application manifests from scratch - used within demo app for lauching 'custom' applications
    app.use('/manifest', createCustomManifestMiddleware());

    // Add route for serving static resources
    app.use(express.static(getRootDirectory() + '/res'));

    // Add route for code
    if (args.static) {
        // Run application using pre-built code (use 'npm run build' or 'npm run build:dev')
        app.use(express.static(getRootDirectory() + '/dist'));
    } else {
        // Run application using webpack-dev-middleware. Will build app before launching, and watch for any source file changes
        app.use(await createWebpackMiddleware(args.mode, args.writeToDisk));
    }

    return app;
}

export async function startServer(args: CLIArguments) {
    const app = await createServer(args);
    const {PORT} = getProjectConfig();

    console.log('Starting application server...');
    app.listen(PORT, async () => {
        // Manually start service on Mac OS (no RVM support)
        if (platform() === 'darwin') {
            console.log('Starting Provider for Mac OS');

            // Launch latest stable version of the service
            await launch({manifestUrl: getProviderUrl(args.providerVersion)}).catch(console.log);
        }

        // Launch application, if requested to do so
        if (args.launchApp) {
            const manifestPath = 'demo/app.json';
            const manifestUrl = `http://localhost:${PORT}/${manifestPath}`;

            const fetchRequest = await fetch.default(getProviderUrl(args.providerVersion)).catch((err: string) => {
                throw new Error(err);
            });

            if (fetchRequest.status === 200) {
                const providerManifestContent = await fetchRequest.json();
                console.log('Launching application');

                connect({uuid: 'wrapper', manifestUrl}).then(async fin => {
                    const service =
                        fin.Application.wrapSync({uuid: `${providerManifestContent.startup_app.uuid}`, name: `${providerManifestContent.startup_app.name}`});

                    // Terminate local server when the provider closes
                    service
                        .addListener(
                            'closed',
                            async () => {
                                process.exit(0);
                            })
                        .catch(console.error);
                }, console.error);
            } else {
                throw new Error(`Invalid response from server:  Status code: ${fetchRequest.status}`);
            }
        } else {
            console.log('Local server running');
        }
    });
}