import * as fs from 'fs';
import * as path from 'path';

import * as webpack from 'webpack';
import * as mkdirp from 'mkdirp';

interface BaseOptions {
    outputPath: string;
    input: string|string[];
}

export type PluginSpec<T> = {
    [K in keyof T]: T[K]|((value: T[K]) => any);
}

export type PluginOptions<T> = T & BaseOptions;

export abstract class BasePlugin<T> {
    /**
     * Supported options:
     * - outputPath: string
     *   Where to write any output files to, either a filename or a directory.
     *   If a directory, filenames will be appended based on the input file with the extension changed.
     * - input: string|string[]
     *   The JSON Schema file(s) to process using this plugin.
     *   If passing multiple files, then 'outputPath' MUST be a directory rather than an absolute filename.
     *
     * @param name The unique name of this plugin. Will appear in webpack output.
     * @param outputExtension The default file extension to use when writing files from this plugin. If only writing a single file, can be overridden by using an absolute path as outputPath option
     * @param options Object containing options passed-in from webpack config. See comments on BasePlugin and derived classes for list of supported options.
     */

    private name: string;
    private firstRun: boolean;
    private inputExt: string;
    private outputExt: string;

    protected options!: PluginOptions<T>;

    constructor(name: string, outputExtension: string, options: any) {
        if (!name) {
            throw new Error('Plugin name is required');
        }
        this.name = name;
        this.firstRun = true;
        this.inputExt = '.schema.json';
        this.outputExt = outputExtension || this.inputExt;

        // Ensure required options were passed-in
        this.parseOptions<BaseOptions>(options, {
            input: (value: string|string[]) => {
                // Normalise input from string|string[] to string[]
                if (typeof value === 'string') {
                    value = [value];
                } else if (!value || typeof value !== 'object' || !value.length) {
                    throw new Error('\'input\' must be a string or array of strings');
                }

                // Make sure all input files have expected extension
                value.forEach(filename => {
                    if (!filename.endsWith(this.inputExt)) {
                        // Plugin assumes this filename format when generating output path
                        throw new Error(`Invalid schema input: ${filename}. Expecting "${this.inputExt}" file extension`);
                    }
                });

                return value;
            },
            outputPath: (value: string) => {
                if (typeof value !== 'string') {
                    throw new Error('Required option outputPath not specified');
                } else if (this.options.input.length > 1 && path.extname(value) !== '') {
                    throw new Error('Multiple input files were provided, outputPath must be a directory');
                }
            }
        });
    }

    public abstract async run(action?: string): Promise<void>;

    protected parseOptions<O = PluginOptions<T>>(options: {} & O, spec: PluginSpec<O>) {
        const optionNames: (keyof O)[] = Object.keys(spec) as (keyof O)[];
        const parsedOptions: any = {};

        // Options will be built-up gradually as each input is validated
        optionNames.forEach((optionName) => {
            const specType = typeof spec[optionName];

            if (!options.hasOwnProperty(optionName)) {
                throw new Error(`Required option ${optionName} not specified`);
            } else if (specType === 'function') {
                // Use callback to parse/validate argument. Callback should throw if value isn't valid.
                const value = parsedOptions[optionName] || options[optionName];
                const ret = (spec[optionName] as Function)(value);

                parsedOptions[optionName] = (ret !== undefined) ? ret : value;
            } else if (specType !== 'string') {
                throw new Error('Invalid plugin spec');
                // @ts-ignore
            } else if (typeof options[optionName] !== spec[optionName]) {
                throw new Error(`Required option ${optionName} is of incorrect type. Expected ${spec[optionName]}, got ${typeof options[optionName]}.`);
            } else {
                // Option is valid
                parsedOptions[optionName] = options[optionName];
            }

            this.options = {...this.options, ...parsedOptions};
        });
    }

    protected getOutputPath(inputFilename: string) {
        const options = this.options;

        if (path.extname(options.outputPath)) {
            // Output path is already a filename
            return path.resolve(options.outputPath);
        } else {
            // Replace file extension on schema filename, and append to given outputPath
            return path.resolve(options.outputPath, path.basename(inputFilename).replace(this.inputExt, this.outputExt));
        }
    }


    protected async writeFile(fullPath: string, contents: any) {
        await this.createDirectory(fullPath);
        await new Promise((resolve, reject) => {
            fs.writeFile(fullPath, contents, 'utf8', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    protected apply(compiler: webpack.Compiler) {
        compiler.hooks.beforeCompile.tapPromise(this.name, (compilationParams) => {
            // Only build schemas once per webpack invocation
            if (!this.firstRun) {
                return Promise.resolve();
            } else {
                this.firstRun = false;
            }

            const promise = this.run();
            if (!this.isPromiseLike(promise)) {
                throw new Error(`The run() method of plugin '${this.name}' must return a promise`);
            }
            return promise;
        });
    }

    private async createDirectory(fullPath: string) {
        // Normalise file/dir path to dir path
        const isFilename = (path.extname(fullPath) !== '');
        if (isFilename) {
            fullPath = path.dirname(fullPath);
        }

        await new Promise((resolve, reject) => {
            mkdirp(fullPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private isPromiseLike(runResult: any) {
        return runResult
        && (typeof runResult === 'object')
           && runResult.then !== undefined
           && (typeof runResult.then === 'function');
    }
}

