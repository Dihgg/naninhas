const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const cliProgress = require("cli-progress");

const optimizeImage = async (srcFilePath, destFilePath) => {
	try {
		const ext = path.extname(srcFilePath).toLowerCase();
		const image = sharp(srcFilePath);
		if (ext === ".png") {
			await image.png({ quality: 80, compressionLevel: 9 }).toFile(destFilePath);
		} else if (ext === ".jpg" || ext === ".jpeg") {
			await image.jpeg({ quality: 80 }).toFile(destFilePath);
		}
	} catch (error) {
		console.error(`⚠️ Failed to optimize image ${srcFilePath}:`, error);
	}
};

// Recursively gather all files first
const gatherAllFiles = async (dir) => {
	const items = await fs.readdir(dir, { withFileTypes: true });
	const filePaths = [];

	for (const item of items) {
		const fullPath = path.join(dir, item.name);
		if (item.isDirectory()) {
			const subFiles = await gatherAllFiles(fullPath);
			filePaths.push(...subFiles);
		} else {
			filePaths.push(fullPath);
		}
	}
	return filePaths;
};

const copyAndOptimizeRecursive = async (srcDir, destDir, progressBar) => {
	const items = await fs.readdir(srcDir, { withFileTypes: true });
	await fs.ensureDir(destDir);

	for (const item of items) {
		const srcPath = path.join(srcDir, item.name);
		const destPath = path.join(destDir, item.name);

		if (item.isDirectory()) {
			await copyAndOptimizeRecursive(srcPath, destPath, progressBar);
		} else {
			const ext = path.extname(item.name).toLowerCase();
			const isImage = [".png", ".jpg", ".jpeg"].includes(ext);

			if (isImage) {
				await optimizeImage(srcPath, destPath);
			} else {
				await fs.copy(srcPath, destPath);
			}

			progressBar.increment();
		}
	}
};

const copyFolder = async (srcPath, destPath) => {
	const pipewrenchJsonPath = path.join(process.cwd(), "pipewrench.json");
	const { modInfo: { name } } = JSON.parse(fs.readFileSync(pipewrenchJsonPath, "utf8"));

	const srcDir = path.join(process.cwd(), ...srcPath.split("/"));
	const destDir = path.join(process.cwd(), "dist", name, "media", ...destPath.split("/"));

	if (!fs.existsSync(srcDir)) return;

	console.log(`📁 Copying and optimizing files from ${srcDir} to ${destDir}...`);

	const allFiles = await gatherAllFiles(srcDir);

	// Initialize progress bar
	const progressBar = new cliProgress.SingleBar({
		format: "Progress |{bar}| {percentage}% | {value}/{total} files",
		barCompleteChar: "█",
		barIncompleteChar: "░",
		hideCursor: true
	});
	progressBar.start(allFiles.length, 0);

	await copyAndOptimizeRecursive(srcDir, destDir, progressBar);

	progressBar.stop();
	console.log("✅ Copy and optimization complete!");
};

exports.copyFolder = copyFolder;
