const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const {
	copyFolder,
	getInfo,
	extractFrontMatterData,
	markdownToBbcode
} = require("./utils");

/**
 * Generate workshop.txt from workshop.md.
 * @param {string} workshopMdPath
 * @param {string} [outputTxtPath]
 */
async function generateWorkshopTxt(workshopMdPath, outputTxtPath) {
	if (!(await fs.pathExists(workshopMdPath))) {
		console.warn(`workshop.md not found at ${workshopMdPath}. Skipping workshop.txt generation.`);
		return null;
	}

    const { version } = getInfo();

	const workshopMd = (await fs.readFile(workshopMdPath, "utf8"));
	const { extracted, content } = extractFrontMatterData(workshopMd, {
		id: "string",
		title: "string",
		tags: "array",
		visibility: "string"
	});

	const { id, title, tags, visibility } = extracted;
	const description = markdownToBbcode(content);

	const workshopTxt = [
		`version=${version}`,
		`id=${id}`,
		`title=${title}`,
		`description=${description}`,
		`tags=${tags}`,
		`visibility=${visibility}`
	].join("\n");

	await fs.writeFile(outputTxtPath, `${workshopTxt}\n`, "utf8");
	console.info(`Generated workshop.txt at ${outputTxtPath}`);
}

/**
 * Creates a zip for steam workshop
 */
async function prepareSteam() {
	const { name } = getInfo();
	const tempPath = path.join(os.tmpdir(), `${name}-temp`);

	// steam workshop expects the following structure mod-name/contents/mods/mod-name
	const modPath = path.join(tempPath, "contents", "mods");

	const workshopPath = path.join(os.homedir(), "Zomboid", "Workshop", name);

	// Ensure folder structure in temp directory
	await fs.ensureDir(modPath);

	// copy preview image to temp folder root for steam workshop
	await fs.copy(path.join(process.cwd(), "steam", "preview.png"), path.join(tempPath, "preview.png"));

	// generate workshop.txt
	await generateWorkshopTxt(
        path.join(process.cwd(), "steam", "workshop.md"),
        path.join(tempPath, "workshop.txt")
    );

	// Copy mod files to the expected modPath
	await copyFolder(path.join(process.cwd(), "dist"), modPath);

	// Move the temp folder to workshop
	if((await fs.pathExists(workshopPath))) {
		await fs.remove(workshopPath);
		console.info(`Removed existing ${name} folder at: ${workshopPath}`);
	}

	await fs.ensureDir(workshopPath);

	await copyFolder(tempPath, workshopPath);

	console.info(`Steam workshop files prepared at: ${workshopPath}`);
	
	fs.removeSync(tempPath);
}

prepareSteam().catch(err => {
	console.error("Error preparing Steam zip file:", err);
});
