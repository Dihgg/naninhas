import type { IsoPlayer } from "@asledgehammer/pipewrench";

/**
 * Build 42 trait operations for IsoPlayer.
 */
export class CharacterTraitApi {
	private static normalizeTraitId(value: string): string {
		const normalized = value.trim().toLowerCase();
		return normalized.startsWith("base:") ? normalized.slice(5) : normalized;
	}

	private static resolveTrait(traitId: string): CharacterTraitRef | undefined {
		const getTrait = CharacterTrait.get;
		const makeResourceLocation = globalThis.ResourceLocation.of;

		const traitLocation = makeResourceLocation(this.normalizeTraitId(traitId));
		return getTrait(traitLocation);
	}

	private static matchesTraitId(trait: CharacterTraitRef | string, traitId: string): boolean {
		const normalizedTraitId = this.normalizeTraitId(traitId);

		if (!trait) {
			return false;
		}

		if (typeof trait === "string") {
			return this.normalizeTraitId(trait) === normalizedTraitId;
		}

		const traitName = trait.getName();
		if (traitName && this.normalizeTraitId(traitName) === normalizedTraitId) {
			return true;
		}

		const traitString = trait.toString();

		return !!traitString && this.normalizeTraitId(traitString) === normalizedTraitId;
	}

	private static hasKnownTrait(knownTraits: PZList, traitId: string): boolean {

		for (let index = 0; index < knownTraits.size(); index += 1) {
			if (this.matchesTraitId(knownTraits.get(index), traitId)) {
				return true;
			}
		}

		return false;
	}

	/** Returns the Build 42 CharacterTraits container, when available. */
	public static getCharacterTraits(player: IsoPlayer): PzCharacterTraits {
		return player.getCharacterTraits() as unknown as PzCharacterTraits;
	}

	/** Checks whether a player has the given trait using Build 42 APIs. */
	public static hasTrait(player: IsoPlayer, traitId: string): boolean {
		const characterTraits = this.getCharacterTraits(player);
		const trait = this.resolveTrait(traitId);

		if (trait) {
			return characterTraits.get(trait);
		}

		return this.hasKnownTrait(characterTraits.getKnownTraits(), traitId);
	}

	/** Adds a trait using Build 42 trait objects. */
	public static addTrait(player: IsoPlayer, traitId: string): void {
		const characterTraits = this.getCharacterTraits(player);
		const trait = this.resolveTrait(traitId);

		if (trait) {
			characterTraits.add(trait);
		}
	}

	/** Removes a trait using Build 42 trait objects. */
	public static removeTrait(player: IsoPlayer, traitId: string): void {
		const characterTraits = this.getCharacterTraits(player);
		const trait = this.resolveTrait(traitId);

		if (trait) {
			characterTraits.remove(trait);
		}
	}
}
