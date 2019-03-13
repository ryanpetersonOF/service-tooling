#!/usr/bin/env node

import * as program from 'commander';
import {startServer} from './server/server';
import * as webpack from './webpack/webpack';

export {webpack};
export interface CLIArguments {
    /**
     * Chooses which version of the provider to run against. Will default to building and running a local version of the provider.
     *
     * - "local"
     *   Starts a local version of the provider, built from the code in 'src/provider'
     * - "stable"
     *   Runs the latest public release of the service from the OpenFin CDN
     * - "staging"
     *   Runs the latest internal build of the service from the OpenFin CDN. May be unstable.
     * - <version number>
     *   Specifiying a "x.y.z" version number will load that version of the service from the OpenFin CDN.
     */
    providerVersion: string;

    /**
     * The mode to use for webpack, either 'development' (default) or 'production'.
     */
    mode: 'development'|'production'|'none';

    /**
     * If the demo application should be launched after building (default: true).
     *
     * Otherwise will build and start the local server, but not automatically launch any applications.
     */
    launchApp: boolean;

    /**
     * Rather than building the application via webpack (and then watching for any source file changes), will launch the
     * provider from pre-built code within the 'dist' directory.
     *
     * You should first build the provider using either 'npm run build' or 'npm run build:dev'. This option has no effect if
     * '--version' is set to anything other than 'local'.
     */
    static: boolean;

    /**
     * By default, webpack-dev-server builds and serves files from memory without writing to disk. Using this option will
     * also write the output to the 'dist' folder, as if running one of the 'build' scripts.
     */
    writeToDisk: boolean;
}

/**
 * Starts the build + server process, passing in any provided CLI arguments.
 * @param args
 */
function startCommandProcess(args: CLIArguments) {
    const sanitizedArgs: CLIArguments = {
        providerVersion: args.providerVersion || 'local',
        mode: args.mode || 'development',
        launchApp: args.launchApp || true,
        static: args.static || false,
        writeToDisk: args.writeToDisk || false
    };

    startServer(sanitizedArgs);
}

program.command('start')
    .option('-v, --providerVersion <version>', 'Sets the runtime version for the provider.  Defaults to "local".', 'local')
    .option('-m, --mode <mode>', 'Sets the webpack mode.  Defaults to "development".', 'development')
    .option('-l, --launchApp', 'Launches the server and application once built.  Defaults to true.', true)
    .option('-s, --static', 'Launches the server and application using pre-built files.  Defaults to false.', false)
    .option('-w, --write', 'Writes and serves the built files from disk.  Defaults to false.', false)
    .action(startCommandProcess);

program.parse(process.argv);

// if program was called with no arguments, show help.
if (program.args.length === 0) {
    program.help();
}