/**
 * Helper build utility to copy non-built files to the dist directory.  This itself file is not included in the distributed project.
 */

const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');
const glob = require('glob');

// List of files to copy into the dist directory on build
[
    './package.json',
    './README.md',
    ...glob.sync('src/config/**/*', {dot: true})
].forEach(file => fs.copyFileSync(path.resolve(file), path.resolve('dist', path.basename(file))));

// List of directories to copy into the dist directory on build
[
    ...glob.sync('src/typedoc-template/**/*')
].forEach(file => {
    const isDir = fs.lstatSync(file).isDirectory();
    if (isDir) {
        fs.mkdirSync(path.dirname(path.resolve('dist', path.relative('./src', file))));
    } else {
        fs.copyFileSync(path.resolve(file), path.resolve('dist', path.relative('./src', file)));
    }
    // mkdirp.sync(path.dirname(path.resolve('dist', path.relative('./src', file))));
    // fs.copyFileSync(path.resolve(file), path.resolve('dist', path.relative('./src', file)));
});

