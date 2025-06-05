import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Observer } from "components/Observer";


/**
 * This class control the Plushie behavior
 */
export abstract class Plushie implements Observer {
	name: string;
	/** Zomboid player object */
	private player: IsoPlayer;
	/** List of traits that this Plushie should grant */
	private traitNames: string[];
	/** List of traits the player current posseses that are from Plushies ONLY */
	private naninhasTraits: string[];

	constructor(player: IsoPlayer, name: string, traitsNames: string[] = []) {
		this.name = name;
		this.player = player;
		this.traitNames = traitsNames;
		// TODO: improve this, maybe creating a wrapper into the player object
		this.ensureModData();

		this.naninhasTraits = this.player.getModData().NaninhaClass.naninhasTraits;
	}

	/**
	 * This method will ensure the naninhas data in the `getModData`.
	 * This is where the traits from naninhas will be set, so the
	 * traits are not permanent
	 */
	private ensureModData() {
		if (!this.player.getModData().NaninhaClass) {
			this.player.getModData().NaninhaClass = {};
		}
		if (!this.player.getModData().NaninhaClass.naninhasTraits) {
			this.player.getModData().NaninhaClass.naninhasTraits = [];
		}
	}

	update() {
		print(`Buff for ${this.name} should be applied here!`);
		this.player.getModData().NaninhaClass.naninhasTraits = this.naninhasTraits;
	}

	public subscribe() {
		for (const trait of this.traitNames) {
			// Only saves traits that the player does not have without the Naninha
			if (!this.naninhasTraits.includes(trait) && !this.player.HasTrait(trait)) {
				this.naninhasTraits.push(trait);
				this.player.getTraits().add(trait);
			}
		}
	}

	public unsubscribe() {
		for (const trait of this.traitNames) {
			// Remove all the traits that are exclusive this Naninha
			if (this.naninhasTraits.includes(trait)) {
				this.player.getTraits().remove(trait);
				this.naninhasTraits = this.naninhasTraits.filter(nTrait => nTrait != trait);
			}
		}
	}
}
