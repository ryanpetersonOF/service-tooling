import {Server as WebSocketServer} from 'ws';
import webpack = require('webpack');

import {WSS_DEFAULT_PORT} from '../constants';

let existingServer: WebSocketServer|undefined;

interface SocketServerOptions {
    useExisting?: boolean;
}

export function createSocketServer(options: SocketServerOptions) {
    if (options.useExisting && existingServer) {
        return existingServer;
    } else {
        existingServer = new WebSocketServer({port: WSS_DEFAULT_PORT});
        return existingServer;
    }
}

export function createWebpackEventHandlers(compiler: webpack.MultiCompiler, wss: WebSocketServer) {
    wss.on('connection', (ws) => {
        compiler.hooks.done.tap('DoneHook', () => {
            ws.send(JSON.stringify({type: 'done'}));
        });

        compiler.hooks.invalid.tap('InvalidHook', () => {
            ws.send(JSON.stringify({type: 'invalid'}));
        });

        compiler.hooks.run.tap('RunHook', () => {
            ws.send(JSON.stringify({type: 'run'}));
        });

        compiler.hooks.watchRun.tap('WatchRun', () => {
            ws.send(JSON.stringify({type: 'watchRun'}));
        });

        compiler.hooks.watchClose.tap('WatchClose', () => {
            ws.send(JSON.stringify({type: 'watchClose'}));
        });
    });
}
