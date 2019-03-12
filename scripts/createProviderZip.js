var fs = require('fs');
var path = require('path');
var archiver = require('archiver');

const {getProjectConfig} = require('../utils');

const {SERVICE_NAME} = getProjectConfig();

var output = fs.createWriteStream(path.resolve(process.cwd(), 'dist','provider',`${SERVICE_NAME}-service.zip`));
var archive = archiver('zip', {zlib: {level: 9}});

output.on('close', () => {
    console.log(`Zip file created at '${output.path}'`);
    console.log(`${archive.pointer()} total bytes written`);
})

archive.pipe(output);

// Include all provider res files except app.json (which is also in dist)
archive.glob('**/!(app.json)', {cwd: path.resolve(process.cwd(), 'res', 'provider')});
// Include all provider dist files except the zip itself
archive.glob('**/*.!(zip)', {cwd: path.resolve(process.cwd(), 'dist', 'provider')});

archive.finalize();
