
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { PlayerApi } from "@shared/components/PlayerApi";
import { Traits } from "@shared/components/Traits";
import { ModData } from "./ModData";
import { Observer } from "../Observer/Observer";
import type { PlayerModData, PlushieProps } from "types";

// TODO: Apply the LuaEventManager to allow other mods to interact with this one
// import { LuaEventManager } from "@asledgehammer/pipewrench"


/**
 * This class controls the Plushie behavior
 */
export abstract class Plushie implements Observer {
	name: string;
	/** Wrapped player object */
	protected readonly player: PlayerApi;

	/** List of traits that this Plushie should grant */
	private readonly traitsToAdd: string[];
	private readonly traitsToSuppress: string[] = [];

	/** List of traits that are added by Plushies */
	// private readonly addedTraits: Set<string>;
	/** List of traits that are suppressed by Plushies */
	// private readonly suppressedTraits: Set<string>;

	/** The data from `player.getModData()` to ensure traits are not permanent */
	private readonly playerData: ModData<PlayerModData>;

	/**
	 * @param player Player object from PZ
	 * @param name Plushie name
	 * @param traitsNames A string with traits that this plushies gives when equipped
	 */
	constructor({ player, name, traitsToAdd = [], traitsToSuppress = [] }: PlushieProps) {
		this.name = name;
		this.player = new PlayerApi(player);
		this.traitsToAdd = traitsToAdd;
		this.traitsToSuppress = traitsToSuppress;
		this.playerData = new ModData({
			object: this.player.raw,
			modKey: "Naninhas",
			defaultData: { addedTraits: [], suppressedTraits: [], xpBoosts: {} }
		});

		// Load the data from `player.getModData()`
		//const { data } = this.playerData;
		// this.addedTraits = new Set(this.data.addedTraits);
		// this.suppressedTraits = new Set(this.data.suppressedTraits);
	}

	/**
	 * Method that should be called periodically to apply the Plushie effect.
	 * This ensures the traits data are saved in the `player.getModData()`
	 */
	update() {}

	/**
	 * For a given trait, apply a boost based on Naninhas traits
	 * @param trait The trait to look for in Naninhas traits
	 * @param shouldApply Should the boost be applied or removed (set to 0)
	 */
	private applyBoost(trait: string, shouldApply = true) {
		const data = this.ensureData();
		const perks = Traits.getPerkBoostsForTrait(trait);

		const xp = this.player.getXp();
		
		for (const { perk, value } of perks) {
			const key = `${trait}:${perk}`;
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

		const toAdd = this.traitsToAdd
			.filter((trait) => !data.addedTraits.includes(trait) && !this.hasTrait(trait))
		
		for (const trait of toAdd) {
			data.addedTraits.push(trait);
			this.player.addTrait(trait);
			this.applyBoost(trait, true);
		}

		const toSuppress = this.traitsToSuppress
			.filter((trait) => !data.suppressedTraits.includes(trait) && this.hasTrait(trait));
		
		for (const trait of toSuppress) {
			data.suppressedTraits.push(trait);
			this.player.removeTrait(trait);
			this.applyBoost(trait, false);
		}
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
			this.player.removeTrait(trait);
			this.applyBoost(trait, false);
		}

		// Add back the traits that are suppressed by this Plushie
		const toRestore = this.traitsToSuppress
			.filter((trait) => data.suppressedTraits.includes(trait));
		for (const trait of toRestore) {
			data.suppressedTraits = data.suppressedTraits.filter((t) => t !== trait);
			this.player.addTrait(trait);
			this.applyBoost(trait, true);
		}
	}

	private hasTrait(trait: string): boolean {
		return this.player.hasTrait(trait);
	}

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

	get data() {
		return this.playerData.data;
	}
}
