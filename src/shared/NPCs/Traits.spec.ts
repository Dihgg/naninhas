import { Traits } from "../components/Traits";
jest.mock("../components/Traits");

describe("TraitClass event registration", () => {
	it("The TraitClass should be initialized", () => {
		// triggers event registration
		require("./Traits");
		expect(Traits).toHaveBeenCalled();
	});
});
