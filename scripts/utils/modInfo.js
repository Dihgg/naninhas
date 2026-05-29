/**
 * Converts info object back to .info format
 * @param {Record<string, string>}
 * @returns {string}
 */
const stringifyInfoFile = info =>
	Object.entries(info)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");

module.exports = {
    stringifyInfoFile
};