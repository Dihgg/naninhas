import { TooltipPatcher } from "@client/components/TooltipPatcher";

const MOCK_PLUSHIE_NAMES = {
	ALPHA: "MockAlpha",
	BETA: "MockBeta",
};

// Values must be literals here: jest.mock factories are hoisted before any
// const declarations, so external variables cannot be referenced inside them.
jest.mock("@constants", () => ({
	PlushieNames: {
		ALPHA: "MockAlpha",
		BETA: "MockBeta",
	}
}));

describe("TooltipPatcher", () => {
	let calls: string[];
	let scriptManager: { getItem: (fullType: string) => { DoParam: (param: string) => void } | undefined };

	beforeEach(() => {
		calls = [];
		scriptManager = {
			getItem: (fullType: string) => ({
				DoParam: (param: string) => {
					calls.push(`${fullType}|${param}`);
				}
			})
		};
		new TooltipPatcher(scriptManager as any);
	});

	it("patches the expected total number of items", () => {
		expect(calls).toHaveLength(6);
	});

	it.each([
		["AuthenticZClothing", MOCK_PLUSHIE_NAMES.ALPHA],
		["AuthenticZBackpacksPlus", MOCK_PLUSHIE_NAMES.ALPHA],
		["AuthenticZLite", MOCK_PLUSHIE_NAMES.ALPHA],
		["AuthenticZClothing", MOCK_PLUSHIE_NAMES.BETA],
		["AuthenticZBackpacksPlus", MOCK_PLUSHIE_NAMES.BETA],
		["AuthenticZLite", MOCK_PLUSHIE_NAMES.BETA],
	])("patches %s.%s tooltip", (mod, name) => {
		expect(calls).toContain(`${mod}.${name}|Tooltip = Tooltip_${name}`);
	});

	it("skips fullTypes that are not present in script manager", () => {
		const absent = `AuthenticZLite.${MOCK_PLUSHIE_NAMES.BETA}`;
		const partialCalls: string[] = [];
		const partialScriptManager = {
			getItem: (fullType: string) => {
				if (fullType === absent) {
					return undefined;
				}

				return {
					DoParam: (param: string) => {
						partialCalls.push(`${fullType}|${param}`);
					}
				};
			}
		};

		new TooltipPatcher(partialScriptManager as any);
		expect(partialCalls).not.toContain(`${absent}|Tooltip = Tooltip_${MOCK_PLUSHIE_NAMES.BETA}`);
	});
});
