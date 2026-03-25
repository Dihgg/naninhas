import type { IsoPlayer } from "@asledgehammer/pipewrench";

type Stats = ReturnType<IsoPlayer["getStats"]>;

/**
 * Returns true when the game exposes the CharacterStat enum (Build 42+).
 * Compiles to `type(CharacterStat) ~= "nil"` in Lua — no version parsing needed.
 */
const isB42 = (): boolean => typeof CharacterStat !== "undefined";

/**
 * Reduces the boredom stat, compatible with Build 41 and Build 42.
 */
export const reduceBoredom = (stats: Stats, amount: number): void => {
	if (isB42()) {
		stats.remove(CharacterStat.BOREDOM, amount);
	} else {
		stats.setBoredom(Math.max(0, stats.getBoredom() - amount));
	}
};

/**
 * Increases the endurance stat, compatible with Build 41 and Build 42.
 */
export const increaseEndurance = (stats: Stats, amount: number): void => {
	if (isB42()) {
		stats.add(CharacterStat.ENDURANCE, amount);
	} else {
		stats.setEndurance(Math.min(1, stats.getEndurance() + amount));
	}
};

/**
 * Reduces the fatigue stat, compatible with Build 41 and Build 42.
 */
export const reduceFatigue = (stats: Stats, amount: number): void => {
	if (isB42()) {
		stats.remove(CharacterStat.FATIGUE, amount);
	} else {
		stats.setFatigue(Math.max(0, stats.getFatigue() - amount));
	}
};

/**
 * Reduces panic (and fear in Build 41) stats.
 * Note: FEAR was removed as a distinct stat in Build 42; only PANIC applies there.
 */
export const reducePanic = (stats: Stats, amount: number): void => {
	if (isB42()) {
		stats.remove(CharacterStat.PANIC, amount);
	} else {
		stats.setFear(Math.max(0, stats.getFear() - amount));
		stats.setPanic(Math.max(0, stats.getPanic() - amount));
	}
};
