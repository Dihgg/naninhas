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
			expect(() => player.reduceBoredom(0.1)).toThrow("CharacterStat API is required");
		} finally {
			(globalThis as unknown as { CharacterStat?: unknown }).CharacterStat = previousCharacterStat;
		}
	});
});