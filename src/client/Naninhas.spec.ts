const spyNew = jest.fn();
class MockedClass {
	constructor(...args: never[]) {
		spyNew(...args);
	}
}

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./components/NaninhasClass", () => ({
	Naninhas: MockedClass
}));

describe("Naninhas event registration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();
	});
	
	it("The Naninhas should be initialized", () => {
		require("./Naninhas"); // triggers event registration
		expect(spyNew).toHaveBeenCalled();
	});
});
