#!/usr/bin/env node
import * as childprocess from 'child_process';
import * as path from 'path';

import * as program from 'commander';

import {startServer, createServer, startApplication, createDefaultMiddleware} from './server/server';
import {CLIArguments, BuildCommandArgs, CLITestArguments} from './types';
import {createProviderZip} from './scripts/createProviderZip';
import {createRuntimeChannels} from './scripts/createRuntimeChannels';
import {executeWebpack} from './webpack/executeWebpack';
import {getProjectConfig} from './utils/getProjectConfig';
import {startIntegrationRunner} from './testUtils/runner';

/**
 * Start command
 */
program.command('start')
    .description('Builds and runs a demo app, for testing service functionality.')
    .option(
        '-v, --providerVersion <version>',
        'Sets the runtime version for the provider.  Defaults to "local". Options: local | staging | stable | x.y.z',
        'local'
    )
    .option('-r, --runtime <version>', 'Sets the runtime version.  Options: stable | w.x.y.z')
    .option('-m, --mode <mode>', 'Sets the webpack mode.  Defaults to "development".  Options: development | production | none', 'development')
    .option('-n, --noDemo', 'Runs the server but will not launch the demo application.', true)
    .option('-s, --static', 'Launches the server and application using pre-built files.', true)
    .option('-w, --writeToDisk', 'Writes and serves the built files from disk.', true)
    .action(startCommandProcess);

/**
 * Build command
 */
program.command('build')
    .description('Builds the project and writes output to disk, will simultaneously build client, provider and demo app.')
    .action(buildCommandProcess)
    .option('-m, --mode <mode>', 'Sets the webpack build mode.  Defaults to "production". Options: development | production | none', 'production');

/**
 * Create Runtime channels
 */
program.command('channels')
    .description('Creates additional provider manifests that will run the provider on specific runtime channels.')
    .action(createRuntimeChannels);

/**
 * Zip command
 */
program.command('zip')
    .description('Creates a zip file that contains the provider source code and resources. Can be used to re-deploy the provider internally.')
    .action(createProviderZip);

/**
 * ESLint Check
 */
program.command('check')
    .description('Checks the project for linting issues.')
    .action(checkCommandProcess);

/**
 * ESLint Fix
 */
program.command('fix')
    .description('Checks the project for linting issues, and fixes issues wherever possible.')
    .action(fixCommandProcess);

/**
 * Typedoc command
 */
program.command('docs')
    .description('Generates typedoc for the project using the standardized theme.')
    .action(generateTypedoc);

/**
 * Unit tests command
 */
program.command('test:unit')
    .description('Runs all unit tests for the extending project.')
    .action(runUnitTests);

/**
 * Integration tests command
 */
program.command('test:int')
    .description('Runs all integration tests for the extending project.')
    .option('-r, --runtime <version>', 'Sets the runtime version.  Options: stable | w.x.y.z')
    .option('-m, --mode <mode>', 'Sets the webpack mode.  Defaults to "development".  Options: development | production | none', 'development')
    .option('-s, --static', 'Launches the server and application using pre-built files.', true)
    .option('-n, --fileName <fileName>', 'Runs all tests in the given file.')
    .option('-f, --filter <filter>', 'Only runs tests whose names match the given pattern.')
    .option('-c, --customMiddlewarePath <path>', 'Path to a custom middleware js file')
    .option('-x, --extraArgs <extraArgs...>', 'Any extra arguments to pass on to jest')
    .action(runIntegrationTests);

/**
 * Process CLI commands
 */
program.parse(process.argv);

// If program was called with no arguments, show help
if (program.args.length === 0) {
    program.help();
}

/**
 * Handles the integration test command.
 */
function runIntegrationTests(args: CLITestArguments){
    const sanitizedArgs: CLITestArguments = {
        providerVersion: 'testing',
        noDemo: true,
        writeToDisk: args.static !== undefined && args.static ? false : true,
        mode: args.mode || 'development',
        static: args.static === undefined ? false : true,
        filter: args.filter ? `--testNamePattern ${args.filter}` : '',
        fileNames: args.fileNames && args.fileNames.split(' ').map(testFileName => `${testFileName}.inttest.ts`).join(' ') || '',
        customMiddlewarePath: args.customMiddlewarePath,
        runtime: args.runtime,
        extraArgs: args.extraArgs || ''
    };
    startIntegrationRunner(sanitizedArgs);
}

/**
 * Starts the build + server process, passing in any provided CLI arguments
 */
async function startCommandProcess(args: CLIArguments) {
    const sanitizedArgs: CLIArguments = {
        providerVersion: args.providerVersion || 'local',
        mode: args.mode || 'development',
        noDemo: args.noDemo === undefined ? false : true,
        static: args.static === undefined ? false : true,
        writeToDisk: args.writeToDisk === undefined ? false : true,
        runtime: args.runtime
    };

    const server = await createServer();
    await createDefaultMiddleware(server, sanitizedArgs);
    await startServer(server);
    startApplication(sanitizedArgs);
}

/**
 * Initiates a webpack build for the extending project
 */
async function buildCommandProcess(args: BuildCommandArgs) {
    const sanitizedArgs = {mode: args.mode || 'production'};

    await executeWebpack(sanitizedArgs.mode, true);
    process.exit(0);
}

/**
 * Starts the eslint check process
 */
function checkCommandProcess() {
    const eslintCmd = path.resolve('./node_modules/.bin/eslint');
    const eslintConfig = path.resolve('./node_modules/openfin-service-tooling/.eslintrc.json');
    const cmd = `"${eslintCmd}" src test --ext .ts --ext .tsx --config "${eslintConfig}"`;
    childprocess.execSync(cmd, {stdio: 'inherit'});
}

/**
 * Starts the eslint fix process
 */
function fixCommandProcess() {
    const eslintCmd = path.resolve('./node_modules/.bin/eslint');
    const eslintConfig = path.resolve('./node_modules/openfin-service-tooling/.eslintrc.json');
    const cmd = `"${eslintCmd}" src test --ext .ts --ext .tsx --fix --config "${eslintConfig}"`;
    childprocess.execSync(cmd, {stdio: 'inherit'});
}


/**
 * Generates typedoc
 */
function generateTypedoc() {
    const config = getProjectConfig();
    const [typedocCmd, themeDir, outDir, tsConfig] = [
        './node_modules/.bin/typedoc',
        './node_modules/openfin-service-tooling/typedoc-template',
        './dist/docs/api',
        './src/client/tsconfig.json'
    ].map(filePath => path.resolve(filePath));
    const cmd = `"${typedocCmd}" --name "OpenFin ${config.SERVICE_TITLE}" --theme "${themeDir}" --out "${outDir}" --excludeNotExported --excludePrivate --excludeProtected --hideGenerator --tsconfig "${tsConfig}" --readme none`; // eslint-disable-line
    childprocess.execSync(cmd, {stdio: 'inherit'});
}

/**
 * Runs unit tests
 */
function runUnitTests(){
    const [jestCmd, jestUnitConfig] = [
        './node_modules/.bin/jest',
        './node_modules/openfin-service-tooling/jest/jest-unit.config.js'
    ].map(filePath => path.resolve(filePath));
    const cmd = `"${jestCmd}" --config "${jestUnitConfig}"`;
    childprocess.execSync(cmd, {stdio: 'inherit'});
}
