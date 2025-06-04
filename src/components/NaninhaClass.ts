import { AttachedItem, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";


/**
 * This interface defines an Object that can be updated, subscibe or unsubscribed from a Subject
 * by using an Observer pattern
 */
interface Observer {
	/** The name is the main way to reference the observers */
	name: string;

	/** This method will be called periodiacally by this Observer Subject */
	update(): void;

	/** This method will be called when this Observer is subscribed */
	subscribe(): void;

	/** This method will be called when this Observer is unsubscribed */
	unsubscribe(): void;
}

/**
 * This class will handle all the observers
 */
class Subject {
	/** List of observers objects */
	private observers: Observer[] = [];
	
	/** Add the observer to the list */
	subscribe(observer: Observer) {
		observer.subscribe();
		this.observers.push(observer);
	}

	/** Unsusbscribe the observer by its name */
	unsubscribe(observerName: string) {
		const observer = this.find(observerName);
		observer?.unsubscribe();
		this.observers = this.observers.filter(({name}) => name !== observerName);
	}
	
	/** Update all the observed objects */
	update() {
		this.observers.forEach( observer => observer.update() );
	}

	/** Method to find an observer by its name */
	find(name:string) {
		return this.observers.find( (observer) => observer.name == name );
	} 
}

/**
 * This class control the Plushie behavior
 */
class Plushie implements Observer {
	name: string;
	/** Zomboid player object */
	private player: IsoPlayer;
	/** List of traits that this Plushie should grant */
	private traitNames: string[];
	/** List of traits the player current posseses by the Naninhas ONLY */
	private naninhasTraits: string[];
	
	constructor(player: IsoPlayer, name: string, traitsNames: string[] = []) {
		this.name = name;
		this.player = player;
		this.traitNames = traitsNames;
		this.ensureModData();

		this.naninhasTraits = this.player.getModData().NaninhaClass.naninhasTraits;
	}

	/**
	 * This method will ensure the naninhas data in the `getModData`.
	 * This is where the traits from naninhas will be set, so the 
	 * traits are not permanent
	 */
	private ensureModData() {
		if (!this.player.getModData().NaninhaClass) {
			this.player.getModData().NaninhaClass = {}
		}
		if (!this.player.getModData().NaninhaClass.naninhasTraits) {
			this.player.getModData().NaninhaClass.naninhasTraits = [];
		}
	}
	
	update() {
		print(`Buff for ${this.name} should be applied here!`);
		this.player.getModData().NaninhaClass.naninhasTraits = this.naninhasTraits;
	}

	public subscribe() {
		for (const trait of this.traitNames) {
			// Only saves traits that the player does not have without the Naninha
			if (!this.naninhasTraits.includes(trait) && !this.player.HasTrait(trait)) {
				this.naninhasTraits.push(trait);
				this.player.getTraits().add(trait);
			}
		}
	}
	
	public unsubscribe() {
		for (const trait of this.traitNames) {
			// Remove all the traits that are exclusive this Naninha
			if (this.naninhasTraits.includes(trait)) {
				this.player.getTraits().remove(trait);
				this.naninhasTraits = this.naninhasTraits.filter( nTrait => nTrait != trait )
			}
		}
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

	PLUSHIES: Plushie[] = [];

	private subject: Subject;

	constructor(player: IsoPlayer) {
		this.player = player;
		this.subject = new Subject();
		this.PLUSHIES = [
			new SpiffoSanta(player, "SpiffoSanta")
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
		this.player.getAttachedItems().forEach((attachedItem: AttachedItem) => {
			const fullType = attachedItem.getItem().getFullType();
			const name = fullType.replace("AuthenticZClothing.", "");
			const plushie = this.PLUSHIES.find(p => p.name === name);
			if (plushie) {
				attachedSet.add(plushie.name);
			}
		});

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
