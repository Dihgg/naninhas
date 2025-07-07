import { mock } from "jest-mock-extended";
import { Plushie } from "./Plushie";
import { IsoPlayer, Perks } from "@asledgehammer/pipewrench";

jest.mock("@shared/components/Traits", () => ({
	Traits: {
		getPerkBoostsForTrait: jest.fn(() => [
			{ perk: Perks.Woodwork, value: 1 }
		])
	}
}));

describe("Plushie", () => {
	const addXpMultiplier = jest.fn();
	const getMultiplier = jest.fn();
	const addTraitFn = jest.fn();
	const removeTraitFn = jest.fn();
	
	const mockPlayer = (hasTrait = false) =>
		mock<IsoPlayer>({
			HasTrait: jest.fn().mockReturnValue(hasTrait),
			getTraits: jest.fn().mockImplementation(() => ({
				add: addTraitFn,
				remove: removeTraitFn,
			})),
			getXp: jest.fn().mockImplementation(() => ({
				addXpMultiplier,
				getMultiplier
			})),
			getModData: jest
				.fn()
				.mockImplementationOnce(() => ({}))
				.mockImplementation(() => ({
					Naninhas: { addedTraits: new Map(), suppressedTraits: new Map() }
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

	it("Should call addXpMultiplier when applying a trait boost", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked",
			traitsToAdd: ["mockedTrait"]
		});
		
		plushie.subscribe();
		expect(addXpMultiplier).toHaveBeenCalledWith(Perks.Woodwork, 1, 0, 0);
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
			addTraitFn.mockReset();
			removeTraitFn.mockReset();
		});

		it("Should add trait if player does not have it", () => {
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(addTraitFn).toHaveBeenCalledWith("mockedTrait");
		});

		it("Should suppress trait if player has it", () => {
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToSuppress: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(removeTraitFn).toHaveBeenCalledWith("mockedTrait");
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
			expect(addTraitFn).toHaveBeenNthCalledWith(1, "mockedTrait");
			expect(addTraitFn).toHaveBeenCalledTimes(1);
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
			expect(removeTraitFn).toHaveBeenNthCalledWith(1, "mockedTrait");
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
			expect(addTraitFn).toHaveBeenNthCalledWith(1, "mockedTrait");
		});

		it("Do not add Trait if Player has the Trait", () => {
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(addTraitFn).not.toHaveBeenCalled();
		});
	});
	
});
