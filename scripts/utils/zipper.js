const fs = require('fs-extra');
const path = require('path');
const micromatch = require('micromatch');

const EXCLUDE_PATTERNS = [
    'node_modules',
    'contents',
    'scripts',
    'dev',
    '*.md',
    'package*',
    '.git*',
    '.nvm*',
    '*.zip',
    '*.code-workspace'
];

function shouldInclude(filePath) {
    return !micromatch.isMatch(filePath, EXCLUDE_PATTERNS);
}

async function generateZippedFiles(outputDir) {
    // Copy files directly into the output directory
    const files = fs.readdirSync(process.cwd());
    files
        .filter(shouldInclude)
        .forEach(file => {
            const srcPath = path.join(process.cwd(), file);
            const destPath = path.join(outputDir, file);
            fs.copySync(srcPath, destPath);
        });
}

module.exports = { generateZippedFiles };