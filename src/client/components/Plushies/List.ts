
import { IsoPlayer, Perk, Perks } from "@asledgehammer/pipewrench";
import { Plushie } from "@client/components/Plushies/Plushie";
import { PlushieNames } from "@constants";

/**
 * Boris Badger plushie grants the NightVision trait.
 * Helps the player see in low-light conditions.
 */
export class BorisBadger extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.BORISBADGER,
			traitsToAdd: ["NightVision"]
		});
	}
}

/**
 * Doll plushie improves eyesight.
 * Adds the EagleEyed trait and suppresses ShortSighted.
 */
export class Doll extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.DOLL,
			traitsToAdd: ["EagleEyed"],
			traitsToSuppress: ["ShortSighted"]
		});
	}
}

/**
 * Flamingo plushie improves agility and coordination.
 * Adds the Graceful trait and suppresses Clumsy.
 */
export class Flamingo extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.FLAMINGO,
			traitsToAdd: ["Graceful"],
			traitsToSuppress: ["Clumsy"]
		});
	}
}

/**
 * FluffyfootBunny plushie reduces food consumption.
 * Adds the LightEater trait and suppresses HeartyAppitite.
 */
export class FluffyfootBunny extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.FLUFFYFOOTBUNNY,
			traitsToAdd: ["LightEater"],
			traitsToSuppress: ["HeartyAppitite"]
		});
	}
}

/**
 * Freddy Fox plushie improves stealth and concealment.
 * Adds the Inconspicuous trait and suppresses Conspicuous.
 */
export class FreddyFox extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.FREDDYFOX,
			traitsToAdd: ["Inconspicuous"],
			traitsToSuppress: ["Conspicuous"]
		});
	}
}

/**
 * Furbert Squirrel plushie improves outdoor survival and foraging.
 * Adds the Outdoorsman trait for better survival in nature.
 */
export class FurbertSquirrel extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.FURBERTSQUIRREL,
			traitsToAdd: ["Outdoorsman"]
		});
	}
}

/**
 * Grogu AZ plushie enhances learning speed.
 * Adds the FastLearner trait and suppresses SlowLearner.
 */
export class GroguAZ extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.GROGUAZ,
			traitsToAdd: ["FastLearner"],
			traitsToSuppress: ["SlowLearner"]
		});
	}
}

/**
 * Jacques Beaver grants a direct XP bonus.
 * Adds +1 Woodwork XP multiplier while equipped.
 */
export class JacquesBeaver extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.JACQUESBEAVER,
			xpBoostsToAdd: [
				{ perk: Perks.Woodwork as Perk, value: 1 }
			]
		});
	}
}

/**
 * Moley Mole grants a direct XP bonus.
 * Adds +2 Plant Scavenging XP multiplier while equipped.
 */
export class MoleyMole extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.MOLEYMOLE,
			xpBoostsToAdd: [
				{ perk: Perks.PlantScavenging as Perk, value: 2 }
			]
		});
	}
}

/**
 * Otis Pug plushie enhances reading speed.
 * Adds the FastReader trait and suppresses SlowReader.
 */
export class OtisPug extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.OTISPUG,
			traitsToAdd: ["FastReader"],
			traitsToSuppress: ["SlowReader"]
		});
	}
}

/**
 * Pancake Hedgehog grants direct XP bonuses.
 * Adds +1 Sprinting and +1 Agility XP multipliers while equipped.
 */
export class PancakeHedgehog extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.PANCAKEHEDGEHOG,
			xpBoostsToAdd: [
				{ perk: Perks.Sprinting as Perk, value: 1 },
				{ perk: Perks.Agility as Perk, value: 1 }
			]
		});
	}
}

/**
 * Spiffo is the iconic mascot plushie.
 * Passively increases player endurance by 0.1 every update.
 */
export class Spiffo extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFO
		});
	}
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
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFOBLUEBERRY,
			traitsToAdd: ["LowThirst"],
			traitsToSuppress: ["HighThirst"]
		});
	}
}

/**
 * Spiffo Cherry variant improves organization.
 * Adds the Organized trait and suppresses Disorganized.
 */
export class SpiffoCherry extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFOCHERRY,
			traitsToAdd: ["Organized"],
			traitsToSuppress: ["Disorganized"]
		});
	}
}

/**
 * Spiffo Grey grants direct combat XP bonuses.
 * Adds +1 multiplier to Nimble, LongBlade, SmallBlade, Blunt, and SmallBlunt.
 */
export class SpiffoGrey extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFOGREY,
			xpBoostsToAdd: [
				{ perk: Perks.Nimble as Perk, value: 1 },
				{ perk: Perks.LongBlade as Perk, value: 1 },
				{ perk: Perks.SmallBlade as Perk, value: 1 },
				{ perk: Perks.Blunt as Perk, value: 1 },
				{ perk: Perks.SmallBlunt as Perk, value: 1 }
			]
		});
	}
}

/**
 * Spiffo Heart grants a direct medical XP bonus.
 * Adds +2 Doctor XP multiplier while equipped.
 */
export class SpiffoHeart extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFOHEART,
			xpBoostsToAdd: [
				{ perk: Perks.Doctor as Perk, value: 2 }
			]
		});
	}
}

/**
 * Spiffo Rainbow variant provides comprehensive stat benefits.
 * Every update: reduces boredom by 0.5, increases endurance by 0.5, and reduces fatigue by 0.5.
 */
export class SpiffoPlushieRainbow extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFOPLUSHIERAINBOW
		});
	}
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
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFOSANTA
		});
	}
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
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SPIFFOSHAMROCK,
			xpBoostsToAdd: [
				{ perk: Perks.Aiming as Perk, value: 5 },
				{ perk: Perks.Reloading as Perk, value: 5 }
			]
		});
	}
}

/**
 * Substitution Doll provides psychological comfort and courage.
 * Adds the Brave trait and suppresses fear-based traits (Desensitized, Cowardly, Agoraphobic, Claustophobic).
 */
export class SubstitutionDoll extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.SUBSTITUTIONDOLL,
			traitsToAdd: ["Brave"],
			traitsToSuppress: ["Desensitized", "Cowardly", "Agoraphobic", "Claustophobic"]
		});
	}
}

/**
 * Toy Bear provides comfort and anxiety relief.
 * Every update: reduces panic by 0.5 to soothe the player's nerves.
 */
export class ToyBear extends Plushie {
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.TOYBEAR
		});
	}
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
	constructor(player: IsoPlayer) {
		super({
			player,
			name: PlushieNames.TOYBEARSMALL
		});
	}
	update() {
		this.playerApi.reducePanic(0.1);
		super.update();
	}
}
