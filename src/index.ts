import {createAppJsonMiddleware, createCustomManifestMiddleware} from './server/middleware';
import * as webpackTools from './webpack/webpackTools';
import {parseIntegrationTestRunnerOptions} from './utils/parseIntegrationTestRunnerOptions';
import {startIntegrationRunner} from './testUtils/runner';

export = {
    webpackTools,
    middleware: {createCustomManifestMiddleware, createAppJsonMiddleware},
    utils: {parseIntegrationTestRunnerOptions},
    tests: {startIntegrationRunner}
};
