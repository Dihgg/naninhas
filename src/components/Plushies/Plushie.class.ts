import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Observer } from "components/Observer";
// import { LuaEventManager } from "@asledgehammer/pipewrench"

/**
 * Wrapper around `player.getModData()` to ensure the data can be retrieve type safely
 */
class PlayerData<T> {
	private player: IsoPlayer;
	private defaultData: T;
	/**
	 * @param player Player object from PZ
	 * @param defaultData The data that shall be returned by default
	 */
	constructor(player: IsoPlayer, defaultData: T)  {
		this.player = player;
		this.defaultData = defaultData;
	}
	/**
	 * Safely retrieve some data from `player.getModData()`
	 * @param key The key to be used in `getModData()`
	 * @returns The data in expected format
	 */
	get(key: string) {
		if(!this.player.getModData()[key]) {
			this.player.getModData()[key] = this.defaultData;
		}
		return (this.player.getModData()[key] as T);
	}
}

/**
 * This class control the Plushie behavior
 */
export abstract class Plushie implements Observer {
	name: string;
	/** Zomboid player object */
	private readonly player: IsoPlayer;
	/** List of traits that this Plushie should grant */
	private readonly traitNames: string[];
	/** List of traits the player current posseses that are from Plushies ONLY */
	private naninhasTraits: string[];
	/** The data from `player.getModData()` to ensure traits are not permanent */
	private data: PlayerData<{ traits: string[] }>;

	/**
	 * @param player Player object from PZ
	 * @param name Plushie name
	 * @param traitsNames A string with traits that this plushies gives when equipped
	 */
	constructor(player: IsoPlayer, name: string, traitsNames: string[] = []) {
		this.name = name;
		this.player = player;
		this.traitNames = traitsNames;
		this.data = new PlayerData(this.player, { traits: [] });

		this.naninhasTraits = this.data.get('NaninhasData').traits;
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect
	 */
	update() {
		print(`Buff for ${this.name} should be applied here!`);
		this.data.get('NaninhasData').traits = this.naninhasTraits;
	}

	/**
	 * Method that should be called when the Plushie is equipped
	 */
	public subscribe() {
		for (const trait of this.traitNames) {
			// Only saves traits that the player does not have without the Naninha
			if (!this.naninhasTraits.includes(trait) && !this.player.HasTrait(trait)) {
				this.naninhasTraits.push(trait);
				this.player.getTraits().add(trait);
			}
		}
	}

	/**
	 * Method that should be called when Plushie is unequipped
	 */
	public unsubscribe() {
		for (const trait of this.traitNames) {
			// Remove all the traits that are exclusive this Plushie
			if (this.naninhasTraits.includes(trait)) {
				this.player.getTraits().remove(trait);
				this.naninhasTraits = this.naninhasTraits.filter(nTrait => nTrait != trait);
			}
		}
	}
}
