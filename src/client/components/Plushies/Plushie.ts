
import { IsoPlayer, java, Perk, Trait, transformIntoKahluaTable } from "@asledgehammer/pipewrench";
import { Traits } from "@shared/components/Traits";
import { ModData } from "./ModData";
import { Observer } from "../Observer/Observer";
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
	// private readonly addedTraits: Set<string>;
	/** List of traits that are suppressed by Plushies */
	// private readonly suppressedTraits: Set<string>;

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
		//const { data } = this.playerData;
		// this.addedTraits = new Set(this.data.addedTraits);
		// this.suppressedTraits = new Set(this.data.suppressedTraits);
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect.
	 * This ensures the traits data are saved in the `player.getModData()`
	 */
	// abstract update(): void;

	/**
	 * For a given trait, apply a boost based on Naninhas traits
	 * @param trait The trait to look for in Naninhas traits
	 * @param shouldApply Should the boost be applied or removed (set to 0)
	 */
	private applyBoost(trait: string, shouldApply = true) {
		const perks = Traits.getPerkBoostsForTrait(trait);

		const xp = this.player.getXp();
		
		for (const { perk, value } of perks) {
			print(`Applying boost for ${trait} to ${perk} with value ${value}`);
			
			xp.addXpMultiplier(perk, shouldApply ? value : 0, 0, 0);
		}
	}

	/**
	 * Method that should be called when the Plushie is equipped
	 */
	public subscribe() {

		const toAdd = this.traitsToAdd
			.filter(trait => !this.data.addedTraits.includes(trait) && !this.player.HasTrait(trait))
		
		for (const trait of toAdd) {
			this.data.addedTraits.push(trait);
			this.player.getTraits().add(trait);
			this.applyBoost(trait, true);
		}

		const toSuppress = this.traitsToSuppress
			.filter(trait => !this.data.suppressedTraits.includes(trait) && this.player.HasTrait(trait));
		
		for (const trait of toSuppress) {
			this.data.suppressedTraits.push(trait);
			this.player.getTraits().remove(trait);
			this.applyBoost(trait, false);
		}
	}

	/**
	 * Method that should be called when Plushie is unequipped
	 */
	public unsubscribe() {
		// Remove all the traits that are exclusive this Plushie
		const toRemove = this.traitsToAdd
			.filter((trait) => this.data.addedTraits.includes(trait));

		for (const trait of toRemove) {
			this.data.addedTraits = this.data.addedTraits.filter(t => t !== trait);
			this.player.getTraits().remove(trait);
			this.applyBoost(trait, false);
		}

		// Add back the traits that are suppressed by this Plushie
		const toRestore = this.traitsToSuppress
			.filter((trait) => this.data.suppressedTraits.includes(trait));
		for (const trait of toRestore) {
			this.data.suppressedTraits = this.data.suppressedTraits.filter(t => t !== trait);
			this.player.getTraits().add(trait);
			this.applyBoost(trait, true);
		}
	}

	get data() {
		return this.playerData.data;
	}
}
