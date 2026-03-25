import { reduceBoredom, increaseEndurance, reduceFatigue, reducePanic } from "./StatsCompat";

const buildMockStats = () => ({
	// B42 methods
	add: jest.fn(),
	remove: jest.fn(),
	get: jest.fn(),
	set: jest.fn(),
	// B41 methods
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

describe("StatsCompat", () => {
	describe("Build 42 (CharacterStat available)", () => {
		// CharacterStat is set in globalThis via test/mock.ts (setupFiles)
		it("reduceBoredom calls stats.remove with BOREDOM", () => {
			const stats = buildMockStats();
			reduceBoredom(stats as any, 0.5);
			expect(stats.remove).toHaveBeenCalledWith(CharacterStat.BOREDOM, 0.5);
			expect(stats.setBoredom).not.toHaveBeenCalled();
		});

		it("increaseEndurance calls stats.add with ENDURANCE", () => {
			const stats = buildMockStats();
			increaseEndurance(stats as any, 0.1);
			expect(stats.add).toHaveBeenCalledWith(CharacterStat.ENDURANCE, 0.1);
			expect(stats.setEndurance).not.toHaveBeenCalled();
		});

		it("reduceFatigue calls stats.remove with FATIGUE", () => {
			const stats = buildMockStats();
			reduceFatigue(stats as any, 0.5);
			expect(stats.remove).toHaveBeenCalledWith(CharacterStat.FATIGUE, 0.5);
			expect(stats.setFatigue).not.toHaveBeenCalled();
		});

		it("reducePanic calls stats.remove with PANIC only", () => {
			const stats = buildMockStats();
			reducePanic(stats as any, 0.5);
			expect(stats.remove).toHaveBeenCalledWith(CharacterStat.PANIC, 0.5);
			expect(stats.setFear).not.toHaveBeenCalled();
			expect(stats.setPanic).not.toHaveBeenCalled();
		});
	});

	describe("Build 41 (CharacterStat not available)", () => {
		let savedCharacterStat: unknown;

		beforeEach(() => {
			savedCharacterStat = (globalThis as any).CharacterStat;
			delete (globalThis as any).CharacterStat;
		});

		afterEach(() => {
			(globalThis as any).CharacterStat = savedCharacterStat;
		});

		it("reduceBoredom calls stats.setBoredom with clamped value", () => {
			const stats = buildMockStats(); // getBoredom returns 0.8
			reduceBoredom(stats as any, 0.5);
			expect(stats.setBoredom).toHaveBeenCalledWith(0.30000000000000004); // 0.8 - 0.5
			expect(stats.remove).not.toHaveBeenCalled();
		});

		it("reduceBoredom clamps at 0 when amount exceeds current value", () => {
			const stats = buildMockStats(); // getBoredom returns 0.8
			reduceBoredom(stats as any, 1.0);
			expect(stats.setBoredom).toHaveBeenCalledWith(0);
		});

		it("increaseEndurance calls stats.setEndurance with clamped value", () => {
			const stats = buildMockStats(); // getEndurance returns 0.5
			increaseEndurance(stats as any, 0.3);
			expect(stats.setEndurance).toHaveBeenCalledWith(0.8);
			expect(stats.add).not.toHaveBeenCalled();
		});

		it("increaseEndurance clamps at 1 when amount exceeds room", () => {
			const stats = buildMockStats(); // getEndurance returns 0.5
			increaseEndurance(stats as any, 1.0);
			expect(stats.setEndurance).toHaveBeenCalledWith(1);
		});

		it("reduceFatigue calls stats.setFatigue with clamped value", () => {
			const stats = buildMockStats(); // getFatigue returns 0.6
			reduceFatigue(stats as any, 0.4);
			expect(stats.setFatigue).toHaveBeenCalledWith(0.19999999999999996); // 0.6 - 0.4
			expect(stats.remove).not.toHaveBeenCalled();
		});

		it("reducePanic calls setFear and setPanic with clamped values", () => {
			const stats = buildMockStats(); // getFear returns 0.4, getPanic returns 0.7
			reducePanic(stats as any, 0.5);
			expect(stats.setFear).toHaveBeenCalledWith(0); // max(0, 0.4 - 0.5)
			expect(stats.setPanic).toHaveBeenCalledWith(0.19999999999999996); // max(0, 0.7 - 0.5)
			expect(stats.remove).not.toHaveBeenCalled();
		});

		it("reducePanic clamps fear at 0", () => {
			const stats = buildMockStats(); // getFear returns 0.4
			reducePanic(stats as any, 1.0);
			expect(stats.setFear).toHaveBeenCalledWith(0);
			expect(stats.setPanic).toHaveBeenCalledWith(0);
		});
	});
});
