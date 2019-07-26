import {createAppJsonMiddleware, createCustomManifestMiddleware} from './server/middleware';
import * as webpackTools from './webpack/webpackTools';

export const middleware = {createCustomManifestMiddleware, createAppJsonMiddleware};
export {webpackTools};
