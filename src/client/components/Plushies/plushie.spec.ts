import { mock } from "jest-mock-extended";
import { Plushie } from "./Plushie";
import {IsoPlayer, Perks} from "@asledgehammer/pipewrench";

jest.mock("@components/TraitsClass", () => ({
	TraitsClass: {
		getPerkBoostsForTrait: jest.fn(() => [
			{ perk: Perks.Woodwork, value: 1 }
		])
	}
}));

describe("Plushie", () => {
	const AddXPNoMultiplier = jest.fn();
	const mockedAddTraitsFn = jest.fn();
	const mockedRemoveTraitsFn = jest.fn();
	
	const mockPlayer = (hasTrait = false) =>
		mock<IsoPlayer>({
			HasTrait: jest.fn().mockReturnValue(hasTrait),
			getTraits: jest.fn().mockImplementation(() => ({
				addAll: mockedAddTraitsFn,
				removeAll: mockedRemoveTraitsFn,
			})),
			getXp: jest.fn().mockImplementation(() => ({
				AddXPNoMultiplier
			})),
			getModData: jest
				.fn()
				.mockImplementationOnce(() => ({}))
				.mockImplementation(() => ({
					Naninhas: { addedTraits: [], suppressedTraits: [] }
				}))
		});

	class TestPlushie extends Plushie {}

	it("Should instantiate a Plushie abstracted class", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});
		expect(plushie).toBeInstanceOf(TestPlushie);
	});

	it("Should call AddXPNoMultiplier when applying a trait boost", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked",
			traitsToAdd: ["mockedTrait"]
		});
		
		plushie.subscribe();
		expect(AddXPNoMultiplier).toHaveBeenCalledWith(Perks.Woodwork, 1);
	});
	
	it("When updating, the getModData should be called", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});
		plushie.update();
		expect(player.getModData).toHaveBeenCalled();
	});

	describe("Player does not have the Trait", () => {
		
		afterEach(() => {
			mockedAddTraitsFn.mockReset();
			mockedRemoveTraitsFn.mockReset();
		});

		it("Should add trait if player does not have it", () => {
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedAddTraitsFn).toHaveBeenCalledWith(["mockedTrait"]);
		});

		it("Should suppress trait if player has it", () => {
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToSuppress: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedRemoveTraitsFn).toHaveBeenCalledWith(["mockedTrait"]);
		});

		it("Should add Plushie exclusive trait only once", () => {
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			plushie.subscribe();
			expect(mockedAddTraitsFn).toHaveBeenNthCalledWith(1, ["mockedTrait"]);
		});

		it("Should remove Plushie exclusive trait", () => {
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			plushie.unsubscribe();
			expect(mockedRemoveTraitsFn).toHaveBeenNthCalledWith(2, ["mockedTrait"]);
		});

		it("Should restore suppressed traits on unsubscribe", () => {
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToSuppress: ["mockedTrait"]
			});
			plushie.subscribe();
			plushie.unsubscribe();
			expect(mockedAddTraitsFn).toHaveBeenNthCalledWith(2, ["mockedTrait"]);
		});

		it("Do not add Trait if Player has the Trait", () => {
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(mockedAddTraitsFn).toHaveBeenCalledWith([]);
		});
	});
	
});
