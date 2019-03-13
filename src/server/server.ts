import * as express from 'express';
import {connect, launch} from 'hadouken-js-adapter';
import {platform} from 'os';

import {CLIArguments} from '..';
import {getProjectConfig} from '../utils/getProjectConfig';
import {getProviderUrl} from '../utils/getProviderUrl';
import {createAppJsonMiddleware, createCustomManifestMiddleware, createWebpackMiddleware} from '../webpack/middleware';

const {PORT, SERVICE_NAME} = getProjectConfig();
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
    app.use(express.static(process.cwd() + '/res'));

    // Add route for code
    if (args.static) {
        // Run application using pre-built code (use 'npm run build' or 'npm run build:dev')
        app.use(express.static(process.cwd() + '/dist'));
    } else {
        // Run application using webpack-dev-middleware. Will build app before launching, and watch for any source file changes
        app.use(await createWebpackMiddleware(args.mode, args.writeToDisk));
    }

    return app;
}

export async function startServer(args: CLIArguments) {
    const app = await createServer(args);

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

            console.log('Launching application');
            connect({uuid: 'wrapper', manifestUrl: `http://localhost:${PORT}/${manifestPath}`}).then(async fin => {
                const service = fin.Application.wrapSync({uuid: `${SERVICE_NAME}`, name: `${SERVICE_NAME}`});

                // Terminate local server when the demo app closes
                service
                    .addListener(
                        'closed',
                        async () => {
                            process.exit(0);
                        })
                    .catch(console.error);
            }, console.error);
        } else {
            console.log('Local server running');
        }
    });
}