import { IsoPlayer } from "@asledgehammer/pipewrench";
import type { PlushieProps } from "types";
export class Plushie {
	name = "";
	player: IsoPlayer;
	constructor({ player, name }: PlushieProps) {
		this.player = player;
		this.name = name;
	}
	update() {}
	subscribe() {}
	unsubscribe() {}
}
