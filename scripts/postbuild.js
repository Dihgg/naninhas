const { copyFolder } = require('./utils');

copyFolder("src/ui", "ui")
.then(() => {
    console.info('ui folder copied successfully.');
})
.catch((err) => {
    console.error('Error copying ui folder:', err);
});

copyFolder("src/translations", "lua/shared/Translate")
.then(() => {
    console.info('Translations folder copied successfully.');
})
.catch((err) => {
    console.error('Error copying translations folder:', err);
});
