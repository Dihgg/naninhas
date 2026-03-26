import { Traits } from "@shared/components/Traits";
jest.mock("@shared/components/Traits");

describe("TraitClass event registration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it("The TraitClass should be initialized", () => {
		jest.isolateModules(() => {
			require("./Traits");
		});

		expect(Traits).toHaveBeenCalledTimes(1);
	});
});
