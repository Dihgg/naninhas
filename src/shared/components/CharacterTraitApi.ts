import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { isB42 } from "@shared/utils";

/**
 * Cross-build trait operations for IsoPlayer.
 * Uses Build 42 CharacterTrait APIs when available and falls back to legacy trait APIs.
 */
export class CharacterTraitApi {
	private static normalizeTraitId(value: string): string {
		const normalized = value.trim().toLowerCase();
		return normalized.startsWith("base:") ? normalized.slice(5) : normalized;
	}

	private static resolveTrait(traitId: string): PzCharacterTraitRef | undefined {
		const getTrait = globalThis.CharacterTrait?.get;
		const makeResourceLocation = globalThis.ResourceLocation?.of;

		if (!getTrait || !makeResourceLocation) {
			return undefined;
		}

		const traitLocation = makeResourceLocation(this.normalizeTraitId(traitId));
		return getTrait(traitLocation);
	}

	private static matchesTraitId(trait: PzCharacterTraitRef | string | undefined, traitId: string): boolean {
		const normalizedTraitId = this.normalizeTraitId(traitId);

		if (!trait) {
			return false;
		}

		if (typeof trait === "string") {
			return this.normalizeTraitId(trait) === normalizedTraitId;
		}

		const traitName = trait.getName?.();
		if (traitName && this.normalizeTraitId(traitName) === normalizedTraitId) {
			return true;
		}

		const traitString = trait.toString ? trait.toString() : undefined;
		return !!traitString && this.normalizeTraitId(traitString) === normalizedTraitId;
	}

	private static hasKnownTrait(knownTraits: PzKnownTraitList | undefined, traitId: string): boolean {
		const size = knownTraits?.size?.();

		if (size === undefined || !knownTraits?.get) {
			return false;
		}

		for (let index = 0; index < size; index += 1) {
			if (this.matchesTraitId(knownTraits.get(index), traitId)) {
				return true;
			}
		}

		return false;
	}

	/** Returns the Build 42 CharacterTraits container, when available. */
	public static getCharacterTraits(player: IsoPlayer): PzCharacterTraits | undefined {
		return player.getCharacterTraits?.() as unknown as PzCharacterTraits | undefined;
	}

	/** Returns the legacy trait collection used by Build 41-style APIs. */
	public static getTraitCollection(player: IsoPlayer): PzLegacyTraitCollection | undefined {
		return player.getTraits?.();
	}

	/** Checks whether a player has the given trait across Build 41 and Build 42 APIs. */
	public static hasTrait(player: IsoPlayer, traitId: string): boolean {
		if (isB42()) {
			const characterTraits = this.getCharacterTraits(player);
			const runtimeTrait = this.resolveTrait(traitId);

			if (runtimeTrait && characterTraits?.get) {
				return characterTraits.get(runtimeTrait);
			}

			if (player.HasTrait !== undefined) {
				return player.HasTrait(traitId);
			}

			return this.hasKnownTrait(characterTraits?.getKnownTraits?.(), traitId);
		}

		return player.HasTrait?.(traitId) ?? false;
	}

	/** Adds a trait using Build 42 trait objects or legacy trait collection fallback. */
	public static addTrait(player: IsoPlayer, traitId: string): void {
		if (isB42()) {
			const characterTraits = this.getCharacterTraits(player);
			const runtimeTrait = this.resolveTrait(traitId);

			if (characterTraits && runtimeTrait) {
				characterTraits.add?.(runtimeTrait);
				return;
			}
		}

		this.getTraitCollection(player)?.add?.(traitId);
	}

	/** Removes a trait using Build 42 trait objects or legacy trait collection fallback. */
	public static removeTrait(player: IsoPlayer, traitId: string): void {
		if (isB42()) {
			const characterTraits = this.getCharacterTraits(player);
			const runtimeTrait = this.resolveTrait(traitId);

			if (characterTraits && runtimeTrait) {
				characterTraits.remove?.(runtimeTrait);
				return;
			}
		}

		this.getTraitCollection(player)?.remove?.(traitId);
	}
}
