import { Plushie } from "./Plushie.class";


export class SpiffoSanta extends Plushie {
	public subscribe() {
		super.subscribe();
		print("SpiffoSanta buff should be applied");
	}
}
