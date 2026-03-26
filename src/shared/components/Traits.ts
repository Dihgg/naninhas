import { Perk, Perks } from "@asledgehammer/pipewrench";
import type { PerkBoost, TraitType } from "types";


const TRAITS: TraitType[] = [
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
				value: 5
			},
			{
				perk: Perks.Reloading as Perk,
				value: 5
			}
		]
	}
];

export class Traits {

	private static cache: Map<string, PerkBoost[]>;

	/**
	 * Return an Array of Perks and values for a given trait
	 * Cache this value in a Map so the lookup is done only once
	 * @param trait the trait name for the lookup
	 */
	public static getPerkBoostsForTrait(trait: string): PerkBoost[] {
		if (!this.cache) {
			this.cache = new Map(
				TRAITS
					.map((({ id, xpBoosts }) =>
						[
							id,
							xpBoosts.map(({ perk, value }) => ({ perk, value }))
						]
					))
			);
		}
		return this.cache.get(trait) ?? [];
	}
}
