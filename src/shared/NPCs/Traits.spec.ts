import { Traits } from "../components/Traits";
jest.mock("../components/Traits");

describe("TraitClass event registration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it.each([41, 42])("The TraitClass should be initialized on version %s", major => {
		jest.isolateModules(() => {
			require("./Traits");
		});

		expect(Traits).toHaveBeenCalledTimes(1);
	});
});
