const tooling = require('../dist/index').webpackTools;
const outputDir = __dirname + "/dist";

module.exports = [
    tooling.createConfig(`${outputDir}/demo`, './src/index.ts', undefined, tooling.versionPlugin),
    tooling.createConfig(`${outputDir}/provider`, './src/index.ts', undefined, tooling.versionPlugin)
];