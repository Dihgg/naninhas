import { ScriptManager } from "@asledgehammer/pipewrench";
import { TooltipPatcher } from "@client/components/TooltipPatcher";
import { mock } from "jest-mock-extended";

// Values must be literals here: jest.mock factories are hoisted before any
// const declarations, so external variables cannot be referenced inside them.
jest.mock("@constants", () => ({
	PlushieNames: {
		ALPHA: "MockAlpha",
		BETA: "MockBeta",
	}
}));

describe("TooltipPatcher", () => {
	const scriptManagerMock = mock<ScriptManager>();
	
	it('should instantiate the TooltipPatcher', () => {
		const patcher = new TooltipPatcher();
		expect(patcher).toBeInstanceOf(TooltipPatcher);
	});

	it.each([
		'MockModule1',
		'MockModule2',
	])('should call getItem for each plushie and module %s', (moduleName) => {
		const getItemSpy = jest.spyOn(scriptManagerMock, 'getItem');
		new TooltipPatcher(scriptManagerMock, [moduleName]);
		expect(getItemSpy).toHaveBeenCalledWith(`${moduleName}.MockAlpha`);
		expect(getItemSpy).toHaveBeenCalledWith(`${moduleName}.MockBeta`);
	});
});
