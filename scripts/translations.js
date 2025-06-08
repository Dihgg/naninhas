const fs = require('fs-extra');
const path = require('path');

const copyTranslationsFolder = async () => {
    const pipewrenchJsonPath = path.join(process.cwd(), 'pipewrench.json');
    const { modInfo: { name } } = JSON.parse(fs.readFileSync(pipewrenchJsonPath, 'utf8'));

    const srcDir = path.join(process.cwd(), 'src', 'translations');
    const destDir = path.join(process.cwd(), 'dist', name, 'media', 'lua', 'shared', 'Translate');

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

copyTranslationsFolder()
    .then(() => {
        console.info('Translations folder copied successfully.');
    })
    .catch((err) => {
        console.error('Error copying translations folder:', err);
    });
