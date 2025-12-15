import { getVersion } from "@shared/utils";

jest.mock("@asledgehammer/pipewrench", () => ({
	getCore: () => ({
		getVersionNumber: () => "41.20"
	})
}));


describe("Utils", () => {
	const originalGlobal = globalThis;
	beforeEach(() => {
		(globalThis as any).string = {
			match: (version: string) => {
				const [, major, minor] = version.match(/(\d+)\.(\d+)/) ?? [];
				return [ major, minor ];
			}
		};
	})
	it("should return a valid game version", () => {
		const { major, minor } = getVersion();
		expect(major).toBe(41);
		expect(minor).toBe(20);
	});
	afterEach(() => {
		(globalThis as any) = originalGlobal;
	});
});