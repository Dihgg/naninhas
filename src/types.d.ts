import type { IsoPlayer, KahluaTable, Perk } from "@asledgehammer/pipewrench";

export type PerkBoost = {
	perk: Perk;
	value: number
};

export type PlushieProps = {
	player: IsoPlayer;
	name: string;
	traitsToAdd?: string[];
	traitsToSuppress?: string[];
	xpBoostsToAdd?: PerkBoost[];
};

export type ModDataProps<T> = {
	/** The player object from PZ */
	object: { getModData(): KahluaTable };
	/** The key to be used in `getModData()` */
	modKey: string;
	/** The data that shall be returned by default */
	defaultData: T;
};

export type PlayerModData = {
	addedTraits: string[];
	suppressedTraits: string[];
	xpBoosts: Record<string, number>;
};

export type EventData = PlayerModData & {
	name: string;
};
