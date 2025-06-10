import { mock } from "jest-mock-extended";
import { Plushie } from "./Plushie";
import { IsoPlayer } from "@asledgehammer/pipewrench";

describe("Plushie", () => {
	const mockPlayer = () =>
		mock<IsoPlayer>({
			getModData: jest
				.fn()
				.mockImplementationOnce(() => ({}))
				.mockImplementation(() => ({
					Naninhas: { addedTraits: [], suppressedTraits: [] }
				}))
		});

	class ExamplePlushie extends Plushie {}

	it("Should instantiate a Plushie abstracted class", () => {
		const player = mockPlayer();
		const plushie = new ExamplePlushie({
			player,
			name: "mocked"
		});
		expect(plushie).toBeInstanceOf(ExamplePlushie);
	});

	it("When updating, the getModData should be called", () => {
		const player = mockPlayer();
		const plushie = new ExamplePlushie({
			player,
			name: "mocked"
		});
		plushie.update();
		expect(player.getModData).toHaveBeenCalled();
	});

	describe("Player does not have the Trait", () => {
		const mockedAddTraitsFn = jest.fn();
		const mockedRemoveTraitsFn = jest.fn();
		afterEach(() => {
			mockedAddTraitsFn.mockReset();
			mockedRemoveTraitsFn.mockReset();
		});

		const playerWithTraits = (hasTrait: boolean = false) => ({
			...mockPlayer(),
			HasTrait: jest.fn().mockReturnValue(hasTrait),
			getTraits: jest.fn().mockImplementation(() => ({
				add: mockedAddTraitsFn,
				remove: mockedRemoveTraitsFn
			}))
		});

		it("Should add trait if player does not have it", () => {
			const player = playerWithTraits();
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedAddTraitsFn).toHaveBeenCalledWith("mockedTrait");
		});

		it("Should suppress trait if player has it", () => {
			const player = playerWithTraits(true);
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToSuppress: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedRemoveTraitsFn).toHaveBeenCalledWith("mockedTrait");
		});

		it("Should add Plushie exclusive trait only once", () => {
			const player = playerWithTraits();
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			plushie.subscribe();
			expect(mockedAddTraitsFn).toHaveBeenNthCalledWith(1, "mockedTrait");
		});

		it("Should remove Plushie exclusive trait", () => {
			const player = playerWithTraits();
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			plushie.unsubscribe();
			expect(mockedRemoveTraitsFn).toHaveBeenNthCalledWith(1, "mockedTrait");
		});

		it("Should restore suppressed traits on unsubscribe", () => {
			const player = playerWithTraits(true);
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToSuppress: ["mockedTrait"]
			});
			plushie.subscribe();
			plushie.unsubscribe();
			expect(mockedAddTraitsFn).toHaveBeenNthCalledWith(1, "mockedTrait");
		});

		it("Do not add Trait if Player has the Trait", () => {
			const player = {
				...playerWithTraits(),
				HasTrait: jest.fn().mockReturnValue(true)
			};
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedAddTraitsFn).not.toHaveBeenCalled();
		});
	});
});
