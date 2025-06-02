const { pathsToModuleNameMapper, createDefaultPreset } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  // extensionsToTreatAsEsm:['.ts'],
  setupFiles: [
    "./test/mock.ts"
  ],
  transform: {
    ...tsJestTransformCfg,
  },
  // modulePaths: ['./<rootDir>', 'node_modules'],
  // moduleDirectories: ['./<rootDir>', 'node_modules'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>" }),
  coverageDirectory: './coverage',
  moduleFileExtensions: ['js', 'json', 'ts', 'd.ts', 'node'],
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  transformIgnorePatterns: [
    // '/node_modules/(?!<module-name>).+\\.js$',
  ],
};