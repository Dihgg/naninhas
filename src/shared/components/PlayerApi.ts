import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { getVersion } from "@shared/utils";
import { CharacterTraitApi } from "./CharacterTraitApi";

type Stats = ReturnType<IsoPlayer["getStats"]>;
type CharacterStatArgument = Parameters<Stats["add"]>[0];

type RuntimeCharacterStatApi = {
	readonly BOREDOM?: CharacterStatArgument;
	readonly ENDURANCE?: CharacterStatArgument;
	readonly FATIGUE?: CharacterStatArgument;
	readonly PANIC?: CharacterStatArgument;
};

/**
 * Wrapper around IsoPlayer that centralizes version-aware player operations.
 */
export class PlayerApi {
	private readonly version = getVersion();

	constructor(private readonly player: IsoPlayer) {}

	/** Returns the underlying Project Zomboid player. */
	public get raw(): IsoPlayer {
		return this.player;
	}

	/** Returns the underlying XP tracker. */
	public getXp(): ReturnType<IsoPlayer["getXp"]> {
		return this.player.getXp();
	}

	/** Returns the player's mod data table. */
	public getModData(): ReturnType<IsoPlayer["getModData"]> {
		return this.player.getModData();
	}

	/** Returns whether the player currently has the given trait. */
	public hasTrait(traitId: string): boolean {
		return CharacterTraitApi.hasTrait(this.player, traitId);
	}

	/** Adds a trait to the player. */
	public addTrait(traitId: string): void {
		CharacterTraitApi.addTrait(this.player, traitId);
	}

	/** Removes a trait from the player. */
	public removeTrait(traitId: string): void {
		CharacterTraitApi.removeTrait(this.player, traitId);
	}

	/** Reduces boredom while honoring the active game build API. */
	public reduceBoredom(amount: number): void {
		const stats = this.player.getStats();
		const characterStats = this.getCharacterStatApi();

		if (this.canUseCharacterStats() && characterStats?.BOREDOM) {
			stats.remove(characterStats.BOREDOM, amount);
			return;
		}

		stats.setBoredom(Math.max(0, stats.getBoredom() - amount));
	}

	/** Increases endurance while honoring the active game build API. */
	public increaseEndurance(amount: number): void {
		const stats = this.player.getStats();
		const characterStats = this.getCharacterStatApi();

		if (this.canUseCharacterStats() && characterStats?.ENDURANCE) {
			stats.add(characterStats.ENDURANCE, amount);
			return;
		}

		stats.setEndurance(Math.min(1, stats.getEndurance() + amount));
	}

	/** Reduces fatigue while honoring the active game build API. */
	public reduceFatigue(amount: number): void {
		const stats = this.player.getStats();
		const characterStats = this.getCharacterStatApi();

		if (this.canUseCharacterStats() && characterStats?.FATIGUE) {
			stats.remove(characterStats.FATIGUE, amount);
			return;
		}

		stats.setFatigue(Math.max(0, stats.getFatigue() - amount));
	}

	/** Reduces panic, and fear on Build 41, while honoring the active game build API. */
	public reducePanic(amount: number): void {
		const stats = this.player.getStats();
		const characterStats = this.getCharacterStatApi();

		if (this.canUseCharacterStats() && characterStats?.PANIC) {
			stats.remove(characterStats.PANIC, amount);
			return;
		}

		stats.setFear(Math.max(0, stats.getFear() - amount));
		stats.setPanic(Math.max(0, stats.getPanic() - amount));
	}

	private canUseCharacterStats(): boolean {
		return this.version.major >= 42 && this.getCharacterStatApi() !== undefined;
	}

	private getCharacterStatApi(): RuntimeCharacterStatApi | undefined {
		return (globalThis as unknown as { CharacterStat?: RuntimeCharacterStatApi }).CharacterStat;
	}
}