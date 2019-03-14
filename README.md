# OpenFin Service Build Tooling


## Overview

Extracts out common build and server components which can be shared across different service development environments.

### Dependencies
- None.

### Features
* Common build utils
* Common server and demo launching utils

## API
* openfin-service-base start [...options]
    Starts the build and serves the project.

    - Options: 
        - --v, --providerVersion <version>: 'Sets the runtime version for the provider.  Defaults to "local".
        - --m, --mode <mode>: 'Sets the webpack mode.  Defaults to "development".
        - --l, --launchApp: 'Launches the server and application once built.  Defaults to true.
        - --s, --static: 'Launches the server and application using pre-built files.  Defaults to false.
        - --w, --write: 'Writes and serves the built files from disk.  Defaults to false.

* openfin-service-base zip
    Zips the project.

* Exports
    - webpack
        - createConfig: Creates a webpack configuration
        - versionPlugin: Replaces 'PACKAGE_VERSION' constant in source files with the current version of the service
        - manifestPlugin: Provider temporarily requires an extra plugin to override index.html within provider app.json

## Roadmap
This is a WIP as services continue to evolve.

### Usage
An in-depth usage guide and additional documentation will be published in due course.

## Getting Started

Install as a node module to your existing service project.

### Setup

- After installing, add a script to your projects package.json with the command: `openfin-service-base start` 
- In your webpack.config.js, import `openfin-service-base` - this will expose the common webpack utils to create configurations and export.

You can then invoke `openfin-service-base start` added previously to build and serve your project.

### Startup
Once dependencies are installed and imported, you can invoke `openfin-service-base start` to build and serve your project.

## Known Issues
A list of known issues will be here.

## License
This project uses the [Apache2 license](https://www.apache.org/licenses/LICENSE-2.0)

However, if you run this code, it may call on the OpenFin RVM or OpenFin Runtime, which are covered by OpenFin's Developer, Community, and Enterprise licenses. You can learn more about OpenFin licensing at the links listed below or just email us at support@openfin.co with questions.

https://openfin.co/developer-agreement/
https://openfin.co/licensing/

## Support
This is an open source project and all are encouraged to contribute.
Please enter an issue in the repo for any questions or problems. Alternatively, please contact us at support@openfin.co
