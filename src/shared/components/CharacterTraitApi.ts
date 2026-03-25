import type { IsoPlayer } from "@asledgehammer/pipewrench";

type RuntimeCharacterTrait = {
	getName?: () => string;
	toString?: () => string;
};

type RuntimeKnownTraitList = {
	size?: () => number;
	get?: (index: number) => RuntimeCharacterTrait | string;
};

type RuntimeCharacterTraits = {
	get?: (trait: RuntimeCharacterTrait) => boolean;
	add?: (trait: RuntimeCharacterTrait) => void;
	remove?: (trait: RuntimeCharacterTrait) => void;
	getKnownTraits?: () => RuntimeKnownTraitList;
};

type RuntimeLegacyTraitCollection = {
	add?: (trait: string) => void;
	remove?: (trait: string) => boolean;
};

type RuntimeCharacterTraitStatic = {
	get?: (this: void, id: unknown) => RuntimeCharacterTrait;
};

type RuntimeResourceLocationStatic = {
	of?: (this: void, id: string) => unknown;
};

type RuntimePlayer = {
	getCharacterTraits?: () => RuntimeCharacterTraits;
	getTraits?: () => RuntimeLegacyTraitCollection;
	hasTrait?: (trait: RuntimeCharacterTrait) => boolean;
	HasTrait?: (trait: string) => boolean;
};

export class CharacterTraitApi {
	private static getRuntimePlayer(player: IsoPlayer): RuntimePlayer {
		return player as unknown as RuntimePlayer;
	}

	private static getRuntimeCharacterTraitApi(): RuntimeCharacterTraitStatic | undefined {
		return (globalThis as unknown as { CharacterTrait?: RuntimeCharacterTraitStatic }).CharacterTrait;
	}

	private static getRuntimeResourceLocationApi(): RuntimeResourceLocationStatic | undefined {
		return (globalThis as unknown as { ResourceLocation?: RuntimeResourceLocationStatic }).ResourceLocation;
	}

	private static normalizeTraitId(value: string): string {
		const normalized = value.trim().toLowerCase();
		return normalized.startsWith("base:") ? normalized.slice(5) : normalized;
	}

	private static resolveTrait(traitId: string): RuntimeCharacterTrait | undefined {
		const runtimeCharacterTraitApi = this.getRuntimeCharacterTraitApi();

		if (!runtimeCharacterTraitApi) {
			return undefined;
		}

		const get = runtimeCharacterTraitApi.get;
		if (get) {
			const resourceLocationOf = this.getRuntimeResourceLocationApi()?.of;
			if (resourceLocationOf) {
				const traitLocation = resourceLocationOf(this.normalizeTraitId(traitId));
				const traitByLocation = get(traitLocation);

				if (traitByLocation !== undefined) {
					return traitByLocation;
				}
			}

			return get(this.normalizeTraitId(traitId));
		}

		return undefined;
	}

	private static matchesTraitId(trait: RuntimeCharacterTrait | string | undefined, traitId: string): boolean {
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

	private static hasKnownTrait(knownTraits: RuntimeKnownTraitList | undefined, traitId: string): boolean {
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

	public static getCharacterTraits(player: IsoPlayer): RuntimeCharacterTraits | undefined {
		return this.getRuntimePlayer(player).getCharacterTraits?.();
	}

	public static getTraitCollection(player: IsoPlayer): RuntimeLegacyTraitCollection | undefined {
		const runtimePlayer = player as unknown as RuntimePlayer;

		if (runtimePlayer.getTraits) {
			return runtimePlayer.getTraits();
		}

		return undefined;
	}

	public static hasTrait(player: IsoPlayer, traitId: string): boolean {
		const runtimePlayer = this.getRuntimePlayer(player);
		const characterTraits = this.getCharacterTraits(player);

		if (characterTraits) {
			const runtimeTrait = this.resolveTrait(traitId);

			if (runtimeTrait && characterTraits.get) {
				return characterTraits.get(runtimeTrait);
			}

			return this.hasKnownTrait(characterTraits.getKnownTraits?.(), traitId);
		}

		const runtimeTrait = this.resolveTrait(traitId);

		if (runtimeTrait && runtimePlayer.hasTrait) {
			return runtimePlayer.hasTrait(runtimeTrait);
		}

		if (runtimePlayer.HasTrait) {
			return runtimePlayer.HasTrait(traitId);
		}

		return false;
	}

	public static addTrait(player: IsoPlayer, traitId: string): void {
		const characterTraits = this.getCharacterTraits(player);
		const runtimeTrait = this.resolveTrait(traitId);

		if (characterTraits && runtimeTrait) {
			characterTraits.add?.(runtimeTrait);
			return;
		}

		this.getTraitCollection(player)?.add?.(traitId);
	}

	public static removeTrait(player: IsoPlayer, traitId: string): void {
		const characterTraits = this.getCharacterTraits(player);
		const runtimeTrait = this.resolveTrait(traitId);

		if (characterTraits && runtimeTrait) {
			characterTraits.remove?.(runtimeTrait);
			return;
		}

		this.getTraitCollection(player)?.remove?.(traitId);
	}
}
