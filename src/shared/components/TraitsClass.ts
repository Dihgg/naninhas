import { getText, Perk, TraitFactory } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import type { PerkBoost, TraitType } from "types";
import { NaninhasTraits } from "./TraitValues";

export class TraitsClass {
	private readonly traits: TraitType[];

	private static cache: Map<string,PerkBoost[]>;
	constructor() {
		this.traits = NaninhasTraits;
		Events.onGameBoot.addListener(() => this.addTraits());
	}

	private addTraits() {
		for (const { id, cost, profession = false, xpBoosts = [] } of this.traits) {
			const name = getText(`UI_Trait_${id}`);
			const description = getText(`UI_Trait_${id}_Description`);
			const trait = TraitFactory.addTrait(id, name, cost, description, profession);
			for (const { perk, value } of xpBoosts) {
				trait.addXPBoost(perk as Perk, value);
			}
		}
	}

	public static getPerkBoostsForTrait(trait: string): PerkBoost[] {
		if(!this.cache) {
			this.cache = new Map(
				NaninhasTraits.map((({id, xpBoosts = []}) => {
					return [id,xpBoosts.map(({perk, value}) => ({perk, value}))]
				}))
			)
		}
		return this.cache.get(trait) ?? [];
	} 
}
