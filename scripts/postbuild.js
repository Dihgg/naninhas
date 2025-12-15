const path = require("path");
const fs = require("fs-extra");
const { copyFolder, getInfo } = require("./utils");

/**
 * returns the src Path for this operation
 * @param {string} dirPath
 * @returns {string}
 */
const srcPath = dirPath => path.join(process.cwd(), ...dirPath.split("/"));

/**
 * returns the dist path (inside media) for this operation
 * @param {string} dirPath
 * @param {boolean} media should include the media folder in destPath ?
 * @returns {string}
 */
const distPath = (dirPath, media = true) => {
	const { name } = getInfo();
	return path.join(process.cwd(), "dist", name, media ? "media" : "", ...dirPath.split("/"));
};

const generateBuild42Files = async () => {
	const { name } = getInfo();
	const basePath = path.join(process.cwd(), "dist", name);
	const build42Path = path.join(basePath, "42");

	await fs.ensureDir(build42Path);

	const filesToMirror = ["logo.png", "poster.png", "mod.info"];
	await Promise.all(
		filesToMirror.map(async file => {
			const source = path.join(basePath, file);
			const destination = path.join(build42Path, file);
			if (await fs.pathExists(source)) {
				await fs.copy(source, destination);
			}
		})
	);

	if (await fs.pathExists(path.join(basePath, "media"))) {
		await fs.remove(path.join(build42Path, "media"));
		await fs.copy(path.join(basePath, "media"), path.join(build42Path, "media"));
	}
};

const run = async () => {
	try {
		await copyFolder(srcPath("src/media"), distPath(""));
		console.info("media folder copied successfully.");

		await copyFolder(srcPath("src/translations"), distPath("lua/shared/Translate"));
		console.info("Translations folder copied successfully.");

		await copyFolder(srcPath("src/root"), distPath("", false));
		console.info("copy root folder copied successfully.");

		await generateBuild42Files();
		console.info("Build 42 folder structure ready.");
	} catch (err) {
		console.error("Error copying files:", err);
		process.exitCode = 1;
	}
};

run();
