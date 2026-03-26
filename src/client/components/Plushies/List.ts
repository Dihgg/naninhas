
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Plushie } from "./Plushie";

export class BorisBadger extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "BorisBadger",
			traitsToAdd: ["NightVision"]
		});
	}
}

export class Doll extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "Doll",
			traitsToAdd: ["EagleEyed"],
			traitsToSuppress: ["ShortSighted"]
		});
	}
}

export class Flamingo extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "Flamingo",
			traitsToAdd: ["Graceful"],
			traitsToSuppress: ["Clumsy"]
		});
	}
}

export class FluffyfootBunny extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "FluffyfootBunny",
			traitsToAdd: ["LightEater"],
			traitsToSuppress: ["HeartyAppitite"]
		});
	}
}

export class FreddyFox extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "FreddyFox",
			traitsToAdd: ["Inconspicuous"],
			traitsToSuppress: ["Conspicuous"]
		});
	}
}

export class FurbertSquirrel extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "FurbertSquirrel",
			traitsToAdd: ["Outdoorsman"]
		});
	}
}

export class GroguAZ extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "GroguAZ",
			traitsToAdd: ["FastLearner"],
			traitsToSuppress: ["SlowLearner"]
		});
	}
}

export class JacquesBeaver extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "JacquesBeaver",
			traitsToAdd: ["Naninhas_JacquesBeaver"]
		});
	}
}

export class MoleyMole extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "MoleyMole",
			traitsToAdd: ["Naninhas_MoleyMole"]
		});
	}
}

export class OtisPug extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "OtisPug",
			traitsToAdd: ["FastReader"],
			traitsToSuppress: ["SlowReader"]
		});
	}
}

export class PancakeHedgehog extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "PancakeHedgehog",
			traitsToAdd: ["Naninhas_PancakeHedgehog"]
		});
	}
}

export class Spiffo extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "Spiffo"
		});
	}
	update() {
		super.update();
		this.player.increaseEndurance(0.1);
	}
}

export class SpiffoBlueberry extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SpiffoBlueberry",
			traitsToAdd: ["LowThirst"],
			traitsToSuppress: ["HighThirst"]
		});
	}
}

export class SpiffoCherry extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SpiffoCherry",
			traitsToAdd: ["Organized"],
			traitsToSuppress: ["Disorganized"]
		});
	}
}

export class SpiffoGrey extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SpiffoGrey",
			traitsToAdd: ["Brave", "Naninhas_SpiffoGray"],
			traitsToSuppress: ["Brave", "Cowardly", "Agoraphobic", "Claustophobic"]
		});
	}
}

export class SpiffoHeart extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SpiffoHeart",
			traitsToAdd: ["Naninhas_SpiffoHeart"]
		});
	}
}

export class SpiffoPlushieRainbow extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SpiffoPlushieRainbow"
		});
	}
	update() {
		super.update();
		this.player.reduceBoredom(0.5);
		this.player.increaseEndurance(0.5);
		this.player.reduceFatigue(0.5);
	}
}

export class SpiffoSanta extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SpiffoSanta"
		});
	}
	public update() {
		super.update();
		this.player.reduceBoredom(0.5);
	}
}

export class SpiffoShamrock extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SpiffoShamrock",
			traitsToAdd: ["Naninhas_SpiffoShamrock"]
		});
	}
}

export class SubstitutionDoll extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "SubstitutionDoll",
			traitsToAdd: ["Brave"],
			traitsToSuppress: ["Desensitized", "Cowardly", "Agoraphobic", "Claustophobic"]
		});
	}
}

export class ToyBear extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "ToyBear"
		});
	}
	update() {
		super.update();
		this.player.reducePanic(0.5);
	}
}

export class ToyBearSmall extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: "ToyBearSmall"
		});
	}
	update() {
		super.update();
		this.player.reducePanic(0.1);
	}
}
