import {Server as WebSocketServer} from 'ws';
import webpack = require('webpack');

import {WSS_DEFAULT_PORT} from '../constants';

let existingServer: WebSocketServer|undefined;

interface SocketServerOptions {
    useExisting?: boolean;
}

export function createSocketServer(options: SocketServerOptions) {
    console.log('creating wss');
    if (options.useExisting && existingServer) {
        console.log('using existing');
        return existingServer;
    } else {
        console.log('using new');
        return existingServer = new WebSocketServer({port: WSS_DEFAULT_PORT});
    }
}

export function createWebpackEventHandlers(compiler: webpack.MultiCompiler, wss: WebSocketServer) {
    wss.on('connection', (ws) => {
        console.log('wss connected');
        compiler.hooks.done.tap('DoneHook', () => {
            console.log(1);
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
