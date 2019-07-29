import * as path from 'path';

import {NextFunction, Request, RequestHandler, Response} from 'express-serve-static-core';

import {getJsonFile} from '../utils/getJsonFile';
import {getProjectConfig} from '../utils/getProjectConfig';
import {getProviderUrl} from '../utils/getProviderUrl';

/**
 * Quick implementation on the app.json, for the pieces we use.
 */
type ManifestFile = {
    licenseKey: string,
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
 * Creates express-compatible middleware function that will add/replace any URL's found within app.json files according
 * to the command-line options of this utility.
 */
export function createAppJsonMiddleware(providerVersion: string, runtimeVersion?: string): RequestHandler {
    const {PORT, SERVICE_NAME, CDN_LOCATION} = getProjectConfig();

    return async (req: Request, res: Response, next: NextFunction) => {
        const configPath = req.params[0];            // app.json path, relative to 'res' dir
        const component = configPath.split('/')[0];  // client, provider or demo

        // Parse app.json
        const config: ManifestFile|void = await getJsonFile<ManifestFile>(path.resolve('res', configPath))
            .catch(() => {
                next();
            });

        if (!config || !config.startup_app) {
            next();
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
        if (runtimeVersion) {
            // Replace runtime version with one provided.
            config.runtime.version = runtimeVersion;
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
    const {PORT, SERVICE_NAME} = getProjectConfig();

    return async (req, res, next) => {
        const defaultConfig = await getJsonFile<ManifestFile>(path.resolve('./res/demo/app.json')).catch(next);

        if (!defaultConfig) {
            return;
        }

        const query: {[key: string]: string} = req.query;
        const {
            uuid,
            url,
            frame,
            defaultCentered,
            defaultLeft,
            defaultTop,
            defaultWidth,
            defaultHeight,
            realmName,
            enableMesh,
            runtime,
            useService,
            provider,
            config,
            licenseKey
        } = {
            // Set default values
            uuid: `demo-app-${Math.random().toString(36).substr(2, 4)}`,
            url: `http://localhost:${PORT}/demo/testbed/index.html`,
            runtime: defaultConfig.runtime.version,
            provider: 'local',
            config: null,
            realmName: null,

            // Override with query args
            ...query,

            // Special handling for any non-string args (both parses query string args, and defines default values)
            frame: req.query.frame !== 'false',
            enableMesh: req.query.enableMesh !== 'false',
            useService: req.query.useService !== 'false',
            defaultCentered: req.query.defaultCentered === 'true',
            defaultLeft: Number.parseInt(req.query.defaultLeft, 10) || 860,
            defaultTop: Number.parseInt(req.query.defaultTop, 10) || 605,
            defaultWidth: Number.parseInt(req.query.defaultWidth, 10) || 860,
            defaultHeight: Number.parseInt(req.query.defaultHeight, 10) || 605,
            licenseKey: defaultConfig.licenseKey
        };

        const manifest = {
            licenseKey,
            startup_app:
                {uuid, name: uuid, url, frame, autoShow: true, saveWindowState: false, defaultCentered, defaultLeft, defaultTop, defaultWidth, defaultHeight},
            runtime: {arguments: '--v=1' + (realmName ? ` --security-realm=${realmName}${enableMesh ? ' --enable-mesh' : ''}` : ''), version: runtime},
            services: {}
        };
        if (useService) {
            const service: serviceDeclaration = {name: `${SERVICE_NAME}`};

            if (provider !== 'default') {
                service.manifestUrl = getProviderUrl(provider);
            }
            if (config) {
                service.config = JSON.parse(config!);
            }
            manifest.services = [service];
        }

        // Return modified JSON to client
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify(manifest, null, 4));
    };
}
