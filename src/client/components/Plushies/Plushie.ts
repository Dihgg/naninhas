import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Observer } from "../Observer/Observer";
// import { LuaEventManager } from "@asledgehammer/pipewrench"

type PlayerDataProps<T> = {
	/** The player object from PZ */
	player: IsoPlayer,
	/** The key to be used in `getModData()` */
	modKey: string,
	/** The data that shall be returned by default */
	defaultData: T
};
/**
 * Wrapper around `player.getModData()` to ensure the data can be retrieve type safely
 */
class PlayerData<T> {
	private player: IsoPlayer;
	private readonly modKey: string;
	private readonly defaultData: T;

	constructor({ player, modKey, defaultData }:PlayerDataProps<T>)  {
		this.player = player;
		this.modKey = modKey;
		this.defaultData = defaultData;
	}

	/**
	 * Safely retrieve some data from `player.getModData()`
	 * @returns The data in expected format
	 */
	get() {
		if(!this.player.getModData()[this.modKey]) {
			this.player.getModData()[this.modKey] = this.defaultData;
		}
		return (this.player.getModData()[this.modKey] as T);
	}
}

/**
 * This class control the Plushie behavior
 */
type PlushieProps = {
	player: IsoPlayer;
	name: string;
	traitsToAdd?: string[];
	traitsToSuppress?: string[];
};
export abstract class Plushie implements Observer {
	name: string;
	/** Zomboid player object */
	private readonly player: IsoPlayer;
	/** List of traits that this Plushie should grant */
	private readonly traitsToAdd: string[];
	private readonly traitsToSuppress: string[] = [];
	/** List of traits the player current posseses that are from Plushies ONLY */
	private addedTraits: string[];
	private suppressedTraits: string[];
	
	
	/** The data from `player.getModData()` to ensure traits are not permanent */
	private data: PlayerData<{ addedTraits: string[], suppressedTraits: string[] }>;

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
		this.data = new PlayerData({
			player: this.player,
			modKey: "Naninhas",
			defaultData: { addedTraits: [], suppressedTraits: [] }
		});

		this.addedTraits = this.data.get().addedTraits;
		this.suppressedTraits = this.data.get().suppressedTraits;
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect
	 */
	update() {
		// This ensures the data is saved in the `player.getModData()`
		this.data.get().addedTraits = this.addedTraits;
		this.data.get().suppressedTraits = this.suppressedTraits;
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
	}

	/**
	 * Method that should be called when Plushie is unequipped
	 */
	public unsubscribe() {
		for (const trait of this.traitsToAdd) {
			// Remove all the traits that are exclusive this Plushie
			if (this.addedTraits.includes(trait)) {
				this.player.getTraits().remove(trait);
				this.addedTraits = this.addedTraits.filter(aTrait => aTrait != trait);
			}
		}
		for (const trait of this.traitsToSuppress) {
			// Add back the traits that are suppressed by this Plushie
			if (this.suppressedTraits.includes(trait)) {
				this.player.getTraits().add(trait);
				this.suppressedTraits = this.suppressedTraits.filter(sTrait => sTrait != trait);
			}
		}
		// This ensures the data is saved in the `player.getModData()` before the Plushie effect is no longer applied
		this.update();
	}
}
