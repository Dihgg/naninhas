import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { CharacterTraitApi } from "./CharacterTraitApi";

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

	it("falls back to runtimePlayer.hasTrait when CharacterTraits is unavailable", () => {
		const hasTrait = jest.fn(() => true);
		const player = {
			hasTrait,
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Naninhas:mockedTrait")).toBe(true);
		expect(hasTrait).toHaveBeenCalledWith(runtimeTrait);
	});

	it("falls back to legacy HasTrait when runtime trait resolution fails", () => {
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const HasTrait = jest.fn(() => true);
		const player = {
			HasTrait,
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Organized")).toBe(true);
		expect(HasTrait).toHaveBeenCalledWith("Organized");
	});

	it("returns false when no trait APIs are available", () => {
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const player = {} as IsoPlayer;
		expect(CharacterTraitApi.hasTrait(player, "Organized")).toBe(false);
	});

	it("returns false when knownTraits does not provide size/get", () => {
		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({}),
			}),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Naninhas:mockedTrait")).toBe(false);
	});

	it("matches known trait IDs using toString normalization", () => {
		const player = {
			getCharacterTraits: () => ({
				getKnownTraits: () => ({
					size: () => 1,
					get: () => ({
						toString: () => "base:naninhas:mockedtrait",
					}),
				}),
			}),
		} as unknown as IsoPlayer;

		expect(CharacterTraitApi.hasTrait(player, "Naninhas:mockedtrait")).toBe(true);
	});

	it("uses legacy trait collection when runtime trait object cannot be resolved", () => {
		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => undefined };
		}).CharacterTrait = {
			get: jest.fn(() => undefined),
		};

		const add = jest.fn();
		const remove = jest.fn();
		const player = {
			getTraits: () => ({ add, remove }),
		} as unknown as IsoPlayer;

		CharacterTraitApi.addTrait(player, "Organized");
		CharacterTraitApi.removeTrait(player, "Organized");

		expect(add).toHaveBeenCalledWith("Organized");
		expect(remove).toHaveBeenCalledWith("Organized");
	});

	it("returns undefined trait collection when player has no getTraits", () => {
		const player = {} as IsoPlayer;
		expect(CharacterTraitApi.getTraitCollection(player)).toBeUndefined();
	});
});