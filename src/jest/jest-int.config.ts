import * as path from 'path';

console.log(path.resolve('./node_modules/openfin-service-tooling/jest/base.config.js'));
const {createConfig} = require(path.resolve('./node_modules/openfin-service-tooling/jest/base.config.js'));
const config = createConfig('int');
config['globalSetup']= '<rootDir>/test/demo/utils/globalSetup.ts',
config['globalTeardown']= '<rootDir>/test/demo/utils/globalTeardown.ts',
config['testEnvironment']= '<rootDir>/test/demo/utils/integrationTestEnv.js',

module.exports = config;
