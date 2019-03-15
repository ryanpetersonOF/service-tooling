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
    mode: WebpackMode;

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

export type BuildCommandArgs = {
    mode: WebpackMode;
};

/**
 * Available modes for webpack to run against.
 */
export type WebpackMode = 'development'|'production'|'none';