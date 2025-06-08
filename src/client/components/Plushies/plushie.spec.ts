import { mock } from "jest-mock-extended";
import { Plushie } from "./Plushie";
import { IsoPlayer } from "@asledgehammer/pipewrench";

describe("Plushie", () => {

	const mockPlayer = () => mock<IsoPlayer>({
		getModData: jest.fn()
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
		const mockedTraitsFn = jest.fn();
		afterEach(() => {
			mockedTraitsFn.mockReset();
		});

		const playerWithTraits = () => ({
			...mockPlayer(),
			HasTrait: jest.fn().mockReturnValue(false),
			getTraits: jest.fn().mockImplementation(() => ({
				add: mockedTraitsFn,
				remove: mockedTraitsFn,
			})),
		});
	
		it("Should add trait if player does not have it", () => {
			const player = playerWithTraits();
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedTraitsFn).toHaveBeenCalledWith("mockedTrait");
		});

		it("Should add Plushie exclusive trait onlu once", () => {
			const player = playerWithTraits();
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			plushie.subscribe();
			expect(mockedTraitsFn).toHaveBeenNthCalledWith(1, "mockedTrait");
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
			expect(mockedTraitsFn).toHaveBeenNthCalledWith(2, "mockedTrait");
		});

		it("Do not add Trait if Player has the Trait", () => {
			const player = {
				...playerWithTraits(),
				HasTrait: jest.fn().mockReturnValue(true),
			};
			const plushie = new ExamplePlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedTraitsFn).not.toHaveBeenCalled();
		});
	});
});
