import {IsoPlayer} from "@asledgehammer/pipewrench";

export class Plushie {
	name = "";
	player: IsoPlayer;
	constructor(player: IsoPlayer, name: string) {
		console.log('calling mocked plushie constructor');
		this.player = player;
		this.name = name;
	}
	update = jest.fn();
	subscribe = jest.fn();
	unsubscribe = jest.fn();
}
