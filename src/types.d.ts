import type { IsoPlayer, KahluaTable, Perk } from "@asledgehammer/pipewrench";

type PerkBoost = {
	perk: Perk;
	value: number
};

type TraitType = {
	id: string;
	cost: number;
	profession?: boolean;
	xpBoosts?: PerkBoost[];
};

type PlushieProps = {
	player: IsoPlayer;
	name: string;
	traitsToAdd?: string[];
	traitsToSuppress?: string[];
};

type ModDataProps<T> = {
	/** The player object from PZ */
	object: { getModData(): KahluaTable };
	/** The key to be used in `getModData()` */
	modKey: string;
	/** The data that shall be returned by default */
	defaultData: T;
};