
import { getText, Perk } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import type { PerkBoost, TraitType } from "types";
import { NaninhasTraits } from "./TraitValues";
import { TraitRegister } from "./TraitRegister";

export class Traits {
	private readonly traits: TraitType[];
	private readonly traitRegister: TraitRegister;

	private static cache: Map<string,PerkBoost[]>;
	constructor(traits: TraitType[] = NaninhasTraits, traitRegister: TraitRegister = TraitRegister.create()) {
		this.traits = traits;
		this.traitRegister = traitRegister;
		Events.onCreateLivingCharacter.addListener(() => this.addTraits());
	}

	/**
	 * For each Plushie trait, register it and it's boosts, if any;
	 */
	private addTraits() {
		if (!this.traitRegister.isAvailable()) {
			return;
		}

		for (const { id, cost, profession = false } of this.traits) {
			const name = getText(`UI_Trait_${id}`);
			const description = getText(`UI_Trait_${id}_Description`);
			this.traitRegister.addTrait(id, name, cost, description, profession);
		}
		this.setMutualExclusive();
	}

	/**
	 * Sets mutual exclusives for traits.
	 * This method iterates through the traits and sets mutual exclusives using the TraitRegister.
	 */
	private setMutualExclusive() {
		if (!this.traitRegister.isAvailable()) {
			return;
		}

		for (const { id, exclusives = [] } of this.traits) {
			for (const exclusive of exclusives) {
				this.traitRegister.setMutualExclusive(id, exclusive);
			}
		}
	}

	/**
	 * Return an Array of Perks and values for a given trait
	 * Cache this value in a Map so the lookup is done only once
	 * @param trait the trait name for the lookup
	 */
	public static getPerkBoostsForTrait(trait: string): PerkBoost[] {
		if(!this.cache) {
			this.cache = new Map(
				NaninhasTraits
					.map((({ id, xpBoosts = [] }) =>
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
