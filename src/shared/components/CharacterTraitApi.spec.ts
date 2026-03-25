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
});