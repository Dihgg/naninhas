import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { PlayerApi } from "./PlayerApi";

const buildMockStats = () => ({
	add: jest.fn(),
	remove: jest.fn(),
	get: jest.fn(),
	set: jest.fn()
});

const buildPlayer = (stats: ReturnType<typeof buildMockStats>): IsoPlayer => ({
	getStats: jest.fn().mockReturnValue(stats)
} as unknown as IsoPlayer);

describe("PlayerApi", () => {
	it("reduces boredom through CharacterStat", () => {
		const stats = buildMockStats();
		const player = new PlayerApi(buildPlayer(stats));

		player.reduceBoredom(0.5);

		expect(stats.remove).toHaveBeenCalledWith(CharacterStat.BOREDOM, 0.5);
	});

	it("increases endurance through CharacterStat", () => {
		const stats = buildMockStats();
		const player = new PlayerApi(buildPlayer(stats));

		player.increaseEndurance(0.1);

		expect(stats.add).toHaveBeenCalledWith(CharacterStat.ENDURANCE, 0.1);
	});

	it("reduces fatigue through CharacterStat", () => {
		const stats = buildMockStats();
		const player = new PlayerApi(buildPlayer(stats));

		player.reduceFatigue(0.5);

		expect(stats.remove).toHaveBeenCalledWith(CharacterStat.FATIGUE, 0.5);
	});

	it("reduces panic through CharacterStat", () => {
		const stats = buildMockStats();
		const player = new PlayerApi(buildPlayer(stats));

		player.reducePanic(0.5);

		expect(stats.remove).toHaveBeenCalledWith(CharacterStat.PANIC, 0.5);
	});

	it("throws when CharacterStat API is unavailable", () => {
		const previousCharacterStat = (globalThis as unknown as { CharacterStat?: unknown }).CharacterStat;
		delete (globalThis as unknown as { CharacterStat?: unknown }).CharacterStat;

		try {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));
			expect(() => player.reduceBoredom(0.1)).toThrow();
		} finally {
			(globalThis as unknown as { CharacterStat?: unknown }).CharacterStat = previousCharacterStat;
		}
	});

	it("returns player instance through getter", () => {
		const stats = buildMockStats();
		const mockPlayer = buildPlayer(stats);
		const playerApi = new PlayerApi(mockPlayer);

		expect(playerApi.player).toBe(mockPlayer);
	});

	it("delegates getXp to player", () => {
		const mockXpTracker = { test: "xp" };
		const stats = buildMockStats();
		const mockPlayer = {
			...buildPlayer(stats),
			getXp: jest.fn().mockReturnValue(mockXpTracker),
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);
		const result = playerApi.getXp();

		expect(mockPlayer.getXp).toHaveBeenCalled();
		expect(result).toBe(mockXpTracker);
	});

	it("delegates getModData to player", () => {
		const mockModData = { data: "test" };
		const stats = buildMockStats();
		const mockPlayer = {
			...buildPlayer(stats),
			getModData: jest.fn().mockReturnValue(mockModData),
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);
		const result = playerApi.getModData();

		expect(mockPlayer.getModData).toHaveBeenCalled();
		expect(result).toBe(mockModData);
	});

	it("delegates hasTrait to CharacterTraitApi", () => {
		const stats = buildMockStats();
		const mockGetCharacterTraits = jest.fn(() => ({
			get: jest.fn().mockReturnValue(true),
			getKnownTraits: jest.fn(() => ({ size: () => 0 })),
		}));

		const mockPlayer = {
			...buildPlayer(stats),
			getCharacterTraits: mockGetCharacterTraits,
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);

		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => object };
			ResourceLocation?: { of: (id: string) => unknown };
		}).CharacterTrait = {
			get: jest.fn(() => ({ getName: () => "TestTrait" })),
		};

		(globalThis as unknown as {
			ResourceLocation?: { of: (id: string) => unknown };
		}).ResourceLocation = {
			of: jest.fn(() => ({})),
		};

		const result = playerApi.hasTrait("TestTrait");

		expect(mockGetCharacterTraits).toHaveBeenCalled();
		expect(result).toBe(true);

		delete (globalThis as unknown as { CharacterTrait?: unknown }).CharacterTrait;
		delete (globalThis as unknown as { ResourceLocation?: unknown }).ResourceLocation;
	});

	it("delegates addTrait to CharacterTraitApi", () => {
		const stats = buildMockStats();
		const mockAddFn = jest.fn();
		const mockPlayer = {
			...buildPlayer(stats),
			getCharacterTraits: jest.fn(() => ({ add: mockAddFn })),
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);

		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => object };
			ResourceLocation?: { of: (id: string) => unknown };
		}).CharacterTrait = {
			get: jest.fn(() => ({ getName: () => "TestTrait" })),
		};

		(globalThis as unknown as {
			ResourceLocation?: { of: (id: string) => unknown };
		}).ResourceLocation = {
			of: jest.fn(() => ({})),
		};

		playerApi.addTrait("TestTrait");

		expect(mockPlayer.getCharacterTraits).toHaveBeenCalled();
		expect(mockAddFn).toHaveBeenCalled();

		delete (globalThis as unknown as { CharacterTrait?: unknown }).CharacterTrait;
		delete (globalThis as unknown as { ResourceLocation?: unknown }).ResourceLocation;
	});

	it("delegates removeTrait to CharacterTraitApi", () => {
		const stats = buildMockStats();
		const mockRemoveFn = jest.fn();
		const mockPlayer = {
			...buildPlayer(stats),
			getCharacterTraits: jest.fn(() => ({ remove: mockRemoveFn })),
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);

		(globalThis as unknown as {
			CharacterTrait?: { get: (id: unknown) => object };
			ResourceLocation?: { of: (id: string) => unknown };
		}).CharacterTrait = {
			get: jest.fn(() => ({ getName: () => "TestTrait" })),
		};

		(globalThis as unknown as {
			ResourceLocation?: { of: (id: string) => unknown };
		}).ResourceLocation = {
			of: jest.fn(() => ({})),
		};

		playerApi.removeTrait("TestTrait");

		expect(mockPlayer.getCharacterTraits).toHaveBeenCalled();
		expect(mockRemoveFn).toHaveBeenCalled();

		delete (globalThis as unknown as { CharacterTrait?: unknown }).CharacterTrait;
		delete (globalThis as unknown as { ResourceLocation?: unknown }).ResourceLocation;
	});
});