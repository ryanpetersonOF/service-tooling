/**
 * Helper build utility to copy non-built files to the dist directory.  This itself file is not included in the distributed project.
 */

const fs = require('fs');
const path = require('path');

const glob = require('glob');

// List of files to copy into the dist directory on build
[
    './package.json',
    './README.md',
    ...glob.sync('src/config/**/*', {dot: true})
].forEach(file => fs.copyFileSync(path.resolve(file), path.resolve('dist', path.basename(file))));

