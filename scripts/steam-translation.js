#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { Command } = require("commander");
const translate = require("translatte");
const { execa } = require("execa");

const {
	copyFolder,
	getInfo,
	getLocale,
	extractFrontMatterData,
	markdownToBbcode
} = require("./utils");

/**
 * Loads Workshop metadata for a translation package from steam/translations.json.
 * Accepts either language (e.g. "pt") or locale (e.g. "PTBR") keys.
 * Supported value formats:
 * - "3737445801"
 * - 3737445801
 * - { "id": "3737445801", "excerpt": "...", "description": "..." }
 * @param {string} language
 * @param {string} locale
 * @returns {Promise<{ id: string, excerpt?: string, description?: string }>}
 */
const getTranslationWorkshopMetadata = async (language, locale) => {
	const translationsPath = path.join(process.cwd(), "steam", "translations.json");
	if (!(await fs.pathExists(translationsPath))) {
		console.warn(`translations.json not found at ${translationsPath}. Using id=0.`);
		return { id: "0", excerpt: undefined, description: undefined };
	}

	const data = await fs.readJson(translationsPath);
	const candidates = [
		language,
		language.toLowerCase(),
		language.toUpperCase(),
		locale,
		locale.toLowerCase(),
		locale.toUpperCase()
	];

	for (const key of candidates) {
		const value = data[key];
		if (typeof value === "string" && value.trim()) {
			return { id: value.trim(), excerpt: undefined, description: undefined };
		}
		if (typeof value === "number") {
			return { id: String(value), excerpt: undefined, description: undefined };
		}
		if (value && typeof value === "object") {
			const id =
				typeof value.id === "number"
					? String(value.id)
					: typeof value.id === "string"
						? value.id.trim()
						: "";
			const excerpt =
				typeof value.excerpt === "string"
					? value.excerpt.trim()
					: undefined;
			const description =
				typeof value.description === "string"
					? value.description.trim()
					: undefined;

			if (id) {
				return { id, excerpt, description };
			}
		}
	}

	console.warn(
		`No translation Workshop ID found for language '${language}' or locale '${locale}' in ${translationsPath}. Using id=0.`
	);
	return { id: "0", excerpt: undefined, description: undefined };
};

/**
 * Parse and validate language argument.
 * @returns {{ language: string, locale: string }}
 */
const getArgs = () => {
	const program = new Command();
	program.argument("<language>", "Language code to prepare steam translation (e.g. pt, es, de)").parse();

	const language = (program.args[0] || "").trim().toLowerCase();
	if (!language) {
		throw new Error("Please specify a language, e.g. npm run steam:translate -- pt");
	}

	return { language, locale: getLocale(language) };
};

/**
 * Returns an excerpt (translation notice) for the quote.
 * Priority:
 * 1) excerpt field from translations.json
 * 2) Auto-translated "This is a translation package for..."
 * @param {string} name
 * @param {string | undefined} excerptFromJson
 * @param {string} language
 * @returns {Promise<string>}
 */
const getTranslationExcerpt = async (name, excerptFromJson, language) => {
	if (excerptFromJson) {
		return excerptFromJson;
	}

	let translationNotice = `This is a translation package for the ${name} mod.`;
	try {
		translationNotice = (await translate(translationNotice, { to: language })).text;
	} catch (err) {
		console.warn("Could not translate excerpt; using English.", err);
	}

	return translationNotice;
};

/**
 * Ensures translation package exists in dist by running translate if needed.
 * @param {string} language
 * @param {string} locale
 * @param {string} packageName
 * @returns {Promise<string>}
 */
const ensureTranslatedPackage = async (language, locale, packageName) => {
	const localePackagePath = path.join(process.cwd(), "dist", `${packageName} - ${locale}`);
	if (await fs.pathExists(localePackagePath)) {
		return localePackagePath;
	}

	console.info(`Translation package not found at ${localePackagePath}. Running translate script...`);
	await execa("npm", ["run", "translate", "--", language], { stdio: "inherit" });

	if (!(await fs.pathExists(localePackagePath))) {
		throw new Error(`Translated package was not generated at ${localePackagePath}`);
	}

	return localePackagePath;
};

/**
 * Returns a localized workshop description body in BBCode.
 * Priority:
 * 1) dev/workshop-<locale>.txt (manual translation)
 * 2) translated steam/workshop.md content converted to BBCode
 * 3) original steam/workshop.md content converted to BBCode
 * @param {string} workshopMdPath
 * @param {string} locale
 * @param {string} language
 * @returns {Promise<{ extracted: { id: string, title: string, tags: string, visibility: string }, descriptionBbcode: string }>}
 */
const getLocalizedWorkshopDescription = async (workshopMdPath, locale, language) => {
	if (!(await fs.pathExists(workshopMdPath))) {
		throw new Error(`workshop.md not found at ${workshopMdPath}`);
	}

	const workshopMd = await fs.readFile(workshopMdPath, "utf8");
	const { extracted, content } = extractFrontMatterData(workshopMd, {
		id: "string",
		title: "string",
		tags: "array",
		visibility: "string"
	});

	const manualTxtPath = path.join(process.cwd(), "dev", `workshop-${locale.toLowerCase()}.txt`);
	if (await fs.pathExists(manualTxtPath)) {
		const manualDescription = (await fs.readFile(manualTxtPath, "utf8")).trim();
		if (manualDescription) {
			return {
				extracted,
				descriptionBbcode: manualDescription
			};
		}
	}

	try {
		const translatedContent = (await translate(content, { to: language })).text;
		return {
			extracted,
			descriptionBbcode: markdownToBbcode(translatedContent)
		};
	} catch (err) {
		console.warn("Could not translate workshop markdown content; using source description.", err);
		return {
			extracted,
			descriptionBbcode: markdownToBbcode(content)
		};
	}
};

/**
 * Builds workshop.txt for a translation package.
 * @param {string} language
 * @param {string} locale
 * @param {string} workshopMdPath
 * @param {string} outputTxtPath
 */
const generateTranslationWorkshopTxt = async (language, locale, workshopMdPath, outputTxtPath) => {
	const { version, name } = getInfo();
	const translationWorkshopMetadata = await getTranslationWorkshopMetadata(language, locale);
	const { extracted, descriptionBbcode: generatedDescriptionBbcode } = await getLocalizedWorkshopDescription(workshopMdPath, locale, language);
	const descriptionBbcode = translationWorkshopMetadata.description || generatedDescriptionBbcode;
	const excerpt = await getTranslationExcerpt(name, translationWorkshopMetadata.excerpt, language);

	const titleSuffix = `(${locale} Translation)`;
	const title = extracted.title && extracted.title.includes(titleSuffix)
		? extracted.title
		: `${extracted.title} ${titleSuffix}`.trim();

	const description = `[quote]${excerpt}[/quote]\n\n${descriptionBbcode}`;
	const modId = translationWorkshopMetadata.id !== "0" ? `${name.toLowerCase()}-${locale.toLowerCase()}` : name;
	const workshopTxt = [
		`version=${version}`,
		`id=${translationWorkshopMetadata.id}`,
		`title=${title}`,
		`description=${description}`,
		`tags=${extracted.tags}`,
		`visibility=${extracted.visibility}`
	];

	if (translationWorkshopMetadata.id && translationWorkshopMetadata.id !== "0") {
		workshopTxt.push("");
		workshopTxt.push(`Workshop ID: ${translationWorkshopMetadata.id}`);
		workshopTxt.push(`Mod ID: ${modId}`);
	}

	const finalTxt = workshopTxt.join("\n");
	await fs.writeFile(outputTxtPath, `${finalTxt}\n`, "utf8");
	console.info(`Generated translation workshop.txt at ${outputTxtPath}`);
};

/**
 * Prepares Steam Workshop folder for a locale translation package.
 * @param {string} language
 * @param {string} locale
 */
const prepareSteamTranslation = async (language, locale) => {
	const { name } = getInfo();
	const localePackagePath = await ensureTranslatedPackage(language, locale, name);
	const workshopFolderName = `${name} - ${locale}`;
	const tempPath = path.join(os.tmpdir(), `${name}-${locale}-temp`);
	const modPath = path.join(tempPath, "contents", "mods");
	const workshopPath = path.join(os.homedir(), "Zomboid", "Workshop", workshopFolderName);

	await fs.remove(tempPath);
	await fs.ensureDir(modPath);

	const localizedPreview = path.join(localePackagePath, "preview.png");
	const defaultPreview = path.join(process.cwd(), "steam", "preview.png");
	if (await fs.pathExists(localizedPreview)) {
		await fs.copy(localizedPreview, path.join(tempPath, "preview.png"));
	} else {
		await fs.copy(defaultPreview, path.join(tempPath, "preview.png"));
	}

	await generateTranslationWorkshopTxt(
		language,
		locale,
		path.join(process.cwd(), "steam", "workshop.md"),
		path.join(tempPath, "workshop.txt")
	);

	await copyFolder(localePackagePath, path.join(modPath, workshopFolderName));

	if (await fs.pathExists(workshopPath)) {
		await fs.remove(workshopPath);
		console.info(`Removed existing translation workshop folder at: ${workshopPath}`);
	}

	await fs.ensureDir(workshopPath);
	await copyFolder(tempPath, workshopPath);
	await fs.remove(tempPath);

	console.info(`Steam translation files prepared at: ${workshopPath}`);
};

const run = async () => {
	const { language, locale } = getArgs();
	await prepareSteamTranslation(language, locale);
};

run().catch(err => {
	console.error("Error preparing Steam translation package:", err);
	process.exitCode = 1;
});
