import {getRootDirectory} from '../utils/getRootDirectory';

import webpack = require('webpack');
import {BasePlugin} from './BasePlugin';

/**
 * Runs all code generation plugins without having to do a full build.
 *
 * Will extract code generation plugins from the main webpack config, and then invoke those plugins from "manually",
 * without using webpack.
 */
export async function executeAllPlugins() {
    const webpackConfig: webpack.Configuration[] = require(getRootDirectory() + '/webpack.config.js');
    const runnablePlugins: BasePlugin<any>[] = [];

    webpackConfig.forEach(step => {
        if (step.plugins) {
            runnablePlugins.push(...step.plugins.filter(isValidPlugin));
        }
    });

    // Run all found plugins (outside of webpack - will generate code without any other build steps)
    await Promise.all(runnablePlugins.map(p => p.run())).catch((err) => {
        console.error('One or more plugins failed:');
        console.error(err);
        throw err;
    });
}

function isValidPlugin(plugin: any): plugin is BasePlugin<any>&webpack.Plugin {
    return (typeof plugin.run === 'function') && (plugin.run.length === 0);
}
