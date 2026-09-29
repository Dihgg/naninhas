const fs = require("fs-extra");
const path = require("path");

/**
 * Patches PipeWrench-generated Lua for the current Project Zomboid runtime.
 *
 * - client.lua and PipeWrench.lua:
 *   Rewrites generated global lookup stubs to direct `_G['Y']` access. Both
 *   embedded-require and plain lookup forms are supported because Project
 *   Zomboid 42.20.4 removed `loadstring`.
 * - PipeWrench.lua:
 *   Removes obsolete dynamic compilation exports that the game no longer
 *   implements and Naninhas does not use.
 * - lualib_bundle.lua:
 *   Replaces test fixture import with runtime-safe `require "ISBaseObject"`.
 *
 * @param {string} basePath
 */
const patchPipeWrenchLua = async basePath => {
	const glob = await fs.readdir(basePath, { recursive: true });

	const allFiles = Array.isArray(glob) ? glob.map(filePath => path.join(basePath, filePath)) : [];

	for (const filePath of allFiles) {
		const base = path.basename(filePath);

		if (base !== "client.lua" && base !== "PipeWrench.lua" && base !== "lualib_bundle.lua") {
			continue;
		}

		const stat = await fs.stat(filePath);
		if (!stat.isFile()) {
			continue;
		}

		const content = await fs.readFile(filePath, "utf8");
		const patched = patchPipeWrenchContent(base, content);

		if (patched !== content) {
			await fs.writeFile(filePath, patched, "utf8");
		}
	}
};

/**
 * Applies supported transformations to one known generated Lua file.
 *
 * @param {string} baseName generated Lua file basename
 * @param {string} content generated Lua source
 * @returns {string} patched Lua source
 */
const patchPipeWrenchContent = (baseName, content) => {
	if (baseName === "client.lua" || baseName === "PipeWrench.lua") {
		content = content.replace(
			/loadstring\("(?:require\('[^']+'\);)?return _G\['([^']+)'\]"\)\(\)/g,
			"_G['$1']"
		);
	}

	if (baseName === "PipeWrench.lua") {
		content = content
			.replace(/^function Exports\.loadstring\(lua\) return loadstring\(lua\) end\r?\n/gm, "")
			.replace(
				/^function Exports\.execute\(lua\) return loadstring\(lua\)\(\) end\r?\n/gm,
				""
			);
	}

	if (baseName === "lualib_bundle.lua") {
		content = content.replace(
			/require\s+"tests\/classExtendEachOther\/base\/ISBaseObject"/g,
			'require "ISBaseObject"'
		);
	}

	return content;
};

module.exports = {
	patchPipeWrenchLua
};
