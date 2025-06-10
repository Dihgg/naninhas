import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Observer } from "../Observer/Observer";
import { PlayerData } from "./PlayerData";
// TODO: Apply the LuaEventManager to allow other mods to interact with this one 
// import { LuaEventManager } from "@asledgehammer/pipewrench"

type PlushieProps = {
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
	private addedTraits: string[];
	/** List of traits that are suppressed by Plushies */
	private suppressedTraits: string[];
	
	
	/** The data from `player.getModData()` to ensure traits are not permanent */
	private playerData: PlayerData<{ addedTraits: string[], suppressedTraits: string[] }>;

	/**
	 * @param player Player object from PZ
	 * @param name Plushie name
	 * @param traitsNames A string with traits that this plushies gives when equipped
	 */
	constructor({player, name, traitsToAdd = [], traitsToSuppress = []}: PlushieProps) {
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
		this.addedTraits = data.addedTraits;
		this.suppressedTraits = data.suppressedTraits;
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect.
	 * This ensure the traits data are saved in the `player.getModData()`
	 */
	update() {
		// This ensures the data is saved in the `player.getModData()`
		const { data } = this.playerData;
		data.addedTraits = this.addedTraits;
		data.suppressedTraits = this.suppressedTraits;
	}

	/**
	 * Method that should be called when the Plushie is equipped
	 */
	public subscribe() {
		for (const trait of this.traitsToAdd) {
			// Only saves traits that the player does not have without the Naninha
			if (!this.addedTraits.includes(trait) && !this.player.HasTrait(trait)) {
				this.addedTraits.push(trait);
				this.player.getTraits().add(trait);
			}
		}
		for (const trait of this.traitsToSuppress) {
			// Remove traits that are suppressed by this Plushie
			if (!this.suppressedTraits.includes(trait) && this.player.HasTrait(trait)) {
				this.suppressedTraits.push(trait);
				this.player.getTraits().remove(trait);
			}
		}
		// Ensures the data is saved in the `player.getModData()` after the Plushie effect is applied
		this.update();
	}

	/**
	 * Method that should be called when Plushie is unequipped
	 */
	public unsubscribe() {
		// Remove all the traits that are exclusive this Plushie
		for (const trait of this.traitsToAdd) {
			if (this.addedTraits.includes(trait)) {
				this.player.getTraits().remove(trait);
				this.addedTraits = this.addedTraits.filter(aTrait => aTrait != trait);
			}
		}
		// Add back the traits that are suppressed by this Plushie
		for (const trait of this.traitsToSuppress) {
			if (this.suppressedTraits.includes(trait)) {
				this.player.getTraits().add(trait);
				this.suppressedTraits = this.suppressedTraits.filter(sTrait => sTrait != trait);
			}
		}
		// Ensures the data is saved in the `player.getModData()` before the Plushie effect is no longer applied
		this.update();
	}
}
