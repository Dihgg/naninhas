import {getText, Perk, Perks, TraitFactory} from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";

type TraitType = {
	id: string;
	/* name: string; */
	cost: number;
	/* description: string; */
	profession?: boolean,
	xpBoosts?: { perk?: Perk, value: number }[]
};

export class TraitsClass {
	private readonly traits: TraitType[];
	private readonly defaultTraits: TraitType[] = [
		{
			id: "Naninhas_JacquesBeaver",
			cost: -2,
			xpBoosts: [
				{
					perk: Perks.Woodwork,
					value: 1,
				}
			]
		},
		{
			id: "Naninhas_PancakeHedgehog",
			cost: -2,
			xpBoosts: [
				{
					perk: Perks.Sprinting,
					value: 1,
				},
				{
					perk: Perks.Agility,
					value: 1
				}
			]
		},
		{
			id: "Naninhas_MoleyMole",
			cost: -2,
			xpBoosts: [
				{
					perk: Perks.PlantScavenging,
					value: 2
				}
			]
		},
		{
			id: "Naninhas_SpiffoHeart",
			cost: -2,
			xpBoosts: [
				{
					perk: Perks.Doctor,
					value: 2
				}
			]
		},
		{
			id: "Naninhas_SpiffoGray",
			cost: -6,
			xpBoosts: [
				{
					perk: Perks.Nimble,
					value: 1
				},
				{
					perk: Perks.LongBlade,
					value: 1,
				},
				{
					perk: Perks.SmallBlade,
					value: 1,
				},
				{
					perk: Perks.Blunt,
					value: 1,
				},
				{
					perk: Perks.SmallBlunt,
					value: 1,
				},
			]
		},
		{
			id: "Naninhas_SpiffoShamrock",
			cost: -2,
			xpBoosts: [
				{
					perk: Perks.Aiming,
					value: 1
				},
				{
					perk: Perks.Reloading,
					value: 1
				}
			]
		}
	];
	
	constructor(traits?: TraitType[]) {
		this.traits = traits || this.defaultTraits;
		Events.onGameBoot.addListener(() => this.addTraits());
	}
	
	private addTraits() {
		for (const { id, cost, profession = false, xpBoosts = [] } of this.traits) {
			const name = getText(`UI_Trait_${id}`);
			const description = getText(`UI_Trait_${id}_Description`);
			const trait = TraitFactory.addTrait(
				id,
				name,
				cost,
				description,
				profession
			);
			for (const { perk, value } of xpBoosts) {
				trait.addXPBoost(perk as Perk, value);
			}
		}
	}
}
