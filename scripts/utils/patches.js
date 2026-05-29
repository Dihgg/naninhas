const fs = require("fs-extra");
const path = require("path");

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

module.exports = {
	patchPipeWrenchLua
};