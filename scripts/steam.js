const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const archiver = require("archiver");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");
const { copyFolder, getInfo } = require("./utils");

const md = new MarkdownIt({
	html: false,
	linkify: false,
	typographer: false
});

/**
 * Extract Steam workshop version from package.json.
 * Steam expects an integer value, so we use the major semver.
 * @returns {Promise<string>}
 */
const getWorkshopVersion = async () => {
	const packageJsonPath = path.join(process.cwd(), "package.json");
	if (!(await fs.pathExists(packageJsonPath))) {
		return "1";
	}

	const packageJson = await fs.readJson(packageJsonPath);
	const version = String(packageJson.version ?? "1");
	const major = version.match(/^\d+/)?.[0];
	return major ?? "1";
};

/**
 * Normalize tags frontmatter into Steam workshop format.
 * @param {unknown} rawTags
 * @returns {string}
 */
const normalizeTags = rawTags => {
	if (Array.isArray(rawTags)) {
		return rawTags.map(tag => String(tag).trim()).filter(Boolean).join(";");
	}

	if (typeof rawTags === "string") {
		return rawTags
			.split(",")
			.map(tag => tag.trim())
			.filter(Boolean)
			.join(";");
	}

	return "";
};

/**
 * Render inline markdown-it tokens to Steam BBCode.
 * @param {import("markdown-it/lib/token")[]} children
 * @returns {string}
 */
const renderInlineTokens = children => {
	let out = "";

	for (const child of children) {
		switch (child.type) {
			case "text":
				out += child.content;
				break;
			case "strong_open":
				out += "[b]";
				break;
			case "strong_close":
				out += "[/b]";
				break;
			case "em_open":
				out += "[i]";
				break;
			case "em_close":
				out += "[/i]";
				break;
			case "link_open": {
				const href = child.attrGet("href") ?? "";
				out += `[url=${href}]`;
				break;
			}
			case "link_close":
				out += "[/url]";
				break;
			case "image": {
				const src = child.attrGet("src") ?? "";
				out += `[img]${src}[/img]`;
				break;
			}
			case "code_inline":
				out += `[code]${child.content}[/code]`;
				break;
			case "softbreak":
			case "hardbreak":
				out += " ";
				break;
			default:
				break;
		}
	}

	return out;
};

/**
 * Convert markdown body to Steam BBCode description.
 * @param {string} markdown
 * @returns {string}
 */
const markdownToBbcode = markdown => {
	const tokens = md.parse(markdown, {});
	let out = "";
	const headingStack = [];

	for (const token of tokens) {
		switch (token.type) {
			case "heading_open": {
				const level = Number(token.tag.replace("h", "")) || 2;
				headingStack.push(level);
				out += `[h${level}]`;
				break;
			}
			case "heading_close": {
				const level = headingStack.pop() ?? 2;
				out += `[/h${level}] `;
				break;
			}
			case "hr":
				out += "[hr][/hr] ";
				break;
			case "bullet_list_open":
				out += "[list] ";
				break;
			case "bullet_list_close":
				out += "[/list] ";
				break;
			case "ordered_list_open":
				out += "[list] ";
				break;
			case "ordered_list_close":
				out += "[/list] ";
				break;
			case "list_item_open":
				out += "[*]";
				break;
			case "list_item_close":
				out += " ";
				break;
			case "inline":
				out += renderInlineTokens(token.children ?? []);
				break;
			case "code_block":
			case "fence":
				out += `[code]${token.content}[/code] `;
				break;
			case "paragraph_close":
				out += " ";
				break;
			default:
				break;
		}
	}

	return out.replace(/\s+/g, " ").trim();
};

/**
 * Generate workshop.txt from workshop.md.
 * @param {string} workshopMdPath
 * @param {string} [outputTxtPath]
 * @returns {Promise<string | null>} generated path
 */
async function generateWorkshopTxt(workshopMdPath, outputTxtPath) {
	if (!(await fs.pathExists(workshopMdPath))) {
		console.warn(`workshop.md not found at ${workshopMdPath}. Skipping workshop.txt generation.`);
		return null;
	}

	const workshopMd = await fs.readFile(workshopMdPath, "utf8");
	const { data, content } = matter(workshopMd);
	const version = await getWorkshopVersion();

	const id = String(data.id ?? "").trim();
	const title = String(data.title ?? "").trim();
	const tags = normalizeTags(data.tags);
	const visibility = String(data.visibility ?? "public").trim();
	const description = markdownToBbcode(content);

	if (!id || !title) {
		throw new Error("workshop.md frontmatter must include both 'id' and 'title'.");
	}

	const workshopTxtPath = outputTxtPath ?? path.join(path.dirname(workshopMdPath), "workshop.txt");
	const workshopTxt = [
		`version=${version}`,
		`id=${id}`,
		`title=${title}`,
		`description=${description}`,
		`tags=${tags}`,
		`visibility=${visibility}`
	].join("\n");

	await fs.writeFile(workshopTxtPath, `${workshopTxt}\n`, "utf8");
	console.info(`Generated workshop.txt at ${workshopTxtPath}`);

	return workshopTxtPath;
}

/**
 * Creates a zip for steam workshop
 */
async function prepareSteamZip() {
	const { name, zipname } = getInfo();
	const tempPath = path.join(os.tmpdir(), `${name}-temp`);
	// steam workshop expectets the following structure mod-name/contents/mods/mod-name
	const modPath = path.join(tempPath, "contents", "mods");

	// Ensure folder structure in temp directory
	fs.ensureDirSync(modPath);

	// copy preview image to temp folder root for steam workshop
	await fs.copy(path.join(process.cwd(), "steam", "preview.png"), path.join(tempPath, "preview.png"));

	// generate workshop.txt
	const workshopTxtPath = await generateWorkshopTxt(path.join(process.cwd(), "steam", "workshop.md"));
	if (workshopTxtPath) {
		await fs.copy(workshopTxtPath, path.join(tempPath, "workshop.txt"));
	}

	// Copy mod files to the expected modPath
	await copyFolder(path.join(process.cwd(), "dist"), modPath);

	// Create zip
	const finalZipName = zipname.replace(".zip", "-steam.zip");
	const output = fs.createWriteStream(finalZipName);
	const archive = archiver("zip", { zlib: { level: 9 } });

	output.on("close", () => {
		console.info(`${finalZipName} has been created.`);
	});

	archive.pipe(output);
	archive.directory(tempPath, name);
	await archive.finalize();

	fs.removeSync(tempPath);
}

prepareSteamZip().catch(err => {
	console.error("Error preparing Steam zip file:", err);
});
