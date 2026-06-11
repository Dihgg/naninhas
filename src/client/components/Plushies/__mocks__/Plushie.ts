import type { PlushieProps } from "@types";
import { PlayerApi } from "@shared/components/PlayerApi";

export class Plushie {
	name = "";
	protected readonly playerApi: PlayerApi;

	constructor({ player, name }: PlushieProps) {
		this.name = name;
		this.playerApi = new PlayerApi(player);
	}

	update() {}

	subscribe() {}

	unsubscribe() {}
}
