const tooling = require('../dist/index').webpackTools;
const outputDir = __dirname + '/dist';

module.exports = [
    tooling.createConfig(`${outputDir}/provider`, {
        provider: ['./src/index.ts']
    }, undefined, tooling.versionPlugin),
    tooling.createConfig(`${outputDir}/demo`, './src/client.ts', {extractStyles: 'style'})
];
