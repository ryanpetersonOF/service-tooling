#!/usr/bin/env node

import * as program from 'commander';
import {startServer} from './server/server';
import * as webpack from './webpack/webpack';
import { CLIArguments } from './types';
import { createZipProvider } from './scripts/createProviderZip';

export {webpack};

/**
 * Starts the build + server process, passing in any provided CLI arguments.
 * @param args
 */
function startCommandProcess(args: CLIArguments) {
    const sanitizedArgs: CLIArguments = {
        providerVersion: args.providerVersion || 'local',
        mode: args.mode || 'development',
        launchApp: args.launchApp === undefined ? true : false,
        static: args.static === undefined ? false : true,
        writeToDisk: args.writeToDisk === undefined ? false : true
    };

    startServer(sanitizedArgs);
}

/**
 * Starts the zip process
 */
function zipCommandProcess() {
    createZipProvider();
}

program.command('start')
    .option('-v, --providerVersion <version>', 'Sets the runtime version for the provider.  Defaults to "local".', 'local')
    .option('-m, --mode <mode>', 'Sets the webpack mode.  Defaults to "development".', 'development')
    .option('-l, --launchApp', 'Launches the server and application once built.  Defaults to true.', false)
    .option('-s, --static', 'Launches the server and application using pre-built files.  Defaults to false.', true)
    .option('-w, --writeToDisk', 'Writes and serves the built files from disk.  Defaults to false.', true)
    .action(startCommandProcess);

program.command('zip')
    .action(zipCommandProcess);

program.parse(process.argv);

// if program was called with no arguments, show help.
if (program.args.length === 0) {
    program.help();
}