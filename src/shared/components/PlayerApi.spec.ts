import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { getVersion } from "@shared/utils";
import { PlayerApi } from "./PlayerApi";

jest.mock("@shared/utils", () => ({
	getVersion: jest.fn()
}));

const mockedGetVersion = getVersion as jest.MockedFunction<typeof getVersion>;

const buildMockStats = () => ({
	add: jest.fn(),
	remove: jest.fn(),
	get: jest.fn(),
	set: jest.fn(),
	getBoredom: jest.fn().mockReturnValue(0.8),
	setBoredom: jest.fn(),
	getEndurance: jest.fn().mockReturnValue(0.5),
	setEndurance: jest.fn(),
	getFatigue: jest.fn().mockReturnValue(0.6),
	setFatigue: jest.fn(),
	getFear: jest.fn().mockReturnValue(0.4),
	setFear: jest.fn(),
	getPanic: jest.fn().mockReturnValue(0.7),
	setPanic: jest.fn(),
});

const buildPlayer = (stats: ReturnType<typeof buildMockStats>): IsoPlayer => ({
	getStats: jest.fn().mockReturnValue(stats)
} as unknown as IsoPlayer);

describe("PlayerApi", () => {
	beforeEach(() => {
		mockedGetVersion.mockReset();
	});

	describe("Build 42", () => {
		beforeEach(() => {
			mockedGetVersion.mockReturnValue({ major: 42, minor: 0 });
		});

		it("reduces boredom through CharacterStat", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.reduceBoredom(0.5);

			expect(stats.remove).toHaveBeenCalledWith(CharacterStat.BOREDOM, 0.5);
			expect(stats.setBoredom).not.toHaveBeenCalled();
		});

		it("increases endurance through CharacterStat", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.increaseEndurance(0.1);

			expect(stats.add).toHaveBeenCalledWith(CharacterStat.ENDURANCE, 0.1);
			expect(stats.setEndurance).not.toHaveBeenCalled();
		});

		it("reduces fatigue through CharacterStat", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.reduceFatigue(0.5);

			expect(stats.remove).toHaveBeenCalledWith(CharacterStat.FATIGUE, 0.5);
			expect(stats.setFatigue).not.toHaveBeenCalled();
		});

		it("reduces panic through CharacterStat only", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.reducePanic(0.5);

			expect(stats.remove).toHaveBeenCalledWith(CharacterStat.PANIC, 0.5);
			expect(stats.setFear).not.toHaveBeenCalled();
			expect(stats.setPanic).not.toHaveBeenCalled();
		});
	});

	describe("Build 41", () => {
		beforeEach(() => {
			mockedGetVersion.mockReturnValue({ major: 41, minor: 78 });
		});

		it("uses the legacy boredom API even if CharacterStat exists", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.reduceBoredom(0.5);

			expect(stats.setBoredom).toHaveBeenCalledWith(0.30000000000000004);
			expect(stats.remove).not.toHaveBeenCalled();
		});

		it("clamps endurance through the legacy API", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.increaseEndurance(1.0);

			expect(stats.setEndurance).toHaveBeenCalledWith(1);
			expect(stats.add).not.toHaveBeenCalled();
		});

		it("reduces fatigue through the legacy API", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.reduceFatigue(0.4);

			expect(stats.setFatigue).toHaveBeenCalledWith(0.19999999999999996);
			expect(stats.remove).not.toHaveBeenCalled();
		});

		it("reduces fear and panic through the legacy API", () => {
			const stats = buildMockStats();
			const player = new PlayerApi(buildPlayer(stats));

			player.reducePanic(0.5);

			expect(stats.setFear).toHaveBeenCalledWith(0);
			expect(stats.setPanic).toHaveBeenCalledWith(0.19999999999999996);
			expect(stats.remove).not.toHaveBeenCalled();
		});
	});
});