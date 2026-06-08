import { mock } from "jest-mock-extended";
import { Plushie } from "@client/components/Plushies/Plushie";
import { IsoPlayer, Perks, triggerEvent } from "@asledgehammer/pipewrench";
import type { Perk } from "@asledgehammer/pipewrench";
import { EventsEnum } from "@constants";
import * as plushieCatalog from "@shared/catalog/PlushieCatalog";
jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@shared/catalog/PlushieCatalog");

describe("Plushie", () => {
    const triggerEventMock = triggerEvent as jest.MockedFunction<typeof triggerEvent>;
	const getPlushieDefinitionMock = plushieCatalog.getPlushieDefinition as jest.MockedFunction<typeof plushieCatalog.getPlushieDefinition>;
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
		triggerEventMock.mockReset();
		getPlushieDefinitionMock.mockReset();
		addXpMultiplier.mockReset();
		getMultiplier.mockReset();
		getMultiplier.mockReturnValue(0);
		addTraitFn.mockReset();
		removeTraitFn.mockReset();
		hasTraitFn.mockReset();

		// Default mock returns a plushie with no effects
		getPlushieDefinitionMock.mockReturnValue({
			name: "mocked",
			traitsToAdd: [],
			traitsToSuppress: [],
			xpBoostsToAdd: []
		});

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
		getPlushieDefinitionMock.mockReturnValue({
			name: "mocked",
			traitsToAdd: [],
			traitsToSuppress: [],
			xpBoostsToAdd: [{ perk: "Woodwork", value: 1 }]
		});
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});
		
		plushie.subscribe();
		expect(addXpMultiplier).toHaveBeenCalledWith(Perks.Woodwork, 3, 0, 0);
		expect(triggerEventMock).toHaveBeenCalledWith(EventsEnum.Equipped, expect.objectContaining({
			name: "mocked"
		}));
	});

	it("Allows calling update directly without throwing", () => {
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		expect(() => plushie.update()).not.toThrow();
		expect(triggerEventMock).toHaveBeenCalledWith(EventsEnum.Update, expect.objectContaining({
			name: "mocked"
		}));
	});

	it("Uses the default boost behavior when 'shouldApply' argument is omitted", () => {
		getPlushieDefinitionMock.mockReturnValue({
			name: "mocked",
			traitsToAdd: [],
			traitsToSuppress: [],
			xpBoostsToAdd: [{ perk: "Woodwork", value: 1 }]
		});
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		(plushie as unknown as { applyBoosts: () => void }).applyBoosts();

		expect(addXpMultiplier).toHaveBeenCalledWith(Perks.Woodwork, 1, 0, 0);
	});

	it("initializes missing modData fields through ensureData", () => {
		const player = mockPlayer(false, {});
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		const data = plushie.data;

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
		getPlushieDefinitionMock.mockReturnValue({
			name: "mocked",
			traitsToAdd: [],
			traitsToSuppress: [],
			xpBoostsToAdd: [{ perk: "Woodwork", value: 1 }]
		});
		const player = mockPlayer();
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});
		
		plushie.subscribe();
		plushie.unsubscribe();
		expect(addXpMultiplier).toHaveBeenNthCalledWith(2, Perks.Woodwork, 2, 0, 0);
		expect(triggerEventMock).toHaveBeenNthCalledWith(2, EventsEnum.Unequipped, expect.objectContaining({
			name: "mocked"
		}));
	});

	it("Should skip applying multiplier when persisted boost already matches target", () => {
		getPlushieDefinitionMock.mockReturnValue({
			name: "mocked",
			traitsToAdd: [],
			traitsToSuppress: [],
			xpBoostsToAdd: [{ perk: "Woodwork", value: 1 }]
		});
		const player = mockPlayer(false, {
			addedTraits: [],
			suppressedTraits: [],
			xpBoosts: { "mocked:Woodwork": 1 }
		});
		const plushie = new TestPlushie({
			player,
			name: "mocked"
		});

		plushie.subscribe();

		expect(addXpMultiplier).not.toHaveBeenCalled();
	});

	describe("Player does not have the Trait", () => {

		it("Should add trait if player does not have it", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["mockedTrait"],
				traitsToSuppress: [],
				xpBoostsToAdd: []
			});
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked"
			});
			plushie.subscribe();
			expect(addTraitFn).toHaveBeenCalledWith(runtimeTrait);
		});

		it("Should suppress trait if player has it", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: [],
				traitsToSuppress: ["mockedTrait"],
				xpBoostsToAdd: []
			});
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked"
			});
			plushie.subscribe();
			expect(removeTraitFn).toHaveBeenCalledWith(runtimeTrait);
		});

		it("Should add Plushie exclusive trait only once", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["mockedTrait"],
				traitsToSuppress: [],
				xpBoostsToAdd: []
			});
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked"
			});
			plushie.subscribe();
			plushie.subscribe();
			expect(addTraitFn).toHaveBeenNthCalledWith(1, runtimeTrait);
			expect(addTraitFn).toHaveBeenCalledTimes(1);
		});

		it("Should remove Plushie exclusive trait", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["mockedTrait"],
				traitsToSuppress: [],
				xpBoostsToAdd: []
			});
			const player = mockPlayer(false);
			const plushie = new TestPlushie({
				player,
				name: "mocked"
			});
			plushie.subscribe();
			plushie.unsubscribe();
			expect(removeTraitFn).toHaveBeenNthCalledWith(1, runtimeTrait);
		});

		it("Should restore suppressed traits on unsubscribe", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: [],
				traitsToSuppress: ["mockedTrait"],
				xpBoostsToAdd: []
			});
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked"
			});
			plushie.subscribe();
			plushie.unsubscribe();
			expect(addTraitFn).toHaveBeenNthCalledWith(1, runtimeTrait);
		});

		it("Do not add Trait if Player has the Trait", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["mockedTrait"],
				traitsToSuppress: [],
				xpBoostsToAdd: []
			});
			const player = mockPlayer(true);
			const plushie = new TestPlushie({
				player,
				name: "mocked"
			});
			plushie.subscribe();
			expect(addTraitFn).not.toHaveBeenCalled();
		});
	});
	
});
