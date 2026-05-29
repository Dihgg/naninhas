const path = require("path");
const fs = require("fs-extra");
const { copyFolder, getInfo, stringifyInfoFile } = require("./utils");

/**
 * returns the src Path for this operation
 * @param {string} dirPath
 * @returns {string}
 */
const srcPath = dirPath => path.join(process.cwd(), ...dirPath.split("/"));

/**
 * Reads optional build42 config from build42.config.json
 * @returns {{require?: string[], requireMap?: Record<string, string>}}
 */
const getBuild42Config = () => {
	const configPath = path.join(process.cwd(), "build42.config.json");
	if (!fs.existsSync(configPath)) {
		return {};
	}

	try {
		const raw = fs.readFileSync(configPath, "utf8");
		return JSON.parse(raw);
	} catch (_err) {
		return {};
	}
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
 * Parses a mod.info require line into dependency ids
 * @param {string | undefined} requireValue
 * @returns {string[]}
 */
const parseRequireDependencies = requireValue => {
	if (!requireValue) {
		return [];
	}

	return requireValue
		.split(",")
		.map(dep => dep.trim().replace(/^\\+/, ""))
		.filter(Boolean);
};

/**
 * Resolves build 42 dependencies from config overrides/map
 * @param {string | undefined} currentRequire
 * @param {{require?: string[], requireMap?: Record<string, string>}} build42Config
 * @returns {string[]}
 */
const resolveBuild42Dependencies = (currentRequire, build42Config) => {
	if (Array.isArray(build42Config.require) && build42Config.require.length > 0) {
		return build42Config.require;
	}

	const requireMap = build42Config.requireMap || {};
	const currentDependencies = parseRequireDependencies(currentRequire);
	return currentDependencies.map(dep => requireMap[dep] || dep);
};

/**
 * Applies Build 42-specific changes
 * @param {Record<string, string>}
 * @returns {Record<string, string>}
 */
const transformInfoForBuild42 = info => {
	const build42Config = getBuild42Config();
	const dependencies = resolveBuild42Dependencies(info.require, build42Config);

	return {
		...info,
		require: dependencies.length > 0 ? `\\${dependencies.join(",\\")}` : undefined,
		version: "42"
	};
};



/**
 * Patches PipeWrench-generated Lua files to avoid false startup mod errors in PZ.
 *
 * - client.lua and PipeWrench.lua:
 *   Rewrites `loadstring("require('X');return _G['Y']")()` to `_G['Y']`
 *   so startup does not attempt to require vanilla modules eagerly.
 * - lualib_bundle.lua:
 *   Replaces test fixture import with runtime-safe `require "ISBaseObject"`.
 *
 * @param {string} basePath
 */
const patchPipeWrenchLua = async basePath => {
	const glob = await fs.readdir(basePath, { recursive: true }).catch(() => []);

	const allFiles = Array.isArray(glob)
		? glob.map(filePath => path.join(basePath, filePath))
		: [];

	for (const filePath of allFiles) {
		const base = path.basename(filePath);

		if (base !== "client.lua" && base !== "PipeWrench.lua" && base !== "lualib_bundle.lua") {
			continue;
		}

		const stat = await fs.stat(filePath).catch(() => null);
		if (!stat || !stat.isFile()) {
			continue;
		}

		let content = await fs.readFile(filePath, "utf8");
		let changed = false;

		if (base === "client.lua" || base === "PipeWrench.lua") {
			const patched = content.replace(
				/loadstring\("require\('[^']+'\);return _G\['([^']+)'\]"\)\(\)/g,
				"_G['$1']"
			);
			if (patched !== content) {
				content = patched;
				changed = true;
			}
		}

		if (base === "lualib_bundle.lua") {
			const patched = content.replace(
				/require\s+"tests\/classExtendEachOther\/base\/ISBaseObject"/g,
				"require \"ISBaseObject\""
			);
			if (patched !== content) {
				content = patched;
				changed = true;
			}
		}

		if (changed) {
			await fs.writeFile(filePath, content, "utf8");
		}
	}
};

/**
 * Copy EN translations from src/translations-json/LOCALE to the Build 42 output folder, ensuring the directory structure is correct.
 * @param {string} outputPath the path to the output directory for translations (e.g., 42/media/lua/shared/Translate/LOCALE)
 * @param {string} locale the locale to copy (default: "EN")
 */
const translations = async (outputPath, locale = "EN") => {
	const sourceDir = srcPath(`src/translations-json/${locale}`);
	if (!(await fs.pathExists(sourceDir))) {
		console.info(`No src/translations-json/${locale} found; skipping translations.`);
		return;
	}
	await fs.ensureDir(path.join(outputPath, locale));
	const translationFiles = await fs.readdir(sourceDir);
	for (const file of translationFiles) {
		const json = await fs.readJSON(path.join(sourceDir, file));
		const sortedTranslations = new Map(Object.entries(json).sort());
		await fs.writeJson(path.join(outputPath, locale, file), Object.fromEntries(sortedTranslations), { spaces: 4 });
	}
	console.info(`${locale} Translations copied successfully.`);
}

const run = async () => {
	try {
		const { name } = getInfo();
		const basePath = path.join(process.cwd(), "dist", name);
		const build42Path = path.join(basePath, "42");
		const translateRoot = path.join(build42Path, "media", "lua", "shared", "Translate");

		await fs.ensureDir(build42Path);

		// 1a. Copy static media assets (src/media) into 42/media/
		await copyFolder(srcPath("src/media"), path.join(build42Path, "media"));

		// 1b. Merge tstl-compiled Lua (dist/{name}/media/) into 42/media/ then remove root media/
		//     The PipeWrench tstl plugin outputs Lua to dist/{modId}/media/; it must live in 42/ only.
		const rootMediaPath = path.join(basePath, "media");
		if (await fs.pathExists(rootMediaPath)) {
			await fs.copy(rootMediaPath, path.join(build42Path, "media"), { overwrite: false });
			await fs.remove(rootMediaPath);
		}
		console.info("media folder ready in 42/.");

		// 2. Patch PipeWrench-generated Lua files inside 42/
		await patchPipeWrenchLua(build42Path);
		console.info("PipeWrench Lua files patched.");

		// 3. Copy root files (mod.info, logo, poster, etc.) to dist root
		await copyFolder(srcPath("src/root"), basePath);
		console.info("Root folder copied successfully.");

		// 4. Mirror logo/poster into 42/ and write B42 mod.info
		const assetFiles = ["logo.png", "poster.png"];
		await Promise.all(
			assetFiles.map(async file => {
				const src = path.join(basePath, file);
				if (await fs.pathExists(src)) {
					await fs.copy(src, path.join(build42Path, file));
				}
			})
		);

		const infoPath = path.join(basePath, "mod.info");
		if (await fs.pathExists(infoPath)) {
			const raw = await fs.readFile(infoPath, "utf8");
			const parsed = parseInfoFile(raw);
			const transformed = transformInfoForBuild42(parsed);
			await fs.writeFile(path.join(build42Path, "mod.info"), stringifyInfoFile(transformed));
		}
		console.info("mod.info written for Build 42.");

		// 5. Overlay src/42 overrides onto 42/
		const src42Path = srcPath("src/42");
		if (await fs.pathExists(src42Path)) {
			await fs.copy(src42Path, build42Path, { overwrite: true });
			console.info("Build 42 overrides applied.");
		}

		// 6. Copy EN translations into 42/media/lua/shared/Translate/
		await translations(translateRoot);
		
	} catch (err) {
		console.error("Error copying files:", err);
		process.exitCode = 1;
	}
};

run();
