import { TraitsClass } from "../components/TraitsClass";
jest.mock("../components/TraitsClass");

describe("TraitClass event registration", () => {
	it("The TraitClass should be initialized", () => {
		// triggers event registration
		require("./Traits");
		expect(TraitsClass).toHaveBeenCalled();
	});
});
