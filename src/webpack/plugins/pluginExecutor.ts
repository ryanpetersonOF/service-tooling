import {getRootDirectory} from '../../utils/getRootDirectory';

import webpack = require('webpack');
import {BasePlugin} from './BasePlugin';

type Plugin = BasePlugin<any> | webpack.Plugin;

/**
 * Executes all runnable plugins without having to do a full build.  Standard webpack plugins will be ignored.
 *
 * Will extract code generation plugins from the main webpack config, and then invoke those plugins from "manually",
 * without using webpack.
 */
export async function executeAllPlugins(action?: string) {
    const webpackConfig: webpack.Configuration[] = require(`${getRootDirectory()}/webpack.config.js`);

    // Run all found plugins (outside of webpack - will generate code without any other build steps)
    await Promise.all(webpackConfig.reduce((accum: Plugin[], step) => step.plugins ? accum.concat(step.plugins) : accum, [])
        .map((plugin) => executePlugin(plugin, action)))
        .catch((err) => {
            console.error('One or more plugins failed:');
            console.error(err);
            throw err;
        });
}

/**
 * Executes a single runnable plugin.  Standard webpack plugins are ignored.
 */
export async function executePlugin(plugin: Plugin, action?: string) {
    if (isValidPlugin(plugin)) {
        return plugin.run(action);
    }
}

/**
 * Checks if the plugin is one our 'custom' plugins and not a straight webpack plugin.
 *
 * Our custom plugins will contain a `run` method which accepts one optional parameter.
 */
function isValidPlugin(plugin: any): plugin is BasePlugin<any>&webpack.Plugin {
    return (typeof plugin.run === 'function') && (plugin.run.length === 1);
}
