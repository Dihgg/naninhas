#!/usr/bin/env node

import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import { Command } from "commander";
import translate, { languages } from "translatte";

import { getInfo, stringifyInfoFile, copyFolder } from "./utils/index.js";

/**
 * Convert a locale to the format used by Project Zomboid
 * @param {string} locale The locale to convert
 * @returns {string} The converted locale
 */
const getLocale = (locale) => {
    switch (locale) {
        case "pt":
            return "PTBR";
        default:
            return locale.toUpperCase();
    }
}

/**
 * Creates the output folder for the translated mod, ensuring it exists.
 * @param {string} locale The locale for which to create the output folder
 * @returns {Promise<string>} The path to the created output folder
 */
async function createOutputFolder(locale) {
    const { id } = getInfo();
    const outputDir = path.join(process.cwd(), "dist", `${id} - ${locale}`);
    fs.ensureDirSync(outputDir);
    return outputDir;
}

/**
 * Generates translations for the specified language and locale.
 * @param {string} language The language to translate to (e.g., "en", "fr", "de")
 * @param {string} locale The Zomboid locale to use for the output (e.g., "PTBR", "FR", "DE")
 * @param {string} outputPath The path to the output directory
 */
async function generateTranslations(language, locale, outputPath) { 

    console.log(`Translating to ${language}...`);

    const { modInfo } = await fs.readJSON(path.join(process.cwd(), `pipewrench.json`));
    const { id } = modInfo;

    const outputDir = path.join(outputPath, "42", "media", "lua", "shared", "Translate", locale);

    fs.ensureDirSync(outputDir);

    const files = await fs.readdir(path.join(process.cwd(), "src", "translations-json", "EN"));

    console.log(`Found ${files.length} files to translate.`);

    for (const file of files) {
        const originalFilePath = path.join(process.cwd(), "src", "translations-json", "EN", file);
        const outputFilePath = path.join(outputDir, file);

        const translations = new Map();

        if (fs.existsSync(outputFilePath)) {
            console.log(`File ${file} already exists, loading existing translations...`);
            const existingTranslations = await fs.readJSON(outputFilePath);
            for (const key in existingTranslations) {
                const value = existingTranslations[key];
                console.log(`Existing translation for ${key}: ${value}`);
                translations.set(key, value);
            }
        }

        const content = new Map(Object.entries(await fs.readJSON(originalFilePath)));

        const toTranslate = new Map(
            [...content.entries()]
                .filter(([key, value]) => !translations.has(key))
        );

        console.log(`Number of entries to translate: ${toTranslate.size}`);

        for (const [key, value] of toTranslate) {
            console.log(`Translating ${key}`);
            const translation = await translate(value, { to: language });
            translations.set(key, translation.text);
            console.log(`Translated ${value} => ${translations.get(key)}`);
        }

        console.log(`Saving translations for ${file}...`);

        const sortedTranslations = new Map([...translations.entries()].sort());
        const translationsObject = Object.fromEntries(sortedTranslations);
        const formattedTranslations = JSON.stringify(translationsObject, null, 4);

        await fs.writeFile(outputFilePath, formattedTranslations);
    }
}

/**
 * Generates the mod.info file for the translated mod, updating the id, name, and require fields to include the locale.
 * @param {string} outputPath The path to the output directory where the mod.info file should be created
 * @param {string} locale The locale to include in the mod ID and name
 * @param {string} language The language for the description translation
 */
async function generateModInfo(outputPath, locale, language) {
    const { id, name, modInfo } = getInfo();
    const description = (await translate(`Translation of ${name} to ${locale.toUpperCase()}`, { to: language })).text;
    const infoContent = stringifyInfoFile({
        ...modInfo,
        id: `${id}-${locale.toLowerCase()}`,
        name: `${name} - ${locale.toUpperCase()}`,
        description,
        require: [
            ...modInfo.require,
            id
        ]
    });
    await fs.ensureDir(path.join(outputPath, "42"));
    await fs.writeFile(path.join(outputPath, "42", "mod.info"), infoContent);
    await fs.writeFile(path.join(outputPath, "mod.info"), infoContent);
}

/**
 * Copies the media files to the output directory.
 * @param {string} outputPath The path to the output directory
 */
async function copyMedia(outputPath) {
    fs.ensureDirSync(outputPath);
    await copyFolder(path.join(process.cwd(), "src", "root"), path.join(outputPath));
    await copyFolder(path.join(process.cwd(), "src", "root"), path.join(outputPath, "42"));
}

/**
 * Gets the language argument from the command line and validates it.
 * @returns {string} The validated language argument
 */
function getLanguageArg() {
    const program = new Command();

    program
        .argument(
            "<language>",
            "The language to translate to"
        )
        .parse();

    const args = program.args;

    const [language] = args;
    if (!language) {
        console.error("Please specify a language");
        process.exit(1);
    }

    if (!languages[language]) {
        console.error(`Language ${language} is not supported`);
        process.exit(1);
    }

    return language;
}

/**
 * Main function to run the translation process
 */
async function main() {

    const language = getLanguageArg();
    const locale = getLocale(language);
    const outputPath = await createOutputFolder(locale);
    
    await generateTranslations(language, locale, outputPath);
    await generateModInfo(outputPath, locale, language);
    await copyMedia(outputPath);
    
}

main()
    .then(() => {
        console.log("Translations - Done!");
    })
    .catch((err) => {
        console.error("Translations - Error generating translations:", err);
        process.exit(1);
    });