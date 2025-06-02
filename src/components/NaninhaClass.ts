import { AttachedItem, getPlayer, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
export class NaninhaClass {
	private player: IsoPlayer;
	SLOTS = {
		SpiffoPlushie: "SpiffoPlushie",
		Doll: "Doll",
		TeddyBear: "TeddyBear",
		RubberDuck: "RubberDuck"
	}
	constructor() {
		this.player = getPlayer();
		print("Naninha class called!");
	}

	update() {
		const attachedItems = this.player.getAttachedItems();
		for (let i =0; i < attachedItems.size(); i++) {
			const item = attachedItems.get(i);
			print("item is: ", tostring(item))
		}
		attachedItems.forEach((item: AttachedItem) => {
			print("item is: ", tostring(item))
		});
		// this.player.getAttached
	}
	register() {
		Events.everyOneMinute.addListener(() => {
			this.update()
		});
	}

}