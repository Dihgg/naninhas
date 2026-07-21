import type { IsoPlayer, Perk } from "@asledgehammer/pipewrench";
import { GameTime } from "@asledgehammer/pipewrench";
import { PlayerApi } from "@shared/components/PlayerApi";

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

	it("delegates isAsleep to player", () => {
		const stats = buildMockStats();
		const mockPlayer = {
			...buildPlayer(stats),
			isAsleep: jest.fn().mockReturnValue(true)
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);
		expect(playerApi.isAsleep()).toBe(true);
		expect(mockPlayer.isAsleep).toHaveBeenCalled();
	});

	it("normalizes bed type variants to canonical values", () => {
		const stats = buildMockStats();
		const mockPlayer = {
			...buildPlayer(stats),
			getBedType: jest.fn().mockReturnValue("goodBedPillow")
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);
		expect(playerApi.getBedType()).toBe("goodBed");
	});

	it("falls back to averageBed for unknown bed type values", () => {
		const stats = buildMockStats();
		const mockPlayer = {
			...buildPlayer(stats),
			getBedType: jest.fn().mockReturnValue("mysteryBed")
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);
		expect(playerApi.getBedType()).toBe("averageBed");
	});

	it("returns bed object from player", () => {
		const stats = buildMockStats();
		const bed = { id: "bed-1" };
		const mockPlayer = {
			...buildPlayer(stats),
			getBed: jest.fn().mockReturnValue(bed)
		} as unknown as IsoPlayer;

		const playerApi = new PlayerApi(mockPlayer);
		expect(playerApi.getBed()).toBe(bed as any);
	});

	it("returns world age hours from GameTime", () => {
		const stats = buildMockStats();
		const mockPlayer = buildPlayer(stats);
		jest.spyOn(GameTime, "getInstance").mockReturnValue({ getWorldAgeHours: () => 321 } as any);

		const playerApi = new PlayerApi(mockPlayer);
		expect(playerApi.getWorldAgeHours()).toBe(321);
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

	describe("applyXpMultiplierDelta", () => {
		const buildXpPlayer = (currentMultiplier: number) => {
			const addXpMultiplier = jest.fn();
			const getMultiplier = jest.fn().mockReturnValue(currentMultiplier);
			const mockPlayer = {
				...buildPlayer(buildMockStats()),
				getXp: jest.fn().mockReturnValue({ addXpMultiplier, getMultiplier })
			} as unknown as IsoPlayer;
			return { mockPlayer, addXpMultiplier, getMultiplier };
		};

		it("adds a positive delta to the current multiplier", () => {
			const { mockPlayer, addXpMultiplier } = buildXpPlayer(1);
			const perk = "Woodwork" as unknown as Perk;

			new PlayerApi(mockPlayer).applyXpMultiplierDelta(perk, 2);

			expect(addXpMultiplier).toHaveBeenCalledWith(perk, 3, 0, 0);
		});

		it("subtracts a negative delta from the current multiplier", () => {
			const { mockPlayer, addXpMultiplier } = buildXpPlayer(3);
			const perk = "Woodwork" as unknown as Perk;

			new PlayerApi(mockPlayer).applyXpMultiplierDelta(perk, -2);

			expect(addXpMultiplier).toHaveBeenCalledWith(perk, 1, 0, 0);
		});

		it("clamps the result to zero when delta would go negative", () => {
			const { mockPlayer, addXpMultiplier } = buildXpPlayer(1);
			const perk = "Woodwork" as unknown as Perk;

			new PlayerApi(mockPlayer).applyXpMultiplierDelta(perk, -5);

			expect(addXpMultiplier).toHaveBeenCalledWith(perk, 0, 0, 0);
		});
	});
});