const fs = require("fs-extra");
const path = require("path");


const copyFolder = async (srcPath, destPath) => {
    const pipewrenchJsonPath = path.join(process.cwd(), 'pipewrench.json');
    const { modInfo: { name } } = JSON.parse(fs.readFileSync(pipewrenchJsonPath, 'utf8'));

    const srcDir = path.join(process.cwd(), ...srcPath.split("/"));
    const destDir = path.join(process.cwd(), 'dist', name, 'media', ...destPath.split("/"));

    if (!fs.existsSync(srcDir)) return;

    const items = await fs.readdir(srcDir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            const srcFolder = path.join(srcDir, item.name);
            const destFolder = path.join(destDir, item.name);
            await fs.copy(srcFolder, destFolder);
        }
    }
};
exports.copyFolder = copyFolder;
