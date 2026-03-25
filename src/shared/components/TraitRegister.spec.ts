describe("TraitRegister", () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	it("returns a noop register when TraitFactory is unavailable", () => {
		jest.isolateModules(() => {
			jest.doMock("@asledgehammer/pipewrench", () => ({
				TraitFactory: undefined,
			}));

			const { TraitRegister } = require("./TraitRegister") as typeof import("./TraitRegister");
			const register = TraitRegister.create();

			expect(register.isAvailable()).toBe(false);
			expect(() =>
				register.addTrait("Mocked", "Mocked Name", 2, "Mocked Description", false)
			).not.toThrow();
			expect(() => register.setMutualExclusive("Mocked", "Other")).not.toThrow();
		});
	});

	it("returns a noop register when TraitFactory is partially implemented", () => {
		jest.isolateModules(() => {
			const addTrait = jest.fn();
			jest.doMock("@asledgehammer/pipewrench", () => ({
				TraitFactory: { addTrait },
			}));

			const { TraitRegister } = require("./TraitRegister") as typeof import("./TraitRegister");
			const register = TraitRegister.create();

			expect(register.isAvailable()).toBe(false);
			register.addTrait("Mocked", "Mocked Name", 2, "Mocked Description", false);
			expect(addTrait).not.toHaveBeenCalled();
		});
	});

	it("returns a pipewrench register when TraitFactory is fully available", () => {
		jest.isolateModules(() => {
			const addTrait = jest.fn();
			const setMutualExclusive = jest.fn();
			jest.doMock("@asledgehammer/pipewrench", () => ({
				TraitFactory: { addTrait, setMutualExclusive },
			}));

			const { TraitRegister } = require("./TraitRegister") as typeof import("./TraitRegister");
			const register = TraitRegister.create();

			expect(register.isAvailable()).toBe(true);

			register.addTrait("Mocked", "Mocked Name", 2, "Mocked Description", true);
			register.setMutualExclusive("Mocked", "Other");

			expect(addTrait).toHaveBeenCalledWith("Mocked", "Mocked Name", 2, "Mocked Description", true);
			expect(setMutualExclusive).toHaveBeenCalledWith("Mocked", "Other");
		});
	});
});
