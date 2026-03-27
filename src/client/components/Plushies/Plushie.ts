
import { PlayerApi } from "@shared/components/PlayerApi";
import { ModData } from "@client/components/Plushies/ModData";
import { Observer } from "@client/components/Observer/Observer";
import type { PerkBoost, PlayerModData, PlushieProps } from "types";

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
	 * @param name Plushie name
	 * @param traitsToAdd A list of traits that this plushie gives when equipped
	 * @param traitsToSuppress A list of traits that this plushie suppresses when equipped
	 * @param xpBoostsToAdd A list of XP boosts that this plushie gives when equipped
	 */
	constructor({ player, name, traitsToAdd = [], traitsToSuppress = [], xpBoostsToAdd = [] }: PlushieProps) {
		this.name = name;
		this.playerApi = new PlayerApi(player);
		this.traitsToAdd = traitsToAdd;
		this.traitsToSuppress = traitsToSuppress;
		this.xpBoostsToAdd = xpBoostsToAdd;
		this.playerData = new ModData({
			object: this.playerApi.player,
			modKey: "Naninhas",
			defaultData: { addedTraits: [], suppressedTraits: [], xpBoosts: {} }
		});
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect.
	 * This ensures the traits data are saved in the `player.getModData()`
	 * Not all Plushies may need to implement this if they don't have any time-based effects.
	 */
	update() {}

	/**
	 * Applies/removes plushie XP multipliers while preserving any pre-existing player multipliers.
	 * Uses persisted target values and delta math to avoid stacking drift.
	 */
	private applyBoosts(shouldApply = true) {
		const data = this.ensureData();
		const xp = this.playerApi.getXp();
		
		for (const { perk, value } of this.xpBoostsToAdd) {
			const key = `${this.name}:${perk}`;
			const appliedValue = data.xpBoosts[key] ?? 0;
			const targetValue = shouldApply ? value : 0;
			const delta = targetValue - appliedValue;

			if (delta === 0) {
				continue;
			}

			const currentMultiplier = xp.getMultiplier(perk);
			const newMultiplier = Math.max(currentMultiplier + delta, 0);

			xp.addXpMultiplier(perk, newMultiplier, 0, 0);
			data.xpBoosts[key] = targetValue;
		}
	}

	/**
	 * Method that should be called when the Plushie is equipped
	 */
	public subscribe() {
		const data = this.ensureData();

		// Add traits that this Plushie grants, if not already added by another Plushie or present on the player
		const toAdd = this.traitsToAdd
			.filter((trait) => !data.addedTraits.includes(trait) && !this.hasTrait(trait))
		
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

	/**
	 * Method that should be called when Plushie is unequipped
	 */
	public unsubscribe() {
		const data = this.ensureData();
		
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

	/**
	 * Checks if the player has a specific trait.
	 * @param trait The trait to check
	 * @returns True if the player has the trait, false otherwise
	 */
	private hasTrait(trait: string): boolean {
		return this.playerApi.hasTrait(trait);
	}

	/**
	 * Ensures the player mod data has the correct structure and default values.
	 * This is necessary to prevent issues when accessing/modifying the data later on.
	 * @returns The ensured player mod data object
	 */
	private ensureData(): PlayerModData {
		const data = this.playerData.data as Partial<PlayerModData>;

		if (!data.addedTraits) {
			data.addedTraits = [];
		}

		if (!data.suppressedTraits) {
			data.suppressedTraits = [];
		}

		if (!data.xpBoosts || typeof data.xpBoosts !== "object") {
			data.xpBoosts = {};
		}

		return data as PlayerModData;
	}

	/**
	 * Gets the player mod data.
	 * @returns The player mod data object
	 */
	get data() {
		return this.playerData.data;
	}
}
