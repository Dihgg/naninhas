import { getVersion, isB42 } from "@shared/utils";

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
	});
	describe("getVersion", () => {
		it("should return a valid game version", () => {
			const { major, minor } = getVersion();
			expect(major).toBe(41);
			expect(minor).toBe(20);
		});
	});
	describe("isB42", () => {
		it("should return false for Build 41", () => {
			expect(isB42()).toBe(false);
		});
	});
	afterEach(() => {
		(globalThis as any) = originalGlobal;
	});
});