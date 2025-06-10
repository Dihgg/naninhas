jest.mock("../components/TraitsClass");

describe("TraitClass event registration", () => {
	
	it("The TraitClass should be initialized", () => {
		jest.mock("../components/TraitsClass");
		const { TraitsClass } = require("../components/TraitsClass");
		require("./Traits"); // triggers event registration
		expect(TraitsClass).toHaveBeenCalled();
	});
});
