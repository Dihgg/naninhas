/* @noSelfInFile */
/**
 * Defines an Object that can be updated, subscribed or unsubscribed from a Subject
 * by using an Observer pattern
 */
export interface Observer {
	/** The name is the main way to reference the observers */
	name: string;

	/** This method will be called periodically by this Observer Subject */
	update(): void;

	/** This method will be called when this Observer is subscribed */
	subscribe(): void;

	/** This method will be called when this Observer is unsubscribed */
	unsubscribe(): void;
}
