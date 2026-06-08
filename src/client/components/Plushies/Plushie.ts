
import { PlayerApi } from "@shared/components/PlayerApi";
import { ModData } from "@shared/components/ModData";
import { Observer } from "@client/components/Observer/Observer";
import type { EventData, PerkBoost, PlayerModData, PlushieProps } from "types";
import { Perk, Perks, triggerEvent, isClient, isServer } from "@asledgehammer/pipewrench";
import { EventsEnum } from "@constants";
import { getPlushieDefinition } from "@shared/catalog/PlushieCatalog";

// TODO: Apply the LuaEventManager to allow other mods to interact with this one
// import { LuaEventManager } from "@asledgehammer/pipewrench"


/**
 * This class controls the Plushie behavior
 */
export abstract class Plushie implements Observer {
	
	/** The name of the Plushie */
	name: string;
	/** Wrapped player object */
	protected readonly playerApi: PlayerApi;
	/** List of traits that this Plushie should grant */
	private readonly traitsToAdd: string[];
	/** List of traits that this Plushie should suppress */
	private readonly traitsToSuppress: string[] = [];
	/** List of XP boosts that this Plushie should grant */
	private readonly xpBoostsToAdd: PerkBoost[];
	/** The data from `player.getModData()` to ensure traits are not permanent */
	private readonly playerData: ModData<PlayerModData>;

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
		this.playerData = new ModData({
			object: this.playerApi.player,
			modKey: "Naninhas",
			defaultData: { addedTraits: [], suppressedTraits: [], xpBoosts: {} },
			ensure: Plushie.ensurePlayerData
		});
	}

	private static ensurePlayerData(data: Partial<PlayerModData>): PlayerModData {
		const ensured = data as PlayerModData;
		ensured.addedTraits = data.addedTraits ?? [];
		ensured.suppressedTraits = data.suppressedTraits ?? [];
		ensured.xpBoosts = data.xpBoosts && typeof data.xpBoosts === "object" ? data.xpBoosts : {};
		return ensured;
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect.
	 * This ensures the traits data are saved in the `player.getModData()`
	 * Not all Plushies may need to implement this if they don't have any time-based effects.
	 */
	update() {
		// Calls the event with the current traits to allow other mods to react accordingly
		triggerEvent(EventsEnum.Update, {
			name: this.name,
			...this.data
		} as EventData);
	}

	/**
	 * Applies/removes plushie XP multipliers while preserving any pre-existing player multipliers.
	 * Uses persisted target values and delta math to avoid stacking drift.
	 *
	 * No-op in multiplayer — the server applies XP multipliers authoritatively.
	 */
	private applyBoosts(shouldApply = true) {
		if (isClient() && !isServer()) return;

		const data = this.playerData.data;

		for (const { perk, value } of this.xpBoostsToAdd) {
			const key = `${this.name}:${perk}`;
			const appliedValue = data.xpBoosts[key] ?? 0;
			const targetValue = shouldApply ? value : 0;
			const delta = targetValue - appliedValue;

			if (delta === 0) {
				continue;
			}

			this.playerApi.applyXpMultiplierDelta(perk, delta);
			data.xpBoosts[key] = targetValue;
		}
	}

	/**
	 * Method that should be called when the Plushie is equipped
	 */
	public subscribe() {
		// In multiplayer the server applies trait and XP effects authoritatively.
		// The client still fires the Equipped event so UI and audio hooks work.
		if (!(isClient() && !isServer())) {
			const data = this.playerData.data;

			// Add traits that this Plushie grants, if not already added by another Plushie or present on the player
			const toAdd = this.traitsToAdd
				.filter((trait) => !data.addedTraits.includes(trait) && !this.hasTrait(trait));

			for (const trait of toAdd) {
				data.addedTraits.push(trait);
				this.playerApi.addTrait(trait);
			}

			// Remove traits that this Plushie suppresses, if not already suppressed by another Plushie or absent on the player
			const toSuppress = this.traitsToSuppress
				.filter((trait) => !data.suppressedTraits.includes(trait) && this.hasTrait(trait));

			for (const trait of toSuppress) {
				data.suppressedTraits.push(trait);
				this.playerApi.removeTrait(trait);
			}

			// Apply XP boosts for this Plushie (if any)
			this.applyBoosts(true);
		}

		// Calls the event with the current traits to allow other mods to react accordingly
		triggerEvent(EventsEnum.Equipped, {
			name: this.name,
			...this.data
		} as EventData);
	}

	/**
	 * Method that should be called when Plushie is unequipped
	 */
	public unsubscribe() {
		// In multiplayer the server removes trait and XP effects authoritatively.
		// The client still fires the Unequipped event so UI and audio hooks work.
		if (!(isClient() && !isServer())) {
			const data = this.playerData.data;

			// Remove all the traits that are exclusive this Plushie
			const toRemove = this.traitsToAdd
				.filter((trait) => data.addedTraits.includes(trait));

			for (const trait of toRemove) {
				data.addedTraits = data.addedTraits.filter((t) => t !== trait);
				this.playerApi.removeTrait(trait);
			}

			// Add back the traits that are suppressed by this Plushie
			const toRestore = this.traitsToSuppress
				.filter((trait) => data.suppressedTraits.includes(trait));
			for (const trait of toRestore) {
				data.suppressedTraits = data.suppressedTraits.filter((t) => t !== trait);
				this.playerApi.addTrait(trait);
			}

			// Remove XP boosts for this Plushie (if any)
			this.applyBoosts(false);
		}
		
		// Calls the event with the current traits to allow other mods to react accordingly
		triggerEvent(EventsEnum.Unequipped, {
			name: this.name,
			...this.data
		});
	}

	/**
	 * Checks if the player has a specific trait.
	 * @param trait The trait to check
	 * @returns True if the player has the trait, false otherwise
	 */
	private hasTrait(trait: string): boolean {
		return this.playerApi.hasTrait(trait);
	}

	/**
	 * Gets the player mod data.
	 * @returns The player mod data object
	 */
	get data() {
		return this.playerData.data;
	}
}
