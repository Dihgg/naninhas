/* @noSelfInFile */
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Observer } from "../Observer/Observer";
import { ModData } from "./ModData";
import { TraitsClass } from "@components/TraitsClass";
import type { PlushieProps } from "types";

// TODO: Apply the LuaEventManager to allow other mods to interact with this one
// import { LuaEventManager } from "@asledgehammer/pipewrench"


/**
 * This class controls the Plushie behavior
 */
export abstract class Plushie implements Observer {
	name: string;
	/** Zomboid player object */
	protected readonly player: IsoPlayer;

	/** List of traits that this Plushie should grant */
	private readonly traitsToAdd: string[];
	private readonly traitsToSuppress: string[] = [];

	/** List of traits that are added by Plushies */
	private readonly addedTraits: Set<string>;
	/** List of traits that are suppressed by Plushies */
	private readonly suppressedTraits: Set<string>;

	/** The data from `player.getModData()` to ensure traits are not permanent */
	private readonly playerData: ModData<{
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
		this.playerData = new ModData({
			object: this.player,
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
	 * This ensures the traits data are saved in the `player.getModData()`
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
	 * @param trait The trait to look for in Naninhas traits
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
		toAdd.forEach((trait) => this.addedTraits.add(trait));
		// TODO: this is not working right now
		this.player.getTraits().addAll(toAdd);
		this.applyBoosts(toAdd);

		const toSuppress = this.traitsToSuppress.filter(trait => !this.suppressedTraits.has(trait) && this.player.HasTrait(trait));
		toSuppress.forEach( (trait) => this.suppressedTraits.add(trait));
		// TODO: this is not working right now
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
		const toRemove = this.traitsToAdd
			.filter((trait) => this.addedTraits.has(trait));
			
		// TODO: this is not working right now
		this.player.getTraits().removeAll(toRemove);
		this.applyBoosts(toRemove, false);
		toRemove.forEach((trait) => this.addedTraits.delete(trait));

		// Add back the traits that are suppressed by this Plushie
		const toRestore = this.traitsToSuppress
			.filter((trait) => this.suppressedTraits.has(trait));
		// TODO: this is not working right now
		this.player.getTraits().addAll(toRestore);
		this.applyBoosts(toRemove, false);
		toRestore.forEach((trait) => this.suppressedTraits.delete(trait));

		// Ensures the data is saved in the `player.getModData()` before the Plushie effect is no longer applied
		this.update();
	}
}
