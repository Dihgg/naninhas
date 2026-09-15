import { isDebugEnabled } from "@asledgehammer/pipewrench";
import { Logger } from "@shared/components/Logger";

jest.mock("@asledgehammer/pipewrench");

describe("Logger", () => {
	const debugMock = isDebugEnabled as jest.MockedFunction<typeof isDebugEnabled>;
	const printSpy = jest.spyOn(globalThis, "print");
	const logger = new Logger("SleepBuff");

	beforeEach(() => {
		printSpy.mockClear();
	});

	it("does not print outside debug mode", () => {
		debugMock.mockReturnValue(false);
		logger.debug("hidden", ["Client", "Detector"]);
		expect(printSpy).not.toHaveBeenCalled();
	});

	it("prints the configured module and scope in debug mode", () => {
		debugMock.mockReturnValue(true);
		logger.debug("visible", ["Client", "Detector"]);
		expect(printSpy).toHaveBeenCalledWith("[Naninhas][SleepBuff][Client][Detector] visible");
	});

	it("formats empty lists explicitly", () => {
		expect(Logger.formatList([])).toBe("none");
		expect(Logger.formatList(["Doll", "Spiffo"])).toBe("Doll, Spiffo");
	});
});
