const { copyFolder } = require('./copyFolder');
const { generateZippedFiles } = require('./zipper');
const { getZipName } = require('./zipname');

module.exports = {
    copyFolder,
    generateZippedFiles,
    getZipName
};