/* @noSelfInFile */
import { AttachedItem, InventoryItem, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Subject } from "@client/components/Observer/Subject";
import { Plushie } from "@client/components/Plushies/Plushie";
import { PlushieSyncPublisher } from "@client/components/PlushieSyncPublisher";
import { SleepBuffDetector } from "@client/components/SleepBuffDetector";
import { PlayerApi } from "@shared/components/PlayerApi";
import {
	BorisBadger,
	Doll,
	Flamingo,
	FluffyfootBunny,
	FreddyFox,
	FurbertSquirrel,
	GroguAZ,
	JacquesBeaver,
	MoleyMole,
	OtisPug,
	PancakeHedgehog,
	Spiffo,
	SpiffoBlueberry,
	SpiffoCherry,
	SpiffoGrey,
	SpiffoHeart,
	SpiffoPlushieRainbow,
	SpiffoSanta,
	SpiffoShamrock,
	SubstitutionDoll,
	ToyBear,
	ToyBearSmall
} from "@client/components/Plushies/List";

export class Naninhas {
	private player: IsoPlayer;

	private readonly PLUSHIES: Plushie[] = [];

	private subject: Subject;

	private readonly syncPublisher: PlushieSyncPublisher;
	private readonly sleepBuffDetector: SleepBuffDetector;

	constructor(player: IsoPlayer, plushies: Plushie[] = []) {
		this.player = player;
		this.subject = new Subject();
		this.syncPublisher = new PlushieSyncPublisher(player);
		this.sleepBuffDetector = new SleepBuffDetector(player);
		this.PLUSHIES =
			plushies.length > 0
				? plushies
				: [
						new BorisBadger(player),
						new Doll(player),
						new Flamingo(player),
						new FluffyfootBunny(player),
						new FreddyFox(player),
						new FurbertSquirrel(player),
						new GroguAZ(player),
						new JacquesBeaver(player),
						new MoleyMole(player),
						new OtisPug(player),
						new PancakeHedgehog(player),
						new Spiffo(player),
						new SpiffoBlueberry(player),
						new SpiffoCherry(player),
						new SpiffoGrey(player),
						new SpiffoHeart(player),
						new SpiffoPlushieRainbow(player),
						new SpiffoSanta(player),
						new SpiffoShamrock(player),
						new SubstitutionDoll(player),
						new ToyBear(player),
						new ToyBearSmall(player)
					];
		this.registerEvents();
	}

	/**
	 * Method that should be called periodically
	 */
	update() {
		// Tracks attached plushie names for easy lookup
		const attachedSet = new Set<string>();

		// Step 1: Scan all attached items and track plushie names
		const attachedNames = new PlayerApi(this.player).getAttachedItemNames();
		for (const name of attachedNames) {
			// Check if the item is a plushie
			if (this.PLUSHIES.some(p => p.name === name)) {
				attachedSet.add(name);
			}
		}

		for (const plushie of this.PLUSHIES) {
			// Step 2: Subscribe plushies that are now attached and not yet observed
			if (attachedSet.has(plushie.name) && !this.subject.find(plushie.name)) {
				this.subject.subscribe(plushie);
			}
			// Step 3: Unsubscribe plushies that are no longer attached
			if (!attachedSet.has(plushie.name) && this.subject.find(plushie.name)) {
				this.subject.unsubscribe(plushie.name);
			}
		}

		// Step 4: Update all active plushie effects
		this.subject.update();

		// Step 5: Notify server of current plushie set (no-op in single-player)
		this.syncPublisher.tick();

		// Step 6: Detect wake transitions and publish temporary sleep-buff candidates.
		this.sleepBuffDetector.tick();
	}

	/**
	 * Register events handlers for te class
	 */
	registerEvents() {
		Events.everyOneMinute.addListener(() => {
			this.update();
		});
	}
}
