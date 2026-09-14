module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/eslint-recommended"
	],
	ignorePatterns: ["dist/**/*", "scripts/", "jest.config.js"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	root: true,
	rules: {
		"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
	},
	overrides: [
		{
			files: ["**/*.spec.*", "**/__mocks__/**/*"],
			env: {
				jest: true
			},
			rules: {
				"@typescript-eslint/no-explicit-any": "off",
				"@typescript-eslint/no-var-requires": "off"
			}
		}
	]
};
