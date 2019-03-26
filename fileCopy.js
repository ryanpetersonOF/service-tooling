const fs = require('fs');
const glob = require('glob');
const path = require('path');

// List of files to copy into the dist directory on build
[
    './package.json',
    './README.md',
    ...glob.sync('src/config/**.*')
].forEach(file => fs.copyFileSync(file, path.resolve('dist', path.basename(file))));