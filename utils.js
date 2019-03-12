const fs = require("fs");

/**
 * Given name for the projects local configuration file needed for our operations.
 */
const CONFIG_FILE = './config.json';

/**
 * Returns the config json for the extending project.
 */
function getProjectConfig() {

    // Check that the file exists locally
    if(!fs.existsSync(CONFIG_FILE)) {
        throw new Error(`Config file not found in project root.  Please check ${CONFIG_FILE} exists.`);
    }

    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}


/**
 * Returns the package json for the extending project.
 */
function getProjectPackageJson() {
    
    // Check that the file exists locally
    if(!fs.existsSync('./package.json')) {
        throw new Error(`Package.json file not found in project root.  Please check ./package.json exists.`);
    }

    return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
}

module.exports = {
    getProjectConfig,
    getProjectPackageJson
}