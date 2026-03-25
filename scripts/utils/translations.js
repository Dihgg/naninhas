const path = require("path");
const fs = require("fs-extra");

/**
 * Recursively collects all files with a given extension.
 * @param {string} baseDir
 * @param {string} extension
 * @returns {Promise<string[]>}
 */
const collectFilesByExtension = async (baseDir, extension) => {
	const entries = await fs.readdir(baseDir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(baseDir, entry.name);
		if (entry.isDirectory()) {
			const nested = await collectFilesByExtension(fullPath, extension);
			files.push(...nested);
			continue;
		}

		if (entry.isFile() && path.extname(entry.name).toLowerCase() === extension) {
			files.push(fullPath);
		}
	}

	return files;
};

/**
 * Loads translation json files from src/translations-json.
 * Expected structure: <source>/<locale>/<namespace>.json
 * @param {string} sourceRoot
 * @returns {Promise<Record<string, Record<string, Record<string, string>>>>}
 */
const loadTranslationSource = async sourceRoot => {
	if (!(await fs.pathExists(sourceRoot))) {
		return {};
	}

	const jsonFiles = await collectFilesByExtension(sourceRoot, ".json");
	const result = {};

	for (const filePath of jsonFiles) {
		const locale = path.basename(path.dirname(filePath));
		const namespace = path.basename(filePath, ".json");
		const content = await fs.readJson(filePath);

		if (!content || typeof content !== "object" || Array.isArray(content)) {
			throw new Error(`Invalid translation file format: ${filePath}`);
		}

		for (const [key, value] of Object.entries(content)) {
			if (typeof value !== "string") {
				throw new Error(`Invalid translation value for key '${key}' in ${filePath}. Values must be strings.`);
			}
		}

		if (!result[locale]) {
			result[locale] = {};
		}
		result[locale][namespace] = content;
	}

	return result;
};

/**
 * Escapes a value for Build 41 translation txt files.
 * @param {string} value
 * @returns {string}
 */
const escapeBuild41Value = value => value.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"').replace(/\r/g, "").replace(/\n/g, "<LINE>");

/**
 * Converts a json translation object to Build 41 txt format.
 * @param {string} namespace
 * @param {string} locale
 * @param {Record<string, string>} entries
 * @returns {string}
 */
const toBuild41Translation = (namespace, locale, entries) => {
	const header = `${namespace}_${locale} = {`;
	const body = Object.entries(entries)
		.map(([key, value]) => `\t${key} = "${escapeBuild41Value(value)}",`)
		.join("\n");

	return `${header}\n${body}\n}\n`;
};

/**
 * Generates translations for Build 41 and Build 42 from json source.
 * @param {{sourceRoot: string, build41TranslateRoot: string, build42TranslateRoot: string}} paths
 */
const generateTranslations = async ({ sourceRoot, build41TranslateRoot, build42TranslateRoot }) => {
	const source = await loadTranslationSource(sourceRoot);
	const locales = Object.keys(source);

	if (locales.length === 0) {
		return { generated: false, fileCount: 0 };
	}

	let fileCount = 0;

	for (const locale of locales) {
		const namespaces = source[locale];
		const namespaceNames = Object.keys(namespaces);

		for (const namespace of namespaceNames) {
			const entries = namespaces[namespace];
			const build41Path = path.join(build41TranslateRoot, locale, `${namespace}_${locale}.txt`);
			const build42Path = path.join(build42TranslateRoot, locale, `${namespace}.json`);

			await fs.ensureDir(path.dirname(build41Path));
			await fs.ensureDir(path.dirname(build42Path));

			await fs.writeFile(build41Path, toBuild41Translation(namespace, locale, entries), "utf8");
			await fs.writeJson(build42Path, entries, { spaces: 4 });
			fileCount += 2;
		}
	}

	return { generated: true, fileCount };
};

module.exports = {
	generateTranslations
};
