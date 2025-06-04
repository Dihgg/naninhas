import { AttachedItem, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";

interface Observer {
	name: string;
	update(): void;
	subscribe(): void;
	unsubscribe(): void;
}

class Subject {
	private observers: Observer[] = [];
	subscribe(observer: Observer) {
		observer.subscribe();
		this.observers.push(observer);
	}
	unsubscribe(observerName: string) {
		const observer = this.find(observerName);
		observer?.unsubscribe();
		this.observers = this.observers.filter(({name}) => name !== observerName);
	}
	update() {
		this.observers.forEach( observer => observer.update() );
	}

	find(name:string) {
		return this.observers.find( (observer) => observer.name == name );
	} 
}

class Plushie implements Observer {
	player: IsoPlayer;
	name: string;
	traits: Record<string, boolean>;
	constructor(player: IsoPlayer, name: string, traitsNames: string[] = []) {
		this.name = name;
		this.player = player;
		this.traits = this.loadTraits(traitsNames);
	}
	
	update() {
		print(`Buff for ${this.name} should be applied here!`);
	}
	/**
	 * 
	 * @param traitNames A list of traits that should be affecte by this plushie
	 * @returns An object that indicates which traits the player already have
	 */
	private loadTraits(traitNames: string[]): Record<string, boolean> {
		return traitNames.reduce<Record<string,boolean>>((acc, curr) => {
			acc[curr] = this.player.HasTrait(curr);
			return acc;
		}, {});
	}
	/**
	 * Loop through each trait, and act on those that player does not originally have
	 */
	private eachTrait(callback: (trait: string) => void) {
		for (const [trait, playerHasTrait] of Object.entries(this.traits)) {
			if (!playerHasTrait) {
				callback(trait);
			}
		}
	}
	
	public subscribe() {
		this.eachTrait(this.player.getTraits().add);
	}
	
	public unsubscribe() {
		this.eachTrait(this.player.getTraits().remove);
	}
}

class SpiffoSanta extends Plushie {
	public subscribe() {
		super.subscribe();
		print("SpiffoSanta buff should be applied");
	}
}

/* enum SLOTS {
	SpiffoPlushie = "SpiffoPlushie",
	Doll = "Doll",
	TeddyBear = "TeddyBear",
	RubberDuck = "RubberDuck",
} */

export class NaninhaClass {
	private player: IsoPlayer;

	private attachedPlushies: Plushie[] = [];

	PLUSHIES: Plushie[] = [];

	private subject: Subject;

	constructor(player: IsoPlayer) {
		this.player = player;
		this.subject = new Subject();
		this.PLUSHIES = [
			new SpiffoSanta(player, "SpiffoSanta")
		];
		this.registerEvents();
		print("Naninha class called!");
	}

	/**
	 * Method that should be called periodically
	 */
	update() {
		// TODO: Add or remove plushies from the subject deppending if it attached or not
		// TODO: identify which plushies are currently attached
		// TODO: for the ones not attached.
		const attachedItems = this.player.getAttachedItems();
		
		/* const plushies: string[] = [];
		attachedItems.forEach((attachedItem: AttachedItem) => {
			const plushieName = attachedItem
				.getItem()
				.getFullType()
				.replace("AuthenticZClothing.","");
			const plushie = this.PLUSHIES.find(({name}) => name == plushieName);
			if(plushie) {
				plushies.push(plushie.name);
			}
		}); */
		
		this.attachedPlushies = [];
		attachedItems.forEach((attachedItem: AttachedItem) => {
			const plushieName = attachedItem
				.getItem()
				.getFullType()
				.replace("AuthenticZClothing.","");
			const plushie = this.PLUSHIES.find(({name}) => name == plushieName);
			if (plushie && !this.attachedPlushies.find(({name}) => name == plushie?.name )) {
				this.attachedPlushies.push(plushie);;
			}
		});

		for (const plushie of this.attachedPlushies) {
			if(!this.subject.find(plushie.name)) {
				this.subject.subscribe(plushie);
			}
		}

		this.PLUSHIES.filter(
			({name}) => !this.attachedPlushies.find(attached => attached.name == name)
		).forEach(({name}) => {
			this.subject.unsubscribe(name);
		});

		this.subject.update();
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