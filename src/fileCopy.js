/**
 * Helper build utility to copy non-built files to the dist directory.  This itself file is not included in the distributed project.
 */
const path = require('path');

const fs = require('fs-extra');
const glob = require('glob');

// List of files to copy into the dist directory on build
[
    './package.json',
    './README.md',
    ...glob.sync('src/config/**/*', {dot: true})
].forEach(file => fs.copyFileSync(path.resolve(file), path.resolve('dist', path.basename(file))));

// List of directories to copy into the dist directory on build
[

    'src/typedoc-template'
].forEach(file => fs.copySync(file, path.resolve('dist', path.relative('./src', file))));
