import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";

describe("CharacterTraitApi", () => {
	const runtimeTrait = {
		getName: jest.fn(() => "Naninhas:mockedTrait"),
		toString: jest.fn(() => "Naninhas:mockedTrait"),
	};

	beforeEach(() => {
		runtimeTrait.getName.mockClear();
		runtimeTrait.toString.mockClear();

		const resourceLocation = { id: "mocked" };

		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => typeof runtimeTrait };
			ResourceLocation?: { of: (id: string) => unknown };
		}).CharacterTrait = {
			get: jest.fn(() => runtimeTrait),
		};

		(globalThis as unknown as {
			ResourceLocation?: { of: (id: string) => unknown };
		}).ResourceLocation = {
			of: jest.fn(() => resourceLocation),
		};
	});

	afterEach(() => {
		delete (globalThis as unknown as { CharacterTrait?: unknown }).CharacterTrait;
		delete (globalThis as unknown as { ResourceLocation?: unknown }).ResourceLocation;
	});

	it("checks Build 42 traits using CharacterTraits.get", () => {
		const get = jest.fn(() => true);
		const player = {
			getCharacterTraits: () => ({ get }),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Naninhas:mockedTrait")).toBe(true);
		expect(get).toHaveBeenCalledWith(runtimeTrait);
	});

	it("falls back to known-traits iteration when direct lookup is unavailable", () => {
		// Don't resolve the trait so it falls back to knownTraits
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({
					size: () => 1,
					get: () => runtimeTrait,
				}),
			}),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Naninhas:mockedTrait")).toBe(true);
	});

	it("adds and removes Build 42 traits using runtime CharacterTrait objects", () => {
		const add = jest.fn();
		const remove = jest.fn();
		const player = {
			getCharacterTraits: () => ({ add, remove }),
		} as unknown as IsoPlayer;

		CharacterTraitApi.addTrait(player, "Naninhas:mockedTrait");
		CharacterTraitApi.removeTrait(player, "Naninhas:mockedTrait");

		expect(add).toHaveBeenCalledWith(runtimeTrait);
		expect(remove).toHaveBeenCalledWith(runtimeTrait);
	});

	it("returns false when runtime trait resolution fails", () => {
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({
					size: () => 0,
				}),
			}),
		} as unknown as IsoPlayer;
		expect(CharacterTraitApi.hasTrait(player, "Organized")).toBe(false);
	});

	it("returns false when knownTraits does not provide size/get", () => {
		// Don't resolve the trait so it tries the fallback
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({
					size: () => 0, // Empty list - no traits to iterate
				}),
			}),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Naninhas:mockedTrait")).toBe(false);
	});

	it("matches known trait IDs using toString normalization", () => {
		// Don't resolve the trait so it falls back to knownTraits matching
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({
					size: () => 1,
					get: () => ({
						getName: jest.fn(() => null),
						toString: () => "base:naninhas:mockedtrait",
					}),
				}),
			}),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Naninhas:mockedtrait")).toBe(true);
	});

	it("does not add/remove when runtime trait object cannot be resolved", () => {
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const add = jest.fn();
		const remove = jest.fn();
		const player = {
			getCharacterTraits: () => ({ add, remove }),
		} as unknown as IsoPlayer;

		CharacterTraitApi.addTrait(player, "Organized");
		CharacterTraitApi.removeTrait(player, "Organized");

		expect(add).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();
	});

	it("matches trait by getName() when available", () => {
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({
					size: () => 1,
					get: () => ({
						getName: jest.fn(() => "BASE:Organized"),
						toString: jest.fn(() => ""),
					}),
				}),
			}),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Organized")).toBe(true);
	});

	it("returns false when trait object getName returns null", () => {
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({
					size: () => 1,
					get: () => ({
						getName: jest.fn(() => null),
						toString: jest.fn(() => ""),
					}),
				}),
			}),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "UnknownTrait")).toBe(false);
	});

});