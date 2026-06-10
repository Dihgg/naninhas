import * as Events from "@asledgehammer/pipewrench-events";
const spyNew = jest.fn();
const patchTooltips = jest.fn();
class MockedClass {
	constructor(...args: never[]) {
		spyNew(...args);
	}
}

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@client/components/Naninhas", () => ({
	Naninhas: MockedClass
}));
jest.mock("@client/components/TooltipPatcher", () => ({
	TooltipPatcher: class {
		constructor(...args: never[]) {
			patchTooltips(...args);
		}
	}
}));

describe("Naninhas event registration", () => {
	const addListener = jest.fn();
	const addBootListener = jest.fn();
	beforeEach(() => {
		spyNew.mockReset();
		patchTooltips.mockReset();
		(Events as any).onCreatePlayer = { addListener };
		(Events as any).onGameBoot = { addListener: addBootListener };
		addListener.mockReset();
		addBootListener.mockReset();
	});

	it("The Naninhas should be initialized", () => {
		jest.isolateModules(() => {
			require("./Naninhas");
		});
		const [callback] = addListener.mock.calls[0];
		callback();
		expect(patchTooltips).not.toHaveBeenCalled();
		expect(spyNew).toHaveBeenCalled();
	});

	it("applies tooltip patch on game boot", () => {
		jest.isolateModules(() => {
			require("./Naninhas");
		});
		const [callback] = addBootListener.mock.calls[0];
		callback();
		expect(patchTooltips).toHaveBeenCalledTimes(1);
	});
});
