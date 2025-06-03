import { AttachedItem, getPlayer, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
class Plushie {
	traits: Record<string, boolean>;
	player: IsoPlayer;
	constructor(player: IsoPlayer, traitsNames: string[] = []) {
		this.player = player;
		this.traits = this.loadTraits(traitsNames);
	}
	/**
	 * 
	 * @param traitNames A list of traits that should be affecte by this plushie
	 * @returns An object that indicates which traits the player already have
	 */
	private loadTraits(traitNames: string[]): Record<string, boolean> {
		return traitNames.reduce<Record<string,boolean>>((acc, curr) => {
			acc[curr] = this.player.HasTrait(curr);
			return acc;
		}, {});
	}
	/**
	 * Loop through each trait, and act on those that player does not originally have
	 */
	private eachTrait(callback: (trait: string) => void) {
		for (const [trait, playerHasTrait] of Object.entries(this.traits)) {
			if (!playerHasTrait) {
				callback(trait);
			}
		}
	}
	public buff() {
		this.eachTrait(this.player.getTraits().add);
	}
	public debuff() {
		this.eachTrait(this.player.getTraits().remove);
	}
}

class SpiffoSanta extends Plushie {
	public buff() {
		super.buff();
		print("SpiffoSanta buff should be applied");
	}
}

enum SLOTS {
	SpiffoPlushie = "SpiffoPlushie",
	Doll = "Doll",
	TeddyBear = "TeddyBear",
	RubberDuck = "RubberDuck",
}

export class NaninhaClass {
	private player: IsoPlayer;
	/* SLOTS = {
		SpiffoPlushie: "SpiffoPlushie",
		Doll: "Doll",
		TeddyBear: "TeddyBear",
		RubberDuck: "RubberDuck"
	}; */

	PLUSHIES: Record<string, Plushie> = {};

	constructor(player: IsoPlayer) {
		this.player = player;
		this.PLUSHIES = {	
			SpiffoSanta: new SpiffoSanta(player)
		}
		this.registerEvents();
		print("Naninha class called!");
	}

	/**
	 * Method that should be called periodically
	 */
	update() {
		const attachedItems = this.player.getAttachedItems();
		for (let i = 0; i < attachedItems.size(); i++) {
			const item = attachedItems.get(i);
			print("item is: ", tostring(item));
		}
		for (const slot in SLOTS) {
			print("slot: ", slot)
			this.player.getAttachedItem(slot);
		}
		attachedItems.forEach((attachedItem: AttachedItem) => {
			print("attached item is: ", tostring(attachedItem))
			const item = attachedItem.getItem();
			const fullType = item.getFullType();
			const plushieKey = fullType.replace("AuthenticZClothing.","");
			const plushie = this.PLUSHIES[plushieKey];
			if (plushie != undefined) {
				plushie.buff();
			}
		});
	}

	/**
	 * Register events handlers for te class
	 */
	registerEvents() {
		Events.everyOneMinute.addListener(() => {
			this.update();
		});
	}
}