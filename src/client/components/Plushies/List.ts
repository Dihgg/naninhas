import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Plushie } from "@client/components/Plushies/Plushie";
import { PlushieNames } from "@constants";

/**
 * Boris Badger plushie grants the NightVision trait.
 * Helps the player see in low-light conditions.
 */
export class BorisBadger extends Plushie {
	/** Creates Boris Badger for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.BORISBADGER });
	}
}

/**
 * Doll plushie improves eyesight.
 * Adds the EagleEyed trait and suppresses ShortSighted.
 */
export class Doll extends Plushie {
	/** Creates Doll for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.DOLL });
	}
}

/**
 * Flamingo plushie improves agility and coordination.
 * Adds the Graceful trait and suppresses Clumsy.
 */
export class Flamingo extends Plushie {
	/** Creates Flamingo for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.FLAMINGO });
	}
}

/**
 * FluffyfootBunny plushie reduces food consumption.
 * Adds the LightEater trait and suppresses HeartyAppitite.
 */
export class FluffyfootBunny extends Plushie {
	/** Creates Fluffyfoot Bunny for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.FLUFFYFOOTBUNNY });
	}
}

/**
 * Freddy Fox plushie improves stealth and concealment.
 * Adds the Inconspicuous trait and suppresses Conspicuous.
 */
export class FreddyFox extends Plushie {
	/** Creates Freddy Fox for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.FREDDYFOX });
	}
}

/**
 * Furbert Squirrel plushie improves outdoor survival and foraging.
 * Adds the Outdoorsman trait for better survival in nature.
 */
export class FurbertSquirrel extends Plushie {
	/** Creates Furbert Squirrel for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.FURBERTSQUIRREL });
	}
}

/**
 * Grogu AZ plushie enhances learning speed.
 * Adds the FastLearner trait and suppresses SlowLearner.
 */
export class GroguAZ extends Plushie {
	/** Creates Grogu AZ for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.GROGUAZ });
	}
}

/**
 * Jacques Beaver grants a direct XP bonus.
 * Adds +1 Woodwork XP multiplier while equipped.
 */
export class JacquesBeaver extends Plushie {
	/** Creates Jacques Beaver for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.JACQUESBEAVER });
	}
}

/**
 * Moley Mole grants a direct XP bonus.
 * Adds +2 Plant Scavenging XP multiplier while equipped.
 */
export class MoleyMole extends Plushie {
	/** Creates Moley Mole for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.MOLEYMOLE });
	}
}

/**
 * Otis Pug plushie enhances reading speed.
 * Adds the FastReader trait and suppresses SlowReader.
 */
export class OtisPug extends Plushie {
	/** Creates Otis Pug for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.OTISPUG });
	}
}

/**
 * Pancake Hedgehog grants direct XP bonuses.
 * Adds +1 Sprinting and +1 Agility XP multipliers while equipped.
 */
export class PancakeHedgehog extends Plushie {
	/** Creates Pancake Hedgehog for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.PANCAKEHEDGEHOG });
	}
}

/**
 * Spiffo is the iconic mascot plushie.
 * Passively increases player endurance by 0.1 every update.
 */
export class Spiffo extends Plushie {
	/** Creates Spiffo for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFO });
	}
	/** Restores endurance before emitting the standard plushie update event. */
	update() {
		this.playerApi.increaseEndurance(0.1);
		super.update();
	}
}

/**
 * Spiffo Blueberry variant reduces thirst.
 * Adds the LowThirst trait and suppresses HighThirst.
 */
export class SpiffoBlueberry extends Plushie {
	/** Creates Spiffo Blueberry for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFOBLUEBERRY });
	}
}

/**
 * Spiffo Cherry variant improves organization.
 * Adds the Organized trait and suppresses Disorganized.
 */
export class SpiffoCherry extends Plushie {
	/** Creates Spiffo Cherry for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFOCHERRY });
	}
}

/**
 * Spiffo Grey grants direct combat XP bonuses.
 * Adds +1 multiplier to Nimble, LongBlade, SmallBlade, Blunt, and SmallBlunt.
 */
export class SpiffoGrey extends Plushie {
	/** Creates Spiffo Grey for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFOGREY });
	}
}

/**
 * Spiffo Heart grants a direct medical XP bonus.
 * Adds +2 Doctor XP multiplier while equipped.
 */
export class SpiffoHeart extends Plushie {
	/** Creates Spiffo Heart for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFOHEART });
	}
}

/**
 * Spiffo Rainbow variant provides comprehensive stat benefits.
 * Every update: reduces boredom by 0.5, increases endurance by 0.5, and reduces fatigue by 0.5.
 */
export class SpiffoPlushieRainbow extends Plushie {
	/** Creates Spiffo Rainbow for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFOPLUSHIERAINBOW });
	}
	/** Improves comfort stats before emitting the standard plushie update event. */
	update() {
		this.playerApi.reduceBoredom(0.5);
		this.playerApi.increaseEndurance(0.5);
		this.playerApi.reduceFatigue(0.5);
		super.update();
	}
}

/**
 * Spiffo Santa variant provides emotional comfort.
 * Every update: reduces boredom by 0.5 to combat loneliness during harsh winters.
 */
export class SpiffoSanta extends Plushie {
	/** Creates Spiffo Santa for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFOSANTA });
	}
	/** Reduces boredom before emitting the standard plushie update event. */
	public update() {
		this.playerApi.reduceBoredom(0.5);
		super.update();
	}
}

/**
 * Spiffo Shamrock grants direct ranged-combat XP bonuses.
 * Adds +5 Aiming and +5 Reloading XP multipliers while equipped.
 */
export class SpiffoShamrock extends Plushie {
	/** Creates Spiffo Shamrock for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SPIFFOSHAMROCK });
	}
}

/**
 * Substitution Doll provides psychological comfort and courage.
 * Adds the Brave trait and suppresses fear-based traits (Desensitized, Cowardly, Agoraphobic, Claustophobic).
 */
export class SubstitutionDoll extends Plushie {
	/** Creates Substitution Doll for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.SUBSTITUTIONDOLL });
	}
}

/**
 * Toy Bear provides comfort and anxiety relief.
 * Every update: reduces panic by 0.5 to soothe the player's nerves.
 */
export class ToyBear extends Plushie {
	/** Creates Toy Bear for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.TOYBEAR });
	}
	/** Reduces panic before emitting the standard plushie update event. */
	update() {
		this.playerApi.reducePanic(0.5);
		super.update();
	}
}

/**
 * Toy Bear Small is a miniature version providing modest anxiety relief.
 * Every update: reduces panic by 0.1 for gentle emotional support.
 */
export class ToyBearSmall extends Plushie {
	/** Creates Small Toy Bear for the given player. */
	constructor(player: IsoPlayer) {
		super({ player, name: PlushieNames.TOYBEARSMALL });
	}
	/** Slightly reduces panic before emitting the standard plushie update event. */
	update() {
		this.playerApi.reducePanic(0.1);
		super.update();
	}
}
