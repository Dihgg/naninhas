import { AttachedItem, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Subject } from "components/Observer";
import { Plushie, SpiffoSanta } from "./Plushies";

/* enum SLOTS {
	SpiffoPlushie = "SpiffoPlushie",
	Doll = "Doll",
	TeddyBear = "TeddyBear",
	RubberDuck = "RubberDuck",
} */

export class Naninhas {
	private player: IsoPlayer;

	PLUSHIES: Plushie[] = [];

	private subject: Subject;

	constructor(player: IsoPlayer) {
		this.player = player;
		this.subject = new Subject();
		this.PLUSHIES = [
			new SpiffoSanta(player, "SpiffoSanta")
		];
		this.registerEvents();
	}

	/**
	 * Method that should be called periodically
	 */
	update() {
		// Tracks attached plushie names for easy lookup 
		const attachedSet = new Set<string>();

		// Step 1: Scan all attached items and track plushie names
		this.player.getAttachedItems().forEach((attachedItem: AttachedItem) => {
			const fullType = attachedItem.getItem().getFullType();
			const name = fullType.replace("AuthenticZClothing.", "");
			const plushie = this.PLUSHIES.find(p => p.name === name);
			if (plushie) {
				attachedSet.add(plushie.name);
			}
		});

		for (const plushie of this.PLUSHIES) {
			// Step 2: Subscribe plushies that are now attached and not yet observed
			if (attachedSet.has(plushie.name) && !this.subject.find(plushie.name)) {
				this.subject.subscribe(plushie);
			}
			// Step 3: Unsubscribe plushies that are no longer attached
			if (!attachedSet.has(plushie.name) && this.subject.find(plushie.name)) {
				this.subject.unsubscribe(plushie.name);
			}
		}

		// Step 4: Update all active plushie effects
		this.subject.update();
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
