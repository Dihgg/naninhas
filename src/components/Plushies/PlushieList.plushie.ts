import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Plushie } from "./Plushie.class";


export class BorisBadger extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "BorisBadger");
	}
}

export class Doll extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "Doll");
	}
}

export class Flamingo extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "Flamingo");
	}
}

export class FluffyfootBunny extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "FluffyfootBunny");
	}
}

export class FreddyFox extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "FreddyFox");
	}
}

export class FurbertSquirrel extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "FurbertSquirrel");
	}
}

export class GroguAZ extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "GroguAZ");
	}
}

export class JacquesBeaver extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "JacquesBeaver", ["Organized"]);
	}
}

export class MoleyMole extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "MoleyMole");
	}
}

export class OtisPug extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "OtisPug", ["FastReader"]);
	}
}

export class PancakeHedgehog extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "PancakeHedgehog");
	}
}

export class Spiffo extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "Spiffo");
	}
}

export class SpiffoBlueberry extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SpiffoBlueberry", ["LowThirst"]);
	}
}

export class SpiffoCherry extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SpiffoCherry", ["LightEater"]);
	}
}

export class SpiffoGrey extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SpiffoGrey", ["Brave"]);
	}
}

export class SpiffoHeart extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SpiffoHeart");
	}
}

export class SpiffoPlushieRainbow extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SpiffoPlushieRainbow", ["FastLearner"]);
	}
}

export class SpiffoSanta extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SpiffoSanta", ["Outdoorsy"]);
	}
	public update() {
		super.update();
		print("SpiffoSanta buff should be applied");
	}
}

export class SpiffoShamrock extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SpiffoShamrock");
	}
}

export class SubstitutionDoll extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "SubstitutionDoll");
	}
}

export class ToyBear extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "ToyBear");
	}
}

export class ToyBearSmall extends Plushie {
	constructor(player: IsoPlayer) {
		super(player, "ToyBearSmall");
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