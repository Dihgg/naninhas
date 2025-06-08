import {IsoPlayer} from "@asledgehammer/pipewrench";

export class Plushie {
	name = "";
	constructor(player: IsoPlayer, name: string) {
		console.log('calling mocked plushie constructor');
		this.name = name;
	}
	update = jest.fn();
	subscribe = jest.fn();
	unsubscribe = jest.fn();
}
