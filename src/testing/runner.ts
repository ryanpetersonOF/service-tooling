import {getProjectConfig} from '../utils/getProjectConfig';
import {createServer, startServer, createDefaultMiddleware} from '../server/server';
import {CLITestArguments} from '../types';
import getModuleRoot from '../utils/getModuleRoot';

const path = require('path');
const os = require('os');

const execa = require('execa');
const {launch} = require('hadouken-js-adapter');

let port: number;


const cleanup = async (res: any) => {
    if (os.platform().match(/^win/)) {
        const cmd = 'taskkill /F /IM openfin.exe /T';
        execa.shellSync(cmd);
    } else {
        const cmd = `lsof -n -i4TCP:${port} | grep LISTEN | awk '{ print $2 }' | xargs kill`;
        execa.shellSync(cmd);
    }
    process.exit((res.failed===true) ? 1 : 0);
};

const fail = (err: string) => {
    console.error(err);
    process.exit(1);
};

const run = (...args: any[]) => {
    const p = execa(...args);
    p.stdout.pipe(process.stdout);
    p.stderr.pipe(process.stderr);
    return p;
};

export function startIntegrationRunner(args: CLITestArguments) {
    const jestArgs = [
        '--config',
        path.join(getModuleRoot(), '/testing/jest/jest-int.config.js'),
        '--forceExit',
        '--no-cache',
        '--runInBand'
    ];

    /**
     * Pushes in the colors argument if requested
     */
    if (!args.noColor){
        jestArgs.push('--colors');
    }

    /**
     * Pushes in any file names provided
     */
    if (args.fileNames) {
        jestArgs.push(...args.fileNames);
    }

    /**
     * Pushes in the requested filter
     */
    if (args.filter) {
        jestArgs.push(args.filter);
    }

    /**
     * Adds any extra arguments to the end
     */
    if (args.extraArgs) {
        jestArgs.push(...args.extraArgs);
    }

    createServer()
        .then(async app => {
            if (args.customMiddlewarePath) {
                console.log(`Using custom middleware from file ${args.customMiddlewarePath}.`);
                await require(args.customMiddlewarePath)(app);
            } else {
                console.log('No custom middleware loaded.');
            }
            return app;
        })
        .then(app => {
            return createDefaultMiddleware(app, args);
        })
        .then(startServer)
        .then(async () => {
            const port = await launch({manifestUrl: `http://localhost:${getProjectConfig().PORT}/test/test-app-main.json`});
            console.log('Openfin running on port ' + port);
            return port;
        })
        .catch(fail)
        .then(OF_PORT => run('jest', jestArgs, {env: {OF_PORT}}))
        .then(cleanup)
        .catch(cleanup);
}

