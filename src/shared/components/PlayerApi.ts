import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";

/**
 * Wrapper around IsoPlayer that centralizes Build 42 player operations.
 */
export class PlayerApi {
	constructor(private readonly _player: IsoPlayer) {}

	/** Returns the underlying Project Zomboid player. */
	public get player(): IsoPlayer {
		return this._player;
	}

	/** Returns the underlying XP tracker. */
	public getXp(): ReturnType<IsoPlayer["getXp"]> {
		return this._player.getXp();
	}

	/** Returns the player's mod data table. */
	public getModData(): ReturnType<IsoPlayer["getModData"]> {
		return this._player.getModData();
	}

	/** Returns whether the player currently has the given trait. */
	public hasTrait(traitId: string): boolean {
		return CharacterTraitApi.hasTrait(this._player, traitId);
	}

	/** Adds a trait to the player. */
	public addTrait(traitId: string): void {
		CharacterTraitApi.addTrait(this._player, traitId);
	}

	/** Removes a trait from the player. */
	public removeTrait(traitId: string): void {
		CharacterTraitApi.removeTrait(this._player, traitId);
	}

	/** Reduces boredom using Build 42 CharacterStat API. */
	public reduceBoredom(amount: number): void {
		const stats = this._player.getStats();
		stats.remove(CharacterStat.BOREDOM, amount);
	}

	/** Increases endurance using Build 42 CharacterStat API. */
	public increaseEndurance(amount: number): void {
		const stats = this._player.getStats();
		stats.add(CharacterStat.ENDURANCE, amount);
	}

	/** Reduces fatigue using Build 42 CharacterStat API. */
	public reduceFatigue(amount: number): void {
		const stats = this._player.getStats();
		stats.remove(CharacterStat.FATIGUE, amount);
	}

	/** Reduces panic using Build 42 CharacterStat API. */
	public reducePanic(amount: number): void {
		const stats = this._player.getStats();
		stats.remove(CharacterStat.PANIC, amount);
	}
}