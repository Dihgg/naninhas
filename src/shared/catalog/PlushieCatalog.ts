import { PlushieNames } from "@constants";

/**
 * Static description of a plushie's gameplay effects.
 *
 * Intentionally free of any PZ runtime types so it is safe to import from
 * both client and server modules and to use in unit tests without a game
 * context.
 */
export type PlushieDefinition = {
	/** Canonical plushie name — matches `PlushieNames` enum values. */
	name: string;
	/** Trait IDs to add to the player while this plushie is active. */
	traitsToAdd: string[];
	/** Trait IDs to suppress (remove) from the player while this plushie is active. */
	traitsToSuppress: string[];
	/**
	 * XP multiplier boosts granted while this plushie is active.
	 * `perk` is the `Perks.*` identifier string (e.g. `"Woodwork"`).
	 */
	xpBoostsToAdd: Array<{ perk: string; value: number }>;
};

/**
 * Complete static catalog of every plushie and its effects.
 *
 * Keyed by plushie name so lookups are O(1). The server uses this to validate
 * requests and to build the desired aggregate effect snapshot during reconcile.
 */
export const PLUSHIE_CATALOG: Readonly<Record<string, PlushieDefinition>> = {
	[PlushieNames.BORISBADGER]: {
		name: PlushieNames.BORISBADGER,
		traitsToAdd: ["NightVision"],
		traitsToSuppress: [],
		xpBoostsToAdd: []
	},
	[PlushieNames.DOLL]: {
		name: PlushieNames.DOLL,
		traitsToAdd: ["EagleEyed"],
		traitsToSuppress: ["ShortSighted"],
		xpBoostsToAdd: []
	},
	[PlushieNames.FLAMINGO]: {
		name: PlushieNames.FLAMINGO,
		traitsToAdd: ["Graceful"],
		traitsToSuppress: ["Clumsy"],
		xpBoostsToAdd: []
	},
	[PlushieNames.FLUFFYFOOTBUNNY]: {
		name: PlushieNames.FLUFFYFOOTBUNNY,
		traitsToAdd: ["LightEater"],
		traitsToSuppress: ["HeartyAppitite"],
		xpBoostsToAdd: []
	},
	[PlushieNames.FREDDYFOX]: {
		name: PlushieNames.FREDDYFOX,
		traitsToAdd: ["Inconspicuous"],
		traitsToSuppress: ["Conspicuous"],
		xpBoostsToAdd: []
	},
	[PlushieNames.FURBERTSQUIRREL]: {
		name: PlushieNames.FURBERTSQUIRREL,
		traitsToAdd: ["Outdoorsman"],
		traitsToSuppress: [],
		xpBoostsToAdd: []
	},
	[PlushieNames.GROGUAZ]: {
		name: PlushieNames.GROGUAZ,
		traitsToAdd: ["FastLearner"],
		traitsToSuppress: ["SlowLearner"],
		xpBoostsToAdd: []
	},
	[PlushieNames.JACQUESBEAVER]: {
		name: PlushieNames.JACQUESBEAVER,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: [{ perk: "Woodwork", value: 1 }]
	},
	[PlushieNames.MOLEYMOLE]: {
		name: PlushieNames.MOLEYMOLE,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: [{ perk: "PlantScavenging", value: 2 }]
	},
	[PlushieNames.OTISPUG]: {
		name: PlushieNames.OTISPUG,
		traitsToAdd: ["FastReader"],
		traitsToSuppress: ["SlowReader"],
		xpBoostsToAdd: []
	},
	[PlushieNames.PANCAKEHEDGEHOG]: {
		name: PlushieNames.PANCAKEHEDGEHOG,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: [
			{ perk: "Sprinting", value: 1 },
			{ perk: "Agility", value: 1 }
		]
	},
	/** No instant effects — applies periodic endurance tick. */
	[PlushieNames.SPIFFO]: {
		name: PlushieNames.SPIFFO,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: []
	},
	[PlushieNames.SPIFFOBLUEBERRY]: {
		name: PlushieNames.SPIFFOBLUEBERRY,
		traitsToAdd: ["LowThirst"],
		traitsToSuppress: ["HighThirst"],
		xpBoostsToAdd: []
	},
	[PlushieNames.SPIFFOCHERRY]: {
		name: PlushieNames.SPIFFOCHERRY,
		traitsToAdd: ["Organized"],
		traitsToSuppress: ["Disorganized"],
		xpBoostsToAdd: []
	},
	[PlushieNames.SPIFFOGREY]: {
		name: PlushieNames.SPIFFOGREY,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: [
			{ perk: "Nimble", value: 1 },
			{ perk: "LongBlade", value: 1 },
			{ perk: "SmallBlade", value: 1 },
			{ perk: "Blunt", value: 1 },
			{ perk: "SmallBlunt", value: 1 }
		]
	},
	[PlushieNames.SPIFFOHEART]: {
		name: PlushieNames.SPIFFOHEART,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: [{ perk: "Doctor", value: 2 }]
	},
	/** No instant effects — applies periodic boredom/endurance/fatigue tick. */
	[PlushieNames.SPIFFOPLUSHIERAINBOW]: {
		name: PlushieNames.SPIFFOPLUSHIERAINBOW,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: []
	},
	/** No instant effects — applies periodic boredom tick. */
	[PlushieNames.SPIFFOSANTA]: {
		name: PlushieNames.SPIFFOSANTA,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: []
	},
	[PlushieNames.SPIFFOSHAMROCK]: {
		name: PlushieNames.SPIFFOSHAMROCK,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: [
			{ perk: "Aiming", value: 5 },
			{ perk: "Reloading", value: 5 }
		]
	},
	[PlushieNames.SUBSTITUTIONDOLL]: {
		name: PlushieNames.SUBSTITUTIONDOLL,
		traitsToAdd: ["Brave"],
		traitsToSuppress: ["Desensitized", "Cowardly", "Agoraphobic", "Claustophobic"],
		xpBoostsToAdd: []
	},
	/** No instant effects — applies periodic panic tick. */
	[PlushieNames.TOYBEAR]: {
		name: PlushieNames.TOYBEAR,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: []
	},
	/** No instant effects — applies periodic panic tick (lighter than ToyBear). */
	[PlushieNames.TOYBEARSMALL]: {
		name: PlushieNames.TOYBEARSMALL,
		traitsToAdd: [],
		traitsToSuppress: [],
		xpBoostsToAdd: []
	}
};

/**
 * Returns the definition for the given plushie name, or `undefined` if the
 * name is not in the catalog.
 *
 * @param name - Plushie name to look up.
 */
export function getPlushieDefinition(name: string): PlushieDefinition | undefined {
	return PLUSHIE_CATALOG[name];
}

/**
 * Returns `true` when `name` is a recognised plushie in the catalog.
 *
 * @param name - Plushie name to validate.
 */
export function isKnownPlushie(name: string): boolean {
	return name in PLUSHIE_CATALOG;
}
