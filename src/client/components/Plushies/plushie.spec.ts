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
	
	const mockPlayer = (hasTrait = false) => {
		const modData: Record<string, unknown> = {};
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

	describe("subscribe()", () => {
		it("fires Equipped event with plushie name", () => {
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			plushie.subscribe();
			expect(triggerEventMock).toHaveBeenCalledWith(EventsEnum.Equipped, expect.objectContaining({
				name: "mocked"
			}));
		});

		it("never calls addTrait directly (server-authoritative)", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["EagleEyed"],
				traitsToSuppress: [],
				xpBoostsToAdd: []
			});
			const plushie = new TestPlushie({ player: mockPlayer(false), name: "mocked" });
			plushie.subscribe();
			expect(addTraitFn).not.toHaveBeenCalled();
		});

		it("never calls removeTrait for suppression directly (server-authoritative)", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: [],
				traitsToSuppress: ["ShortSighted"],
				xpBoostsToAdd: []
			});
			const plushie = new TestPlushie({ player: mockPlayer(true), name: "mocked" });
			plushie.subscribe();
			expect(removeTraitFn).not.toHaveBeenCalled();
		});

		it("never applies XP multipliers directly (server-authoritative)", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: [],
				traitsToSuppress: [],
				xpBoostsToAdd: [{ perk: "Woodwork", value: 1 }]
			});
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			plushie.subscribe();
			expect(addXpMultiplier).not.toHaveBeenCalled();
		});
	});

	describe("unsubscribe()", () => {
		it("fires Unequipped event with plushie name", () => {
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			plushie.unsubscribe();
			expect(triggerEventMock).toHaveBeenCalledWith(EventsEnum.Unequipped, expect.objectContaining({
				name: "mocked"
			}));
		});

		it("never calls removeTrait directly (server-authoritative)", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["EagleEyed"],
				traitsToSuppress: [],
				xpBoostsToAdd: []
			});
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			plushie.subscribe();
			plushie.unsubscribe();
			expect(removeTraitFn).not.toHaveBeenCalled();
		});

		it("never restores suppressed traits directly (server-authoritative)", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: [],
				traitsToSuppress: ["ShortSighted"],
				xpBoostsToAdd: []
			});
			const plushie = new TestPlushie({ player: mockPlayer(true), name: "mocked" });
			plushie.subscribe();
			plushie.unsubscribe();
			expect(addTraitFn).not.toHaveBeenCalled();
		});

		it("never removes XP multipliers directly (server-authoritative)", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: [],
				traitsToSuppress: [],
				xpBoostsToAdd: [{ perk: "Woodwork", value: 1 }]
			});
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			plushie.subscribe();
			plushie.unsubscribe();
			expect(addXpMultiplier).not.toHaveBeenCalled();
		});
	});

	describe("data getter", () => {
		it("returns definition traits and suppressions", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["EagleEyed"],
				traitsToSuppress: ["ShortSighted"],
				xpBoostsToAdd: []
			});
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			expect(plushie.data.addedTraits).toEqual(["EagleEyed"]);
			expect(plushie.data.suppressedTraits).toEqual(["ShortSighted"]);
		});

		it("returns definition xpBoosts keyed by plushie name and perk", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: [],
				traitsToSuppress: [],
				xpBoostsToAdd: [{ perk: "Woodwork", value: 2 }]
			});
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			expect(plushie.data.xpBoosts[`mocked:${Perks.Woodwork as unknown as Perk}`]).toBe(2);
		});

		it("event payload includes definition traits via spread", () => {
			getPlushieDefinitionMock.mockReturnValue({
				name: "mocked",
				traitsToAdd: ["Brave"],
				traitsToSuppress: [],
				xpBoostsToAdd: []
			});
			const plushie = new TestPlushie({ player: mockPlayer(), name: "mocked" });
			plushie.subscribe();
			expect(triggerEventMock).toHaveBeenCalledWith(
				EventsEnum.Equipped,
				expect.objectContaining({ addedTraits: ["Brave"] })
			);
		});
	});
});
