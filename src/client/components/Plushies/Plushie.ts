
import { PlayerApi } from "@shared/components/PlayerApi";
import { Observer } from "@client/components/Observer/Observer";
import type { EventData, PerkBoost, PlushieProps } from "types";
import { Perk, Perks, triggerEvent } from "@asledgehammer/pipewrench";
import { EventsEnum } from "@constants";
import { getPlushieDefinition } from "@shared/catalog/PlushieCatalog";

// TODO: Apply the LuaEventManager to allow other mods to interact with this one
// import { LuaEventManager } from "@asledgehammer/pipewrench"


/**
 * This class controls the Plushie behavior.
 *
 * In all modes (SP and MP), trait and XP effects are applied server-authoritatively
 * via the reconcile pipeline. This class is responsible only for firing client-side
 * events so that UI, audio, and external mod hooks continue to work.
 */
export abstract class Plushie implements Observer {

	/** The name of the Plushie */
	name: string;
	/** Wrapped player object */
	protected readonly playerApi: PlayerApi;
	/** List of traits that this Plushie should grant */
	private readonly traitsToAdd: string[];
	/** List of traits that this Plushie should suppress */
	private readonly traitsToSuppress: string[];
	/** List of XP boosts that this Plushie should grant */
	private readonly xpBoostsToAdd: PerkBoost[];

	/**
	 * @param player Player object from PZ
	 * @param name Plushie name. Effect data (traits, suppressions, XP boosts) is
	 * always resolved from the catalog via {@link getPlushieDefinition}.
	 */
	constructor({ player, name }: PlushieProps) {
		const { traitsToAdd, traitsToSuppress, xpBoostsToAdd } = getPlushieDefinition(name)!;
		this.name = name;
		this.playerApi = new PlayerApi(player);
		this.traitsToAdd = traitsToAdd;
		this.traitsToSuppress = traitsToSuppress;
		this.xpBoostsToAdd = xpBoostsToAdd.map(b => ({
			perk: Perks[b.perk as keyof typeof Perks] as Perk,
			value: b.value
		}));
	}

	/**
	 * Should be called periodically (e.g. `everyOneMinute`) to notify listeners.
	 * Not all Plushies may need to implement this if they don't have time-based effects.
	 */
	update() {
		triggerEvent(EventsEnum.Update, {
			name: this.name,
			...this.data
		} as EventData);
	}

	/**
	 * Should be called when the Plushie is equipped.
	 * Fires the Equipped event. Trait/XP application is handled server-authoritatively.
	 */
	public subscribe() {
		triggerEvent(EventsEnum.Equipped, {
			name: this.name,
			...this.data
		} as EventData);
	}

	/**
	 * Should be called when the Plushie is unequipped.
	 * Fires the Unequipped event. Trait/XP removal is handled server-authoritatively.
	 */
	public unsubscribe() {
		triggerEvent(EventsEnum.Unequipped, {
			name: this.name,
			...this.data
		});
	}

	/**
	 * Returns the plushie effect definition for use in event payloads.
	 * Reflects what the plushie offers; actual player state is managed by the server.
	 */
	get data() {
		const xpBoosts: Record<string, number> = {};
		for (const { perk, value } of this.xpBoostsToAdd) {
			xpBoosts[`${this.name}:${perk}`] = value;
		}
		return {
			addedTraits: this.traitsToAdd,
			suppressedTraits: this.traitsToSuppress,
			xpBoosts
		};
	}
}
