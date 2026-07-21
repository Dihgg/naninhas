import { GameTime } from "@asledgehammer/pipewrench";
import type { IsoPlayer, Perk } from "@asledgehammer/pipewrench";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";
import { extractItemName } from "@shared/utils/ItemType";
import type { BedType } from "@types";

/**
 * Wrapper around IsoPlayer that centralizes Build 42 player operations.
 */
export class PlayerApi {
	/** The underlying IsoPlayer instance. */
	private readonly _player: IsoPlayer;
	
	/**
	 * Creates a new PlayerApi instance for the given player.
	 * @param _player The IsoPlayer to wrap
	 */
	constructor(player: IsoPlayer) {
		this._player = player;
	}

	/** Returns the underlying Project Zomboid player.
	 * @returns The IsoPlayer instance wrapped by this API
	 */
	public get player(): IsoPlayer {
		return this._player;
	}

	/** Returns the underlying Stats instance.
	 * @returns The Stats object for the player
	*/
	private get stats() {
		return this.player.getStats();
	}

	/** Returns the underlying XP tracker. */
	public getXp(): ReturnType<IsoPlayer["getXp"]> {
		return this.player.getXp();
	}

	/** Returns the player's mod data table. */
	public getModData(): ReturnType<IsoPlayer["getModData"]> {
		return this.player.getModData();
	}

	/** Returns the extracted item names from all currently attached items. */
	public getAttachedItemNames(): Set<string> {
		const names = new Set<string>();
		const attachedItems = this.player.getAttachedItems();

		for (let i = 0; i < attachedItems.size(); i++) {
			const fullType = attachedItems.get(i).getItem().getFullType();
			names.add(extractItemName(fullType));
		}

		return names;
	}

	/** Returns whether the player currently has the given trait. */
	public hasTrait(traitId: string): boolean {
		return CharacterTraitApi.hasTrait(this._player, traitId);
	}

	/** Returns whether the wrapped player is currently asleep. */
	public isAsleep(): boolean {
		return this.player.isAsleep();
	}

	/** Returns the sleep-bed type classified by vanilla sleep flow. */
	public getBedType(): BedType {
		const raw = this.player.getBedType?.() ?? "averageBed";
		if (raw === "badBed" || raw === "averageBed" || raw === "goodBed" || raw === "floor") {
			return raw;
		}
		if (raw.includes("badBed")) return "badBed";
		if (raw.includes("goodBed")) return "goodBed";
		if (raw.includes("floor")) return "floor";
		return "averageBed";
	}

	/** Returns the bed object associated with the player's current sleep context. */
	public getBed(): ReturnType<IsoPlayer["getBed"]> {
		return this.player.getBed();
	}

	/** Adds a trait to the player. */
	public addTrait(traitId: string): void {
		CharacterTraitApi.addTrait(this._player, traitId);
	}

	/** Removes a trait from the player. */
	public removeTrait(traitId: string): void {
		CharacterTraitApi.removeTrait(this._player, traitId);
	}

	/**
	 * Adjusts an XP multiplier for `perk` by `delta`, clamping the result to zero.
	 * Uses the current live multiplier as the base so existing non-plushie boosts
	 * are preserved.
	 */
	public applyXpMultiplierDelta(perk: Perk, delta: number): void {
		const xp = this.player.getXp();
		const newMultiplier = Math.max(xp.getMultiplier(perk) + delta, 0);
		xp.addXpMultiplier(perk, newMultiplier, 0, 0);
	}

	/** Reduces boredom using Build 42 CharacterStat API. */
	public reduceBoredom(amount: number): void {
		this.stats.remove(CharacterStat.BOREDOM, amount);
	}

	/** Increases endurance using Build 42 CharacterStat API. */
	public increaseEndurance(amount: number): void {
		this.stats.add(CharacterStat.ENDURANCE, amount);
	}

	/** Reduces fatigue using Build 42 CharacterStat API. */
	public reduceFatigue(amount: number): void {
		this.stats.remove(CharacterStat.FATIGUE, amount);
	}

	/** Reduces panic using Build 42 CharacterStat API. */
	public reducePanic(amount: number): void {
		this.stats.remove(CharacterStat.PANIC, amount);
	}

	/** Returns current monotonic world-age hours. */
	public getWorldAgeHours(): number {
		return GameTime.getInstance().getWorldAgeHours();
	}
}