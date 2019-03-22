import {createAppJsonMiddleware, createCustomManifestMiddleware} from './server/middleware';
import * as webpackTools from './webpack/webpackTools';

export = {
    webpackTools,
    middleware: {createCustomManifestMiddleware, createAppJsonMiddleware}
};