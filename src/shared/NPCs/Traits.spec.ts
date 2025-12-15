import { Traits } from "../components/Traits";
jest.mock("../components/Traits");

describe("TraitClass event registration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it.each([41, 42])("The TraitClass should be initialized on version %s", major => {
		jest.isolateModules(() => {
			jest.doMock("@shared/utils", () => ({
				getVersion: () => ({
					major,
					minor: 20
				})
			}));
			require("./Traits");
		});

		expect(Traits).toHaveBeenCalledTimes(major < 42 ? 1 : 0);
	});
});
