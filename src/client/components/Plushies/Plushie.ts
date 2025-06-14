/* @noSelfInFile */
import { IsoPlayer, Perk, TraitFactory, XPMultiplier } from "@asledgehammer/pipewrench";
import { Observer } from "../Observer/Observer";
import { PlayerData } from "./PlayerData";
import { NaninhasTraits } from "shared/components/TraitValues";
import type { PerkBoost } from "types";
import { TraitsClass } from "shared/components/TraitsClass";
// TODO: Apply the LuaEventManager to allow other mods to interact with this one
// import { LuaEventManager } from "@asledgehammer/pipewrench"

export type PlushieProps = {
	player: IsoPlayer;
	name: string;
	traitsToAdd?: string[];
	traitsToSuppress?: string[];
};

/**
 * This class control the Plushie behavior
 */
export abstract class Plushie implements Observer {
	name: string;
	/** Zomboid player object */
	protected readonly player: IsoPlayer;

	/** List of traits that this Plushie should grant */
	private readonly traitsToAdd: string[];
	private readonly traitsToSuppress: string[] = [];

	/** List of traits that are added by Plushies */
	private addedTraits: Set<string>;
	/** List of traits that are suppressed by Plushies */
	private suppressedTraits: Set<string>;

	/** The data from `player.getModData()` to ensure traits are not permanent */
	private readonly playerData: PlayerData<{
		addedTraits: string[];
		suppressedTraits: string[];
	}>;

	/**
	 * @param player Player object from PZ
	 * @param name Plushie name
	 * @param traitsNames A string with traits that this plushies gives when equipped
	 */
	constructor({ player, name, traitsToAdd = [], traitsToSuppress = [] }: PlushieProps) {
		this.name = name;
		this.player = player;
		this.traitsToAdd = traitsToAdd;
		this.traitsToSuppress = traitsToSuppress;
		this.playerData = new PlayerData({
			player: this.player,
			modKey: "Naninhas",
			defaultData: { addedTraits: [], suppressedTraits: [] }
		});

		// Load the data from `player.getModData()`
		const { data } = this.playerData;
		this.addedTraits = new Set(data.addedTraits);
		this.suppressedTraits = new Set(data.suppressedTraits);
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect.
	 * This ensure the traits data are saved in the `player.getModData()`
	 */
	update() {
		// This ensures the data is saved in the `player.getModData()`
		const { data } = this.playerData;
		data.addedTraits = [...this.addedTraits];
		data.suppressedTraits = [...this.suppressedTraits];
	}

	/* private traitToPerkBoosts(trait: string): PerkBoost[] {
		return NaninhasTraits
			.reduce<PerkBoost[]>((acc, { id, xpBoosts = [] }) => {
				if (id === trait) {
					const perks = xpBoosts.map(({ perk, value }) => ({ perk: perk as Perk, value }));
					return [...acc, ...perks];
				}
				return acc;
			}, []);
	} */

	/**
	 * For a given trait, apply a boost based on Naninhas traits
	 * @param trait The trait to loof for in Naninhas traits
	 * @param shouldApply Should the boost be applied or removed (set to 0) 
	 */
	private applyBoost(trait: string, shouldApply = true) {
		const xp = this.player.getXp();
		const perks = TraitsClass.getPerkBoostsForTrait(trait);
		for (const { perk, value } of perks) {
			xp.AddXPNoMultiplier(perk, shouldApply ? value : 0);
		}
	}

	/**
	 * Calls `applyBoost` in each given trait
	 * @param traits List of traits
	 * @param shouldApply Should the boost be applied or removed (set to 0) 
	 */
	private applyBoosts(traits: string[], shouldApply = true) {
		for (const trait of traits) {
			this.applyBoost(trait, shouldApply);
		}
	}

	/**
	 * Method that should be called when the Plushie is equipped
	 */
	public subscribe() {

		const toAdd = this.traitsToAdd.filter(trait => !this.addedTraits.has(trait) && !this.player.HasTrait(trait))
		toAdd.forEach(this.addedTraits.add);
		this.player.getTraits().addAll(toAdd);
		this.applyBoosts(toAdd);

		const toSuppress = this.traitsToAdd.filter(trait => !this.suppressedTraits.has(trait) && this.player.HasTrait(trait));
		toSuppress.forEach(this.suppressedTraits.add);
		this.player.getTraits().removeAll(toSuppress);
		this.applyBoosts(toSuppress, false);

		// Ensures the data is saved in the `player.getModData()` after the Plushie effect is applied
		this.update();
	}

	/**
	 * Method that should be called when Plushie is unequipped
	 */
	public unsubscribe() {
		// Remove all the traits that are exclusive this Plushie
		const toRemove = this.traitsToAdd.filter(this.addedTraits.has);
		this.player.getTraits().removeAll(toRemove);
		this.applyBoosts(toRemove, false);
		toRemove.forEach(this.addedTraits.delete);

		// Add back the traits that are suppressed by this Plushie
		const toRestore = this.traitsToSuppress.filter(this.suppressedTraits.has);
		this.player.getTraits().addAll(toRestore);
		this.applyBoosts(toRemove, false);
		toRestore.forEach(this.suppressedTraits.delete);

		// Ensures the data is saved in the `player.getModData()` before the Plushie effect is no longer applied
		this.update();
	}
}
