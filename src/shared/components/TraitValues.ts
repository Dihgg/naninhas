/* @noSelfInFile */
import { Perk, Perks } from "@asledgehammer/pipewrench";
import type { TraitType } from "types";

export const NaninhasTraits: TraitType[] = [
	{
		id: "Naninhas_JacquesBeaver",
		cost: 2,
		xpBoosts: [
			{
				perk: Perks.Woodwork as Perk,
				value: 1
			}
		]
	},
	{
		id: "Naninhas_PancakeHedgehog",
		cost: 2,
		xpBoosts: [
			{
				perk: Perks.Sprinting as Perk,
				value: 1
			},
			{
				perk: Perks.Agility as Perk,
				value: 1
			}
		]
	},
	{
		id: "Naninhas_MoleyMole",
		cost: 2,
		xpBoosts: [
			{
				perk: Perks.PlantScavenging as Perk,
				value: 2
			}
		]
	},
	{
		id: "Naninhas_SpiffoHeart",
		cost: 2,
		xpBoosts: [
			{
				perk: Perks.Doctor as Perk,
				value: 2
			}
		]
	},
	{
		id: "Naninhas_SpiffoGray",
		cost: 6,
		xpBoosts: [
			{
				perk: Perks.Nimble as Perk,
				value: 1
			},
			{
				perk: Perks.LongBlade as Perk,
				value: 1
			},
			{
				perk: Perks.SmallBlade as Perk,
				value: 1
			},
			{
				perk: Perks.Blunt as Perk,
				value: 1
			},
			{
				perk: Perks.SmallBlunt as Perk,
				value: 1
			}
		]
	},
	{
		id: "Naninhas_SpiffoShamrock",
		cost: 2,
		xpBoosts: [
			{
				perk: Perks.Aiming as Perk,
				value: 1
			},
			{
				perk: Perks.Reloading as Perk,
				value: 1
			}
		]
	}
];

