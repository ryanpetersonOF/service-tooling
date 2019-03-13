import { getProjectConfig } from "./getProjectConfig";

const {PORT, CDN_LOCATION} = getProjectConfig();

/**
 * Returns the URL of the manifest file for the requested version of the service.
 * 
 * @param {string} version Version number of the service, or a channel
 * @param {string} manifestUrl The URL that was set in the application manifest (if any). Any querystring arguments will be persisted, but the rest of the URL will be ignored.
 */
export function getProviderUrl(version: string, manifestUrl?: string) {
    const index = (manifestUrl && manifestUrl.indexOf("?")) || -1;
    const query = manifestUrl && index >= 0 ? manifestUrl.substr(index) : "";

    if (version === 'local') {
        // Provider is running locally
        return `http://localhost:${PORT}/provider/app.json${query}`;
    } else if (version === 'stable') {
        // Use the latest stable version
        return `${CDN_LOCATION}/app.json${query}`;
    } else if (version === 'staging') {
        // Use the latest staging build
        return `${CDN_LOCATION}/app.staging.json${query}`;
    } else if (/\d+\.\d+\.\d+/.test(version)) {
        // Use a specific public release of the service
        return `${CDN_LOCATION}/${version}/app.json${query}`;
    } else if (version.indexOf('://') > 0) {
        // Looks like an absolute URL to an app.json file
        return version;
    } else {
        throw new Error(`Not a valid version number or channel: ${version}`);
    }
}