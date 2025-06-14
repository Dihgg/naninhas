import type { Perk } from "@asledgehammer/pipewrench";

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
