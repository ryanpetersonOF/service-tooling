import {createAppJsonMiddleware, createCustomManifestMiddleware} from './server/middleware';
import * as spawn from './testing/tools/spawn';
import * as webpackTools from './webpack/webpackTools';

export = {
    webpackTools,
    middleware: {createCustomManifestMiddleware, createAppJsonMiddleware},
    testTools: {
        spawn: {...spawn}
    }
};
