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

/**
 * Parses a .info file (key=value per line)
 * @param {string} content
 * @returns {Record<string, string>}
 */
const parseInfoFile = content => {
	return content
		.split(/\r?\n/)
		.filter(Boolean)
		.reduce((acc, line) => {
			const [key, ...rest] = line.split("=");
			acc[key.trim()] = rest.join("=").trim();
			return acc;
		}, {});
};

/**
 * Converts info object back to .info format
 * @param {Record<string, string>}
 * @returns {string}
 */
const stringifyInfoFile = info =>
	Object.entries(info)
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");

/**
 * Applies Build 42-specific changes
 * @param {Record<string, string>}
 * @returns {Record<string, string>}
 */
const transformInfoForBuild42 = info => {
	return {
		...info,

		// format: \modID,\modID2
		require: info.require ? `\\${info.require.replace(/\s*,\s*/g, ",\\")}` : undefined,

		version: "42"
	};
};

const generateBuild42Files = async () => {
	const { name } = getInfo();
	const basePath = path.join(process.cwd(), "dist", name);
	const build42Path = path.join(basePath, "42");

	await fs.ensureDir(build42Path);

	// Copy static files
	const filesToMirror = ["logo.png", "poster.png"];
	await Promise.all(
		filesToMirror.map(async file => {
			const source = path.join(basePath, file);
			const destination = path.join(build42Path, file);
			if (await fs.pathExists(source)) {
				await fs.copy(source, destination);
			}
		})
	);

	// Read, transform and write mod.info
	const infoPath = path.join(basePath, "mod.info");
	if (await fs.pathExists(infoPath)) {
		const raw = await fs.readFile(infoPath, "utf8");
		const parsed = parseInfoFile(raw);
		const transformed = transformInfoForBuild42(parsed);
		const output = stringifyInfoFile(transformed);

		await fs.writeFile(path.join(build42Path, "mod.info"), output);
	}

	// Copy media folder
	const mediaPath = path.join(basePath, "media");
	if (await fs.pathExists(mediaPath)) {
		await fs.remove(path.join(build42Path, "media"));
		await fs.copy(mediaPath, path.join(build42Path, "media"));
	}
};

const run = async () => {
	try {
		await copyFolder(srcPath("src/media"), distPath(""));
		console.info("media folder copied successfully.");

		await copyFolder(srcPath("src/translations"), distPath("lua/shared/Translate"));
		console.info("Translations folder copied successfully.");

		await copyFolder(srcPath("src/root"), distPath("", false));
		console.info("Root folder copied successfully.");

		await generateBuild42Files();
		console.info("Build 42 folder structure ready.");
	} catch (err) {
		console.error("Error copying files:", err);
		process.exitCode = 1;
	}
};

run();
