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
	const hasTraitFn = jest.fn();
	const runtimeTrait = {
		getName: jest.fn(() => "mockedTrait"),
		toString: jest.fn(() => "mockedTrait")
	};

	beforeEach(() => {
		addXpMultiplier.mockReset();
		getMultiplier.mockReset();
		getMultiplier.mockReturnValue(0);
		addTraitFn.mockReset();
		removeTraitFn.mockReset();
		hasTraitFn.mockReset();

		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => typeof runtimeTrait };
			ResourceLocation?: { of: (id: string) => unknown };
		}).CharacterTrait = {
			get: jest.fn(() => runtimeTrait)
		};

		(globalThis as unknown as {
			ResourceLocation?: { of: (id: string) => unknown };
		}).ResourceLocation = {
			of: jest.fn(() => ({ id: "mocked" }))
		};
	});

	afterEach(() => {
		delete (globalThis as unknown as { CharacterTrait?: unknown }).CharacterTrait;
		delete (globalThis as unknown as { ResourceLocation?: unknown }).ResourceLocation;
	});
	
	const mockPlayer = (hasTrait = false, initialNaninhasData?: Record<string, unknown>) => {
		const modData: Record<string, unknown> = {};
		if (initialNaninhasData !== undefined) {
			modData.Naninhas = initialNaninhasData;
		}
		hasTraitFn.mockReturnValue(hasTrait);

		return mock<IsoPlayer>({
			getCharacterTraits: jest.fn().mockImplementation(() => ({
				get: hasTraitFn,
				add: addTraitFn,
				remove: removeTraitFn
			})),
			getXp: jest.fn().mockImplementation(() => ({
				addXpMultiplier,
				getMultiplier
			})),
			getModData: jest.fn(() => modData)
		});
	};

	class TestPlushie extends Plushie {}

	it("Should instantiate a Plushie abstracted class", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});
		expect(plushie).toBeInstanceOf(TestPlushie);
	});

	it("Should add the Plushie bonus on top of existing multipliers", () => {
		getMultiplier.mockReturnValue(2);
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked",
			traitsToAdd: ["mockedTrait"]
		});
		
		plushie.subscribe();
		expect(addXpMultiplier).toHaveBeenCalledWith(Perks.Woodwork, 3, 0, 0);
	});

	it("Allows calling update directly without throwing", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		expect(() => plushie.update()).not.toThrow();
	});

	it("Uses the default boost behavior when 'shouldApply' argument is omitted", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		(plushie as unknown as { applyBoost: (trait: string) => void }).applyBoost("mockedTrait");

		expect(addXpMultiplier).toHaveBeenCalledWith(Perks.Woodwork, 1, 0, 0);
	});

	it("initializes missing modData fields through ensureData", () => {
		const player = mockPlayer(false, {});
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		const data = (plushie as unknown as { ensureData: () => Record<string, unknown> }).ensureData();

		expect(data.addedTraits).toEqual([]);
		expect(data.suppressedTraits).toEqual([]);
		expect(data.xpBoosts).toEqual({});
	});

	it("exposes player data through getter", () => {
		const initial = { addedTraits: ["a"], suppressedTraits: [], xpBoosts: {} };
		const player = mockPlayer(false, initial);
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		expect(plushie.data).toBe(initial);
	});

	it("Should keep existing multipliers when removing the Plushie bonus", () => {
		getMultiplier.mockReturnValueOnce(2).mockReturnValueOnce(3);
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked",
			traitsToAdd: ["mockedTrait"]
		});
		
		plushie.subscribe();
		plushie.unsubscribe();
		expect(addXpMultiplier).toHaveBeenNthCalledWith(2, Perks.Woodwork, 2, 0, 0);
	});

	describe("Player does not have the Trait", () => {

		it("Should add trait if player does not have it", () => {
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToAdd: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(addTraitFn).toHaveBeenCalledWith(runtimeTrait);
		});

		it("Should suppress trait if player has it", () => {
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked",
				traitsToSuppress: ["mockedTrait"]
			});
			plushie.subscribe();
			expect(removeTraitFn).toHaveBeenCalledWith(runtimeTrait);
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
			expect(addTraitFn).toHaveBeenNthCalledWith(1, runtimeTrait);
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
			expect(removeTraitFn).toHaveBeenNthCalledWith(1, runtimeTrait);
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
			expect(addTraitFn).toHaveBeenNthCalledWith(1, runtimeTrait);
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
