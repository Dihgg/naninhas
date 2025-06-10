const { pathsToModuleNameMapper, createDefaultPreset } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

const { transform } = createDefaultPreset();

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: "node",
	preset: "ts-jest",
	rootDir: "src",
	setupFiles: ["./test/mock.ts"],
	transform,
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
		prefix: "<rootDir>"
	}),
	coverageDirectory: "../coverage",
	moduleFileExtensions: ["js", "json", "ts", "d.ts", "node"],
	testRegex: ".*\\.spec\\.ts$",
	collectCoverageFrom: ["**/*.(t|j)s"],
	coveragePathIgnorePatterns: ["index.(t|j)s"],
	transformIgnorePatterns: ["/node_modules/(?!<module-name>).+\\.js$"]
};
