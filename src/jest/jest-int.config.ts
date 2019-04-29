import * as path from 'path';

import getModuleRoot from '../utils/getModuleRoot';

const {createConfig} = require(path.join(getModuleRoot(), '/jest/base.config.js'));
const config = createConfig('int');
config['globalSetup']= '<rootDir>/test/demo/utils/globalSetup.ts',
config['globalTeardown']= '<rootDir>/test/demo/utils/globalTeardown.ts',
config['testEnvironment']= '<rootDir>/test/demo/utils/integrationTestEnv.js',

module.exports = config;
