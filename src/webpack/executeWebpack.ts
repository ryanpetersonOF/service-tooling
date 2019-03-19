import {RequestHandler} from 'express-serve-static-core';
import * as path from 'path';
import * as webpack from 'webpack';
import * as webpackDevMiddleware from 'webpack-dev-middleware';
import {WebpackMode} from '../types';
import {getRootDirectory} from '../utils/getRootDirectory';

/**
 * Executes Webpack.  Doubles as express-compatible middleware function to serve webpack modules.
 *
 * Wrapper will immediately terminate the server if the initial build fails.
 *
 * This is a wrapper around the webpack-dev-middleware utility.
 */
export async function executeWebpack(mode: WebpackMode, writeToDisk: boolean): Promise<RequestHandler> {
    return new Promise<RequestHandler>((resolve) => {
        // Load config and set development mode
        const config: webpack.Configuration[] = require(getRootDirectory() + '/webpack.config.js');

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
                const component = path.relative(getRootDirectory(), stat.compilation.outputOptions.path);
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