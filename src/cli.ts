#!/usr/bin/env node
import * as childprocess from 'child_process';

import * as program from 'commander';

import {startServer} from './server/server';
import {CLIArguments, BuildCommandArgs} from './types';
import {createZipProvider} from './scripts/createProviderZip';
import {executeWebpack} from './webpack/executeWebpack';


/**
 * Start command
 */
program.command('start')
    .option(
        '-v, --providerVersion <version>',
        'Sets the runtime version for the provider.  Defaults to "local". Options: local | staging | stable | x.y.z',
        'local'
    )
    .option('-r, --runtime <version>', 'Sets the runtime version.  Options: stable | w.x.y.z', 'stable')
    .option('-m, --mode <mode>', 'Sets the webpack mode.  Defaults to "development".  Options: development | production | none', 'development')
    .option('-n, --noDemo', 'Runs the server but will not launch the demo application.', true)
    .option('-s, --static', 'Launches the server and application using pre-built files.', true)
    .option('-w, --writeToDisk', 'Writes and serves the built files from disk.', true)
    .action(startCommandProcess);

/**
 * Build command
 */
program.command('build')
    .action(buildCommandProcess)
    .option('-m, --mode <mode>', 'Sets the webpack build mode.  Defaults to "production". Options: development | production | none', 'production');

/**
 * Zip command
 */
program.command('zip').action(zipCommandProcess);

/**
 * ESLint Check
 */
program.command('check').action(checkCommandProcess);

/**
 * ESLint Fix
 */
program.command('fix').action(fixCommandProcess);

/**
 * Process CLI commands
 */
program.parse(process.argv);

// If program was called with no arguments, show help.
if (program.args.length === 0) {
    program.help();
}


/**
 * Starts the build + server process, passing in any provided CLI arguments.
 */
function startCommandProcess(args: CLIArguments) {
    const sanitizedArgs: CLIArguments = {
        providerVersion: args.providerVersion || 'local',
        mode: args.mode || 'development',
        noDemo: args.noDemo === undefined ? false : true,
        static: args.static === undefined ? false : true,
        writeToDisk: args.writeToDisk === undefined ? false : true,
        runtime: args.runtime
    };

    startServer(sanitizedArgs);
}

/**
 * Initiates a webpack build for the extending project.
 */
async function buildCommandProcess(args: BuildCommandArgs) {
    const sanitizedArgs = {mode: args.mode || 'production'};

    await executeWebpack(sanitizedArgs.mode, true);
    process.exit(0);
}

/**
 * Starts the zip process
 */
function zipCommandProcess() {
    createZipProvider();
}

/**
 * Starts the eslint check process
 */
function checkCommandProcess() {
    childprocess.execSync('.\\node_modules\\.bin\\eslint src test --ext .ts --ext .tsx', {stdio: 'inherit'});
}

/**
 * Starts the eslint fix process
 */
function fixCommandProcess() {
    childprocess.execSync('.\\node_modules\\.bin\\eslint src test --ext .ts --ext .tsx --fix', {stdio: 'inherit'});
}
