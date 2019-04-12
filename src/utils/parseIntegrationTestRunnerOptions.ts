interface IntegrationTestRunnerOptions {
    testCommand: string,
    skipBuild: boolean,
    debugMode: boolean,
    runtimeVersion: string|undefined
}

export function parseIntegrationTestRunnerOptions(): IntegrationTestRunnerOptions {
    const unusedArgs = process.argv.slice(2);

    const testFileNames = ['*'];
    const testNameFilter: string|undefined = getArg('--filter', unusedArgs, true);
    const showHelp: boolean = getArg('--help', unusedArgs) || getArg('-h', unusedArgs);
    const skipBuild: boolean = getArg('--run', unusedArgs) || getArg('-r', unusedArgs);
    const debugMode: boolean = getArg('--debug', unusedArgs) || getArg('-d', unusedArgs);
    const runtimeVersion: string|undefined = getArg('--runtime-version', unusedArgs, true);
    const color: string = getArg('--color', unusedArgs, true, true);

    let testFileName;
    while ((testFileName = getArg('--file-name', unusedArgs, true))) {
        testFileNames.push(testFileName);
    }

    if (showHelp) {
        console.log(`\
Test runner accepts the following arguments. Any additional arguments will be passed-through to the test runner, see "jest --help" for details.

NOTE: When running through 'npm test', pass -- before any test runner options, to stop NPM from consuming those arguments. For example, 'npm test -- -b'.

Options:
--file-name <file>              Runs all tests in the given file
--filter <pattern>              Only runs tests whose names match the given pattern. Can be used with --file-name.
--runtime-version <version>     Runs the tests on a specified runtime version.
--help | -h                     Displays this help
--run | -r                      Skips the build step, and will *only* run the tests - rather than the default 'build & run' behaviour.
--debug | -d                    Builds the test/application code using 'development' webpack mode for easier debugging. Has no effect when used with -r.
        `);
        process.exit();
    }

    const fileNamesArg = testFileNames.length > 1 ? testFileNames.slice(1).map(testFileName => `${testFileName}.inttest.ts`).join(' ') : '';
    const testCommand = 'jest ' +
        `--color=${color} ` +
        '--no-cache --config=jest-int.config.js --forceExit --runInBand ' +
        `${fileNamesArg} ${testNameFilter ? '--testNamePattern=' + testNameFilter: ''} ` +
        `${unusedArgs.join(' ')}`;

    return {testCommand, skipBuild, debugMode, runtimeVersion};
}

/**
 * Simple command-line parser. Returns the named argument from the list of process arguments.
 *
 * @param {string} name Argument name, including any hyphens
 * @param {string[]} unusedArgs Remaining arguments to be consumed
 * @param {boolean} hasValue If this argument requires a value. Accepts "--name value" and "--name=value" syntax.
 * @param {any} defaultValue Determines return value, if an argument with the given name doesn't exist. Only really makes sense when 'hasValue' is true.
 */
function getArg(name: string, unusedArgs:string[], hasValue: boolean = false, defaultValue: any = hasValue ? null : false): any {
    let value = defaultValue;
    let argIndex = unusedArgs.indexOf(name);

    if (argIndex >= 0 && argIndex < unusedArgs.length - (hasValue ? 1 : 0)) {
        if (hasValue) {
            // Take the argument after this as being the value
            value = unusedArgs[argIndex + 1];
            unusedArgs.splice(argIndex, 2);
        } else {
            // Only consume the one argument
            value = true;
            unusedArgs.splice(argIndex, 1);
        }
    } else if (hasValue) {
        argIndex = unusedArgs.findIndex((arg) => arg.indexOf(name + '=') === 0);
        if (argIndex >= 0) {
            value = unusedArgs[argIndex].substr(unusedArgs[argIndex].indexOf('=') + 1);
            unusedArgs.splice(argIndex, 1);
        }
    }

    return value;
}
