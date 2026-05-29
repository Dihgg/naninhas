const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const { copyFolder, getInfo, distPath } = require("./utils");

const archiver = require("archiver");

/**
 * Creates a easy to share zip
 */
const createZip = async () => {
	if (!(await fs.pathExists(distPath()))) {
		console.error("Error: dist path does not exist. Please run the build script first.");
		process.exit(1);
	}

	const { name, zipname } = getInfo();
	const tempDir = path.join(os.tmpdir(), `${name}-temp`);

	fs.ensureDirSync(tempDir);

	await copyFolder(distPath(), tempDir);

	const output = fs.createWriteStream(zipname);
	const archive = archiver("zip", { zlib: { level: 9 } });

	archive.pipe(output);
	archive.directory(tempDir, false);
	await archive.finalize();

	fs.removeSync(tempDir);
	console.log(`Zip file created successfully: ${zipname}`);
};

createZip().catch(err => {
	console.error("Error preparing zip file:", err);
});
