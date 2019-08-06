import {EventEmitter} from 'events';
import webpack = require('webpack');

import {WSS_DEFAULT_PORT} from '../constants';

const eventEmitter = new EventEmitter();

export const WebpackEvents = {
    on<T extends keyof webpack.compilation.MultiCompilerHooks>(type: T, callback: () => void) {
        const ws = new WebSocket(`ws://localhost:${WSS_DEFAULT_PORT}`);

        eventEmitter.addListener(type.toUpperCase(), callback);

        ws.onmessage = function(message: MessageEvent) {
            eventEmitter.emit(JSON.parse(message.data).type.toUpperCase());
        };
    }
};
