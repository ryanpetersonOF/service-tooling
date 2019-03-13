import {NextFunction, Request, RequestHandler, Response} from 'express-serve-static-core';
import * as path from 'path';
import * as webpack from 'webpack';
import * as webpackDevMiddleware from 'webpack-dev-middleware';

import {getJsonFile} from '../utils/getJsonFile';
import {getProjectConfig} from '../utils/getProjectConfig';
import {getProviderUrl} from '../utils/getProviderUrl';

const {PORT, SERVICE_NAME, CDN_LOCATION} = getProjectConfig();

/**
 * Quick implementation on the app.json, for the pieces we use.
 */
type ManifestFile = {
    startup_app: {url: string, uuid: string, name: string},
    runtime: {arguments: string, version: string}
    services?: serviceDeclaration[]
};

type serviceDeclaration = {
    name: string,
    manifestUrl?: string,
    config?: {}
};



/**
 * Creates express-compatible middleware function to serve webpack modules.
 *
 * Wrapper will immediately terminate the server if the initial build fails.
 *
 * This is a wrapper around the webpack-dev-middleware utility.
 */
export async function createWebpackMiddleware(mode: 'development'|'production'|'none', writeToDisk: boolean): Promise<RequestHandler> {
    return new Promise<RequestHandler>((resolve) => {
        // Load config and set development mode
        const config: webpack.Configuration[] = require(process.cwd() + '/webpack.config.js');

        config.forEach((entry: webpack.Configuration) => entry.mode = (entry.mode || mode));

        // Create express middleware
        const compiler = webpack(config);
        const middleware = webpackDevMiddleware(compiler, {publicPath: '/', writeToDisk});

        // Wait until initial build has finished before starting application
        const startTime = Date.now();
        middleware.waitUntilValid((result) => {
            // result is actually {stats: webpack.Stats[]}, but the type reports it as only webpack.Stats;
            const results = result as unknown as {stats: webpack.Stats[]};

            // Output build times
            const buildTimes = results.stats.map(stat => {
                const component = path.relative(process.cwd() + '/dist', stat.compilation.outputOptions.path);
                return `${component}: ${(stat.endTime!.valueOf() - stat.startTime!.valueOf()) / 1000}s`;
            });
            console.log(`\nInitial build complete after ${(Date.now() - startTime) / 1000} seconds\n    ${buildTimes.join('\n    ')}\n`);

            // Check build status
            if (results.stats.find(stats => stats.compilation.errors.length > 0)) {
                console.error('Build failed. See output above.');
                process.exit(1);
            } else {
                resolve(middleware);
            }
        });
    });
}

/**
 * Creates express-compatible middleware function that will add/replace any URL's found within app.json files according
 * to the command-line options of this utility.
 */
export function createAppJsonMiddleware(providerVersion: string): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        const configPath = req.params[0];            // app.json path, relative to 'res' dir
        const component = configPath.split('/')[0];  // client, provider or demo

        // Parse app.json
        const config: ManifestFile|void = await getJsonFile<ManifestFile>(path.resolve('res', configPath)).catch(next);

        if (!config) {
            return;
        }

        const serviceDefinition = (config.services || []).find(service => service.name === SERVICE_NAME);
        const startupUrl = config.startup_app.url;

        // Edit manifest
        if (startupUrl) {
            // Replace startup app with HTML served locally
            config.startup_app.url = startupUrl.replace(CDN_LOCATION, `http://localhost:${PORT}/${component}`);
        }
        if (serviceDefinition) {
            // Replace provider manifest URL with the requested version
            serviceDefinition.manifestUrl = getProviderUrl(providerVersion, serviceDefinition.manifestUrl);
        }

        // Return modified JSON to client
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify(config, null, 4));
    };
}



/**
 * Creates express-compatible middleware function to generate custom application manifests.
 *
 * Differs from createAppJsonMiddleware (defined in server.js), as this spawns custom demo windows, rather than
 * re-writing existing demo/provider manifests.
 */
export function createCustomManifestMiddleware(): RequestHandler {
    return async (req, res, next) => {
        const defaultConfig = await getJsonFile<ManifestFile>(path.resolve('./res/demo/app.json')).catch(next);

        if (!defaultConfig) {
            return;
        }
        //@ts-ignore Need help here
        const {uuid, url, frame, defaultCentered, defaultLeft, defaultTop, defaultWidth, defaultHeight, realmName, enableMesh, runtime, useService, provider, config} = {
            // Set default values
            uuid: `demo-app-${Math.random().toString(36).substr(2, 4)}`,
            url: `http://localhost:${PORT}/demo/testbed/index.html`,
            runtime: defaultConfig.runtime.version,
            provider: 'local',
            config: null,

            // Override with query args
            ...req.query,

            // Special handling for any non-string args (both parses query string args, and defines default values)
            frame: req.query.frame !== 'false',
            enableMesh: req.query.enableMesh !== 'false',
            useService: req.query.useService !== 'false',
            defaultCentered: req.query.defaultCentered === 'true',
            defaultLeft: Number.parseInt(req.query.defaultLeft, 10) || 860,
            defaultTop: Number.parseInt(req.query.defaultTop, 10) || 605,
            defaultWidth: Number.parseInt(req.query.defaultWidth, 10) || 860,
            defaultHeight: Number.parseInt(req.query.defaultHeight, 10) || 605
        };

        const manifest = {
            startup_app: {
                uuid,
                name: uuid,
                url,
                frame,
                autoShow: true,
                saveWindowState: false,
                defaultCentered,
                defaultLeft,
                defaultTop,
                defaultWidth,
                defaultHeight
            },
            runtime: {
                arguments: "--v=1" + (realmName ? ` --security-realm=${realmName}${enableMesh ? ' --enable-mesh' : ''}` : ''),
                version: runtime
            }, 
            services: {}
        };
        if (useService) {
            const service: serviceDeclaration = {name: 'layouts'};

            if (provider !== 'default') {
                service.manifestUrl = getProviderUrl(provider);
            }
            if (config) {
                service.config = JSON.parse(config);
            }
            manifest.services = [service];
        }

        // Return modified JSON to client
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify(manifest, null, 4));
    };
}