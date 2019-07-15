import * as path from 'path';
import * as os from 'os';

import * as execa from 'execa';
import {launch} from 'hadouken-js-adapter';

import {getProjectConfig} from '../utils/getProjectConfig';
import {createServer, startServer, createDefaultMiddleware} from '../server/server';
import {CLITestArguments} from '../types';
import getModuleRoot from '../utils/getModuleRoot';

let port: number;
let success: boolean = false;

const cleanup = () => {
    if (os.platform().match(/^win/)) {
        const cmd = 'taskkill /F /IM openfin.exe /T';
        execa.shellSync(cmd);
    } else {
        const cmd = `lsof -n -i4TCP:${port} | grep LISTEN | awk '{ print $2 }' | xargs kill`;
        execa.shellSync(cmd);
    }
};

const exit = () => {
    process.exit(success ? 0 : 1);
};

const run = (processName: string, args?: any[], execaOptions?: execa.Options) => {
    const p = execa(processName, args, execaOptions);
    p.stdout.pipe(process.stdout);
    p.stderr.pipe(process.stderr);
    return p;
};

export function runIntegrationTests(customJestArgs: string[], cliArgs: CLITestArguments) {
    const jestArgs = customJestArgs.concat([
        '--config',
        path.join(getModuleRoot(), '/testing/jest/jest-int.config.js'),
        '--forceExit',
        '--no-cache',
        '--runInBand'
    ]);

    createServer()
        .then(async app => {
            if (cliArgs.customMiddlewarePath) {
                await require(cliArgs.customMiddlewarePath)(app);
            }

            return app;
        })
        .then(app => {
            return createDefaultMiddleware(app, cliArgs);
        })
        .then(startServer)
        .then(async () => {
            const port = await launch({manifestUrl: `http://localhost:${getProjectConfig().PORT}/test/test-app-main.json`});
            console.log('Openfin running on port ' + port);
            return port;
        })
        .catch((error) => {
            console.error(error);
            throw new Error();
        })
        .then(OF_PORT => run('jest', jestArgs, {env: {OF_PORT: (OF_PORT as Number).toString()}}))
        .then(res => success = !res.failed)
        .then(cleanup)
        .catch(cleanup)
        .then(exit)
        .catch(exit);
}

export function runUnitTests(customJestArgs: string[]) {
    const jestArgs = customJestArgs.concat([
        '--config',
        path.join(getModuleRoot(), '/testing/jest/jest-unit.config.js')
    ]);

    run('jest', jestArgs)
        .then((res: any) => {
            process.exit((res.failed===true) ? 1 : 0);
        });
}

