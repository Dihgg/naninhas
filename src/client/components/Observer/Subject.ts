
import { Observer } from "./Observer";

/**
 * This class will handle all the observers
 */
export class Subject {
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
		this.observers = this.observers.filter(({ name }) => name !== observerName);
	}

	/** Update all the observed objects */
	update() {
		this.observers.forEach(observer => observer.update());
	}

	/** Method to find an observer by its name */
	find(name: string) {
		return this.observers.find(observer => observer.name == name);
	}
}
