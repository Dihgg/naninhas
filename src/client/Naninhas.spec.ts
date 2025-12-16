import * as Events from "@asledgehammer/pipewrench-events";
const spyNew = jest.fn();
class MockedClass {
	constructor(...args: never[]) {
		spyNew(...args);
	}
}

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@client/components/Naninhas", () => ({
	Naninhas: MockedClass
}));

describe("Naninhas event registration", () => {
	const addListener = jest.fn();
	beforeEach(() => {
		(Events as any).onCreatePlayer = { addListener };
	});
	it("The Naninhas should be initialized", () => {
		require("./Naninhas"); // triggers event registration
		const [callback] = addListener.mock.calls[0];
		callback();
		expect(spyNew).toHaveBeenCalled();
	});
});
