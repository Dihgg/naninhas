import type { IsoPlayer, Perk } from "@asledgehammer/pipewrench";

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
