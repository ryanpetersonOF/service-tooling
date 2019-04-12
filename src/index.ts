import {createAppJsonMiddleware, createCustomManifestMiddleware} from './server/middleware';
import * as webpackTools from './webpack/webpackTools';
import {parseIntegrationTestRunnerOptions} from './utils/parseIntegrationTestRunnerOptions';

export = {
    webpackTools,
    middleware: {createCustomManifestMiddleware, createAppJsonMiddleware},
    utils: {parseIntegrationTestRunnerOptions}
};
