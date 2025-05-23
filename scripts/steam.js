const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const archiver = require('archiver');
const { generateZippedFiles, getZipName } = require('./utils');

// Clean up .DS_Store files
const removeDSStore = dir => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            removeDSStore(filePath);
        } else if (file === '.DS_Store') {
            fs.unlinkSync(filePath);
        }
    });
};

async function prepareSteamZip() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const { name } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const tempDir = path.join(os.tmpdir(), `${name}-temp`);
    const projectFolder = path.join(tempDir, name); // Root folder for the project
    const contentsFolder = path.join(projectFolder, 'contents');
    const modsFolder = path.join(contentsFolder, 'mods', name); // Place mods inside contents
    const outputZip = getZipName();

    // Ensure folder structure in temp directory
    fs.ensureDirSync(modsFolder);

    // Generate files using zipper.js directly into the mods folder
    await generateZippedFiles(modsFolder);

    // Copy items from the source contents folder to the generated contents folder
    const originalContentsFolder = path.join(process.cwd(), 'contents');
    if (fs.existsSync(originalContentsFolder)) {
        fs.readdirSync(originalContentsFolder).forEach(file => {
            const srcPath = path.join(originalContentsFolder, file);
            const destPath = path.join(projectFolder, file);
            fs.copySync(srcPath, destPath);
        });
    }

    // Remove .DS_Store files from the temp directory
    removeDSStore(tempDir);

    // Create zip
    const output = fs.createWriteStream(outputZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.info(`${outputZip} has been created.`);
    });

    archive.pipe(output);
    archive.directory(projectFolder, name); // Include the project folder as the root
    await archive.finalize();

    // Clean up temporary folders
    fs.removeSync(tempDir);
}

prepareSteamZip()
.catch(err => {
    console.error('Error preparing Steam zip file:', err);
});