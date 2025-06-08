import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Plushie } from "./Plushie";


export class BorisBadger extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "BorisBadger"
		});
	}
}

export class Doll extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "Doll"
		});
	}
}

export class Flamingo extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "Flamingo",
			traitsToAdd: ["Graceful"],
			traitsToSuppress: ["Clumsy"]
		});
	}
}

export class FluffyfootBunny extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "FluffyfootBunny",
			traitsToAdd: ["Inconspicuous"],
			traitsToSuppress: ["Conspicuous"]
		});
	}
}

export class FreddyFox extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "FreddyFox"
		});
	}
}

export class FurbertSquirrel extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "FurbertSquirrel"
		});
	}
}

export class GroguAZ extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "GroguAZ"
		});
	}
}

export class JacquesBeaver extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "JacquesBeaver",
			traitsToAdd: ["Organized"],
			traitsToSuppress: ["Disorganized"]
		});
	}
}

export class MoleyMole extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "MoleyMole"
		});
	}
}

export class OtisPug extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "OtisPug",
			traitsToAdd: ["FastLearner"],
			traitsToSuppress: ["SlowLearner"]
		});
	}
}

export class PancakeHedgehog extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "PancakeHedgehog"
		});
	}
}

export class Spiffo extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "Spiffo"
		});
	}
}

export class SpiffoBlueberry extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SpiffoBlueberry",
			traitsToAdd: ["LowThirst"],
			traitsToSuppress: ["HighThirst"]
		});
	}
}

export class SpiffoCherry extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SpiffoCherry",
			traitsToAdd: ["LightEater"],
			traitsToSuppress: ["HeartyAppitite"]
		});
	}
}

export class SpiffoGrey extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SpiffoGrey",
			traitsToAdd: ["Brave"],
			traitsToSuppress: ["Cowardly", "Agoraphobic", "Claustophobic"]
		});
	}
}

export class SpiffoHeart extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SpiffoHeart"
		});
	}
}

export class SpiffoPlushieRainbow extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SpiffoPlushieRainbow",
			traitsToAdd: ["FastLearner"],
			traitsToSuppress: ["SlowLearner"]
		});
	}
}

export class SpiffoSanta extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SpiffoSanta",
			traitsToAdd: ["Outdoorsman"]
			
		});
	}
	public update() {
		super.update();
		print("SpiffoSanta buff should be applied");
	}
}

export class SpiffoShamrock extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SpiffoShamrock"
		});
	}
}

export class SubstitutionDoll extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "SubstitutionDoll"
		});
	}
}

export class ToyBear extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "ToyBear"
		});
	}
}

export class ToyBearSmall extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name:  "ToyBearSmall"
		});
	}
}

/*
	[
		'BorisBadger',
		'Doll',
		'Flamingo',
		'FluffyfootBunny',
		'FreddyFox',
		'FurbertSquirrel',
		'GroguAZ',
		'JacquesBeaver',
		'MoleyMole',
		'OtisPug',
		'PancakeHedgehog',
		'Spiffo',
		'SpiffoBlueberry',
		'SpiffoCherry',
		'SpiffoGrey',
		'SpiffoHeart',
		'SpiffoPlushieRainbow',
		'SpiffoSanta',
		'SpiffoShamrock',
		'SubstitutionDoll',
		'ToyBear',
		'ToyBearSmall'
	];
*/
