/**
 * Build 42 type declarations.
 * Augments zombie.characters.Stats with the new CharacterStat-based API
 * and declares CharacterStat as a global.
 */

// `export {}` makes this a module file so we can use `declare global` and
// `declare module` augmentation side-by-side.
export {};

/** Opaque type representing a CharacterStat enum value (Java-backed). */
declare type CharacterStatValue = { readonly __brand: "CharacterStatValue" };

declare global {
	/**
	 * Build 42 CharacterStat enum - global accessible from Lua.
	 * Replaces the legacy direct stat getter/setter methods on Stats.
	 */
	var CharacterStat: {
		readonly ANGER: CharacterStatValue;
		readonly BOREDOM: CharacterStatValue;
		readonly DISCOMFORT: CharacterStatValue;
		readonly ENDURANCE: CharacterStatValue;
		readonly FATIGUE: CharacterStatValue;
		readonly FITNESS: CharacterStatValue;
		readonly FOOD_SICKNESS: CharacterStatValue;
		readonly HUNGER: CharacterStatValue;
		readonly IDLENESS: CharacterStatValue;
		readonly INTOXICATION: CharacterStatValue;
		readonly MORALE: CharacterStatValue;
		readonly NICOTINE_WITHDRAWAL: CharacterStatValue;
		readonly PAIN: CharacterStatValue;
		readonly PANIC: CharacterStatValue;
		readonly POISON: CharacterStatValue;
		readonly SANITY: CharacterStatValue;
		readonly SICKNESS: CharacterStatValue;
		readonly STRESS: CharacterStatValue;
		readonly TEMPERATURE: CharacterStatValue;
		readonly THIRST: CharacterStatValue;
		readonly UNHAPPINESS: CharacterStatValue;
		readonly WETNESS: CharacterStatValue;
		readonly ZOMBIE_FEVER: CharacterStatValue;
		readonly ZOMBIE_INFECTION: CharacterStatValue;
	};

	interface CharacterTraitRef {
		getName: () => string;
		toString: () => string;
	}

	type KnownTraitList = {
		size(): number;
		get(index: number): CharacterTraitRef | string;
	};

	var CharacterTrait: {
		get: (this: void, id: unknown) => CharacterTraitRef | undefined
	};
	var ResourceLocation: {
		of: (this: void, id: string) => unknown;
	};
}

declare module "@asledgehammer/pipewrench" {
	export namespace zombie.characters {
		interface IsoGameCharacter$CharacterTraits {
			/** Build 42 overload using CharacterTrait object. */
			get(trait: CharacterTraitRef): boolean;
			/** Build 42 overload using CharacterTrait object. */
			add(trait: CharacterTraitRef): void;
			/** Build 42 overload using CharacterTrait object. */
			remove(trait: CharacterTraitRef): void;
			/** Build 42 API: list of known trait refs/ids. */
			getKnownTraits(): KnownTraitList;
		}

		interface Stats {
			/** Gets the current value of a stat. */
			get(stat: CharacterStatValue): number;
			/** Sets the value of a stat directly. */
			set(stat: CharacterStatValue, value: number): void;
			/** Adds an amount to a stat (clamped at max). Returns true if changed. */
			add(stat: CharacterStatValue, amount: number): boolean;
			/** Removes an amount from a stat (clamped at 0). Returns true if changed. */
			remove(stat: CharacterStatValue, amount: number): boolean;
			/** Resets a stat to its default value. */
			reset(stat: CharacterStatValue): void;
			/** Returns the endurance warning threshold. */
			getEnduranceWarning(): number;
			/** Returns true if the stat is above its minimum threshold. */
			isAboveMinimum(stat: CharacterStatValue): boolean;
		}
	}
}
